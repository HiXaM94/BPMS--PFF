

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
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

import StatusBadge from '../../../components/ui/StatusBadge';

import { managerData } from '../../../data/mockData';

import {

    LayoutDashboard, Users, CheckCircle, AlertCircle,
    FileText, Briefcase, CheckSquare, XCircle, Plus, Search, Trash2, Edit, Clock, Calendar, TrendingUp, Activity, ArrowUpRight, CheckCircle2, MessageSquare
} from 'lucide-react';



export default function ManagerDashboard() {

    const { currentRole } = useRole();

    const managerId = 'manager'; // Mock ID



    const [selectedProject, setSelectedProject] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);



    const handleProjectClick = (project) => {

        // Enriched project with data from mockData if missing (like description/budget)

        const enrichedProject = managerData.assignedProjects.find(p => p.id === project.id) || project;

        setSelectedProject(enrichedProject);

        setIsModalOpen(true);

    };



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
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const confirmDeleteTask = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        taskController.delete(deleteTarget.id);
        await refreshTasks();
        setDeleting(false);
        setDeleteTarget(null);
    };



    // Mock Data for Employees (until User module is ready)

    const MOCK_EMPLOYEES = [

        { id: 'employee', name: 'You (Demo Employee)' },

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



    const myProjectsColumns = (onTitleClick) => [

        {

            key: 'title',

            label: 'Project Name',

            render: (val, row) => (

                <button

                    onClick={() => onTitleClick(row)}

                    className="font-semibold text-text-primary text-sm hover:text-brand-500 hover:underline transition-all text-left cursor-pointer"

                >

                    {val}

                </button>

            )

        },

        { key: 'department', label: 'Department', cellClassName: 'text-text-tertiary text-xs uppercase font-bold' },

        {

            key: 'status', label: 'Status', render: (val) => (

                <StatusBadge variant={val === 'Active' ? 'brand' : 'neutral'} size="sm">{val}</StatusBadge>

            )

        },

        {

            key: 'progress', label: 'Progress', render: (_, row) => {

                const projectTasks = allTasks.filter(t => t.projectId === row.id);

                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                return (

                    <div className="flex items-center gap-2">

                        <div className="w-16 h-1.5 bg-border-secondary rounded-full overflow-hidden">

                            <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />

                        </div>

                        <span className="text-[10px] font-bold text-text-secondary">{progress}%</span>

                    </div>

                );

            }

        }

    ];



    const taskValidationColumns = [

        {

            key: 'title', label: 'Task', render: (val, row) => (

                <div>

                    <p className="font-semibold text-text-primary text-sm leading-tight">{val}</p>

                    <p className="text-[10px] text-text-tertiary uppercase font-bold mt-0.5">ID: #{row.id}</p>

                </div>

            )

        },

        {

            key: 'assigneeId', label: 'Assignee', render: (val) => (

                <div className="flex items-center gap-2">

                    <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-[10px]">

                        {val.charAt(0)}

                    </div>

                    <span className="text-xs text-text-secondary font-medium">{val}</span>

                </div>

            )

        },

        {

            key: 'actions', label: 'Decision', render: (_, row) => (

                <div className="flex items-center gap-2">

                    <button

                        onClick={() => handleValidation(row.id, 'approve')}

                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"

                        disabled={processing === row.id}

                    >

                        {processing === row.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin rounded-full" /> : <CheckCircle2 size={14} />}

                    </button>

                    <button

                        onClick={() => handleValidation(row.id, 'reject')}

                        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all"

                        disabled={processing === row.id}

                    >

                        <XCircle size={14} />

                    </button>

                    <button
                        onClick={() => setDeleteTarget(row)}
                        className="p-1.5 rounded-lg bg-gray-500/10 text-gray-500 hover:bg-red-500 hover:text-white transition-all"
                        disabled={processing === row.id}
                        title="Delete Task"
                    >
                        <Trash2 size={14} />
                    </button>

                </div>

            )

        }

    ];



    const teamProgressionColumns = [

        {

            key: 'name', label: 'Employee', render: (val, row) => (

                <div className="flex items-center gap-2">

                    <div className="w-7 h-7 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-[10px] border border-orange-500/20">

                        {(val || 'U').charAt(0)}

                    </div>

                    <div>

                        <p className="font-semibold text-text-primary text-xs">{val}</p>

                        <p className="text-[9px] text-text-tertiary">{row.role}</p>

                    </div>

                </div>

            )

        },

        {

            key: 'efficiency', label: 'Efficiency', render: (val) => (

                <div className="flex items-center gap-2">

                    <div className="w-12 h-1 bg-border-secondary rounded-full overflow-hidden">

                        <div className="h-full bg-brand-500" style={{ width: `${val}%` }} />

                    </div>

                    <span className="text-[10px] font-bold text-brand-600">{val}%</span>

                </div>

            )

        },

        {

            key: 'tasksCompleted', label: 'Tasks', render: (val, row) => (

                <span className="text-[10px] font-medium text-text-secondary">

                    <b className="text-text-primary">{val}</b>/{val + (row.tasksActive || 0)}

                </span>

            )

        },

        {

            key: 'status', label: 'Status', render: (val) => (

                <StatusBadge variant={val === 'Active' ? 'success' : 'warning'} size="xs" dot>{val}</StatusBadge>

            )

        }

    ];



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



            {/* 4-Table Layout */}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* 1. Projects Linked by Admin (Functional) */}

                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-brand-500/5">

                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                            <Briefcase size={16} className="text-brand-500" />

                            Projects Linked to Me

                        </h2>

                    </div>

                    <DataTable

                        columns={myProjectsColumns(handleProjectClick)}

                        data={myProjects}

                        emptyMessage="No projects assigned."

                    />

                </div>



                {/* 2. Team Task Validation (Functional) */}

                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-amber-500/5">

                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                            <Clock size={16} className="text-amber-500" />

                            Task Validation Request

                        </h2>

                        <StatusBadge variant="warning" size="sm">{pendingValidation.length} Awaiting</StatusBadge>

                    </div>

                    <DataTable columns={taskValidationColumns} data={pendingValidation} emptyMessage="No tasks waiting for validation." />

                </div>

            </div>

            {/* Admin Feedback (Mocked) */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm flex flex-col justify-center animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-text-primary">Administrative Feedback</h2>
                        <p className="text-xs text-text-tertiary">Notes from Leadership</p>
                    </div>
                </div>
                <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary group relative">
                    <p className="text-sm font-medium text-text-primary italic">"Great job on the recent sprint. Team efficiency is looking highly positive. Keep focusing on the redesign project delivery."</p>
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center text-[10px] font-semibold text-text-tertiary">
                            <Clock size={10} className="mr-1" /> 2 hours ago • Admin Team
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Team Member Progression (Instant) */}

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                <div className="p-5 border-b border-border-secondary flex justify-between items-center">

                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                        <TrendingUp size={16} className="text-emerald-500" />

                        Team Member Progression (Instant)

                    </h2>

                </div>

                <DataTable columns={teamProgressionColumns} data={managerData.teamMembers} />

            </div>



            {/* 4. Active Projects Overall Progress */}

            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">

                <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/30">

                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">

                        <Activity size={16} className="text-brand-500" />

                        Active Projects Overall Progress

                    </h2>

                </div>

                <DataTable

                    columns={[

                        {

                            key: 'title',

                            label: 'Project',

                            render: (val, row) => (

                                <button

                                    onClick={() => handleProjectClick(row)}

                                    className="font-bold text-text-primary text-sm hover:text-brand-500 hover:underline transition-all text-left cursor-pointer"

                                >

                                    {val}

                                </button>

                            )

                        },

                        {

                            key: 'progress', label: 'Progress', render: (_, row) => {

                                const projectTasks = allTasks.filter(t => t.projectId === row.id);

                                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                const progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                return (

                                    <div className="flex items-center gap-3">

                                        <div className="flex-1 h-2 bg-border-secondary rounded-full overflow-hidden max-w-[120px]">

                                            <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${progress}%` }} />

                                        </div>

                                        <span className="text-xs font-black text-brand-600">{progress}%</span>

                                    </div>

                                );

                            }

                        },

                        { key: 'department', label: 'Team', render: (val) => <span className="text-xs font-semibold text-text-tertiary">{val}</span> },

                        {

                            key: 'actions', label: '', render: () => (

                                <button className="text-brand-500 hover:text-brand-600 transition-colors">

                                    <ArrowUpRight size={16} />

                                </button>

                            )

                        }

                    ]}

                    data={myProjects}

                />

            </div>



            {/* Project Detail Modal */}

            {isModalOpen && selectedProject && createPortal(

                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">

                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Modal Header */}

                        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-brand-500/10 to-transparent relative">

                            <div className="flex justify-between items-start mb-4">

                                <div className="space-y-1">

                                    <div className="flex items-center gap-3">

                                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">

                                            <Briefcase size={24} />

                                        </div>

                                        <div>

                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">{selectedProject.title}</h3>

                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{selectedProject.department} • {selectedProject.client || 'Enterprise'}</p>

                                        </div>

                                    </div>

                                </div>

                                <button

                                    onClick={() => setIsModalOpen(false)}

                                    className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:text-gray-900 transition-all active:scale-90"

                                >

                                    <XCircle size={20} />

                                </button>

                            </div>

                            <div className="flex items-center gap-4 mt-6">

                                <StatusBadge variant={selectedProject.status === 'Active' ? 'brand' : 'danger'} size="sm" dot>{selectedProject.status}</StatusBadge>

                                <div className="h-4 w-px bg-gray-200" />

                                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">

                                    <Clock size={14} className="text-brand-500" />

                                    Deadline: {selectedProject.deadline}

                                </div>

                            </div>

                        </div>



                        {/* Modal Body */}

                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">

                            <div className="space-y-3">

                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Project Overview</h4>

                                <p className="text-sm text-gray-600 leading-relaxed font-medium">

                                    {selectedProject.description || 'Comprehensive project management and execution phase for ' + selectedProject.title + '.'}

                                </p>

                            </div>



                            <div className="grid grid-cols-2 gap-8">

                                <div className="space-y-4">

                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Financial Summary</h4>

                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">

                                        <span className="text-xs font-bold text-emerald-600/80">Total Budget</span>

                                        <span className="text-lg font-black text-emerald-600">{selectedProject.budget || '$0'}</span>

                                    </div>

                                </div>

                                <div className="space-y-4">

                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Team Composition</h4>

                                    <div className="flex items-center gap-2">

                                        <div className="flex -space-x-3">

                                            {[1, 2, 3, 4].map(i => (

                                                <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">

                                                    {String.fromCharCode(64 + i)}

                                                </div>

                                            ))}

                                        </div>

                                        <span className="text-xs font-bold text-gray-500">+{selectedProject.members - 4} more</span>

                                    </div>

                                </div>

                            </div>



                            <div className="space-y-4">

                                <div className="flex justify-between items-end">

                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Progression</h4>

                                    <span className="text-xl font-black text-brand-600">

                                        {(() => {

                                            const projectTasks = allTasks.filter(t => t.projectId === selectedProject.id);

                                            const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                            return projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                        })()}%

                                    </span>

                                </div>

                                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">

                                    <div

                                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 shadow-lg shadow-brand-500/30 transition-all duration-1000 ease-out"

                                        style={{

                                            width: `${(() => {

                                                const projectTasks = allTasks.filter(t => t.projectId === selectedProject.id);

                                                const completed = projectTasks.filter(t => t.status === 'Completed' || t.validationStatus === 'Validated').length;

                                                return projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;

                                            })()}%`

                                        }}

                                    />

                                </div>

                            </div>

                        </div>



                        {/* Modal Footer */}

                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">

                            <button

                                onClick={() => setIsModalOpen(false)}

                                className="px-6 py-2.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"

                            >

                                Close

                            </button>

                            <button className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all active:translate-y-0">

                                Manage Project

                            </button>

                        </div>

                    </div>

                </div>,

                document.body

            )}

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

            {/* Delete Task Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDeleteTask}
                title="Delete Task"
                message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ''}
                confirmLabel="Delete Task"
                loading={deleting}
            />

        </div>

    );

}

