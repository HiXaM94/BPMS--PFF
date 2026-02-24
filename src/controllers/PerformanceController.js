
import { storageService, KEYS } from '../services/StorageService';
import { Performance } from '../models/Performance';
import { taskController } from './TaskController';

class PerformanceController {
    getEmployeePerformance(employeeId) {
        // realtime calculation based on tasks
        const tasks = taskController.getByEmployee(employeeId);
        const total = tasks.length;
        const validated = tasks.filter(t => t.validationStatus === 'Validated').length;

        // Check if there is stored performance record for periodic reviews
        // For now, we return a realtime snapshot object
        return new Performance({
            employeeId,
            tasksAssigned: total,
            tasksCompleted: validated, // "Completed" for performance means Validated by manager
            period: 'Current Sprint'
        });
    }

    calculateProjectProgress(projectId) {
        const tasks = taskController.getByProject(projectId);
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(t => t.status === 'Completed').length; // using status for simple progress
        return Math.round((completed / tasks.length) * 100);
    }
}

export const performanceController = new PerformanceController();
