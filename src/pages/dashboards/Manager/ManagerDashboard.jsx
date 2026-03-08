import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    Users,
    ListChecks,
    ClipboardCheck,
    TrendingUp,
    Star,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    LayoutDashboard,
    Clock,
    Activity,
    Briefcase
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import MiniChart from '../../../components/ui/MiniChart';
import PasswordChangeModal from '../../../components/ui/PasswordChangeModal';
import { managerData } from '../../../data/mockData';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import { useAuth } from '../../../contexts/AuthContext';
import { useDefaultPasswordCheck } from '../../../hooks/useDefaultPasswordCheck';

const statIcons = [Users, ListChecks, ClipboardCheck, TrendingUp];
const statColors = [
    'bg-gradient-to-br from-[#ff9a55] to-[#ffbe7b]',
    'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
    'bg-gradient-to-br from-[#ff6a55] to-[#ff9a7b]',
    'bg-gradient-to-br from-[#83bf6e] to-[#a8d99a]',
];

// Table column definitions
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
    { key: 'deadline', label: 'Deadline', cellClassName: 'text-text-secondary text-xs' },
    {
        key: 'status', label: 'Status', render: (val) => (
            <StatusBadge variant={val === 'Active' ? 'brand' : val === 'Critical' ? 'danger' : 'neutral'} size="sm">{val}</StatusBadge>
        )
    },
];

const taskValidationColumns = [
    {
        key: 'title', label: 'Task', render: (val, row) => (
            <div>
                <p className="font-semibold text-text-primary text-sm leading-tight">{val}</p>
                <p className="text-[10px] text-text-tertiary uppercase font-bold mt-0.5">{row.project}</p>
            </div>
        )
    },
    {
        key: 'assignee', label: 'Assignee', render: (val) => (
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-[10px]">
                    {val.charAt(0)}
                </div>
                <span className="text-sm text-text-secondary font-medium">{val}</span>
            </div>
        )
    },
    {
        key: 'priority', label: 'Priority', render: (val) => (
            <StatusBadge variant={val === 'Critical' ? 'danger' : val === 'High' ? 'warning' : 'brand'} size="sm">{val}</StatusBadge>
        )
    },
    {
        key: 'actions', label: 'Decision', render: () => (
            <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                    <CheckCircle2 size={14} />
                </button>
                <button className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all">
                    <XCircle size={14} />
                </button>
            </div>
        )
    }
];

const teamProgressionColumns = [
    {
        key: 'name', label: 'Employee', render: (val, row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-500/20">
                    {(val || 'U').charAt(0)}
                </div>
                <div>
                    <p className="font-semibold text-text-primary text-sm">{val}</p>
                    <p className="text-[10px] text-text-tertiary">{row.role}</p>
                </div>
            </div>
        )
    },
    {
        key: 'efficiency', label: 'Efficiency', render: (val) => (
            <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-border-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${val}%` }} />
                </div>
                <span className="text-xs font-bold text-brand-600">{val}%</span>
            </div>
        )
    },
    {
        key: 'tasksCompleted', label: 'Tasks', render: (val, row) => (
            <span className="text-xs font-medium text-text-secondary">
                <b className="text-text-primary">{val}</b> / {val + (row.tasksActive || 0)}
            </span>
        )
    },
    {
        key: 'status', label: 'Status', render: (val) => (
            <StatusBadge variant={val === 'Active' ? 'success' : 'warning'} size="sm" dot>{val}</StatusBadge>
        )
    }
];

const approvalColumns = [
    {
        key: 'title',
        label: 'Request',
        render: (val, row) => (
            <div>
                <span className="font-semibold text-text-primary block">{val}</span>
                <span className="text-[11px] text-text-tertiary">{row.requester}</span>
            </div>
        ),
    },
    {
        key: 'type', label: 'Type', render: (val) => (
            <StatusBadge variant="neutral" size="sm" dot>{val}</StatusBadge>
        )
    },
    {
        key: 'amount', label: 'Amount/Duration', cellClassName: 'text-text-secondary font-medium text-xs'
    },
    {
        key: 'priority', label: 'Priority', render: (val) => (
            <StatusBadge variant={val === 'high' ? 'danger' : val === 'medium' ? 'warning' : 'brand'} size="sm">
                {val}
            </StatusBadge>
        )
    },
    { key: 'submitted', label: 'Submitted', cellClassName: 'text-text-secondary text-xs' },
    {
        key: 'actions', label: 'Actions', render: () => (
            <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                    <CheckCircle2 size={14} />
                </button>
                <button className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all">
                    <XCircle size={14} />
                </button>
            </div>
        )
    }
];

const activeProjectProgressColumns = (onTitleClick) => [
    {
        key: 'title',
        label: 'Project',
        render: (val, row) => (
            <button
                onClick={() => onTitleClick(row)}
                className="font-bold text-text-primary text-sm hover:text-brand-500 hover:underline transition-all text-left cursor-pointer"
            >
                {val}
            </button>
        )
    },
    {
        key: 'progress', label: 'Progress', render: (val) => (
            <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-border-secondary rounded-full overflow-hidden max-w-[120px]">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${val}%` }} />
                </div>
                <span className="text-xs font-black text-brand-600">{val}%</span>
            </div>
        )
    },
    { key: 'members', label: 'Team', render: (val) => <span className="text-xs font-semibold text-text-tertiary">{val} Members</span> },
    {
        key: 'actions', label: '', render: () => (
            <button className="text-brand-500 hover:text-brand-600 transition-colors">
                <ArrowUpRight size={16} />
            </button>
        )
    }
];

