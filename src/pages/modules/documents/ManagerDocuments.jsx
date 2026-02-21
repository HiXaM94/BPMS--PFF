import {
    Users, FileText, FileCheck, Search, Eye
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

const teamDocuments = [
    { id: 1, employee: 'Ahmed Benali', title: 'Work Experience Letter', status: 'completed', date: 'Mar 21, 2026' },
    { id: 2, employee: 'Sara Idrissi', title: 'Training Certificate', status: 'pending', date: 'Mar 20, 2026' },
    { id: 3, employee: 'Omar Fahmi', title: 'Onboarding Documents', status: 'processing', date: 'Mar 19, 2026' },
];

const columns = [
    { key: 'employee', label: 'Team Member', cellClassName: 'font-semibold text-text-primary text-sm' },
    {
        key: 'title', label: 'Document / Request', render: (val) => (
            <div className="flex items-center gap-2">
                <FileText size={14} className="text-text-tertiary" /> <span className="text-sm font-medium">{val}</span>
            </div>
        )
    },
    { key: 'date', label: 'Date', cellClassName: 'text-text-secondary text-xs' },
    {
        key: 'status', label: 'Status', render: (val) => {
            const map = { completed: 'success', processing: 'brand', pending: 'warning' };
            return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
        }
    },
    {
        key: 'actions', label: '', render: () => (
            <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View">
                <Eye size={14} className="text-text-tertiary" />
            </button>
        )
    },
];

export default function ManagerDocuments() {
    return (
        <div className="space-y-6 animate-fade-in">

            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    IT Team Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Total Team Requests" value="14" icon={FileText} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Manager Approvals" value="1" subtitle="Requires your review" icon={FileCheck} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Complete" value="12" icon={FileCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Manager Approval Card (e.g. Training Request) */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-2 bg-amber-500/5">
                        <FileCheck size={18} className="text-amber-500" />
                        <h3 className="text-base font-bold text-text-primary">Action Required</h3>
                    </div>
                    <div className="p-5">
                        <p className="font-semibold text-text-primary mb-1">Training Certificate Request</p>
                        <p className="text-xs text-text-secondary mb-4">Sara Idrissi wants to attend a React Advanced Workshop (Cost: 1,500 MAD) and needs your approval before HR processes the paperwork.</p>

                        <div className="bg-surface-secondary p-3 rounded-lg border border-border-secondary mb-4">
                            <span className="text-xs font-semibold text-text-tertiary uppercase block mb-1">Manager Note (To HR)</span>
                            <textarea className="w-full bg-surface-primary border border-border-secondary rounded text-xs p-2 shrink-0 outline-none" rows="2" placeholder="Looks good..." />
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 py-2 bg-brand-500 text-white rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors">Approve</button>
                            <button className="flex-1 py-2 bg-surface-primary border border-border-secondary text-text-primary rounded-lg font-medium text-sm hover:bg-surface-secondary transition-colors">Deny</button>
                        </div>
                    </div>
                </div>

                {/* Team Activity Table */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-base font-bold text-text-primary">Recent Team Document Activity</h3>
                        <div className="relative hidden sm:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input type="text" placeholder="Search team..." className="pl-9 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none" />
                        </div>
                    </div>
                    <DataTable columns={columns} data={teamDocuments} />
                </div>

            </div>

        </div>
    );
}
