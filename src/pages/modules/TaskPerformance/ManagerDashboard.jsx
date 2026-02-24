
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '../../../contexts/RoleContext';
import { useController } from '../../../controllers/useController';
import { taskController } from '../../../controllers/TaskController';
import { performanceController } from '../../../controllers/PerformanceController';
import { projectController } from '../../../controllers/ProjectController';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import {
    LayoutDashboard, Users, CheckCircle, AlertCircle,
    FileText, Briefcase, CheckSquare, XCircle, Plus, Search, Trash2, Edit, Clock, Calendar
} from 'lucide-react';

export default function ManagerDashboard() {
    const { currentRole } = useRole();
    const managerId = 'manager'; // Mock ID

    // Fetch Reviews (Validation Pending)
    const { data: allTasks, loading: tasksLoading, refresh: refreshTasks } = useController(
        () => taskController.getAll(), // In real app, filter by manager's team projects
        []
    );

    // Fetch Projects
    const { data: projects, loading: projectsLoading } = useController(
        (id) => projectController.getByManager(id),
        [managerId]
    );

    const [processing, setProcessing] = useState(null);

    // Mock Data for Employees (until User module is ready)
    const MOCK_EMPLOYEES = [
        { id: 'employee', name: 'You (Demo Employee)' }, // Matches the ID used in EmployeeDashboard
        { id: 'emp2', name: 'Sarah Connor' },
        { id: 'emp3', name: 'John Doe' },
        { id: 'emp4', name: 'Jane Smith' }
    ];

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        projectId: '',
        assigneeId: '',
        priority: 'Medium',
        deadline: '',
        description: ''
    });

    const handleValidation = async (taskId, decision) => {
        setProcessing(taskId);
        let newStatus = decision === 'approve' ? 'Completed' : 'In Progress';
        let validationStatus = decision === 'approve' ? 'Validated' : 'Rejected';
        await taskController.validateTask(taskId, validationStatus);
        await refreshTasks();
        setProcessing(null);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        await taskController.create({
            ...newTask,
            status: 'Not Started',
            validationStatus: 'None',
            createdAt: new Date().toISOString()
        });
        setIsCreateOpen(false);
        setNewTask({ title: '', projectId: '', assigneeId: '', priority: 'Medium', deadline: '', description: '' });
        await refreshTasks();
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await taskController.delete(taskId);
            await refreshTasks();
        }
    };

    if (tasksLoading || projectsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    const pendingValidation = allTasks?.filter(t => t.validationStatus === 'Pending') || [];
    const myProjects = projects || [];
    const teamTasks = allTasks || [];

    const validationColumns = [
        {
            key: 'title', label: 'Task', render: (val, row) => (
                <div>
                    <span className="font-semibold text-text-primary block text-sm">{val}</span>
                    <span className="text-[11px] text-text-tertiary">ID: #{row.id}</span>
                </div>
            )
        },
        { key: 'assigneeId', label: 'Assignee', cellClassName: 'text-text-secondary text-sm' },
        { key: 'deadline', label: 'Deadline', cellClassName: 'text-text-secondary text-xs' },
        {
            key: 'actions', label: 'Decision', render: (_, row) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleValidation(row.id, 'approve')}
                        className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-medium"
                    >
                        <CheckCircle size={14} /> Approve
                    </button>
                    <button
                        onClick={() => handleValidation(row.id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                    >
                        <XCircle size={14} /> Reject
                    </button>
                </div>
            )
        }
    ];

    const allTeamTasksColumns = [
        {
            key: 'title', label: 'Task', render: (val, row) => (
                <div>
                    <span className="font-semibold text-text-primary block text-sm">{val}</span>
                    <span className="text-[11px] text-text-tertiary">ID: #{row.id}</span>
                </div>
            )
        },
        {
            key: 'assigneeId', label: 'Assignee', render: (val) => {
                const emp = MOCK_EMPLOYEES.find(e => e.id === val);
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">
                            {emp ? emp.name.charAt(0) : '?'}
                        </div>
                        <span className="text-sm text-text-secondary">{emp ? emp.name : val}</span>
                    </div>
                );
            }
        },
        {
            key: 'priority', label: 'Priority', render: (val) => {
                const map = { Critical: 'danger', High: 'warning', Medium: 'brand', Low: 'neutral' };
                return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
            }
        },
        {
            key: 'status', label: 'Status', render: (val, row) => (
                <StatusBadge variant={row.validationStatus === 'Validated' ? 'success' : (val === 'Completed' ? 'warning' : 'neutral')} size="sm">
                    {row.validationStatus === 'Validated' ? 'Validated' : val}
                </StatusBadge>
            )
        },
        {
            key: 'actions', label: 'Actions', render: (_, row) => (
                <div className="flex gap-2">
                    <button onClick={() => handleDeleteTask(row.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                    </button>
                    {/* Edit could be added similarly */}
                </div>
            )
        }
    ];

    const renderValidationQueue = () => (
        <>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {pendingValidation.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No tasks waiting for validation.
                    </div>
                ) : (
                    pendingValidation.map(row => (
                        <div key={row.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-900">{row.title}</h4>
                                    <span className="text-xs text-gray-500">ID: #{row.id}</span>
                                </div>
                                <span className="text-xs text-gray-500">{row.deadline}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>Assignee: {MOCK_EMPLOYEES.find(e => e.id === row.assigneeId)?.name || row.assigneeId}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex gap-2">
                                <button
                                    onClick={() => handleValidation(row.id, 'approve')}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-xs font-medium"
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                                <button
                                    onClick={() => handleValidation(row.id, 'reject')}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-medium"
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <DataTable
                    columns={validationColumns}
                    data={pendingValidation}
                    emptyMessage="No tasks waiting for validation."
                />
            </div>
        </>
    );

    const renderProjects = () => (
        <>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {myProjects.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No active projects.
                    </div>
                ) : (
                    myProjects.map(row => {
                        const projectTasks = allTasks.filter(t => t.projectId === row.id);
                        const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;
                        const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
                        return (
                            <div key={row.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold text-sm text-gray-900">{row.title}</h4>
                                        <span className="text-xs text-gray-500">{row.department}</span>
                                    </div>
                                    <StatusBadge variant={row.status === 'Active' ? 'brand' : 'neutral'} size="sm">{row.status}</StatusBadge>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <DataTable
                    columns={[
                        { key: 'title', label: 'Project', cellClassName: 'font-semibold text-text-primary text-sm' },
                        { key: 'department', label: 'Dept', cellClassName: 'text-text-secondary text-xs' },
                        { key: 'status', label: 'Status', render: (val) => <StatusBadge variant={val === 'Active' ? 'brand' : 'neutral'} size="sm">{val}</StatusBadge> },
                        {
                            key: 'progress', label: 'Progress', render: (_, row) => {
                                const projectTasks = allTasks.filter(t => t.projectId === row.id);
                                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;
                                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                return (
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 rounded-full bg-border-secondary overflow-hidden">
                                            <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="text-xs text-text-secondary">{progress}%</span>
                                    </div>
                                );
                            }
                        }
                    ]}
                    data={myProjects}
                    emptyMessage="No active projects."
                />
            </div>
        </>
    );

    const renderTeamTasks = () => (
        <>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {allTasks.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No tasks found.
                    </div>
                ) : (
                    allTasks.map(row => (
                        <div key={row.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-900">{row.title}</h4>
                                    <span className="text-xs text-gray-500">ID: #{row.id}</span>
                                </div>
                                <StatusBadge variant={row.validationStatus === 'Validated' ? 'success' : (row.status === 'Completed' ? 'warning' : 'neutral')} size="sm">
                                    {row.validationStatus === 'Validated' ? 'Validated' : row.status}
                                </StatusBadge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">
                                        {MOCK_EMPLOYEES.find(e => e.id === row.assigneeId)?.name.charAt(0) || '?'}
                                    </div>
                                    <span>{MOCK_EMPLOYEES.find(e => e.id === row.assigneeId)?.name || row.assigneeId}</span>
                                </div>
                                {(() => {
                                    const map = { Critical: 'danger', High: 'warning', Medium: 'brand', Low: 'neutral' };
                                    return <StatusBadge variant={map[row.priority] || 'neutral'} size="sm">{row.priority}</StatusBadge>;
                                })()}
                            </div>
                            <div className="pt-3 border-t border-gray-50 flex justify-end">
                                <button onClick={() => handleDeleteTask(row.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Desktop View */}
            <div className="hidden md:block">
                <DataTable
                    columns={allTeamTasksColumns}
                    data={allTasks}
                    emptyMessage="No tasks found."
                />
            </div>
        </>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <PageHeader
                title="Manager Portal"
                description="Oversee projects, validate tasks, and monitor team performance."
                icon={Briefcase}
                iconColor="from-orange-500 to-amber-600"
                actionLabel="New Task"
                actionIcon={Plus}
                onAction={() => setIsCreateOpen(true)}
            />

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Pending Validations"
                    value={pendingValidation.length}
                    icon={CheckSquare}
                    iconColor="bg-gradient-to-br from-amber-500 to-orange-500"
                    subtitle="Requires Attention"
                />
                <StatCard
                    title="Active Projects"
                    value={myProjects.length}
                    icon={LayoutDashboard}
                    iconColor="bg-gradient-to-br from-blue-500 to-indigo-600"
                />
                <StatCard
                    title="Total Team Tasks"
                    value={teamTasks.length}
                    icon={FileText}
                    iconColor="bg-gradient-to-br from-brand-500 to-brand-600"
                />
                <StatCard
                    title="Team Efficiency"
                    value="87%"
                    icon={Users}
                    iconColor="bg-gradient-to-br from-emerald-500 to-teal-600"
                    subtitle="On-time Completion"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Validation Queue */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-amber-50/30">
                        <h2 className="font-semibold text-text-primary flex items-center gap-2">
                            <AlertCircle size={18} className="text-amber-500" />
                            Validation Queue
                        </h2>
                        <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold">{pendingValidation.length}</span>
                    </div>
                    {renderValidationQueue()}
                </div>

                {/* Projects Overview */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border-secondary bg-surface-secondary/30">
                        <h2 className="font-semibold text-text-primary">Active Projects</h2>
                    </div>
                    {renderProjects()}
                </div>
            </div>

            {/* All Team Tasks Section */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border-secondary flex justify-between items-center">
                    <h2 className="font-semibold text-text-primary flex items-center gap-2">
                        <FileText size={18} className="text-brand-500" />
                        All Team Tasks
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                        />
                    </div>
                </div>
                {renderTeamTasks()}
            </div>

            import React, {useState} from 'react';
            import {createPortal} from 'react-dom';
            import {useRole} from '../../../contexts/RoleContext';
            // ... existing imports

            // ... inside component ...

            {/* Create Task Modal */}
            {isCreateOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-900">Create New Task</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-900">&times;</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Task Title</label>
                                <input
                                    required
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                                    placeholder="e.g. Update API Documentation"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Project</label>
                                    <select
                                        required
                                        value={newTask.projectId}
                                        onChange={e => setNewTask({ ...newTask, projectId: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                                    >
                                        <option value="">Select Project...</option>
                                        {myProjects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To</label>
                                    <select
                                        required
                                        value={newTask.assigneeId}
                                        onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                                    >
                                        <option value="">Select Employee...</option>
                                        {MOCK_EMPLOYEES.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Deadline</label>
                                    <input
                                        required
                                        type="date"
                                        value={newTask.deadline}
                                        onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none resize-none"
                                    placeholder="Task details..."
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-all"
                                >
                                    Create Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
