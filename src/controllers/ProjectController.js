
import { storageService, KEYS } from '../services/StorageService';
import { Project } from '../models/Project';

class ProjectController {
    getAll() {
        const rawData = storageService.getAll('projects');
        return rawData.map(p => new Project(p));
    }

    getByManager(managerId) {
        return this.getAll().filter(p => p.managerId === managerId);
    }

    getById(id) {
        const raw = storageService.getById('projects', id);
        return raw ? new Project(raw) : null;
    }

    create(projectData) {
        return new Project(storageService.create('projects', projectData));
    }

    calculateProgress(projectId) {
        // Logic to calculate progress based on tasks will be here, 
        // likely invoking TaskController or doing a cross-lookup if needed.
        // For now, returning stored progress.
        const project = this.getById(projectId);
        return project ? project.progress : 0;
    }
}

export const projectController = new ProjectController();
