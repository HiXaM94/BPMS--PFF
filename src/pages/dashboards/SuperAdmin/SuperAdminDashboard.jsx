import React, { useEffect, useMemo, useState } from 'react';
import {
    Building2, Users, FolderGit2, CheckCircle2,
    ListChecks, TrendingUp, Banknote, ShieldCheck,
    Activity, Clock, Target, CalendarDays,
    CreditCard, Tag, Search, Filter, Globe,
    UserCheck, UserX, BarChart3, PieChart
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { supabase } from '../../../services/supabase';
import { landingSupabase } from '../../../services/landingSupabase';

const formatSubscriptionAmount = (price, billingCycle) => {
    const numeric = Number(price);
    if (!Number.isFinite(numeric)) return '—';
    const suffix = (billingCycle || 'monthly').toLowerCase() === 'annual' ? '/yr' : '/mo';
    return `DH ${numeric.toLocaleString('en-US')}${suffix}`;
};

const normalizeSubscriptionStatus = (rawStatus) => {
    const norm = (rawStatus || '').toLowerCase();
    if (!norm) return 'Paid';
    if (norm.includes('past') || norm.includes('due')) return 'Past Due';
    if (norm.includes('active')) return 'Active';
    if (norm.includes('paid')) return 'Paid';
    return rawStatus;
};

const statusVariant = (status) => {
    const norm = (status || '').toLowerCase();
    if (norm.includes('past') || norm.includes('due')) return 'danger';
    if (norm.includes('active') || norm.includes('paid')) return 'success';
    return 'neutral';
};

// --- COMPONENT ---
export default function SuperAdminDashboard() {
    const [landingStats, setLandingStats] = useState({ totalRevenue: 0, activeSubs: 0, totalSubs: 0, mrr: 0 });
    const [operationalStats, setOperationalStats] = useState(null);
    const [landingSubscriptions, setLandingSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Fetch Landing Page Data via Secure RPC (bypasses RLS)
                const { data: subsData, error: subsError } = await landingSupabase.rpc('get_dashboard_subscriptions', {
                    admin_token: 'bpms_admin_secret_2026'
                });

                if (subsError) throw subsError;

                const subs = subsData || [];
                const activeSubs = subs.filter(s => (s.status || '').toLowerCase() === 'active');

                // For Total Revenue, we still need payments. If RLS blocks it, we fallback to 0.
                let totalRevenue = 0;
                const { data: payData, error: payError } = await landingSupabase.from('payments').select('amount').eq('status', 'succeeded');
                if (payError) {
                    console.warn('[SuperAdminDashboard] Payments fetch failed or restricted:', payError.message);
                } else {
                    totalRevenue = (payData || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                }

                const mrr = activeSubs.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

                if (!cancelled) {
                    setLandingStats({
                        totalRevenue: totalRevenue || mrr, // Fallback to MRR if payments are blocked
                        activeSubs: activeSubs.length,
                        totalSubs: subs.length,
                        mrr
                    });

                    const mappedSubs = subs.map(s => ({
                        id: s.id,
                        company: s.company_name || 'Unknown',
                        plan: s.plan_name || 'Standard',
                        price: s.price,
                        status: normalizeSubscriptionStatus(s.status),
                        nextBilling: s.end_date || s.next_billing || '—'
                    }));
                    setLandingSubscriptions(mappedSubs);
                }

                // 2. Fetch Operational Data from SaaS DB (via our new RPC)
                const { data: opData, error: opError } = await supabase.rpc('get_platform_operational_stats');
                console.log('[DEBUG] Operational Data:', opData);
                if (opError) {
                    console.warn('[SuperAdminDashboard] Operational stats error:', opError);
                    setError(prev => prev ? prev + ' | RPC Error' : 'Operational RPC Error: ' + opError.message);
                } else if (!cancelled) {
                    setOperationalStats(opData);
                }

            } catch (err) {
                console.error('[SuperAdminDashboard] Error fetching real data:', err);
                if (!cancelled) setError(err?.message || 'Unable to connect to databases');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, []);

    const subscriptionsData = useMemo(() => landingSubscriptions, [landingSubscriptions]);

    const paidCount = useMemo(() => (
        subscriptionsData.filter(s => {
            const norm = (s.status || '').toLowerCase();
            return norm.includes('paid') || norm.includes('active');
        }).length
    ), [subscriptionsData]);
    const pastDueCount = useMemo(() => (
        subscriptionsData.filter(s => (s.status || '').toLowerCase().includes('past')).length
    ), [subscriptionsData]);

    // Calculated Aggregations
    // Aggregates from local operationalStats
    const totalUsers = operationalStats?.total_users || 0;
    const activeEmployeesCount = operationalStats?.active_users || 0;
    const inactiveEmployeesCount = operationalStats?.inactive_users || 0;
    const totalProjects = operationalStats?.total_projects || 0;
    const validatedProjectsCount = operationalStats?.validated_projects || 0;
    const projectCompletionRate = totalProjects > 0 ? Math.round((validatedProjectsCount / totalProjects) * 100) : 0;
    const totalTasks = operationalStats?.total_tasks || 0;
    const finishedTasks = operationalStats?.finished_tasks || 0;
    const pendingTasks = operationalStats?.pending_tasks || 0;
    const avgProductivity = operationalStats?.avg_task_completion || 0;
    const topCompanies = operationalStats?.top_companies || [];
    const recentTasks = operationalStats?.recent_tasks || [];

    const subscriptionColumns = [
        { key: 'company', label: 'Company', cellClassName: 'font-bold text-text-primary text-sm' },
        {
            key: 'plan', label: 'Active Plan', render: (val) => (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
                    <Tag size={10} /> {val}
                </span>
            )
        },
        { key: 'amount', label: 'Subscription Pricing', cellClassName: 'font-black text-text-primary text-sm' },
        { key: 'billingCycle', label: 'Billing Cycle', cellClassName: 'text-text-secondary text-xs font-semibold' },
        { key: 'nextBilling', label: 'Next Billing', cellClassName: 'text-text-secondary text-xs' },
        {
            key: 'status', label: 'Billing Status', render: (val) => (
                <StatusBadge variant={statusVariant(val)} size="sm" dot>{val}</StatusBadge>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader
                title="SaaS Global Management"
                description="Global overview across all registered companies on the platform."
                icon={Globe}
                iconColor="from-indigo-600 to-purple-600"
            />

            {/* GLOBAL TOP-LEVEL STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={loading ? '-' : `DH ${landingStats.totalRevenue.toLocaleString()}`}
                    icon={Banknote}
                    iconColor="bg-emerald-500"
                    subtitle="Platform Sales"
                />
                <StatCard
                    title="Active Subscriptions"
                    value={loading ? '-' : landingStats.activeSubs}
                    icon={Activity}
                    iconColor="bg-blue-500"
                    subtitle="Paying Clients"
                />
                <StatCard
                    title="Monthly Revenue (MRR)"
                    value={loading ? '-' : `DH ${landingStats.mrr.toLocaleString()}`}
                    icon={TrendingUp}
                    iconColor="bg-indigo-500"
                    subtitle="Subscription Value"
                />
                <StatCard
                    title="Total Tenants"
                    value={loading ? '-' : landingStats.totalSubs}
                    icon={Building2}
                    iconColor="bg-brand-500"
                    subtitle="Registered Orgs"
                />
            </div>

            {/* HR & User SECTION (RED) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-rose-500/5">
                        <Users size={20} className="text-rose-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">User Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Total Users Across All Companies</p>
                            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{totalUsers.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <UserCheck size={16} className="text-rose-500" />
                                    <span className="text-xs font-bold text-text-secondary uppercase">Employees</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{(operationalStats?.total_employees || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <ShieldCheck size={16} className="text-rose-600" />
                                    <span className="text-xs font-bold text-text-secondary uppercase">HR Managers</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{(operationalStats?.total_hr || 0).toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <TrendingUp size={16} className="text-rose-500" />
                                    <span className="text-xs font-bold text-text-secondary uppercase">Team Managers</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{(operationalStats?.total_managers || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-emerald-500/5">
                        <FolderGit2 size={20} className="text-emerald-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Projects Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Total Projects Across All Companies</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalProjects.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-surface-secondary rounded-xl border border-border-secondary space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-text-primary flex items-center gap-2"><PieChart size={16} className="text-emerald-500" /> Project Completion Trend</span>
                                <span className="text-emerald-600 dark:text-emerald-400">{projectCompletionRate}%</span>
                            </div>
                            <div className="h-3 w-full bg-border-secondary rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-emerald-500" style={{ width: `${projectCompletionRate}%` }} />
                            </div>
                            <p className="text-xs text-text-tertiary">
                                {validatedProjectsCount} validated out of {totalProjects} projects system-wide.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* REMAINING SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-emerald-500/5">
                        <ListChecks size={20} className="text-emerald-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Tasks Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Total Tasks Created</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalTasks.toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Finished</span>
                                </div>
                                <p className="text-xl font-bold text-text-primary">{finishedTasks.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase">Pending</span>
                                </div>
                                <p className="text-xl font-bold text-text-primary">{pendingTasks.toLocaleString()}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Task Completion Rate Across Companies</h3>
                            <div className="space-y-4">
                                {topCompanies.map((c, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-semibold text-text-primary">{c.name}</span>
                                            <span className="font-bold">{c.productivity}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${c.productivity}%` }} />
                                        </div>
                                    </div>
                                ))}
                                {topCompanies.length === 0 && <p className="text-xs text-text-tertiary italic">No company data available</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-secondary">
                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Recent Task Activity</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {recentTasks.map((t, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/30 border border-border-secondary/50 hover:border-emerald-500/30 transition-colors">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span className="text-sm font-bold text-text-primary truncate" title={t.title}>{t.title}</span>
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={10} className="text-text-tertiary" />
                                                <span className="text-[10px] font-medium text-text-tertiary truncate">{t.company_name}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 ml-4">
                                            <StatusBadge variant={t.is_finished ? 'success' : 'warning'} className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider">
                                                {t.is_finished ? 'Finished' : 'Pending'}
                                            </StatusBadge>
                                        </div>
                                    </div>
                                ))}
                                {recentTasks.length === 0 && (
                                    <div className="text-center py-6 bg-surface-secondary/20 rounded-xl border border-dashed border-border-secondary">
                                        <p className="text-xs text-text-tertiary italic">No recent activity detected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PERFORMANCE SECTION */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-amber-500/5">
                        <BarChart3 size={20} className="text-amber-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Performance Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Overall Productivity Indicators</p>
                            <div className="flex items-end gap-2">
                                <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{avgProductivity}%</p>
                            </div>
                            <p className="text-xs text-text-tertiary mt-1">
                                {finishedTasks} finished out of {totalTasks} global tasks.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Team Efficiency Comparison</h3>
                            <div className="space-y-3">
                                {topCompanies.map((c, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-surface-secondary/50 border border-border-secondary rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-text-tertiary w-4">#{idx + 1}</span>
                                            <span className="text-sm font-bold text-text-primary">{c.name}</span>
                                        </div>
                                        <StatusBadge variant={c.productivity >= 90 ? 'success' : c.productivity >= 80 ? 'info' : 'warning'}>
                                            {c.productivity}% Eff.
                                        </StatusBadge>
                                    </div>
                                ))}
                                {topCompanies.length === 0 && <p className="text-xs text-text-tertiary italic">No data yet</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* PAYROLL SECTION: SaaS Perspective */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-purple-500/5">
                        <div className="flex items-center gap-3">
                            <CreditCard size={20} className="text-purple-500" />
                            <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Payroll Section (SaaS Perspective)</h2>
                        </div>
                        <StatusBadge variant="brand" size="sm">Financial Relationship</StatusBadge>
                    </div>

                    <div className="p-5 border-b border-border-secondary flex flex-wrap gap-4 items-center justify-between bg-surface-secondary/30">
                        <p className="text-sm text-text-secondary">View company subscriptions, active plans, pricing, and billing statuses.</p>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="font-semibold">{paidCount} Paid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                <span className="font-semibold text-rose-500">{pastDueCount} Past Due</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="px-5 py-2 text-sm text-amber-600 bg-amber-50 border-b border-border-secondary">
                            {error} — falling back to cached SaaS sample.
                        </div>
                    )}

                    <div className="flex-1 overflow-x-auto">
                        <DataTable
                            columns={subscriptionColumns}
                            data={subscriptionsData.map(item => {
                                const cycleRaw = (item.billingCycle || item.billing_cycle || 'monthly').toLowerCase();
                                const cycleLabel = cycleRaw.replace(/\b\w/g, l => l.toUpperCase());
                                const priceValue = typeof item.price === 'number'
                                    ? item.price
                                    : typeof item.amount === 'number'
                                        ? item.amount
                                        : typeof item.priceValue === 'number'
                                            ? item.priceValue
                                            : typeof item.amountValue === 'number'
                                                ? item.amountValue
                                                : parseFloat(String(item.amount).replace(/[^0-9.]/g, ''));
                                return {
                                    ...item,
                                    amount: formatSubscriptionAmount(priceValue, cycleRaw),
                                    billingCycle: cycleLabel,
                                    status: normalizeSubscriptionStatus(item.status),
                                    nextBilling: item.nextBilling
                                        ? item.nextBilling // Keep as is or format if date
                                        : '—'
                                };
                            })}
                            emptyLabel={loading ? 'Loading subscriptions…' : 'No subscription data available'}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
