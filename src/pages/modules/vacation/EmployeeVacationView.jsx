
import { useState, useMemo } from 'react';
import {
    CalendarDays, Clock, CheckCircle2, Loader2,
    Info, Trash2, ChevronLeft, ChevronRight, CalendarCheck
} from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

const PAGE_SIZE = 8;

export default function EmployeeVacationView({
    requests,
    leaveBalance,
    loading,
    onNewRequest,
    onViewRequest,
    onCancelRequest
}) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const totalDaysApproved = approvedRequests.reduce((sum, r) => sum + (r.daysCount || 0), 0);

    // Filtered + paginated data
    const filtered = useMemo(() => {
        if (statusFilter === 'all') return requests;
        return requests.filter(r => r.status === statusFilter);
    }, [requests, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFilterChange = (f) => { setStatusFilter(f); setPage(1); };

    const typeColorMap = {
        'Annual Leave': 'brand',
        'Sick Leave': 'danger',
        'Remote Work': 'info',
        'Maternity': 'pink',
        'Unpaid Leave': 'neutral'
    };

    const columns = [
        {
            key: 'type', label: 'Type', render: (val) => (
                <StatusBadge variant={typeColorMap[val] || 'neutral'} size="sm">{val}</StatusBadge>
            )
        },
        { key: 'startDate', label: 'From', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
        { key: 'endDate', label: 'To', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
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
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onViewRequest(row)}
                        className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-tertiary cursor-pointer"
                        title="View"
                    >
                        <Info size={14} />
                    </button>
                    {row.status === 'pending' && onCancelRequest && (
                        <button
                            onClick={() => onCancelRequest(row)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Cancel Request"
                        >
                            <Trash2 size={14} className="text-red-400" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const balanceCards = [
        { label: 'Annual Leave', ...(leaveBalance?.annual || { total: 0, used: 0, remaining: 0 }), color: 'bg-brand-500', badgeColor: 'bg-brand-500 text-white' },
        { label: 'Sick Leave', ...(leaveBalance?.sick || { total: 0, used: 0, remaining: 0 }), color: 'bg-red-500', badgeColor: 'bg-red-500 text-white' },
        { label: 'Remote Work', ...(leaveBalance?.remote_work || { total: 0, used: 0, remaining: 0 }), color: 'bg-blue-500', badgeColor: 'bg-blue-500 text-white' },
        { label: 'Unpaid Leave', ...(leaveBalance?.unpaid || { total: 0, used: 0, remaining: 0 }), color: 'bg-slate-500', badgeColor: 'bg-slate-400 text-white dark:bg-slate-600' }
    ];

    const statusTabs = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
    ];

    return (
        <div className="space-y-6">

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: 'PENDING REQUESTS', value: pendingRequests.length, icon: Clock, iconBg: 'bg-orange-500', subtitle: null },
                    { title: 'APPROVED', value: approvedRequests.length, icon: CheckCircle2, iconBg: 'bg-emerald-500', subtitle: null },
                    { title: 'DAYS APPROVED', value: totalDaysApproved, icon: CalendarCheck, iconBg: 'bg-brand-500', subtitle: 'total across all' },
                    { title: 'TOTAL REQUESTS', value: requests.length, icon: CalendarDays, iconBg: 'bg-brand-500', subtitle: null },
                ].map(stat => (
                    <div key={stat.title} className="bg-surface-primary rounded-2xl border border-border-secondary p-5 flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1">{stat.title}</p>
                            <p className="text-3xl font-bold text-text-primary">{stat.value}</p>
                            {stat.subtitle && <p className="text-xs text-text-tertiary mt-0.5">{stat.subtitle}</p>}
                        </div>
                        <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center text-white shrink-0`}>
                            <stat.icon size={20} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── My Leave Balance ── */}
            <div>
                <h3 className="text-base font-bold text-text-primary mb-4">My Leave Balance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {balanceCards.map(lb => {
                        const pct = lb.total > 0 ? Math.round((lb.used / lb.total) * 100) : 0;
                        return (
                            <div key={lb.label} className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mb-3 ${lb.badgeColor}`}>
                                    {lb.label}
                                </span>
                                <div className="flex items-end justify-between mb-3">
                                    <span className="text-3xl font-bold text-text-primary">{lb.remaining}</span>
                                    <span className="text-xs text-text-tertiary">of {lb.total} days</span>
                                </div>
                                <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden mb-1.5">
                                    <div
                                        className={`h-full ${lb.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-text-tertiary">{lb.used} days used</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── All Requests Table ── */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="p-5 border-b border-border-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-text-primary">All Requests</h3>
                    <div className="flex items-center gap-2">
                        {/* Status filter tabs */}
                        <div className="flex bg-surface-secondary rounded-lg p-0.5 border border-border-secondary">
                            {statusTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                        statusFilter === tab.key
                                            ? 'bg-surface-primary text-text-primary shadow-sm'
                                            : 'text-text-tertiary hover:text-text-secondary'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {pendingRequests.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                {pendingRequests.length} pending
                            </span>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={24} className="animate-spin text-text-tertiary" />
                    </div>
                ) : (
                    <>
                        <DataTable
                            columns={columns}
                            data={paginated}
                            emptyMessage="No leave requests found"
                        />

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-5 py-3 border-t border-border-secondary flex items-center justify-between text-xs text-text-tertiary">
                                <span>
                                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                        className="p-1.5 rounded-lg hover:bg-surface-secondary disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                        <ChevronLeft size={14} />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                                page === p ? 'bg-brand-500 text-white' : 'hover:bg-surface-secondary text-text-secondary'
                                            }`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                        className="p-1.5 rounded-lg hover:bg-surface-secondary disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
