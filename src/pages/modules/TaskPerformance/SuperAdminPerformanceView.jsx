import React from 'react';
import { Target, TrendingUp, CheckCircle2, Clock, AlertTriangle, ListChecks, Building2 } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';

const MOCK_COMPANY_PERF = [
    { id: 1, name: 'Acme Corp', activeProjects: 45, totalTasks: 12400, completedTasks: 11408, onTimeRate: 94, avgProductivity: 88 },
    { id: 2, name: 'Global Tech', activeProjects: 12, totalTasks: 3200, completedTasks: 2720, onTimeRate: 85, avgProductivity: 92 },
    { id: 3, name: 'Nexus Industries', activeProjects: 28, totalTasks: 8900, completedTasks: 8010, onTimeRate: 90, avgProductivity: 85 },
    { id: 4, name: 'Stark Enterprises', activeProjects: 105, totalTasks: 45000, completedTasks: 43200, onTimeRate: 96, avgProductivity: 95 },
    { id: 5, name: 'Wayne Corp', activeProjects: 3, totalTasks: 250, completedTasks: 150, onTimeRate: 60, avgProductivity: 75 },
];

export default function SuperAdminPerformanceView() {
    const totalProjects = MOCK_COMPANY_PERF.reduce((acc, curr) => acc + curr.activeProjects, 0);
    const totalTasks = MOCK_COMPANY_PERF.reduce((acc, curr) => acc + curr.totalTasks, 0);
    const avgPlatformProd = Math.round(MOCK_COMPANY_PERF.reduce((acc, curr) => acc + curr.avgProductivity, 0) / MOCK_COMPANY_PERF.length);
    const avgOnTime = Math.round(MOCK_COMPANY_PERF.reduce((acc, curr) => acc + curr.onTimeRate, 0) / MOCK_COMPANY_PERF.length);

    const columns = [
        {
            key: 'name', label: 'Company Name', render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-white border border-brand-500/20 dark:border-white/20 font-bold text-[10px]">
                        {val.charAt(0)}
                    </div>
                    <span className="font-semibold text-text-primary text-sm">{val}</span>
                </div>
            )
        },
        { key: 'activeProjects', label: 'Active Projects', cellClassName: 'text-text-secondary font-medium' },
        {
            key: 'totalTasks', label: 'Tasks (Total / Completed)', render: (val, row) => (
                <span className="text-text-secondary font-medium text-sm">
                    {row.completedTasks.toLocaleString()} / {val.toLocaleString()}
                </span>
            )
        },
        {
            key: 'onTimeRate', label: 'On-Time Rate', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden w-20">
                        <div
                            className={`h-full ${val >= 90 ? 'bg-emerald-500' : val >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${val}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold w-8">{val}%</span>
                </div>
            )
        },
        {
            key: 'avgProductivity', label: 'Productivity Score', render: (val) => (
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-surface-secondary rounded-full overflow-hidden w-20">
                        <div
                            className={`h-full ${val >= 90 ? 'bg-emerald-500' : val >= 80 ? 'bg-brand-500' : 'bg-amber-500'}`}
                            style={{ width: `${val}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold w-8">{val}%</span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* GLOBAL TOP-LEVEL STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Platform Projects" value={totalProjects.toLocaleString()} icon={Target} iconColor="bg-brand-500" subtitle="Active globally" />
                <StatCard title="Total Platform Tasks" value={totalTasks.toLocaleString()} icon={ListChecks} iconColor="bg-blue-500" subtitle="Created globally" />
                <StatCard title="Avg Platform Productivity" value={`${avgPlatformProd}%`} icon={TrendingUp} iconColor="bg-emerald-500" subtitle="Across all tenants" />
                <StatCard title="Avg On-Time Delivery" value={`${avgOnTime}%`} icon={Clock} iconColor="bg-amber-500" subtitle="Cross-company average" />
            </div>

            {/* MAIN DATA TABLE */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-brand-500/5">
                    <Building2 size={20} className="text-brand-500" />
                    <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Cross-Company Task & Performance Overview</h2>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <DataTable columns={columns} data={MOCK_COMPANY_PERF} />
                </div>
            </div>
        </div>
    );
}
