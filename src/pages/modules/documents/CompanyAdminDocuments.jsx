import {
    Building2, Users, FileText, CheckCircle2, ShieldCheck,
    AlertTriangle, Eye, Download, Search, Settings
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

const employeeCompliance = [
    { id: 1, employee: 'Omar Fahmi', dept: 'IT', missing: 2, overdue: 1, status: 'danger' },
    { id: 2, employee: 'Sara Idrissi', dept: 'Marketing', missing: 1, overdue: 1, status: 'danger' },
    { id: 3, employee: 'Karim Alami', dept: 'Sales', missing: 1, overdue: 0, status: 'warning' },
    { id: 4, employee: 'Ahmed Benali', dept: 'IT', missing: 0, overdue: 0, status: 'success' },
];

const columns = [
    {
        key: 'employee', label: 'Employee', render: (val, row) => (
            <div>
                <span className="font-semibold text-text-primary block text-sm">{val}</span>
                <span className="text-[11px] text-text-tertiary">{row.dept}</span>
            </div>
        )
    },
    {
        key: 'status', label: 'Compliance Status', render: (val) => (
            <StatusBadge variant={val === 'success' ? 'success' : val === 'warning' ? 'warning' : 'danger'} size="sm">
                {val === 'success' ? '100% Complete' : val === 'warning' ? 'Missing Docs' : 'Overdue Action Needed'}
            </StatusBadge>
        )
    },
    {
        key: 'missing', label: 'Missing', render: (val) => (
            <span className="text-sm text-text-secondary">{val}</span>
        )
    },
    {
        key: 'overdue', label: 'Overdue', render: (val) => (
            <span className={`text-sm font-semibold ${val > 0 ? 'text-red-500' : 'text-text-secondary'}`}>{val}</span>
        )
    },
    {
        key: 'actions', label: '', render: () => (
            <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-brand-500/10 transition-colors cursor-pointer" title="Remind">
                    <AlertTriangle size={14} className="text-amber-500" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View Folder">
                    <Eye size={14} className="text-text-tertiary" />
                </button>
            </div>
        )
    },
];

export default function CompanyAdminDocuments() {
    return (
        <div className="space-y-6 animate-fade-in">

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Building2 size={20} className="text-brand-500" />
                    Acme Corporation Documents
                </h2>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors text-sm flex items-center gap-2">
                        <Settings size={16} /> Company Templates
                    </button>
                    <button className="px-4 py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm text-sm">
                        Bulk Request
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Employees" value="87" subtitle="Active profiles" icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                <StatCard title="Compliant Profiles" value="72" subtitle="82.8% completion rate" icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                <StatCard title="Missing Documents" value="12" subtitle="Across all employees" icon={FileText} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                <StatCard title="Overdue Requests" value="3" subtitle="Action required" icon={AlertTriangle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Action Required Board */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                    <div className="p-5 border-b border-border-secondary">
                        <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" /> Immediate Action Required
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">

                        {/* Auto-generated doc awaiting review */}
                        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded text-uppercase inline-block mb-1">Pending Approval</span>
                                    <p className="font-bold text-text-primary text-sm">Tax Certificate 2025</p>
                                </div>
                                <StatusBadge variant="warning" size="sm">Review</StatusBadge>
                            </div>
                            <p className="text-xs text-text-secondary mb-3">Requested by: <strong>Ahmed Hassan</strong> (Marketing)</p>
                            <div className="flex gap-2">
                                <button className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-600 font-bold rounded-lg text-xs hover:bg-emerald-500/20">Sign & Approve</button>
                                <button className="flex-1 py-1.5 bg-surface-secondary text-text-primary font-medium rounded-lg text-xs hover:bg-border-secondary">View Draft</button>
                            </div>
                        </div>

                        <div className="pt-2 text-xs text-text-secondary flex justify-between items-center">
                            <span>2 more items pending review.</span>
                            <a href="#" className="font-semibold text-brand-500 hover:text-brand-600">View All</a>
                        </div>

                    </div>
                </div>

                {/* Employee Compliance Table */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-base font-bold text-text-primary">Employee Document Compliance</h3>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="Search employee..."
                                className="pl-9 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-500"
                            />
                        </div>
                    </div>
                    <DataTable columns={columns} data={employeeCompliance} />
                </div>

            </div>

        </div>
    );
}
