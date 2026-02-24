
import { storageService, KEYS } from '../services/StorageService';
import { Task } from '../models/Task';

class TaskController {
    getAll() {
        const rawData = storageService.getAll('tasks');
        return rawData.map(t => new Task(t));
    }

    getByEmployee(employeeId) {
        return this.getAll().filter(t => t.assigneeId === employeeId);
    }

    getByProject(projectId) {
        return this.getAll().filter(t => t.projectId === projectId);
    }

    create(taskData) {
        return new Task(storageService.create('tasks', taskData));
    }

    updateStatus(taskId, status) {
        // Business Logic: If status is 'Completed', validationStatus remains 'Pending' for Manager to approve.
        const updates = { status };
        if (status === 'Completed') {
            updates.validationStatus = 'Pending';
        }
        return new Task(storageService.update('tasks', taskId, updates));
    }

    validateTask(taskId, validationStatus) {
        const updates = { validationStatus };
        if (validationStatus === 'Rejected') {
            updates.status = 'In Progress'; // Send back to employee
        }
        return new Task(storageService.update('tasks', taskId, updates));
    }
}

export const taskController = new TaskController();
