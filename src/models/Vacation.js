
/**
 * VacationModel
 * Represents a leave request and its associated data.
 */
export class VacationRequest {
    constructor(data = {}) {
        this.id = data.id || null;
        this.userId = data.userId || data.user_id || null;
        this.employeeName = data.employeeName || data.users?.name || 'Unknown';
        this.type = data.type || data.leave_type || 'Annual Leave';
        this.startDate = data.startDate || data.start_date || '';
        this.endDate = data.endDate || data.end_date || '';
        this.daysCount = data.daysCount || data.days_count || 0;
        this.reason = data.reason || '';
        this.status = data.status || 'pending';
        this.rejectionReason = data.rejectionReason || data.rejection_reason || '';
        this.approvalReason = data.approvalReason || data.approval_reason || '';
        this.submittedAt = data.submittedAt || data.created_at || new Date().toISOString();
        this.managerId = data.managerId || null;
    }

    /**
     * Validates the request data.
     * @returns {Object} { isValid: boolean, error: string }
     */
    validate() {
        if (!this.startDate || !this.endDate) return { isValid: false, error: 'Start and end dates are required.' };
        if (new Date(this.startDate) > new Date(this.endDate)) return { isValid: false, error: 'Start date must be before end date.' };
        if (!this.reason) return { isValid: false, error: 'Reason is required.' };
        return { isValid: true, error: '' };
    }

    /**
     * Converts the model to Supabase-friendly format.
     */
    toSupabase() {
        return {
            user_id: this.userId,
            leave_type: this.type,
            start_date: this.startDate,
            end_date: this.endDate,
            days_count: this.daysCount,
            reason: this.reason,
            status: this.status,
            rejection_reason: this.rejectionReason,
            approval_reason: this.approvalReason
        };
    }
}

/**
 * LeaveBalanceModel
 * Represents the leave balance for a specific user.
 */
export class LeaveBalance {
    constructor(data = {}) {
        this.userId = data.userId || data.user_id || null;
        this.annual = {
            total: data.annual_total || 22,
            used: data.annual_used || 0,
            remaining: (data.annual_total || 22) - (data.annual_used || 0)
        };
        this.sick = {
            total: data.sick_total || 10,
            used: data.sick_used || 0,
            remaining: (data.sick_total || 10) - (data.sick_used || 0)
        };
        this.remote = {
            total: data.remote_total || 24,
            used: data.remote_used || 0,
            remaining: (data.remote_total || 24) - (data.remote_used || 0)
        };
        this.unpaid = {
            total: data.unpaid_total || 10,
            used: data.unpaid_used || 0,
            remaining: (data.unpaid_total || 10) - (data.unpaid_used || 0)
        };
    }

    /**
     * Checks if the user has enough balance for a request.
     * @param {string} type - Leave type
     * @param {number} days - Number of days requested
     * @returns {boolean}
     */
    hasEnoughBalance(type, days) {
        const typeMap = {
            'Annual Leave': 'annual',
            'Sick Leave': 'sick',
            'Remote Work': 'remote',
            'Unpaid Leave': 'unpaid'
        };
        const balanceType = typeMap[type];
        if (!balanceType) return true; // Default to true for unknown types
        return this[balanceType].remaining >= days;
    }
}
