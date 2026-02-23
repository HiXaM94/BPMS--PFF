
/**
 * Task Model
 * @typedef {Object} Task
 * @property {number} id
 * @property {string} title
 * @property {number} projectId
 * @property {string} assigneeId
 * @property {string} priority
 * @property {string} status - 'Not Started', 'In Progress', 'Completed'
 * @property {string} deadline
 * @property {string} validationStatus - 'Pending', 'Validated', 'Rejected'
 */
export class Task {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.projectId = data.projectId;
        this.assigneeId = data.assigneeId;
        this.priority = data.priority;
        this.status = data.status || 'Not Started';
        this.deadline = data.deadline;
        this.validationStatus = data.validationStatus || 'Pending';
    }
}
