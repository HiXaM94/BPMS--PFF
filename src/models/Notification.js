
/**
 * Notification Model
 * @typedef {Object} Notification
 * @property {number} id
 * @property {string} userId
 * @property {string} type - 'info', 'warning', 'success', 'error'
 * @property {string} message
 * @property {boolean} read
 * @property {string} timestamp
 */
export class Notification {
    constructor(data) {
        this.id = data.id;
        this.userId = data.userId;
        this.type = data.type || 'info';
        this.message = data.message;
        this.read = data.read || false;
        this.timestamp = data.timestamp || new Date().toISOString();
    }
}
