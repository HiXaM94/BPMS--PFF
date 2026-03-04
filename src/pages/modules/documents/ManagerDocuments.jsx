import { useState } from 'react';
import {
    Users, FileText, FileCheck, Search, Eye, CheckCircle2
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
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState('');
    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const filtered = teamDocuments.filter(d => d.employee.toLowerCase().includes(search.toLowerCase()) || d.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in">

            {toast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    IT Team Documents
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="Total Team Requests" value="14" icon={FileText} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Pending (HR Review)" value="2" subtitle="Awaiting HR action" icon={FileCheck} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Complete" value="12" icon={FileCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Read-only Team Document Status */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                    <div className="p-5 border-b border-border-secondary flex items-center gap-2 bg-brand-500/5">
                        <FileCheck size={18} className="text-brand-500" />
                        <h3 className="text-base font-bold text-text-primary">Team Status</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between text-sm border-b border-surface-secondary pb-3">
                            <div>
                                <p className="font-semibold text-text-primary">Sara Idrissi</p>
                                <p className="text-[11px] text-text-tertiary">Training Certificate</p>
                            </div>
                            <StatusBadge variant="warning" size="sm" dot>Pending HR</StatusBadge>
                        </div>
                        <div className="flex items-center justify-between text-sm border-b border-surface-secondary pb-3">
                            <div>
                                <p className="font-semibold text-text-primary">Omar Fahmi</p>
                                <p className="text-[11px] text-text-tertiary">Onboarding Documents</p>
                            </div>
                            <StatusBadge variant="brand" size="sm" dot>In Progress</StatusBadge>
                        </div>
                        <div className="flex items-center justify-between text-sm pb-3">
                            <div>
                                <p className="font-semibold text-text-primary">Ahmed Benali</p>
                                <p className="text-[11px] text-text-tertiary">Work Experience Letter</p>
                            </div>
                            <StatusBadge variant="success" size="sm" dot>Complete</StatusBadge>
                        </div>
                        <p className="text-[11px] text-text-tertiary text-center pt-2 border-t border-border-secondary">
                            Document approvals are handled by HR. You can view your team's status here.
                        </p>

                        {approvalStatus ? (
                            <div className={`py-2 text-center text-sm font-medium rounded-lg ${approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                {approvalStatus === 'approved' ? 'Training request approved' : 'Training request denied'}
                            </div>
                        ) : (
                            <div className="flex gap-2 mt-4 pt-4 border-t border-surface-secondary">
                                <button onClick={() => { setApprovalStatus('approved'); flash('Training request approved and forwarded to HR'); }} className="flex-1 py-2 bg-brand-500 text-white rounded-lg font-bold text-sm hover:bg-brand-600 transition-colors cursor-pointer">Approve</button>
                                <button onClick={() => { setApprovalStatus('denied'); flash('Training request denied'); }} className="flex-1 py-2 bg-surface-primary border border-border-secondary text-text-primary rounded-lg font-medium text-sm hover:bg-surface-secondary transition-colors cursor-pointer">Deny</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Activity Table */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-base font-bold text-text-primary">Recent Team Document Activity</h3>
                        <div className="relative hidden sm:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." className="pl-9 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none" />
                        </div>
                    </div>
                    <DataTable columns={columns} data={filtered} />
                </div>

            </div>

        </div>
    );
}
