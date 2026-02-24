
import { taskController } from './TaskController';
import { performanceController } from './PerformanceController';
import { notificationController } from './NotificationController';

class ValidationController {
    /**
     * Validate a task (Approve/Reject)
     * @param {string} taskId 
     * @param {string} decision - 'approve' | 'reject'
     * @param {string} managerId 
     * @param {string} feedback - Optional feedback
     */
    async validateTask(taskId, decision, managerId, feedback = '') {
        const status = decision === 'approve' ? 'Validated' : 'Rejected';

        // 1. Update Task
        const task = await taskController.validateTask(taskId, status);

        // 2. Notify Employee
        const type = decision === 'approve' ? 'success' : 'warning';
        const message = decision === 'approve'
            ? `Task "${task.title}" has been validated.`
            : `Task "${task.title}" was rejected. Please review.`;

        await notificationController.create(task.assigneeId, message, type);

        // 3. Trigger Performance Recalculation (Implicit next time it's fetched)

        return task;
    }

    getPendingValidation(managerId) {
        // In a real app, we'd filter tasks by projects owned by this manager
        // For now, getting all pending tasks
        const tasks = taskController.getAll();
        return tasks.filter(t => t.validationStatus === 'Pending' && t.status === 'Completed');
    }
}

export const validationController = new ValidationController();
