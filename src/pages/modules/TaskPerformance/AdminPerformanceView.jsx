import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Users, TrendingUp, Activity, BarChart3, Edit3, Plus, Target,
    CheckCircle2, Clock, ListChecks, Calendar, MessageSquare, Save, FolderGit2, XCircle, Briefcase
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useSearchParams } from 'react-router-dom';

// --- INITIAL MOCK DATA ---
const initialEmployees = [
    { id: 1, name: 'Alice Cooper', teamId: 101, completedTasks: 45, deadlines: 98, productivity: 95, score: 94 },
    { id: 2, name: 'Bob Smith', teamId: 101, completedTasks: 38, deadlines: 85, productivity: 88, score: 86 },
    { id: 3, name: 'Charlie Davis', teamId: 102, completedTasks: 52, deadlines: 100, productivity: 99, score: 98 },
    { id: 4, name: 'Dana White', teamId: 102, completedTasks: 29, deadlines: 75, productivity: 80, score: 78 },
];

const initialTeams = [
    { id: 101, name: 'Engineering Alpha', managerId: 201, performance: 90, productivity: 92 },
    { id: 102, name: 'Marketing Core', managerId: 202, performance: 88, productivity: 89 },
];

const initialManagers = [
    { id: 201, name: 'Michael Scott', teamId: 101, productivity: 93, projectProgress: 88, completedTasks: 95, notes: [] },
    { id: 202, name: 'Sarah Connor', teamId: 102, productivity: 90, projectProgress: 85, completedTasks: 92, notes: [] },
];

const INITIAL_PROJECTS = [
    { id: 301, name: 'Website Redesign', desc: 'Revamp external website UI', start: '2026-03-01', deadline: '2026-06-01', managerId: 202, status: 'Active' },
    { id: 302, name: 'Q1 MVP Launch', desc: 'Successfully launched V1', start: '2025-01-01', deadline: '2025-03-31', managerId: 201, status: 'Completed' },
];
const ADMIN_TABS = ['overview', 'employees', 'managers', 'projects'];

