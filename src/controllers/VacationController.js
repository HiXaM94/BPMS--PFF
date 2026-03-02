
import { supabase, isSupabaseReady } from '../services/supabase';
import { VacationRequest, LeaveBalance } from '../models/Vacation';
import { notificationService } from '../services/NotificationService';
import { cacheService } from '../services/CacheService';

const LEAVE_TYPE_TO_BALANCE = {
    'Annual Leave': { usedCol: 'annual_used' },
    'Sick Leave':   { usedCol: 'sick_used' },
    'Remote Work':  { usedCol: 'remote_used' },
    'Unpaid Leave': { usedCol: 'unpaid_used' },
};

/**
 * VacationController
 * Manages leave requests and leave balances.
 */
class VacationController {
    /**
     * Get all leave requests for a given role/context.
     */
    async getRequests(filter = {}) {
        if (!isSupabaseReady) return [];

        let query = supabase
            .from('vacances')
            .select('*, users(id, name, role, email, department)')
            .order('created_at', { ascending: false });

        if (filter.userId) query = query.eq('user_id', filter.userId);
        if (filter.status) query = query.eq('status', filter.status);
        if (filter.entrepriseId) query = query.eq('entreprise_id', filter.entrepriseId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(r => new VacationRequest(r));
    }

    /**
     * Get leave balance for a specific user.
     */
    async getBalance(userId) {
        if (!isSupabaseReady || !userId) return new LeaveBalance();

        const cacheKey = `leave_balance:${userId}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return new LeaveBalance(cached);

        const { data, error } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        const raw = data || { user_id: userId };
        if (data) cacheService.set(cacheKey, raw, 120);
        return new LeaveBalance(raw);
    }

    /**
     * Submit a new leave request.
     */
    async submitRequest(requestData) {
        const request = new VacationRequest(requestData);
        const { isValid, error: validationError } = request.validate();
        if (!isValid) throw new Error(validationError);

        // Balance check
        const balance = await this.getBalance(request.userId);
        if (!balance.hasEnoughBalance(request.type, request.daysCount)) {
            const typeMap = { 'Annual Leave': 'annual', 'Sick Leave': 'sick', 'Remote Work': 'remote', 'Unpaid Leave': 'unpaid' };
            const key = typeMap[request.type] || 'annual';
            throw new Error(`Insufficient balance for ${request.type}. Remaining: ${balance[key].remaining} days.`);
        }

        // Conflict detection
        const conflicts = await this.detectConflicts(request);
        if (conflicts.length > 0) {
            console.warn('AI detected conflicts:', conflicts);
        }

        if (isSupabaseReady) {
            const payload = request.toSupabase();
            if (requestData.entrepriseId) payload.entreprise_id = requestData.entrepriseId;

            const { data, error } = await supabase
                .from('vacances')
                .insert(payload)
                .select('*, users(id, name, role)')
                .single();
            if (error) throw error;

            // Invalidate balance cache
            cacheService.invalidatePattern(`^leave_balance:${request.userId}`);

            return new VacationRequest(data);
        }

        return request;
    }

    /**
     * Approve a leave request — deducts balance and sends notification.
     */
    async approveRequest(requestId, reason = '', approverName = 'HR') {
        if (!isSupabaseReady) return true;

        // 1. Fetch the request to get user_id, type, days
        const { data: req, error: fetchErr } = await supabase
            .from('vacances')
            .select('*')
            .eq('id', requestId)
            .single();
        if (fetchErr) throw fetchErr;
        if (!req) throw new Error('Request not found');
        if (req.status !== 'pending') throw new Error(`Cannot approve a request that is "${req.status}".`);

        // 2. Update status
        const { error: updateErr } = await supabase
            .from('vacances')
            .update({ status: 'approved', approval_reason: reason })
            .eq('id', requestId);
        if (updateErr) throw updateErr;

        // 3. Deduct balance
        await this._adjustBalance(req.user_id, req.leave_type, req.days_count);

        // 4. Notify employee
        notificationService.onLeaveApproved(req.user_id, approverName);

        // 5. Invalidate caches
        cacheService.invalidatePattern(`^leave_balance:${req.user_id}`);
        cacheService.invalidatePattern('^vacation');

        return true;
    }

    /**
     * Reject a leave request — sends notification with reason.
     */
    async rejectRequest(requestId, reason, approverName = 'HR') {
        if (!isSupabaseReady) return true;

        const { data: req, error: fetchErr } = await supabase
            .from('vacances')
            .select('*')
            .eq('id', requestId)
            .single();
        if (fetchErr) throw fetchErr;
        if (!req) throw new Error('Request not found');
        if (req.status !== 'pending') throw new Error(`Cannot reject a request that is "${req.status}".`);

        const { error } = await supabase
            .from('vacances')
            .update({ status: 'rejected', rejection_reason: reason })
            .eq('id', requestId);
        if (error) throw error;

        // Notify employee
        notificationService.onLeaveRejected(req.user_id, approverName, reason);
        cacheService.invalidatePattern('^vacation');

        return true;
    }

    /**
     * Cancel a leave request (only if still pending).
     * If it was already approved, restore the balance.
     */
    async cancelRequest(requestId) {
        if (!isSupabaseReady) return true;

        const { data: req, error: fetchErr } = await supabase
            .from('vacances')
            .select('*')
            .eq('id', requestId)
            .single();
        if (fetchErr) throw fetchErr;
        if (!req) throw new Error('Request not found');

        // If was approved, restore balance
        if (req.status === 'approved') {
            await this._adjustBalance(req.user_id, req.leave_type, -req.days_count);
            cacheService.invalidatePattern(`^leave_balance:${req.user_id}`);
        }

        const { error } = await supabase
            .from('vacances')
            .delete()
            .eq('id', requestId);
        if (error) throw error;

        cacheService.invalidatePattern('^vacation');
        return true;
    }

    /**
     * Adjust a user's leave balance by adding `days` to the used column.
     * Use negative `days` to restore balance.
     */
    async _adjustBalance(userId, leaveType, days) {
        const mapping = LEAVE_TYPE_TO_BALANCE[leaveType];
        if (!mapping) return; // Unknown type (e.g. Maternity) — skip

        // Fetch current balance
        const { data: bal, error: bErr } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (bErr && bErr.code === 'PGRST116') {
            // No balance row — create one with defaults
            const newRow = { user_id: userId, [mapping.usedCol]: Math.max(days, 0) };
            await supabase.from('leave_balances').insert(newRow);
            return;
        }
        if (bErr) throw bErr;

        const currentUsed = bal[mapping.usedCol] || 0;
        const newUsed = Math.max(currentUsed + days, 0); // Never go negative

        await supabase
            .from('leave_balances')
            .update({ [mapping.usedCol]: newUsed })
            .eq('user_id', userId);
    }

    /**
     * Detect conflicts using AI (Internal simulation).
     */
    async detectConflicts(request) {
        const conflicts = [];
        if (request.daysCount > 10) {
            conflicts.push('Requested period exceeds recommended continuous leave for current workload.');
        }
        return conflicts;
    }

    /**
     * Suggest optimal leave periods.
     */
    async suggestOptimalLeave(userId) {
        return [
            { start: '2026-04-10', end: '2026-04-20', reason: 'Low team workload scheduled' },
            { start: '2026-09-15', end: '2026-09-25', reason: 'No project deadlines in this window' }
        ];
    }
}

export const vacationController = new VacationController();