export default function ManagerDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [stats, setStats] = useState(managerData.stats);
    const [teamMembers, setTeamMembers] = useState(managerData.teamMembers);
    const [approvals, setApprovals] = useState(managerData.pendingApprovals);
    const [teamPerf, setTeamPerf] = useState(managerData.teamPerformance);
    const [processComp, setProcessComp] = useState(managerData.processCompletion);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const { showPasswordModal: showDefaultPassModal, hidePasswordModal } = useDefaultPasswordCheck();

    const handleProjectClick = (project) => {
        setSelectedProject(project);
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (!isSupabaseReady || !profile?.id) return;

        // Password check is now handled by useDefaultPasswordCheck hook

        // Fetch team stats
        cacheService.getOrSet('manager:stats', async () => {
            const [teamRes, tasksRes, pendingRes] = await Promise.all([
                supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'EMPLOYEE'),
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'COMPLETED'),
                supabase.from('vacances').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
            ]);
            return {
                teamCount: teamRes.count ?? 0,
                completedTasks: tasksRes.count ?? 0,
                pendingCount: pendingRes.count ?? 0,
            };
        }, 120).then(({ teamCount, completedTasks, pendingCount }) => {
            setStats(prev => [
                { ...prev[0], value: teamCount.toString() },
                { ...prev[1], value: completedTasks.toString() },
                { ...prev[2], value: pendingCount.toString() },
                prev[3],
            ]);
        });

        // Fetch pending leave requests as approvals
        cacheService.getOrSet('manager:approvals', async () => {
            const { data } = await supabase.from('vacances')
                .select('*, users(name)')
                .eq('status', 'PENDING')
                .order('created_at', { ascending: false })
                .limit(5);
            return data;
        }, 90).then(data => {
            if (!data || data.length === 0) return;
            setApprovals(data.map(r => ({
                id: r.id,
                title: `${r.leave_type || 'Leave'} Request`,
                requester: r.users?.name || 'Unknown',
                type: 'Leave',
                priority: r.days_count > 5 ? 'high' : r.days_count > 2 ? 'medium' : 'low',
                amount: `${r.days_count || 0} days`,
                submitted: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            })));
        });
    }, [profile?.id]);

    const handlePasswordModalClose = () => {
        setShowPasswordReset(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                        Team Overview
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Team performance, approvals, and process oversight
                    </p>
                </div>
                <button
                    onClick={() => navigate('/vacation')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                           text-sm font-semibold shadow-sm
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
                    <ClipboardCheck size={16} />
                    Review Approvals
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <StatCard
                        key={stat.id}
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        changeType={stat.changeType}
                        subtitle={stat.subtitle}
                        icon={statIcons[i]}
                        iconColor={statColors[i]}
                        delay={i * 80}
                    />
                ))}
            </div>

            {/* Top Section: My Assigned Projects & Task Validation */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Projects Linked by Admin */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '450ms' }}>
                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                            <Briefcase size={16} className="text-brand-500" />
                            Projects Linked to Me
                        </h2>
                        <StatusBadge variant="brand" size="sm" dot>{managerData.assignedProjects.length} Projects</StatusBadge>
                    </div>
                    <DataTable
                        columns={myProjectsColumns(handleProjectClick)}
                        data={managerData.assignedProjects}
                    />
                </div>

                {/* Team Task Validation */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '550ms' }}>
                    <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                        <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                            <Clock size={16} className="text-amber-500" />
                            Task Validation Request
                        </h2>
                        <StatusBadge variant="warning" size="sm">{managerData.pendingTasks.length} Awaiting</StatusBadge>
                    </div>
                    <DataTable columns={taskValidationColumns} data={managerData.pendingTasks} />
                </div>
            </div>

            {/* Middle Section: Team Progression */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '650ms' }}>
                <div className="p-5 border-b border-border-secondary flex justify-between items-center">
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Team Member Progression (Instant)
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Avg Efficiency:</span>
                        <span className="text-sm font-black text-emerald-500">84%</span>
                    </div>
                </div>
                <DataTable columns={teamProgressionColumns} data={managerData.teamMembers} />
            </div>

            {/* Pending Approvals Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary
                      animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <h2 className="text-sm font-bold text-text-primary">Pending Approvals</h2>
                    <StatusBadge variant="danger" size="sm" dot>
                        {approvals.length} pending
                    </StatusBadge>
                </div>
                <DataTable columns={approvalColumns} data={approvals} />
            </div>

            {/* Bottom Section: Active Projects Progress Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '750ms' }}>
                <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/30">
                    <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                        <Activity size={16} className="text-brand-500" />
                        Active Projects Overall Progress
                    </h2>
                    <button className="text-[10px] font-black text-brand-500 uppercase flex items-center gap-1 hover:underline">
                        Detailed Analytics <ArrowUpRight size={12} />
                    </button>
                </div>
                <DataTable
                    columns={activeProjectProgressColumns(handleProjectClick)}
                    data={managerData.assignedProjects}
                />
            </div>

            {/* Project Detail Modal */}
            {isModalOpen && selectedProject && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-surface-primary rounded-3xl shadow-2xl w-full max-w-2xl border border-border-primary overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-border-secondary bg-gradient-to-br from-brand-500/10 to-transparent relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                                            <Briefcase size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-text-primary tracking-tight">{selectedProject.title}</h3>
                                            <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">{selectedProject.department} • {selectedProject.client}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-xl bg-surface-secondary text-text-tertiary hover:text-text-primary transition-all active:scale-90"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mt-6">
                                <StatusBadge variant={selectedProject.status === 'Active' ? 'brand' : 'danger'} size="sm" dot>{selectedProject.status}</StatusBadge>
                                <div className="h-4 w-px bg-border-secondary" />
                                <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                    <Clock size={14} className="text-brand-500" />
                                    Deadline: {selectedProject.deadline}
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-3">
                                <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Project Overview</h4>
                                <p className="text-sm text-text-secondary leading-relaxed font-medium">
                                    {selectedProject.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Financial Summary</h4>
                                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-600/80">Total Budget</span>
                                        <span className="text-lg font-black text-emerald-600">{selectedProject.budget}</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Team Composition</h4>
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-9 h-9 rounded-full border-2 border-surface-primary bg-surface-tertiary flex items-center justify-center text-[10px] font-bold text-text-tertiary">
                                                    {String.fromCharCode(64 + i)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-text-secondary">+{selectedProject.members - 4} more</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <h4 className="text-xs font-black text-text-tertiary uppercase tracking-widest">Current Progression</h4>
                                    <span className="text-xl font-black text-brand-600">{selectedProject.progress}%</span>
                                </div>
                                <div className="h-3 w-full bg-border-secondary rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 shadow-lg shadow-brand-500/30 transition-all duration-1000 ease-out" style={{ width: `${selectedProject.progress}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border-secondary bg-surface-secondary/30 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 text-xs font-black text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors"
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
        </div>
    );
}
