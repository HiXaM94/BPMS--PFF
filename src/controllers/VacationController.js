
import { supabase, isSupabaseReady } from '../services/supabase';
import { VacationRequest, LeaveBalance } from '../models/Vacation';
import { aiController } from './AIController';

/**
 * VacationController
 * Manages leave requests and leave balances.
 */
class VacationController {
    /**
     * Get all leave requests for a given role/context.
     */
    async getRequests(filter = {}) {
        if (!isSupabaseReady) {
            // In a real app, this would fetch from local storage if offline
            return [];
        }

        let query = supabase
            .from('vacances')
            .select('*, users(name, role)')
            .order('created_at', { ascending: false });

        if (filter.userId) query = query.eq('user_id', filter.userId);
        if (filter.status) query = query.eq('status', filter.status);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(r => new VacationRequest(r));
    }

    /**
     * Get leave balance for a specific user.
     */
    async getBalance(userId) {
        if (!isSupabaseReady) return new LeaveBalance();

        const { data, error } = await supabase
            .from('leave_balances')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return new LeaveBalance(data || { user_id: userId });
    }

    /**
     * Submit a new leave request.
     */
    async submitRequest(requestData) {
        const request = new VacationRequest(requestData);
        const { isValid, error: validationError } = request.validate();
        if (!isValid) throw new Error(validationError);

        // AI Check: Insufficient balance
        const balance = await this.getBalance(request.userId);
        if (!balance.hasEnoughBalance(request.type, request.daysCount)) {
            throw new Error(`Insufficient balance for ${request.type}. Remaining: ${balance.annual.remaining} days.`);
        }

        // AI Check: Conflict detection (Simulated integration)
        const conflicts = await this.detectConflicts(request);
        if (conflicts.length > 0) {
            // We still allow submission but maybe flag it or warn the user
            console.warn('AI detected conflicts:', conflicts);
        }

        if (isSupabaseReady) {
            const { data, error } = await supabase
                .from('vacances')
                .insert(request.toSupabase())
                .select()
                .single();
            if (error) throw error;
            return new VacationRequest(data);
        }

        return request;
    }

    /**
     * Approve a leave request.
     */
    async approveRequest(requestId, reason = '') {
        if (isSupabaseReady) {
            const { error } = await supabase
                .from('vacances')
                .update({
                    status: 'approved',
                    approval_reason: reason
                })
                .eq('id', requestId);
            if (error) throw error;

            // After approval, we might need to update the balance
            // This would ideally be handled by a DB trigger or a background job
        }
        return true;
    }

    /**
     * Reject a leave request.
     */
    async rejectRequest(requestId, reason) {
        if (isSupabaseReady) {
            const { error } = await supabase
                .from('vacances')
                .update({
                    status: 'rejected',
                    rejection_reason: reason
                })
                .eq('id', requestId);
            if (error) throw error;
        }
        return true;
    }

    /**
     * Detect conflicts using AI (Internal simulation).
     */
    async detectConflicts(request) {
        // AI Simulation: Check if more than 30% of the team is away during this period
        // Or if there are critical tasks assigned.
        const conflicts = [];

        // Mocking AI logic
        if (request.daysCount > 10) {
            conflicts.push('Requested period exceeds recommended continuous leave for current workload.');
        }

        return conflicts;
    }

    /**
     * Suggest optimal leave periods.
     */
    async suggestOptimalLeave(userId) {
        // AI Logic: Analyze previous patterns and suggest periods with low team activity
        return [
            { start: '2026-04-10', end: '2026-04-20', reason: 'Low team workload scheduled' },
            { start: '2026-09-15', end: '2026-09-25', reason: 'No project deadlines in this window' }
        ];
    }
}

export const vacationController = new VacationController();
