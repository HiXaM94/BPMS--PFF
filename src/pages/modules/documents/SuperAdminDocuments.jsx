import {
    Building2, Users, FileText, CheckCircle2, ShieldCheck,
    AlertTriangle, UploadCloud, Eye, Download, Search, Filter
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

const complianceData = [
    { id: 1, company: 'Acme Corporation', employees: 87, complete: 72, missing: 12, overdue: 3, status: 'warning' },
    { id: 2, company: 'TechSolutions Ltd', employees: 142, complete: 138, missing: 4, overdue: 0, status: 'success' },
    { id: 3, company: 'Global Logistics', employees: 210, complete: 156, missing: 40, overdue: 14, status: 'danger' },
    { id: 4, company: 'Innovate SA', employees: 45, complete: 45, missing: 0, overdue: 0, status: 'success' },
];

const columns = [
    {
        key: 'company', label: 'Company Name', render: (val) => (
            <span className="font-semibold text-text-primary flex items-center gap-2">
                <Building2 size={16} className="text-brand-500" /> {val}
            </span>
        )
    },
    { key: 'employees', label: 'Total Headcount', cellClassName: 'text-text-secondary' },
    {
        key: 'complete', label: 'Compliant Records', render: (val, row) => (
            <div className="w-full">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-secondary">{val} / {row.employees}</span>
                    <span className="font-semibold text-text-primary">{Math.round((val / row.employees) * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${val === row.employees ? 'bg-emerald-500' : 'bg-brand-500'}`} style={{ width: `${(val / row.employees) * 100}%` }} />
                </div>
            </div>
        )
    },
    {
        key: 'missing', label: 'Missing Docs', render: (val) => (
            <span className={`text-sm font-medium ${val > 0 ? 'text-amber-500' : 'text-text-tertiary'}`}>{val} missing</span>
        )
    },
    {
        key: 'overdue', label: 'Overdue Requests', render: (val) => (
            <span className={`text-sm font-bold ${val > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{val > 0 ? `${val} overdue` : 'Clear'}</span>
        )
    },
    {
        key: 'actions', label: '', render: () => (
            <button className="px-3 py-1.5 bg-surface-secondary text-brand-500 rounded-lg text-xs font-semibold hover:bg-brand-500/10 transition-colors">
                View Dashboard
            </button>
        )
    },
];

export default function SuperAdminDocuments() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* Platform Level Stats */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-brand-500" />
                    Platform Compliance Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Monitored" value="484" subtitle="Employees across 4 orgs" icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Platform Compliance" value="85%" subtitle="Overall document completion" icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" change="-2.1%" changeType="negative" />
                    <StatCard title="Missing Documents" value="56" subtitle="Pending uploads" icon={FileText} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Overdue Requests" value="17" subtitle="Past deadline" icon={AlertTriangle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" change="+5" changeType="negative" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Global Compliance Risk Table */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-base font-bold text-text-primary">Tenant Compliance Status</h3>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <input
                                    type="text"
                                    placeholder="Search tenants..."
                                    className="pl-9 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-500"
                                />
                            </div>
                        </div>
                    </div>
                    <DataTable columns={columns} data={complianceData} />
                </div>

            </div>

        </div>
    );
}
