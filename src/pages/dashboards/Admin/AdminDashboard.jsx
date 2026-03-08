import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    Users,
    Activity,
    Server,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Globe,
    BarChart3,
    Star,
    Palmtree,
    UserPlus,
    Plus,
    FileText,
    Calendar,
    Clock,
    Shield,
    AlertCircle,
    Check
} from 'lucide-react';

import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import MiniChart from '../../../components/ui/MiniChart';
import Modal from '../../../components/ui/Modal';
import { useAuth } from '../../../contexts/AuthContext';
import { adminData } from '../../../data/mockData';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';

/* ─── Asset-style cards with colored backgrounds matching template ─── */
const assetCards = [
    {
        label: 'Active Companies',
        value: '12',
        sub: '245 employees',
        change: '+0.14%',
        positive: true,
        bg: 'bg-[#edf6ff]',
        darkBg: 'dark:bg-blue-500/10',
        icon: Building2,
        iconBg: 'bg-[#2a85ff]',
    },
    {
        label: 'Total Users',
        value: '1,846',
        sub: '89 active today',
        change: '+0.31%',
        positive: true,
        bg: 'bg-brand-50',
        darkBg: 'dark:bg-brand-500/10',
        icon: Users,
        iconBg: 'bg-[#8e55ea]',
    },
    {
        label: 'Uptime',
        value: '99.8%',
        sub: '346 processes',
        change: '+0.27%',
        positive: true,
        bg: 'bg-[#eafaf0]',
        darkBg: 'dark:bg-emerald-500/10',
        icon: Activity,
        iconBg: 'bg-[#83bf6e]',
    },
];

const orgAvatarColors = [
    'from-[#2a85ff] to-[#6cb4ff]',
    'from-[#ff6a55] to-[#ff9a7b]',
    'from-[#83bf6e] to-[#a8d99a]',
    'from-[#8e55ea] to-[#b38cf5]',
    'from-[#ff9a55] to-[#ffbe7b]',
];

