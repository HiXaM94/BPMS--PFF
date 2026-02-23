
/**
 * Project Model
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} title
 * @property {string} department
 * @property {string} managerId
 * @property {string} status
 * @property {number} progress
 * @property {string} startDate
 * @property {string} endDate
 */
export class Project {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.department = data.department;
        this.managerId = data.managerId;
        this.status = data.status || 'Planned';
        this.progress = data.progress || 0;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
    }
}