export default function AdminPerformanceView() {
    const [activeTab, setActiveTab] = useState('overview');
    const [employees] = useState(initialEmployees);
    const [teams] = useState(initialTeams);
    const [managers, setManagers] = useState(initialManagers);
    const [projects, setProjects] = useState(INITIAL_PROJECTS);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab && ADMIN_TABS.includes(queryTab) && queryTab !== activeTab) {
            setActiveTab(queryTab);
        }
    }, [searchParams, activeTab]);

    // Notes state
    const [selectedManager, setSelectedManager] = useState(null);
    const [noteText, setNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState(null);

    // Project state
    const [newProject, setNewProject] = useState({ name: '', desc: '', start: '', deadline: '', managerId: '' });
    const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    // --- HANDLERS ---
    const handleSaveNote = () => {
        if (!selectedManager || !noteText.trim()) return;

        setManagers(prev => prev.map(m => {
            if (m.id === selectedManager.id) {
                if (editingNoteId) {
                    return {
                        ...m, notes: m.notes.map(n => n.id === editingNoteId ? { ...n, text: noteText, updatedAt: new Date().toISOString() } : n)
                    };
                } else {
                    return {
                        ...m, notes: [...m.notes, { id: Date.now(), text: noteText, timestamp: new Date().toISOString() }]
                    };
                }
            }
            return m;
        }));
        setNoteText('');
        setEditingNoteId(null);
    };

    const handleEditNote = (note) => {
        setNoteText(note.text);
        setEditingNoteId(note.id);
    };

    const handleCreateProject = (e) => {
        e.preventDefault();
        if (!newProject.name || !newProject.managerId) return;

        setProjects(prev => [{
            ...newProject,
            id: Date.now(),
            managerId: parseInt(newProject.managerId),
            status: 'Active'
        }, ...prev]);
        setNewProject({ name: '', desc: '', start: '', deadline: '', managerId: '' });
    };

    // --- RENDER HELPERS ---
    const getScoreColor = (score) => {
        if (score >= 90) return 'text-emerald-500 bg-emerald-500/10';
        if (score >= 80) return 'text-blue-500 bg-blue-500/10';
        if (score >= 70) return 'text-amber-500 bg-amber-500/10';
        return 'text-red-500 bg-red-500/10';
    };

    const getScoreBg = (score) => {
        if (score >= 90) return 'bg-emerald-500';
        if (score >= 80) return 'bg-blue-500';
        if (score >= 70) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const tabs = [
        { id: 'overview', label: 'Team & Overview', icon: BarChart3 },
        { id: 'employees', label: 'Employee Tracking', icon: Users },
        { id: 'managers', label: 'Manager Evaluation', icon: Target },
        { id: 'projects', label: 'Projects & Delegation', icon: FolderGit2 },
    ];

    const projectHistoryColumns = [
        { key: 'name', label: 'Title', render: (val, row) => <button onClick={() => { setSelectedProjectForModal(row); setIsProjectModalOpen(true); }} className="font-bold text-text-primary text-sm hover:text-brand-500 hover:underline cursor-pointer">{val}</button> },
        { key: 'managerId', label: 'Manager', render: (val) => <span className="text-sm font-medium">{managers.find(m => m.id === val)?.name}</span> },
        { key: 'status', label: 'Status', render: (val) => <StatusBadge variant={val === 'Active' ? 'brand' : 'success'} size="sm">{val}</StatusBadge> },
        { key: 'deadline', label: 'Deadline', render: (val) => <span className="text-xs text-text-secondary">{val}</span> },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader
                title="Admin Task & Performance"
                description="Monitor performance metrics, evaluate managers, and oversee project delegation across the organization."
                icon={TrendingUp}
                iconColor="from-brand-500 to-indigo-600"
            />

            {/* Tabs */}
            <div className="flex space-x-2 bg-surface-secondary/50 p-1 rounded-xl w-fit border border-border-secondary shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                            ? 'bg-surface-primary text-brand-600 dark:text-white shadow-sm ring-1 ring-border-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Total Teams" value={teams.length} icon={Users} iconColor="bg-blue-500" />
                        <StatCard title="Avg Productivity" value={`${Math.round(teams.reduce((a, b) => a + b.productivity, 0) / teams.length)}%`} icon={Activity} iconColor="bg-emerald-500" />
                        <StatCard title="Active Projects" value={projects.length} icon={FolderGit2} iconColor="bg-brand-500" />
                    </div>

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-text-primary mb-6">Team Performance Comparison</h2>
                        <div className="space-y-6">
                            {teams.map(team => (
                                <div key={team.id} className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-3">
                                        <p className="font-semibold text-text-primary">{team.name}</p>
                                        <p className="text-xs text-text-tertiary">Mgr: {managers.find(m => m.id === team.managerId)?.name}</p>
                                    </div>
                                    <div className="col-span-7">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-text-secondary w-16">Perf.</span>
                                            <div className="h-2 flex-1 bg-surface-secondary rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(team.performance)}`} style={{ width: `${team.performance}%` }} />
                                            </div>
                                            <span className="text-xs font-bold w-8 text-right">{team.performance}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-text-secondary w-16">Prod.</span>
                                            <div className="h-2 flex-1 bg-surface-secondary rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getScoreBg(team.productivity)}`} style={{ width: `${team.productivity}%` }} />
                                            </div>
                                            <span className="text-xs font-bold w-8 text-right">{team.productivity}%</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <StatusBadge variant={team.performance >= 90 ? 'success' : team.performance >= 80 ? 'info' : 'warning'}>
                                            {team.performance >= 90 ? 'Excellent' : team.performance >= 80 ? 'Good' : 'Needs Review'}
                                        </StatusBadge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* EMPLOYEES TAB */}
            {activeTab === 'employees' && (
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in">
                    <div className="p-5 border-b border-border-secondary">
                        <h2 className="text-lg font-bold text-text-primary">Employee Performance Tracking</h2>
                        <p className="text-xs text-text-tertiary">Detailed metrics based on tasks, deadlines, and productivity.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-secondary/50 border-b border-border-secondary text-xs uppercase text-text-tertiary font-bold tracking-wider">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Team</th>
                                    <th className="px-6 py-4">Tasks Done</th>
                                    <th className="px-6 py-4">Deadlines Met</th>
                                    <th className="px-6 py-4">Productivity</th>
                                    <th className="px-6 py-4 text-right">Overall Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-secondary">
                                {employees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-surface-secondary/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-text-primary">{emp.name}</td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">{teams.find(t => t.id === emp.teamId)?.name}</td>
                                        <td className="px-6 py-4 text-sm font-semibold">{emp.completedTasks}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                                                    <div className={`h-full ${getScoreBg(emp.deadlines)}`} style={{ width: `${emp.deadlines}%` }} />
                                                </div>
                                                <span className="text-xs font-semibold">{emp.deadlines}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold">{emp.productivity}%</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold ${getScoreColor(emp.score)}`}>
                                                {emp.score}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MANAGERS TAB */}
            {activeTab === 'managers' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    <div className="col-span-2 space-y-6">
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-text-primary mb-4">Manager Performance Evaluation</h2>
                            <div className="grid gap-4">
                                {managers.map(mgr => (
                                    <div
                                        key={mgr.id}
                                        onClick={() => setSelectedManager(mgr)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedManager?.id === mgr.id
                                            ? 'border-brand-500 bg-brand-50/10 shadow-md transform scale-[1.01]'
                                            : 'border-border-secondary bg-surface-secondary hover:border-text-tertiary'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-text-primary text-lg">{mgr.name}</h3>
                                                <p className="text-sm text-text-tertiary">{teams.find(t => t.id === mgr.teamId)?.name}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <StatusBadge variant="success">Active</StatusBadge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-xs text-text-tertiary font-medium">Team Productivity</span>
                                                <p className="text-xl font-bold text-text-primary flex items-center gap-1">
                                                    {mgr.productivity}% <TrendingUp size={14} className="text-emerald-500" />
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-text-tertiary font-medium">Project Progress</span>
                                                <p className="text-xl font-bold text-text-primary">{mgr.projectProgress}%</p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-text-tertiary font-medium">Task Completion</span>
                                                <p className="text-xl font-bold text-text-primary">{mgr.completedTasks}%</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1">
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm h-full flex flex-col">
                            <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
                                <MessageSquare size={18} className="text-brand-500" /> Administrative Notes
                            </h2>

                            {!selectedManager ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-tertiary border-2 border-dashed border-border-secondary rounded-xl mt-4">
                                    <Edit3 size={32} className="mb-3 opacity-50" />
                                    <p className="text-sm font-medium">Select a manager to view or add notes.</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col mt-4">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-text-primary">Notes for {selectedManager.name}</h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                                        {selectedManager.notes.length === 0 ? (
                                            <p className="text-xs text-text-tertiary italic">No notes recorded yet.</p>
                                        ) : (
                                            selectedManager.notes.map(note => (
                                                <div key={note.id} className="p-3 bg-surface-secondary rounded-xl border border-border-secondary group relative">
                                                    <p className="text-sm text-text-primary whitespace-pre-wrap">{note.text}</p>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                                                            <Clock size={10} /> {new Date(note.timestamp || note.updatedAt).toLocaleString()}
                                                        </span>
                                                        <button
                                                            onClick={() => handleEditNote(note)}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-brand-500 hover:text-brand-600 font-medium transition-opacity"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border-secondary">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add an evaluation note..."
                                            className="w-full p-3 bg-surface-secondary border border-border-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none min-h-[100px]"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={handleSaveNote}
                                                disabled={!noteText.trim()}
                                                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                <Save size={16} />
                                                {editingNoteId ? 'Update Note' : 'Save Note'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === 'projects' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">

                    {/* Create Project Form */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-text-primary mb-1">Create New Project</h2>
                        <p className="text-xs text-text-tertiary mb-6">Assign a new project to a team manager.</p>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1">Project Name</label>
                                <input
                                    type="text" required
                                    value={newProject.name} onChange={r => setNewProject({ ...newProject, name: r.target.value })}
                                    className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                    placeholder="e.g., Q3 Marketing Campaign"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1">Description</label>
                                <textarea
                                    value={newProject.desc} onChange={r => setNewProject({ ...newProject, desc: r.target.value })}
                                    className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-20"
                                    placeholder="Project objectives..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Start Date</label>
                                    <input
                                        type="date" required
                                        value={newProject.start} onChange={r => setNewProject({ ...newProject, start: r.target.value })}
                                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1">Deadline</label>
                                    <input
                                        type="date" required
                                        value={newProject.deadline} onChange={r => setNewProject({ ...newProject, deadline: r.target.value })}
                                        className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1">Assign to Manager</label>
                                <select
                                    required value={newProject.managerId} onChange={r => setNewProject({ ...newProject, managerId: r.target.value })}
                                    className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                                >
                                    <option value="">Select Manager...</option>
                                    {managers.map(m => <option key={m.id} value={m.id}>{m.name} ({teams.find(t => t.id === m.teamId)?.name})</option>)}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors mt-2 shadow-md shadow-brand-500/20"
                            >
                                <Plus size={18} /> Create & Delegate Project
                            </button>
                        </form>
                    </div>

                    {/* Active Projects & Delegation Flow Visual */}
                    <div className="space-y-6">
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-text-primary mb-4">Active Projects Overview</h2>
                            <div className="space-y-4">
                                {projects.filter(p => p.status === 'Active').length === 0 ? (
                                    <p className="text-sm text-text-tertiary">No active projects.</p>
                                ) : (
                                    projects.filter(p => p.status === 'Active').map(proj => (
                                        <div key={proj.id} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary hover:border-text-tertiary transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <button onClick={() => { setSelectedProjectForModal(proj); setIsProjectModalOpen(true); }} className="font-bold text-text-primary hover:text-brand-500 hover:underline cursor-pointer text-left">{proj.name}</button>
                                                <StatusBadge variant="info">Delegated</StatusBadge>
                                            </div>
                                            <p className="text-xs text-text-tertiary mb-3 line-clamp-2">{proj.desc}</p>

                                            {/* Delegation Flow Visualization */}
                                            <div className="p-3 bg-surface-primary rounded-lg border border-border-secondary text-xs">
                                                <div className="flex items-center gap-2 font-medium text-text-primary mb-2">
                                                    <Users size={14} className="text-indigo-500" /> Delegation Flow
                                                </div>
                                                <div className="flex items-center text-text-secondary relative">
                                                    <div className="absolute left-[9px] top-4 bottom-[-8px] w-0.5 bg-border-secondary"></div>
                                                    <div className="flex items-center gap-2 mb-2 z-10">
                                                        <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border border-brand-200">M</div>
                                                        <span>Assigned to <span className="font-semibold">{managers.find(m => m.id === proj.managerId)?.name}</span></span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center text-text-secondary relative ml-1 mt-1">
                                                    <div className="flex items-center gap-2 z-10 pl-6">
                                                        <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200"><CheckCircle2 size={10} /></div>
                                                        <span className="text-text-tertiary italic">Manager divides and assigns tasks to team</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mt-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> Start: {proj.start || 'TBD'}</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> Due: {proj.deadline || 'TBD'}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Historical Projects Table */}
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-border-secondary flex justify-between items-center">
                                <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <FolderGit2 size={16} className="text-brand-500" /> Project History
                                </h2>
                            </div>
                            <DataTable columns={projectHistoryColumns} data={projects} />
                        </div>
                    </div>
                </div>
            )}

            {/* Project Details Modal */}
            {isProjectModalOpen && selectedProjectForModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-2xl border border-border-primary overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-border-secondary bg-gradient-to-br from-brand-500/10 to-transparent relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-text-primary tracking-tight">{selectedProjectForModal.name}</h3>
                                        <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Delegated to {managers.find(m => m.id === selectedProjectForModal.managerId)?.name}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsProjectModalOpen(false)}
                                    className="p-2 rounded-xl bg-surface-secondary text-text-tertiary hover:text-text-primary transition-all active:scale-90 cursor-pointer"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <StatusBadge variant={selectedProjectForModal.status === 'Active' ? 'brand' : 'success'} size="sm" dot>{selectedProjectForModal.status}</StatusBadge>
                                <div className="h-4 w-px bg-border-secondary" />
                                <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                    <Clock size={14} className="text-brand-500" />
                                    Deadline: {selectedProjectForModal.deadline || 'N/A'}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Description</h4>
                                <p className="text-sm text-text-secondary">{selectedProjectForModal.desc || 'No description provided.'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-text-tertiary">Start Date</h4>
                                    <p className="text-sm text-text-primary">{selectedProjectForModal.start || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-text-tertiary">Deadline</h4>
                                    <p className="text-sm text-text-primary">{selectedProjectForModal.deadline || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex justify-end border-t border-border-secondary pt-6 mt-4">
                                <button onClick={() => setIsProjectModalOpen(false)} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-brand-500/20">
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    );
}
