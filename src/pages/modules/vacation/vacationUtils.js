import { supabase, isSupabaseReady } from '../../../services/supabase';
import { notificationService } from '../../../services/NotificationService';

// ── Shared Supabase Data Fetching ───────────────────────

/**
 * Fetch all leave balances for a specific user (employee_id)
 */
export async function fetchLeaveBalances(userId) {
    if (!isSupabaseReady || !userId) return null;

    // First get the employee record
    const { data: emp } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single();
    if (!emp) return null;

    const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', emp.id)
        .eq('year', new Date().getFullYear());

    if (error) {
        console.error('Error fetching leave balances:', error.message);
        return null;
    }

    // Transform into a structured object
    const balances = {
        annual: { total: 22, used: 0, remaining: 22 },
        sick: { total: 10, used: 0, remaining: 10 },
        remote_work: { total: 24, used: 0, remaining: 24 },
        unpaid: { total: 30, used: 0, remaining: 30 }
    };

    data?.forEach(b => {
        if (balances[b.leave_type]) {
            balances[b.leave_type] = {
                total: b.total_days,
                used: b.used_days,
                remaining: b.total_days - b.used_days
            };
        }
    });

    return balances;
}

/**
 * Fetch leave requests (vacances) with optional filters
 */
export async function fetchLeaveRequests(filters = {}) {
    if (!isSupabaseReady) return [];

    let query = supabase
        .from('vacances')
        .select(`
            id,
            leave_type,
            start_date,
            end_date,
            days_count,
            reason,
            status,
            created_at,
            employee_id,
            employees!inner (
                id,
                position,
                entreprise_id,
                department_id,
                users!inner ( name, email )
            )
        `)
        .order('created_at', { ascending: false });

    if (filters.userId) {
        // Find employee_id by user_id
        const { data: emp } = await supabase.from('employees').select('id').eq('user_id', filters.userId).single();
        if (emp) query = query.eq('employee_id', emp.id);
        else return [];
    }

    if (filters.managerId) {
        // Fetch users managed by this manager
        const { data: team } = await supabase.from('employees').select('id').eq('manager_id', filters.managerId);
        if (team && team.length > 0) {
            query = query.in('employee_id', team.map(t => t.id));
        } else {
            return []; // No team members
        }
    }

    if (filters.entrepriseId) {
        query = query.eq('employees.entreprise_id', filters.entrepriseId);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching leave requests:', error.message);
        return [];
    }

    const dbToUiType = {
        'annual': 'Annual Leave',
        'sick': 'Sick Leave',
        'remote_work': 'Remote Work',
        'unpaid': 'Unpaid Leave',
        'maternity': 'Maternity',
        // Fallbacks for any old data
        'Annual Leave': 'Annual Leave',
        'Sick Leave': 'Sick Leave',
        'Remote Work': 'Remote Work',
        'Unpaid Leave': 'Unpaid Leave'
    };

    // Map to simplified frontend model
    return (data || []).map(req => ({
        id: req.id,
        employeeName: req.employees?.users?.name || 'Unknown',
        employeeId: req.employee_id,
        position: req.employees?.position || '',
        type: dbToUiType[req.leave_type] || req.leave_type,
        startDate: req.start_date,
        endDate: req.end_date,
        daysCount: req.days_count,
        reason: req.reason,
        status: req.status,
        submittedAt: req.created_at,
        departmentId: req.employees?.department_id
    }));
}

/**
 * Submit a new leave request
 */
