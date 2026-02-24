
import { storageService, KEYS } from '../services/StorageService';
import { Notification } from '../models/Notification';

class NotificationController {
    getAll(userId) {
        const raw = storageService.getAll('notifications') || [];
        return raw.filter(n => n.userId === userId).map(n => new Notification(n));
    }

    getUnread(userId) {
        return this.getAll(userId).filter(n => !n.read);
    }

    create(userId, message, type = 'info') {
        const note = {
            userId,
            message,
            type,
            read: false,
            timestamp: new Date().toISOString()
        };
        return new Notification(storageService.create('notifications', note));
    }

    markAsRead(id) {
        return new Notification(storageService.update('notifications', id, { read: true }));
    }

    // Mock AI Logic for generating notifications
    checkDeadlines(userId) {
        // This would typically run on a backend job.
        // Here we can call it when dashboard loads to "simulate" the check.
        // For now, we'll just seed a sample notification if none exist.
        const existing = this.getAll(userId);
        if (existing.length === 0) {
            this.create(userId, 'Welcome to your new Task Dashboard!', 'info');
            this.create(userId, 'Task "API Authentication" is due in 2 days.', 'warning');
        }
    }
}

export const notificationController = new NotificationController();
