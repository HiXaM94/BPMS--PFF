
/**
 * Performance Model
 * @typedef {Object} Performance
 * @property {string} employeeId
 * @property {number} tasksCompleted
 * @property {number} tasksAssigned
 * @property {number} rating
 * @property {string} period
 */
export class Performance {
    constructor(data) {
        this.employeeId = data.employeeId;
        this.tasksCompleted = data.tasksCompleted || 0;
        this.tasksAssigned = data.tasksAssigned || 0;
        this.rating = data.rating || 0;
        this.period = data.period;
    }

    get completionRate() {
        if (this.tasksAssigned === 0) return 0;
        return Math.round((this.tasksCompleted / this.tasksAssigned) * 100);
    }
}
