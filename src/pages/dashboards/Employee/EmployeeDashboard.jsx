import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle2,
    ListChecks,
    Clock,
    TrendingUp,
    ArrowUpRight,
    CircleDot,
    FileText,
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import MiniChart from '../../../components/ui/MiniChart';
import PasswordChangeModal from '../../../components/ui/PasswordChangeModal';
import { employeeData } from '../../../data/mockData';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import { useAuth } from '../../../contexts/AuthContext';
import { useDefaultPasswordCheck } from '../../../hooks/useDefaultPasswordCheck';

const statIcons = [ListChecks, CheckCircle2, Clock, TrendingUp];
const statColors = [
    'bg-gradient-to-br from-[#83bf6e] to-[#a8d99a]',
    'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
    'bg-gradient-to-br from-[#ff9a55] to-[#ffbe7b]',
    'bg-gradient-to-br from-[#8e55ea] to-[#b38cf5]',
];

const taskColumns = [
    {
        key: 'title',
        label: 'Task',
        render: (val, row) => (
            <div>
                <span className="font-semibold text-text-primary block">{val}</span>
                <span className="text-[11px] text-text-tertiary">{row.process}</span>
            </div>
        ),
    },
    {
        key: 'priority',
        label: 'Priority',
        render: (val) => {
            const map = { high: 'danger', medium: 'warning', low: 'neutral' };
            return <StatusBadge variant={map[val] || 'neutral'} size="sm">{val}</StatusBadge>;
        },
    },
    { key: 'deadline', label: 'Deadline', cellClassName: 'text-text-secondary text-xs font-medium' },
    {
        key: 'status',
        label: 'Status',
        render: (val) => {
            const map = {
                'in-progress': 'brand',
                'pending': 'warning',
                'not-started': 'neutral',
                'completed': 'success',
            };
            return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
        },
    },
];

