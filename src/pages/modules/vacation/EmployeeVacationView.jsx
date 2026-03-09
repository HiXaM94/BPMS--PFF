
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

    const usedByLeaveType = approvedRequests.reduce((acc, req) => {
        const type = req.type;
        acc[type] = (acc[type] || 0) + (req.daysCount || 0);
        return acc;
    }, {});

    const getBalanceState = (typeKey, uiType) => {
        const dbTotal = leaveBalance?.[typeKey]?.total || { annual: 22, sick: 10, remote_work: 24, unpaid: 30 }[typeKey];
        const used = usedByLeaveType[uiType] || 0;
        return { total: dbTotal, used: used, remaining: Math.max(0, dbTotal - used) };
    };

    const balanceCards = [
        { label: 'Annual Leave', ...getBalanceState('annual', 'Annual Leave'), color: 'bg-brand-500', badgeColor: 'bg-brand-500 text-white' },
        { label: 'Sick Leave', ...getBalanceState('sick', 'Sick Leave'), color: 'bg-red-500', badgeColor: 'bg-red-500 text-white' },
        { label: 'Remote Work', ...getBalanceState('remote_work', 'Remote Work'), color: 'bg-blue-500', badgeColor: 'bg-blue-500 text-white' },
        { label: 'Unpaid Leave', ...getBalanceState('unpaid', 'Unpaid Leave'), color: 'bg-slate-500', badgeColor: 'bg-slate-400 text-white dark:bg-slate-600' }
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
                    { title: 'PENDING REQUESTS', value: pendingRequests.length, icon: Clock, bg: 'bg-gradient-to-br py-4 from-orange-400 to-orange-600', iconBg: 'bg-white/20' },
                    { title: 'APPROVED', value: approvedRequests.length, icon: CheckCircle2, bg: 'bg-gradient-to-br py-4 from-emerald-400 to-emerald-600', iconBg: 'bg-white/20' },
                    { title: 'DAYS APPROVED', value: totalDaysApproved, icon: CalendarCheck, bg: 'bg-gradient-to-br py-4 from-brand-500 to-indigo-600', iconBg: 'bg-white/20', subtitle: 'total' },
                    { title: 'TOTAL REQUESTS', value: requests.length, icon: CalendarDays, bg: 'bg-gradient-to-br py-4 from-slate-700 to-slate-900', iconBg: 'bg-white/20' },
                ].map((stat, i) => (
                    <div key={i} className={`rounded-2xl shadow-lg border border-white/10 p-5 flex items-start justify-between relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${stat.bg}`}>
                        <div className="relative z-10 text-white">
                            <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1">{stat.title}</p>
                            <p className="text-4xl font-extrabold tracking-tight drop-shadow-sm">{stat.value}</p>
                            {stat.subtitle && <p className="text-xs text-white/70 mt-0.5">{stat.subtitle}</p>}
                        </div>
                        <div className={`relative z-10 w-12 h-12 rounded-xl backdrop-blur-md ${stat.iconBg} border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner`}>
                            <stat.icon size={24} />
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -right-4 -bottom-4 opacity-10 blur-xl">
                            <stat.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── My Leave Balance ── */}
            <div>
                <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                    <CalendarCheck size={20} className="text-brand-500" /> My Leave Balance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {balanceCards.map(lb => {
                        const pct = lb.total > 0 ? Math.round((lb.used / lb.total) * 100) : 0;
                        const bgColorMap = {
                            'bg-brand-500': 'bg-brand-50 dark:bg-brand-500/5 border-brand-200/50 dark:border-brand-500/20 text-brand-700 dark:text-brand-400',
                            'bg-red-500': 'bg-red-50 dark:bg-red-500/5 border-red-200/50 dark:border-red-500/20 text-red-700 dark:text-red-400',
                            'bg-blue-500': 'bg-blue-50 dark:bg-blue-500/5 border-blue-200/50 dark:border-blue-500/20 text-blue-700 dark:text-blue-400',
                            'bg-slate-500': 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300'
                        };
                        const cardTheme = bgColorMap[lb.color] || 'bg-surface-primary border-border-secondary';

                        return (
                            <div key={lb.label} className={`rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${cardTheme}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10.px] font-bold uppercase tracking-wide shadow-sm ${lb.badgeColor}`}>
                                        {lb.label}
                                    </span>
                                </div>
                                <div className="flex items-end justify-between mb-3">
                                    <span className="text-4xl font-extrabold tracking-tight">{lb.remaining}</span>
                                    <span className="text-sm font-medium opacity-70 pb-1">/ {lb.total} left</span>
                                </div>

                                {/* Animated Progress Bar inside Glass container */}
                                <div className="h-2 w-full bg-black/5 dark:bg-white/10 inset-inner rounded-full overflow-hidden mb-2">
                                    <div
                                        className={`h-full ${lb.color} rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                                        style={{ width: `${pct}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium opacity-70">
                                    <span>{lb.used} used</span>
                                    <span>{pct}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── All Requests Table ── */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden mt-6 transition-shadow hover:shadow-md">
                <div className="p-5 border-b border-border-secondary bg-surface-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <CalendarDays size={20} className="text-brand-500" />
                        My Requests History
                    </h3>
                    <div className="flex items-center gap-2">
                        {/* Status filter tabs */}
                        <div className="flex bg-surface-secondary rounded-xl p-1 border border-border-secondary shadow-inner">
                            {statusTabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${statusFilter === tab.key
                                        ? 'bg-surface-primary text-text-primary shadow-sm ring-1 ring-border-secondary'
                                        : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-primary/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {pendingRequests.length > 0 && (
                            <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-xs text-orange-700 dark:text-orange-400 font-bold">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </span>
                                {pendingRequests.length} pending
                            </div>
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
                                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${page === p ? 'bg-brand-500 text-white' : 'hover:bg-surface-secondary text-text-secondary'
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
