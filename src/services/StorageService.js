
/**
 * StorageService.js
 * Handles all data persistence using localStorage to mock a backend database.
 */

const DATA_KEYS = {
  PROJECTS: 'bpms_projects',
  TASKS: 'bpms_tasks',
  PERFORMANCE: 'bpms_performance',
  NOTIFICATIONS: 'bpms_notifications',
};

// Initial Mock Data
const INITIAL_DATA = {
  projects: [
    { id: 1, title: 'HR System Revamp', department: 'IT', managerId: 'manager', status: 'In Progress', progress: 45, startDate: '2025-01-10', endDate: '2025-06-30' },
    { id: 2, title: 'Q1 Marketing Campaign', department: 'Marketing', managerId: 'manager', status: 'Active', progress: 20, startDate: '2025-02-01', endDate: '2025-03-31' },
    { id: 3, title: 'Financial Audit 2024', department: 'Finance', managerId: 'manager', status: 'Completed', progress: 100, startDate: '2024-12-01', endDate: '2025-01-15' },
  ],
  tasks: [
    { id: 101, title: 'Database Schema Design', projectId: 1, assigneeId: 'employee', priority: 'High', status: 'Completed', deadline: '2025-02-15', validationStatus: 'Validated' },
    { id: 102, title: 'API Authentication', projectId: 1, assigneeId: 'employee', priority: 'Critical', status: 'In Progress', deadline: '2025-02-20', validationStatus: 'Pending' },
    { id: 103, title: 'Frontend Dashboard', projectId: 1, assigneeId: 'employee', priority: 'Medium', status: 'Not Started', deadline: '2025-02-28', validationStatus: 'Pending' },
    { id: 104, title: 'Social Media Assets', projectId: 2, assigneeId: 'employee', priority: 'High', status: 'In Progress', deadline: '2025-02-25', validationStatus: 'Pending' },
    { id: 105, title: 'Email Templates', projectId: 2, assigneeId: 'employee', priority: 'Low', status: 'Not Started', deadline: '2025-03-05', validationStatus: 'Pending' },
  ],
  performance: [
    { employeeId: 'employee', tasksCompleted: 15, tasksAssigned: 20, rating: 4.5, period: 'Q1 2025' }
  ]
};

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DATA_KEYS.PROJECTS)) {
      localStorage.setItem(DATA_KEYS.PROJECTS, JSON.stringify(INITIAL_DATA.projects));
    }
    if (!localStorage.getItem(DATA_KEYS.TASKS)) {
      localStorage.setItem(DATA_KEYS.TASKS, JSON.stringify(INITIAL_DATA.tasks));
    }
    if (!localStorage.getItem(DATA_KEYS.PERFORMANCE)) {
      localStorage.setItem(DATA_KEYS.PERFORMANCE, JSON.stringify(INITIAL_DATA.performance));
    }
  }

  get(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Generic Helpers
  getAll(entity) {
    return this.get(DATA_KEYS[entity.toUpperCase()]);
  }

  getById(entity, id) {
    const items = this.getAll(entity);
    return items.find(item => item.id === id);
  }

  create(entity, item) {
    const items = this.getAll(entity);
    const newItem = { ...item, id: Date.now() }; // Simple ID generation
    items.push(newItem);
    this.set(DATA_KEYS[entity.toUpperCase()], items);
    return newItem;
  }

  update(entity, id, updates) {
    const items = this.getAll(entity);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.set(DATA_KEYS[entity.toUpperCase()], items);
      return items[index];
    }
    return null;
  }

  delete(entity, id) {
    const items = this.getAll(entity);
    const filtered = items.filter(item => item.id !== id);
    this.set(DATA_KEYS[entity.toUpperCase()], filtered);
  }
}

export const storageService = new StorageService();
export const KEYS = DATA_KEYS;
