
import { useState } from 'react';
import {
    Users, CheckCircle2, XCircle, AlertCircle,
    Search, Filter, Eye, Check, X, Download, Activity
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
            {/* Command Center Stats */}
            <div className="mb-2">
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 flex items-center gap-2 tracking-tight">
                    <Activity size={24} className="text-brand-500" />
                    HR Command Center
                </h2>
                <p className="text-xs font-semibold tracking-wider uppercase text-text-tertiary mt-1">Real-time vacation & capacity oversight</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Needs Action", value: pendingCount, icon: AlertCircle, color: "orange", desc: "Pending requests" },
                    { title: "Processed", value: approvedCount, icon: CheckCircle2, color: "emerald", desc: "Approved this month" },
                    { title: "Absenteeism", value: "4.2%", icon: Users, color: "brand", desc: "Company average" },
                    { title: "Capacity Alert", value: criticalOverlap, icon: XCircle, color: "red", desc: criticalOverlap >= 2 ? "High overlap risk" : "Stable workforce" }
                ].map((stat, i) => {
                    const colorMap = {
                        orange: "from-orange-500/10 to-amber-500/5 text-orange-600 dark:text-orange-400 border-orange-500/20 ring-orange-500/20",
                        emerald: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 ring-emerald-500/20",
                        brand: "from-brand-500/10 to-indigo-500/5 text-brand-600 dark:text-brand-400 border-brand-500/20 ring-brand-500/20",
                        red: "from-red-500/10 to-rose-500/5 text-red-600 dark:text-red-400 border-red-500/20 ring-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    };
                    const theme = colorMap[stat.color];

                    return (
                        <div key={i} className={`relative bg-surface-primary rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden group`}>
                            {/* Animated Background Blob */}
                            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${theme} rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`}></div>

                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary mb-1">{stat.title}</p>
                                    <h3 className={`text-3xl font-black ${stat.color === 'red' && stat.value >= 2 ? 'text-red-500 animate-pulse' : 'text-text-primary'}`}>{stat.value}</h3>
                                    <p className="text-xs text-text-tertiary font-medium mt-1">{stat.desc}</p>
                                </div>
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme} flex items-center justify-center border shadow-inner`}>
                                    <stat.icon size={20} className="stroke-[2.5px]" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters & Actions */}
            <div className="bg-surface-primary/80 backdrop-blur-xl rounded-2xl border border-border-secondary/80 p-4 flex flex-col sm:flex-row items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] sticky top-0 z-20">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors group-focus-within:text-brand-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-surface-secondary/50 border border-border-secondary rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500/50 transition-all placeholder:text-text-tertiary/70"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 font-medium bg-surface-secondary/50 border border-border-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer hover:bg-surface-secondary transition-colors"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button className="p-2.5 border border-border-secondary bg-surface-primary rounded-xl hover:bg-brand-500/10 hover:border-brand-500/30 hover:text-brand-600 transition-colors shadow-sm" title="Advanced Filters">
                        <Filter size={18} />
                    </button>
                    <div className="h-6 w-px bg-border-secondary hidden sm:block"></div>
                    <button
                        onClick={() => setShowCorrectionModal(true)}
                        className="px-5 py-2.5 text-sm font-bold border border-brand-500/30 text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-500/10 hover:bg-brand-100 dark:hover:bg-brand-500/20 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                        Correct Balance
                    </button>
                    <button className="p-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)] hover:shadow-[0_0_20px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 transition-all duration-300" title="Export Legal Report">
                        <Download size={18} className="drop-shadow-sm" />
                    </button>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-md overflow-hidden relative group">
                {/* Decorative glowing top line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 opacity-80"></div>
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
