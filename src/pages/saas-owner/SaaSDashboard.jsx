import React from 'react';
import {
    Building2, Users, FolderGit2, CheckCircle2,
    ListChecks, TrendingUp, Banknote, ShieldCheck,
    Activity, Clock, Target, CalendarDays,
    CreditCard, Tag, Search, Filter, Globe,
    UserCheck, UserX, BarChart3, PieChart
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

// --- MOCK SAAS DATA ---
const SaaSData = {
    totalCompanies: 45,
    activeUsers: 12450,
    mrr: '$125,000',
    uptime: '99.99%',
    companies: [
        { id: 1, name: 'Acme Corp', employees: 1250, activeEmployees: 1200, projects: 45, completedProjects: 30, tasks: 12400, taskCompletion: 92, productivity: 88, plan: 'Enterprise', status: 'Active' },
        { id: 2, name: 'Global Tech', employees: 340, activeEmployees: 310, projects: 12, completedProjects: 8, tasks: 3200, taskCompletion: 85, productivity: 92, plan: 'Pro', status: 'Active' },
        { id: 3, name: 'Nexus Industries', employees: 890, activeEmployees: 850, projects: 28, completedProjects: 20, tasks: 8900, taskCompletion: 90, productivity: 85, plan: 'Enterprise', status: 'Active' },
        { id: 4, name: 'Stark Enterprises', employees: 2100, activeEmployees: 2000, projects: 105, completedProjects: 85, tasks: 45000, taskCompletion: 96, productivity: 95, plan: 'Enterprise Plus', status: 'Active' },
        { id: 5, name: 'Wayne Corp', employees: 50, activeEmployees: 45, projects: 3, completedProjects: 1, tasks: 250, taskCompletion: 60, productivity: 75, plan: 'Starter', status: 'Past Due' },
    ],
    subscriptions: [
        { id: 1, company: 'Acme Corp', plan: 'Enterprise', amount: '$4,999/mo', billingCycle: 'Monthly', status: 'Paid', nextBilling: '2026-04-01' },
        { id: 2, company: 'Global Tech', plan: 'Pro', amount: '$999/mo', billingCycle: 'Monthly', status: 'Paid', nextBilling: '2026-03-15' },
        { id: 3, company: 'Nexus Industries', plan: 'Enterprise', amount: '$49,990/yr', billingCycle: 'Annual', status: 'Paid', nextBilling: '2027-01-01' },
        { id: 4, company: 'Stark Enterprises', plan: 'Enterprise Plus', amount: '$9,999/mo', billingCycle: 'Monthly', status: 'Paid', nextBilling: '2026-04-05' },
        { id: 5, company: 'Wayne Corp', plan: 'Starter', amount: '$299/mo', billingCycle: 'Monthly', status: 'Past Due', nextBilling: '2026-02-28' },
    ]
};

export default function SaaSDashboard() {
    // Calculated Aggregations
    const totalEmployees = SaaSData.companies.reduce((sum, c) => sum + c.employees, 0);
    const activeEmployees = SaaSData.companies.reduce((sum, c) => sum + c.activeEmployees, 0);
    const inactiveEmployees = totalEmployees - activeEmployees;

    const totalProjects = SaaSData.companies.reduce((sum, c) => sum + c.projects, 0);
    const completedProjects = SaaSData.companies.reduce((sum, c) => sum + c.completedProjects, 0);
    const projectCompletionRate = Math.round((completedProjects / totalProjects) * 100);

    const totalTasks = SaaSData.companies.reduce((sum, c) => sum + c.tasks, 0);
    const avgTaskCompletion = Math.round(SaaSData.companies.reduce((sum, c) => sum + c.taskCompletion, 0) / SaaSData.companies.length);

    const avgProductivity = Math.round(SaaSData.companies.reduce((sum, c) => sum + c.productivity, 0) / SaaSData.companies.length);

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
                <StatusBadge variant={val === 'Paid' ? 'success' : 'danger'} size="sm" dot>{val}</StatusBadge>
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
                <StatCard title="Total Client Companies" value={SaaSData.totalCompanies} icon={Building2} iconColor="bg-indigo-500" subtitle="Platform Tenants" />
                <StatCard title="System Activity" value="Very High" icon={Activity} iconColor="bg-blue-500" subtitle="Live Server Load" />
                <StatCard title="Overall Productivity" value={`${avgProductivity}%`} icon={TrendingUp} iconColor="bg-emerald-500" subtitle="Platform Average" />
                <StatCard title="System Uptime" value={SaaSData.uptime} icon={ShieldCheck} iconColor="bg-brand-500" subtitle="Last 30 days" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* HR SECTION */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-blue-500/5">
                        <Users size={20} className="text-blue-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">HR Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Total Employees Across All Companies</p>
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalEmployees.toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck size={16} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-text-secondary uppercase">Active Users</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{activeEmployees.toLocaleString()}</span>
                            </div>
                            <div className="p-4 bg-surface-secondary rounded-xl border border-border-secondary">
                                <div className="flex items-center gap-2 mb-2">
                                    <UserX size={16} className="text-rose-500" />
                                    <span className="text-xs font-bold text-text-secondary uppercase">Inactive Users</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{inactiveEmployees.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PROJECTS SECTION */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-brand-500/5">
                        <FolderGit2 size={20} className="text-brand-500" />
                        <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Projects Section</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary mb-1">Total Projects Across All Companies</p>
                            <p className="text-3xl font-black text-brand-600 dark:text-brand-400">{totalProjects.toLocaleString()}</p>
                        </div>
                        <div className="p-5 bg-surface-secondary rounded-xl border border-border-secondary space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-text-primary flex items-center gap-2"><PieChart size={16} className="text-brand-500" /> Project Completion Trend</span>
                                <span className="text-brand-600 dark:text-brand-400">{projectCompletionRate}%</span>
                            </div>
                            <div className="h-3 w-full bg-border-secondary rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-brand-500" style={{ width: `${projectCompletionRate}%` }} />
                            </div>
                            <p className="text-xs text-text-tertiary">
                                {completedProjects} completed out of {totalProjects} active/planned projects system-wide.
                            </p>
                        </div>
                    </div>
                </div>

                {/* TASKS SECTION */}
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

                        <div>
                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Task Completion Rate Across Companies</h3>
                            <div className="space-y-4">
                                {SaaSData.companies.slice(0, 4).map(c => (
                                    <div key={c.id}>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-semibold text-text-primary">{c.name}</span>
                                            <span className="font-bold">{c.taskCompletion}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${c.taskCompletion}%` }} />
                                        </div>
                                    </div>
                                ))}
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
                                <span className="text-sm font-semibold text-emerald-500 mb-1 flex items-center"><TrendingUp size={16} /> +2.4%</span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Team Efficiency Comparison</h3>
                            <div className="space-y-3">
                                {SaaSData.companies.sort((a, b) => b.productivity - a.productivity).slice(0, 4).map((c, idx) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-surface-secondary/50 border border-border-secondary rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-text-tertiary w-4">#{idx + 1}</span>
                                            <span className="text-sm font-bold text-text-primary">{c.name}</span>
                                        </div>
                                        <StatusBadge variant={c.productivity >= 90 ? 'success' : c.productivity >= 80 ? 'info' : 'warning'}>
                                            {c.productivity}% Eff.
                                        </StatusBadge>
                                    </div>
                                ))}
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
                                <span className="font-semibold">{SaaSData.subscriptions.filter(s => s.status === 'Paid').length} Paid</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                <span className="font-semibold text-rose-500">{SaaSData.subscriptions.filter(s => s.status === 'Past Due').length} Past Due</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                        <DataTable columns={subscriptionColumns} data={SaaSData.subscriptions} />
                    </div>
                </div>

            </div>
        </div>
    );
}
