
import { useState } from 'react';
import {
    Users, CheckCircle2, XCircle, AlertCircle,
    Search, Filter, Eye, Check, X, Download
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';
import { calculateCriticalOverlap } from './vacationUtils';

export default function HRVacationView({
    requests,
    loading,
    onApprove,
    onReject,
    onView
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const approvedCount = requests.filter(r => r.status === 'approved').length;

    const filteredRequests = requests.filter(r => {
        const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const criticalOverlap = calculateCriticalOverlap(requests);

    const columns = [
        { key: 'employeeName', label: 'Employee', cellClassName: 'font-semibold text-text-primary' },
        {
            key: 'type', label: 'Leave Type', render: (val) => (
                <StatusBadge variant="neutral" size="sm">{val}</StatusBadge>
            )
        },
        {
            key: 'period', label: 'Period', render: (_, row) => (
                <span className="text-xs text-text-secondary">
                    {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
                </span>
            )
        },
        { key: 'daysCount', label: 'Days', cellClassName: 'font-semibold text-center' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <StatusBadge variant={val === 'approved' ? 'success' : val === 'pending' ? 'warning' : 'danger'} size="sm" dot>
                    {val}
                </StatusBadge>
            )
        },
        {
            key: 'actions', label: '', render: (_, row) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onView(row)}
                        className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-tertiary"
                        title="View Details"
                    >
                        <Eye size={14} />
                    </button>
                    {row.status === 'pending' && (
                        <>
                            <button
                                onClick={() => onApprove(row.id)}
                                className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"
                                title="Approve"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => onReject(row.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                                title="Reject"
                            >
                                <X size={14} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    const [showCorrectionModal, setShowCorrectionModal] = useState(false);
    const [correctionToast, setCorrectionToast] = useState('');

    const handleCorrectionSubmit = (e) => {
        e.preventDefault();
        setShowCorrectionModal(false);
        setCorrectionToast('Leave balance successfully corrected and logged.');
        setTimeout(() => setCorrectionToast(''), 4000);
    };

    return (
        <div className="space-y-6">
            {correctionToast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 animate-slide-up">
                    <CheckCircle2 size={16} /> {correctionToast}
                </div>
            )}
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Pending" value={pendingCount.toString()} icon={AlertCircle} iconColor="bg-amber-500" />
                <StatCard title="Approved (Month)" value={approvedCount.toString()} icon={CheckCircle2} iconColor="bg-emerald-500" />
                <StatCard title="Avg. Absenteeism" value="4.2%" icon={Users} iconColor="bg-brand-500" />
                <StatCard title="Critical Overlap" value={criticalOverlap.toString()} icon={XCircle} iconColor="bg-red-500" subtitle={criticalOverlap >= 2 ? "Low team capacity" : "Normal capacity"} />
            </div>

            {/* Filters & Actions */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-surface-secondary border border-border-secondary rounded-xl text-sm focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="p-2 border border-border-secondary rounded-xl hover:bg-surface-tertiary transition-colors" title="Filters">
                        <Filter size={18} className="text-text-secondary" />
                    </button>
                    <button
                        onClick={() => setShowCorrectionModal(true)}
                        className="px-4 py-2 text-sm font-semibold border border-brand-500/30 text-brand-600 dark:text-brand-400 bg-brand-500/5 hover:bg-brand-500/10 rounded-xl transition-colors"
                    >
                        Correct Balance
                    </button>
                    <button className="p-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors" title="Export">
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <DataTable columns={columns} data={filteredRequests} loading={loading} />
            </div>

            {/* Balance Correction Modal */}
            {showCorrectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface-primary rounded-2xl p-6 w-full max-w-md shadow-xl border border-border-secondary">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Manual Balance Correction</h3>
                        <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Employee</label>
                                <select className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary" required>
                                    <option value="">Select an employee...</option>
                                    {[...new Set(requests.map(r => r.employeeName))].map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Leave Type</label>
                                    <select className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary">
                                        <option value="annual">Annual Leave</option>
                                        <option value="sick">Sick Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Days to Add/Deduct</label>
                                    <input type="number" defaultValue="1" className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase">Reason for Correction</label>
                                <textarea rows={2} required className="w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary resize-none" placeholder="e.g. Compensation for overtime"></textarea>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCorrectionModal(false)} className="px-4 py-2 hover:bg-surface-secondary rounded-xl text-sm text-text-secondary font-medium">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-semibold hover:bg-brand-600">Save Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