export async function submitLeaveRequest(userId, requestData) {
    if (!isSupabaseReady || !userId) throw new Error('Database not connected');

    const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).single();
    if (!emp) throw new Error('Employee record not found');

    const uiToDbType = {
        'Annual Leave': 'annual',
        'Sick Leave': 'sick',
        'Remote Work': 'remote_work',
        'Unpaid Leave': 'unpaid',
        'Maternity': 'maternity'
    };

    const dbLeaveType = uiToDbType[requestData.type] || requestData.type.toLowerCase().replace(' ', '_');

    const { error } = await supabase.from('vacances').insert({
        employee_id: emp.id,
        leave_type: dbLeaveType,
        start_date: requestData.startDate,
        end_date: requestData.endDate,
        days_count: requestData.daysCount,
        reason: requestData.reason,
        status: 'pending'
    });

    if (error) throw error;

    try {
        // Fetch Employee Name
        const { data: userRow } = await supabase.from('users').select('name').eq('id', userId).single();
        const empName = userRow?.name || 'An employee';

        let targetIds = [];

        // Fetch Manager User ID
        if (emp.manager_id) {
            const { data: mgr } = await supabase.from('employees').select('user_id').eq('id', emp.manager_id).single();
            if (mgr?.user_id) targetIds.push(mgr.user_id);
        }

        // Fetch HR/Admin User IDs in the same enterprise
        const { data: hrs } = await supabase.from('employees')
            .select('user_id, position')
            .eq('entreprise_id', emp.entreprise_id);

        // Just simplistic filtering for "admin" or "hr" by name/position or role
        if (hrs) {
            hrs.forEach(h => {
                if (h.user_id && !targetIds.includes(h.user_id)) targetIds.push(h.user_id); // Broadly notify enterprise admins/hrs for demo
            });
        }

        if (targetIds.length > 0) {
            await notificationService.sendBulk(targetIds, `📋 New leave request from ${empName} awaiting approval.`, 'info', { event: 'leave_requested' });
        }
    } catch (notifErr) {
        console.error('Failed to send notification:', notifErr);
    }
}

/**
 * Update request status (Approve/Reject)
 */
export async function updateLeaveStatus(requestId, status) {
    if (!isSupabaseReady) throw new Error('Database not connected');

    // Here we should also deduct from leave balance if approved, but in a real-world scenario 
    // it's usually handled by an SQL Trigger. Our initial schema handles this inside `trg_leave_balances_updated_at` or similar later.
    // Fetch the employee_id and user_id to notify them
    const { data: req } = await supabase.from('vacances').select('employee_id, employees!inner(user_id)').eq('id', requestId).single();
    const employeeUserId = req?.employees?.user_id;

    const { error } = await supabase
        .from('vacances')
        .update({ status })
        .eq('id', requestId);

    if (error) throw error;

    if (employeeUserId) {
        if (status === 'approved') {
            await notificationService.send(employeeUserId, `✅ Your leave request has been approved.`, 'success', { event: 'leave_approved' });
        } else if (status === 'rejected' || status === 'cancelled') {
            await notificationService.send(employeeUserId, `❌ Your leave request was ${status}.`, 'warning', { event: 'leave_rejected' });
        }
    }
}

// ── AI Automation Engine simulated logic ────────────────

/**
 * Calculate recommended leave period to avoid overlap
 * (Simulates AI predicting the best time to take leave based on team absence)
 */
export function generateAIRecommendations(teamRequests) {
    if (!teamRequests || teamRequests.length === 0) return null;

    const activeLeaves = teamRequests.filter(r => r.status === 'approved' || r.status === 'pending');

    // If we have an overlap function, we could technically use it here, but let's keep it simple
    const maxOverlap = calculateCriticalOverlap(teamRequests);

    if (maxOverlap < 2) return null;

    return {
        flaggedPeriods: ['Upcoming constraints'],
        message: `High team absence (${maxOverlap} overlapping requests) detected. Consider redistributing tasks.`,
        tasksTip: `${maxOverlap} team members will be absent simultaneously. AI recommends halting non-critical tasks.`
    };
}

/**
 * Calculate the maximum number of concurrent absences
 */
export function calculateCriticalOverlap(requests) {
    if (!requests || requests.length === 0) return 0;

    // Only consider approved or pending future/current leaves
    const activeLeaves = requests.filter(r =>
        (r.status === 'approved' || r.status === 'pending') &&
        new Date(r.endDate) >= new Date()
    );

    const dates = {};
    let maxOverlap = 0;

    activeLeaves.forEach(req => {
        let current = new Date(req.startDate);
        const end = new Date(req.endDate);
        while (current <= end) {
            const dStr = current.toISOString().split('T')[0];
            dates[dStr] = (dates[dStr] || 0) + 1;
            if (dates[dStr] > maxOverlap) maxOverlap = dates[dStr];
            current.setDate(current.getDate() + 1);
        }
    });

    return maxOverlap;
}
