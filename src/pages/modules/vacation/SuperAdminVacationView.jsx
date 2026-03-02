import React from 'react';
import { Palmtree, Users, Building2, CalendarX, TrendingUp } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';

const MOCK_COMPANY_VACATIONS = [
    { id: 1, name: 'Acme Corp', totalEmployees: 1250, onVacation: 45, pendingRequests: 12, avgBalance: 14, status: 'Active' },
    { id: 2, name: 'Global Tech', totalEmployees: 340, onVacation: 25, pendingRequests: 4, avgBalance: 16, status: 'Active' },
    { id: 3, name: 'Nexus Industries', totalEmployees: 890, onVacation: 60, pendingRequests: 18, avgBalance: 12, status: 'Active' },
    { id: 4, name: 'Stark Enterprises', totalEmployees: 2100, onVacation: 120, pendingRequests: 35, avgBalance: 15, status: 'Active' },
    { id: 5, name: 'Wayne Corp', totalEmployees: 50, onVacation: 2, pendingRequests: 0, avgBalance: 18, status: 'Active' },
];

export default function SuperAdminVacationView() {
    const totalEmployees = MOCK_COMPANY_VACATIONS.reduce((acc, curr) => acc + curr.totalEmployees, 0);
    const totalOnVacation = MOCK_COMPANY_VACATIONS.reduce((acc, curr) => acc + curr.onVacation, 0);
    const totalPending = MOCK_COMPANY_VACATIONS.reduce((acc, curr) => acc + curr.pendingRequests, 0);
    const vacationRate = Math.round((totalOnVacation / totalEmployees) * 100);

    const columns = [
        {
            key: 'name', label: 'Company Name', render: (val) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-white border border-indigo-500/20 dark:border-white/20 font-bold text-[10px]">
                        {val.charAt(0)}
                    </div>
                    <span className="font-semibold text-text-primary text-sm">{val}</span>
                </div>
            )
        },
        { key: 'totalEmployees', label: 'Total Employees', cellClassName: 'text-text-secondary font-medium' },
        {
            key: 'onVacation', label: 'Currently On Vacation', render: (val, row) => (
                <div className="flex items-center gap-2">
                    <span className="text-text-primary font-bold">{val}</span>
                    <span className="text-xs text-text-tertiary">({Math.round((val / row.totalEmployees) * 100)}%)</span>
                </div>
            )
        },
        {
            key: 'pendingRequests', label: 'Pending Requests', render: (val) => (
                <StatusBadge variant={val > 10 ? 'warning' : 'neutral'} size="sm">
                    {val} Pending
                </StatusBadge>
            )
        },
        {
            key: 'avgBalance', label: 'Avg Remaining Balance', render: (val) => (
                <span className="text-text-secondary font-medium">{val} Days</span>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Platform Employees" value={totalEmployees.toLocaleString()} icon={Users} iconColor="bg-blue-500" subtitle="Across all tenants" />
                <StatCard title="Global Employees On Leave" value={totalOnVacation.toLocaleString()} icon={Palmtree} iconColor="bg-emerald-500" subtitle="Currently absent" />
                <StatCard title="Global Out-of-Office Rate" value={`${vacationRate}%`} icon={TrendingUp} iconColor="bg-brand-500" subtitle="Platform average" />
                <StatCard title="Global Pending Requests" value={totalPending.toLocaleString()} icon={CalendarX} iconColor="bg-amber-500" subtitle="Awaiting HR approval" />
            </div>

            <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border-secondary flex items-center gap-3 bg-emerald-500/5">
                    <Building2 size={20} className="text-emerald-500" />
                    <h2 className="text-base font-bold text-text-primary uppercase tracking-tight">Cross-Company Leave Analytics</h2>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <DataTable columns={columns} data={MOCK_COMPANY_VACATIONS} />
                </div>
            </div>
        </div>
    );
}