const requestColumns = [
    { key: 'type', label: 'Request Type', cellClassName: 'font-semibold text-text-primary' },
    { key: 'submitted', label: 'Submitted', cellClassName: 'text-text-secondary text-xs' },
    {
        key: 'details',
        label: 'Details',
        render: (val, row) => (
            <span className="text-text-secondary text-xs">{val || row.dates || '—'}</span>
        ),
    },
    {
        key: 'status',
        label: 'Status',
        render: (val) => {
            const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
            return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
        },
    },
];

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [stats, setStats] = useState(employeeData.stats);
    const [myTasks, setMyTasks] = useState(employeeData.myTasks);
    const [myRequests, setMyRequests] = useState(employeeData.myRequests);
    const [activity, setActivity] = useState(employeeData.recentActivity);
    const [weeklyActivity, setWeeklyActivity] = useState(employeeData.weeklyActivity);
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const { showPasswordModal: showDefaultPassModal, hidePasswordModal } = useDefaultPasswordCheck();

    useEffect(() => {
        if (!isSupabaseReady || !profile?.id) return;

        // Password check is now handled by useDefaultPasswordCheck hook

        // Fetch employee's tasks
        cacheService.getOrSet(`emp:tasks:${profile.id}`, async () => {
            const { data } = await supabase.from('tasks')
                .select('*, projects(title)')
                .eq('created_by', profile.id)
                .order('created_at', { ascending: false })
                .limit(10);
            return data;
        }, 90).then(data => {
            if (!data || data.length === 0) return;
            const statusMap = { NOT_STARTED: 'not-started', IN_PROGRESS: 'in-progress', COMPLETED: 'completed' };
            const prioMap = { Low: 'low', Medium: 'medium', High: 'high', Critical: 'high' };
            setMyTasks(data.map(t => ({
                id: t.id,
                title: t.title,
                process: t.projects?.title || '-',
                priority: prioMap[t.priority] || 'medium',
                deadline: t.deadline ? new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-',
                status: statusMap[t.status] || 'pending',
            })));
        });

        // Fetch employee's leave requests
        cacheService.getOrSet(`emp:requests:${profile.id}`, async () => {
            const { data } = await supabase.from('vacances')
                .select('*')
                .eq('user_id', profile.id)
                .order('created_at', { ascending: false })
                .limit(5);
            return data;
        }, 90).then(data => {
            if (!data || data.length === 0) return;
            setMyRequests(data.map(r => ({
                id: r.id,
                type: r.leave_type || 'Leave Request',
                submitted: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                details: `${r.days_count || 0} days`,
                status: (r.status || 'pending').toLowerCase(),
            })));
        });

        // Update stats from real counts
        cacheService.getOrSet(`emp:stats:${profile.id}`, async () => {
            const [allTasks, completed, pending] = await Promise.all([
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('created_by', profile.id),
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'COMPLETED'),
                supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('created_by', profile.id).eq('status', 'NOT_STARTED'),
            ]);
            return { total: allTasks.count ?? 0, completed: completed.count ?? 0, pending: pending.count ?? 0 };
        }, 120).then(({ total, completed, pending }) => {
            setStats(prev => [
                { ...prev[0], value: total.toString() },
                { ...prev[1], value: completed.toString() },
                { ...prev[2], value: pending.toString() },
                prev[3],
            ]);
        });
    }, [profile?.id]);

    const handleModalClose = () => {
        setShowPasswordReset(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                        My Dashboard
                    </h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Your tasks, requests, and personal workflow overview
                    </p>
                </div>
                <button
                    onClick={() => navigate('/vacation')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                           text-sm font-semibold shadow-sm
                           hover:-translate-y-0.5 active:translate-y-0
                           transition-all duration-200 cursor-pointer">
                    <FileText size={16} />
                    New Request
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

            {/* Activity Chart + Task Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <h2 className="text-sm font-bold text-text-primary mb-4">Weekly Activity</h2>
                    <MiniChart
                        data={weeklyActivity}
                        label="Tasks completed per day"
                        height={100}
                        colorFrom="#83bf6e"
                        colorTo="#a8d99a"
                    />
                </div>

                {/* Task summary */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '500ms' }}>
                    <h2 className="text-sm font-bold text-text-primary mb-4">My Leave Balance</h2>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-text-secondary uppercase">Annual Leave</span>
                                <span className="text-sm font-bold text-brand-600">14 Left</span>
                            </div>
                            <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 w-[65%]" />
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-text-secondary uppercase">Sick Leave</span>
                                <span className="text-sm font-bold text-amber-600">8 Left</span>
                            </div>
                            <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 w-[20%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Tasks Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <h2 className="text-sm font-bold text-text-primary">My Tasks</h2>
                        <StatusBadge variant="brand" size="sm">
                            {employeeData.myTasks.length} total
                        </StatusBadge>
                    </div>
                    <DataTable columns={taskColumns} data={employeeData.myTasks} />
                </div>

                {/* Upcoming Leave Widget */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                    <h2 className="text-sm font-bold text-text-primary mb-4">Upcoming Leave</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-secondary group hover:border-brand-500/30 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex flex-col items-center justify-center text-brand-600 shrink-0">
                                <span className="text-[10px] font-bold uppercase">Feb</span>
                                <span className="text-sm font-black leading-none">20</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Annual Leave</p>
                                <p className="text-[10px] text-text-tertiary uppercase">5 Days • Pending</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border border-border-secondary group hover:border-emerald-500/30 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex flex-col items-center justify-center text-emerald-600 shrink-0">
                                <span className="text-[10px] font-bold uppercase">Mar</span>
                                <span className="text-sm font-black leading-none">15</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-text-primary">Sick Leave</p>
                                <p className="text-[10px] text-text-tertiary uppercase">1 Day • Approved</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Requests + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Requests */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary
                        animate-fade-in overflow-hidden" style={{ animationDelay: '700ms' }}>
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                        <h2 className="text-sm font-bold text-text-primary">My Requests</h2>
                        <button
                            onClick={() => navigate('/vacation')}
                            className="text-xs font-medium text-[#2a85ff] hover:text-[#1a6dff]
                                transition-colors cursor-pointer flex items-center gap-1">
                            View All <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <DataTable columns={requestColumns} data={myRequests} />
                </div>

                {/* Recent Activity */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                        animate-fade-in" style={{ animationDelay: '800ms' }}>
                    <h2 className="text-sm font-bold text-text-primary mb-3">Recent Activity</h2>
                    <div className="space-y-3">
                        {activity.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 group">
                                <div className="mt-1.5">
                                    <CircleDot size={10} className="text-[#2a85ff] group-hover:text-[#1a6dff] transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-text-primary">{item.action}</p>
                                </div>
                                <span className="text-[11px] text-text-tertiary whitespace-nowrap">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