function getAttendanceColumns() {
    return [
        {
            key: 'employee_name',
            label: 'Employee',
            render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg
                           bg-gradient-to-br ${orgAvatarColors[Math.abs(row.id?.length || 0) % orgAvatarColors.length]}
                           text-white text-[10px] font-bold shrink-0 shadow-sm`}>
                        {val ? val.slice(0, 2).toUpperCase() : 'EE'}
                    </div>
                    <span className="font-semibold text-text-primary block text-sm">{val}</span>
                </div>
            ),
        },
        {
            key: 'check_in_time',
            label: 'Check In',
            render: (val) => <span className="text-sm text-text-secondary font-medium">{val || '--:--'}</span>
        },
        {
            key: 'check_out_time',
            label: 'Check Out',
            render: (val) => <span className="text-sm text-text-secondary font-medium">{val || '--:--'}</span>
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => (
                <StatusBadge variant={val === 'present' ? 'success' : val === 'late' ? 'warning' : 'neutral'} dot size="sm">
                    {val || 'Present'}
                </StatusBadge>
            ),
        },
        {
            key: 'date',
            label: 'Date',
            render: (val) => (
                <span className="text-xs text-text-tertiary">
                    {val ? new Date(val).toLocaleDateString() : '-'}
                </span>
            ),
        },
    ];
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [cards, setCards] = useState(assetCards);
    const [latestAttendance, setLatestAttendance] = useState([]);
    const [attendancePage, setAttendancePage] = useState(1);
    const itemsPerPage = 6;
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [roleDistribution, setRoleDistribution] = useState([]);
    const [totalUsers, setTotalUsers] = useState('0');
    const [totalUsersTrend, setTotalUsersTrend] = useState(0);
    const [totalActivity, setTotalActivity] = useState(0);
    const [systemLogs, setSystemLogs] = useState([]);
    const [timeRange, setTimeRange] = useState('7D');
    const [chartData, setChartData] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [favorites, setFavorites] = useState(() => {
        try { return JSON.parse(localStorage.getItem('flowly_fav_orgs') || '[]'); } catch { return []; }
    });
    const { profile, signUpSilently } = useAuth();
    const [globalLeave, setGlobalLeave] = useState([]);
    const [entrepriseInfo, setEntrepriseInfo] = useState(null);
    const [projectsOverview, setProjectsOverview] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectValidationProcessing, setProjectValidationProcessing] = useState({});

    const [showAddHRModal, setShowAddHRModal] = useState(false);
    const [hrForm, setHrForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
    const [isSubmittingHR, setIsSubmittingHR] = useState(false);
    const [hrCreated, setHrCreated] = useState(false);
    const [hrError, setHrError] = useState(null);

    const handleCreateHR = async (e) => {
        e.preventDefault();
        setHrError(null);

        if (!profile?.entreprise_id) {
            setHrError('Admin enterprise ID not found. Please re-login.');
            return;
        }
        if (!isSupabaseReady) {
            setHrError('Database connection is not available. Cannot create HR account.');
            return;
        }

        setIsSubmittingHR(true);
        let newUserId = null;
        try {
            const fullName = `${hrForm.firstName} ${hrForm.lastName}`.trim();

            // Step 1: Create Supabase Auth user
            const authData = await signUpSilently(
                hrForm.email,
                hrForm.password,
                { name: fullName, role: 'HR', entreprise_id: profile.entreprise_id }
            );
            newUserId = authData.user?.id;
            if (!newUserId) throw new Error('Failed to create auth user — please try again.');

            // Step 2: Insert into DB tables via RPC (uses admin session token)
            const { data: sessionData } = await supabase.auth.getSession();
            const adminAccessToken = sessionData?.session?.access_token;

            const rpcResponse = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/create_hr_profile`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${adminAccessToken}`,
                    },
                    body: JSON.stringify({
                        p_user_id: newUserId,
                        p_name: fullName,
                        p_email: hrForm.email,
                        p_phone: hrForm.phone,
                        p_password: hrForm.password,
                        p_entreprise_id: profile.entreprise_id
                    })
                }
            );

            if (!rpcResponse.ok) {
                const errBody = await rpcResponse.json().catch(() => ({}));
                // Step 2 FAILED: roll back the Auth user so no orphan account is left
                try { await supabase.auth.admin?.deleteUser?.(newUserId); } catch (_) { }
                throw new Error(errBody?.message || `Failed to create HR profile (code ${rpcResponse.status}).`);
            }

            // Success
            setHrCreated(true);
            setTimeout(() => {
                setShowAddHRModal(false);
                setHrCreated(false);
                setHrForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
            }, 2500);

        } catch (err) {
            console.error('[HR Create] Error:', err);
            setHrError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmittingHR(false);
        }
    };

    const leaveColumns = [
        { key: 'employeeName', label: 'Employee', cellClassName: 'font-semibold text-text-primary text-sm' },
        { key: 'org', label: 'Organization', cellClassName: 'text-text-tertiary text-xs font-bold uppercase' },
        { key: 'type', label: 'Type', render: (val) => <StatusBadge variant="neutral" size="sm">{val}</StatusBadge> },
        { key: 'dates', label: 'Period', cellClassName: 'text-text-secondary text-xs' },
        {
            key: 'status',
            label: 'Status',
            render: (val) => {
                const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
                return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
            },
        },
    ];

    // ── Fetch Dashboard Stats from RPC ──
    const fetchDashboardStats = useCallback(async (days = 7) => {
        if (!profile?.entreprise_id || !isSupabaseReady) return;

        setStatsLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_admin_dashboard_stats', {
                p_entreprise_id: profile.entreprise_id,
                p_chart_days: days
            });

            if (error) throw error;

            if (data) {
                setTotalUsers(data.total_users?.toLocaleString() || '0');
                setTotalUsersTrend(data.user_trend_pct || 0);
                setTotalActivity(data.period_activity_count || 0);
                setGlobalLeave([
                    { status: 'pending', count: data.leave_pending },
                    { status: 'approved', count: data.leave_approved }
                ]);
                setLatestAttendance(data.latest_attendance || []);
                setChartData(data.chart_data || []);
                setRoleDistribution(data.role_distribution || []);
                setRecentDocuments(data.recent_documents || []);
                setEntrepriseInfo(data.entreprise_info || null);

                setCards([
                    {
                        ...assetCards[0],
                        label: 'Total Employees',
                        value: data.total_employees?.toString() || '0',
                        sub: `${data.total_users || 0} users total`,
                        change: '',
                    },
                    {
                        ...assetCards[1],
                        label: "Today's Attendance",
                        value: data.attendance_today?.toString() || '0',
                        sub: 'employees present',
                        icon: Calendar,
                        change: '',
                    },
                    {
                        ...assetCards[2],
                        label: 'Pending Documents',
                        value: data.pending_documents?.toString() || '0',
                        sub: 'awaiting approval',
                        icon: FileText,
                        change: '',
                        positive: data.pending_documents === 0,
                    }
                ]);
            }
        } catch (err) {
            console.error('[Admin Dashboard] Error fetching stats:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [profile?.entreprise_id]);

    useEffect(() => {
        const daysMap = { '1D': 1, '7D': 7, '15D': 15, '30D': 30 };
        fetchDashboardStats(daysMap[timeRange] || 7);
    }, [fetchDashboardStats, timeRange]);

    const fetchProjectsOverview = useCallback(async () => {
        if (!profile?.entreprise_id) return;
        setProjectsLoading(true);
        try {
            const { data: projectData = [], error: projectError } = await supabase
                .from('projects')
                .select('id, name, status, valider, team_manager_assigned (id, name)')
                .eq('entreprise_id', profile.entreprise_id)
                .order('created_at', { ascending: false });

            if (projectError) throw projectError;

            const projectIds = projectData.map(p => p.id).filter(Boolean);
            let tasks = [];
            if (projectIds.length) {
                const { data: taskData = [], error: tasksError } = await supabase
                    .from('tasks')
                    .select('project_id, status')
                    .in('project_id', projectIds);
                if (tasksError) throw tasksError;
                tasks = taskData;
            }

            const progressLookup = projectIds.reduce((acc, id) => ({
                ...acc,
                [id]: { total: 0, completed: 0 },
            }), {});
            tasks.forEach(task => {
                const entry = progressLookup[task.project_id];
                if (!entry) return;
                entry.total += 1;
                if (task.status === 'completed' || task.status === 'validated') {
                    entry.completed += 1;
                }
            });

            setProjectsOverview(projectData.map(project => {
                const progressEntry = progressLookup[project.id];
                const progress = progressEntry && progressEntry.total > 0
                    ? Math.round((progressEntry.completed / progressEntry.total) * 100)
                    : 0;

                return {
                    id: project.id,
                    title: project.name,
                    managerName: project.team_manager_assigned?.name || 'Unassigned',
                    status: project.status,
                    valider: project.valider || false,
                    progress,
                };
            }));
        } catch (err) {
            console.error('[Admin Dashboard] Failed to load projects overview', err);
        } finally {
            setProjectsLoading(false);
        }
    }, [profile?.entreprise_id]);

    const handleToggleProjectValidation = useCallback(async (projectId, currentState) => {
        setProjectValidationProcessing(prev => ({ ...prev, [projectId]: true }));
        try {
            const { error } = await supabase
                .from('projects')
                .update({ valider: !currentState })
                .eq('id', projectId);
            if (error) throw error;
            setProjectsOverview(prev => prev.map(p => (
                p.id === projectId ? { ...p, valider: !currentState } : p
            )));
        } catch (err) {
            console.error('[Admin Dashboard] Failed to toggle project validation', err);
        } finally {
            setProjectValidationProcessing(prev => ({ ...prev, [projectId]: false }));
        }
    }, []);

    useEffect(() => {
        if (!isSupabaseReady) return;
        fetchProjectsOverview();
    }, [fetchProjectsOverview]);

    return (
        <div className="space-y-6">
            {/* Header — clean like template */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
                    Overview
                </h1>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowAddHRModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                        <UserPlus size={16} />
                        Add HR User
                    </button>
                    <button
                        onClick={() => window.location.href = '/modules/vacation'}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                        <Palmtree size={16} />
                        Vacation Management
                    </button>
                    <button
                        onClick={() => navigate('/tasks')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
                    >
                        <Activity size={16} />
                        Task & Performance
                    </button>
                    <button
                        onClick={() => navigate('/tasks?tab=projects')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        Add Project
                    </button>
                </div>
            </div>

            {/* Top Row: Portfolio card + Asset cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-5 bg-surface-primary rounded-2xl border border-border-secondary p-8
                        animate-fade-in shadow-sm">
                    <h2 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">System Activity</h2>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold tracking-tight text-text-primary">
                            {totalActivity}
                        </span>
                        <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                            Check-ins ({timeRange})
                        </span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eafaf0] dark:bg-emerald-500/10 mb-4">
                        <ArrowUpRight size={12} className={totalUsersTrend >= 0 ? "text-[#83bf6e]" : "text-red-500"} />
                        <span className={`text-xs font-semibold ${totalUsersTrend >= 0 ? "text-[#83bf6e]" : "text-red-500"}`}>
                            {totalUsersTrend >= 0 ? '+' : ''}{totalUsersTrend}%
                        </span>
                    </div>

                    {/* Mini chart */}
                    <div className="mt-2">
                        <MiniChart
                            data={chartData}
                            label="Daily Activity (Attendance)"
                            height={80}
                            colorFrom="#2a85ff"
                            colorTo="#6cb4ff"
                        />
                    </div>

                    {/* Time range tabs */}
                    <div className="flex items-center gap-1 mt-4">
                        {['1D', '7D', '15D', '30D'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setTimeRange(tab)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer
                  ${tab === timeRange
                                        ? 'bg-text-primary text-text-inverse'
                                        : 'text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Asset-style cards column — stretches to match System Usage height */}
                <div className="lg:col-span-7 flex flex-col">
                    <h2 className="text-sm font-semibold text-text-secondary mb-3">Quick Stats</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                        {cards.map((card, i) => (
                            <div
                                key={i}
                                className={`${card.bg} ${card.darkBg} rounded-2xl p-5 animate-fade-in
                            hover:-translate-y-0.5 transition-transform duration-200
                            flex flex-col justify-between`}
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                <div>
                                    <span className="text-xl font-bold text-text-primary block">{card.value}</span>
                                    <span className="text-xs text-text-tertiary">{card.sub}</span>
                                </div>

                                {/* Bottom row: icon + change */}
                                <div className="flex items-center justify-between mt-auto pt-4">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${card.iconBg} shadow-sm`}>
                                        <card.icon size={14} className="text-white" />
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        {card.positive
                                            ? <ArrowUpRight size={12} className="text-[#83bf6e]" />
                                            : <ArrowDownRight size={12} className="text-[#ff6a55]" />
                                        }
                                        <span className={`text-xs font-medium ${card.positive ? 'text-[#83bf6e]' : 'text-[#ff6a55]'}`}>
                                            {card.change}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* Global Leave Stats Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border-secondary animate-fade-in flex flex-col justify-between"
                            style={{ animationDelay: '240ms' }}>
                            <div>
                                <span className="text-sm font-semibold text-text-secondary block mb-2 uppercase tracking-wider">Global Leave</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <span className="text-xl font-bold text-text-primary block">
                                            {globalLeave.find(r => r.status === 'pending')?.count ?? 0}
                                        </span>
                                        <span className="text-[10px] text-text-tertiary uppercase font-bold">Pending</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xl font-bold text-text-primary block">
                                            {globalLeave.find(r => r.status === 'approved')?.count ?? 0}
                                        </span>
                                        <span className="text-[10px] text-text-tertiary uppercase font-bold">Approved</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border-secondary flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-medium text-text-secondary">Normal Load</span>
                                </div>
                                <Palmtree size={14} className="text-text-tertiary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Projects Overview Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
                style={{ animationDelay: '350ms' }}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Projects Overview</h2>
                            <p className="text-[10px] text-text-tertiary font-medium uppercase mt-0.5">Monitor project progress and toggle validation status instantly.</p>
                        </div>
                    </div>
                    <StatusBadge variant="success" size="sm">Live Data</StatusBadge>
                </div>
                <div className="overflow-x-auto">
                    {projectsLoading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-text-tertiary">Loading projects…</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-surface-secondary/50 border-b border-border-secondary text-xs uppercase text-text-tertiary font-bold tracking-wider">
                                    <th className="px-5 py-3">Project Title</th>
                                    <th className="px-5 py-3">Project Manager</th>
                                    <th className="px-5 py-3">Progress</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Validation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-secondary">
                                {projectsOverview.map(project => (
                                    <tr key={project.id} className="hover:bg-surface-secondary/50 transition-colors">
                                        <td className="px-5 py-4 font-medium text-text-primary">{project.title}</td>
                                        <td className="px-5 py-4 text-sm text-text-secondary">{project.managerName}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-28 h-1.5 bg-surface-secondary rounded-full overflow-hidden border border-border-secondary">
                                                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${project.progress}%` }} />
                                                </div>
                                                <span className="text-xs font-semibold text-text-secondary">{project.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge
                                                variant={project.valider ? 'success' : 'warning'}
                                                size="sm"
                                                dot
                                            >
                                                {project.valider ? 'Validated' : project.status?.replace('_', ' ') || 'Pending'}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                disabled={projectValidationProcessing[project.id]}
                                                onClick={() => handleToggleProjectValidation(project.id, project.valider)}
                                                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-wait ${project.valider ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                                            >
                                                {projectValidationProcessing[project.id]
                                                    ? 'Updating…'
                                                    : project.valider ? 'Set to Pending' : 'Validate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {projectsOverview.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-6 text-center text-xs font-semibold text-text-tertiary">
                                            No projects found for this enterprise.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Bottom Row: Recent Activity table + Promo card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Latest Attendance Table */}
                <div className="lg:col-span-8 bg-surface-primary rounded-2xl border border-border-secondary
                        overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Latest Attendance</h2>
                                <p className="text-[10px] text-text-tertiary font-medium uppercase mt-0.5">Real-time check-in activity</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="overflow-hidden">
                            <DataTable
                                columns={getAttendanceColumns()}
                                data={latestAttendance.slice((attendancePage - 1) * itemsPerPage, attendancePage * itemsPerPage)}
                                emptyMessage={statsLoading ? "Loading attendance..." : "No attendance recorded for today"}
                            />
                        </div>

                        {latestAttendance.length > itemsPerPage && (
                            <div className="px-5 py-4 border-t border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                                <span className="text-xs font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                    Page {attendancePage} / {Math.ceil(latestAttendance.length / itemsPerPage)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setAttendancePage(p => Math.max(1, p - 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={attendancePage === 1}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border-secondary bg-surface-primary text-xs font-bold uppercase transition-all hover:bg-surface-tertiary hover:border-brand-500/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAttendancePage(p => Math.min(Math.ceil(latestAttendance.length / itemsPerPage), p + 1));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        disabled={attendancePage >= Math.ceil(latestAttendance.length / itemsPerPage)}
                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-border-secondary bg-surface-primary text-xs font-bold uppercase transition-all hover:bg-surface-tertiary hover:border-brand-500/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
                                    >
                                        Next
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Department Distribution / Subscription Card */}
                <div className="lg:col-span-4 bg-surface-primary rounded-2xl border border-border-secondary p-6 flex flex-col justify-between
                        animate-fade-in" style={{ animationDelay: '400ms' }}>
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-brand-500" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Organization Roles</h2>
                            </div>
                            <StatusBadge variant="info" size="xs">{entrepriseInfo?.plan || 'Starter'}</StatusBadge>
                        </div>

                        <div className="space-y-4">
                            {roleDistribution.length > 0 ? (
                                roleDistribution.map((r, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-text-secondary">{r.role.replace('_', ' ')}</span>
                                            <span className="text-text-primary">{r.count} members</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${r.role === 'ADMIN' ? 'bg-orange-500' :
                                                    r.role === 'HR' ? 'bg-brand-500' :
                                                        r.role === 'TEAM_MANAGER' ? 'bg-purple-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${Math.min(100, (r.count / (Math.max(1, parseInt(totalUsers.replace(',', ''))))) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-xs text-text-tertiary border-2 border-dashed border-border-secondary rounded-xl">
                                    <Globe size={24} className="mx-auto mb-2 opacity-20" />
                                    No role data available.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-border-secondary flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-text-tertiary uppercase font-bold tracking-wider">Plan Status</span>
                            <span className="text-xs font-semibold text-text-secondary truncate">
                                {entrepriseInfo?.name || 'Company Account'}
                            </span>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${entrepriseInfo?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            {entrepriseInfo?.status || 'Active'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Document Uploads */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      animate-fade-in" style={{ animationDelay: '500ms' }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-tight">Recent Document Submissions</h2>
                    </div>
                    <StatusBadge variant="neutral" size="sm">Real Time</StatusBadge>
                </div>
                <div className="space-y-4">
                    {recentDocuments.length > 0 ? (
                        recentDocuments.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-secondary transition-colors group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-text-tertiary group-hover:text-brand-500 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-text-primary truncate">{doc.title}</p>
                                        <p className="text-xs text-text-tertiary mt-0.5">
                                            {doc.type} • Uploaded by {doc.uploaded_by_name || 'System'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className="text-[11px] text-text-tertiary font-medium">
                                        {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </span>
                                    <StatusBadge
                                        variant={doc.status === 'approved' ? 'success' : doc.status === 'pending' ? 'warning' : 'danger'}
                                        size="xs"
                                    >
                                        {doc.status}
                                    </StatusBadge>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-border-secondary rounded-xl text-xs text-text-tertiary">
                            No recent document submissions recorded.
                        </div>
                    )}
                </div>
            </div>


            {/* Add HR Modal */}
            <Modal
                isOpen={showAddHRModal}
                onClose={() => { setShowAddHRModal(false); setHrCreated(false); setHrError(null); }}
                title="Create HR Account"
                maxWidth="max-w-md"
            >
                {hrCreated ? (
                    /* ── Success screen shown INSIDE the modal ── */
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-text-primary">HR Account Created!</p>
                            <p className="text-sm text-text-secondary mt-1">
                                {hrForm.firstName} {hrForm.lastName} has been added successfully.
                            </p>
                            <p className="text-xs text-text-tertiary mt-2">This window will close automatically…</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreateHR} className="space-y-4">
                        {/* Error banner — shown when creation fails */}
                        {hrError && (
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400">
                                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                                <p className="text-sm font-medium">{hrError}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">First Name *</label>
                                <input
                                    type="text" required
                                    value={hrForm.firstName}
                                    onChange={e => setHrForm(f => ({ ...f, firstName: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                                    placeholder="e.g. Jane"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Last Name *</label>
                                <input
                                    type="text" required
                                    value={hrForm.lastName}
                                    onChange={e => setHrForm(f => ({ ...f, lastName: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                                    placeholder="e.g. Doe"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Email Address *</label>
                            <input
                                type="email" required
                                value={hrForm.email}
                                onChange={e => setHrForm(f => ({ ...f, email: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                                placeholder="jane.doe@company.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Phone Number *</label>
                            <input
                                type="tel" required
                                value={hrForm.phone}
                                onChange={e => setHrForm(f => ({ ...f, phone: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                                placeholder="+212 600 000 000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">Initial Password *</label>
                            <input
                                type="password" required minLength={6}
                                value={hrForm.password}
                                onChange={e => setHrForm(f => ({ ...f, password: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-text-primary"
                                placeholder="Enter password..."
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-border-secondary">
                            <button
                                type="button"
                                onClick={() => setShowAddHRModal(false)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-tertiary border border-border-secondary transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingHR}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                            >
                                {isSubmittingHR ? 'Creating...' : 'Create HR Account'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
