
import { useState } from 'react';
import {
    CalendarDays, Send, Clock, CheckCircle2,
    XCircle, AlertCircle, Info, Sparkles, Trash2
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

export default function EmployeeVacationView({
    requests,
    leaveBalance,
    onNewRequest,
    onViewRequest,
    onCancelRequest
}) {
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');

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
        { key: 'startDate', label: 'From', render: (val) => new Date(val).toLocaleDateString() },
        { key: 'endDate', label: 'To', render: (val) => new Date(val).toLocaleDateString() },
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
                        className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-tertiary"
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

    return (
        <div className="space-y-6">
            {/* AI Suggestions Banner */}
            <div className="bg-gradient-to-r from-brand-500/10 to-violet-500/10 border border-brand-500/20 rounded-2xl p-4 flex items-center gap-4 animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shrink-0">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-text-primary">AI Suggestion</h4>
                    <p className="text-xs text-text-secondary">Based on project timelines, the best period for your next leave would be between April 10th and April 20th.</p>
                </div>
                <button
                    onClick={onNewRequest}
                    className="ml-auto px-4 py-2 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors"
                >
                    Book Now
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Annual Remaining" value={leaveBalance.annual.remaining.toString()} icon={CalendarDays} iconColor="bg-brand-500" />
                <StatCard title="Pending" value={pendingRequests.length.toString()} icon={Clock} iconColor="bg-amber-500" />
                <StatCard title="Approved" value={approvedRequests.length.toString()} icon={CheckCircle2} iconColor="bg-emerald-500" />
                <StatCard title="Sick Days Used" value={leaveBalance.sick.used.toString()} icon={XCircle} iconColor="bg-red-500" />
            </div>

            {/* Leave Balance Detail */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                <h3 className="text-sm font-semibold text-text-primary mb-4">Detailed Balance</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Annual Leave', ...leaveBalance.annual, color: 'bg-brand-500' },
                        { label: 'Sick Leave', ...leaveBalance.sick, color: 'bg-red-500' },
                        { label: 'Remote Work', ...leaveBalance.remote, color: 'bg-blue-500' },
                        { label: 'Unpaid Leave', ...leaveBalance.unpaid, color: 'bg-slate-500' }
                    ].map(lb => (
                        <div key={lb.label} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary">
                            <span className="text-xs font-medium text-text-tertiary uppercase mb-2 block">{lb.label}</span>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-2xl font-bold text-text-primary">{lb.remaining}</span>
                                <span className="text-xs text-text-tertiary">/ {lb.total} days</span>
                            </div>
                            <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${lb.color} transition-all duration-500`}
                                    style={{ width: `${(lb.used / lb.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* History Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">My Leave History</h3>
                    <StatusBadge variant="brand" size="sm">{requests.length} total</StatusBadge>
                </div>
                <DataTable columns={columns} data={requests} />
            </div>
        </div>
    );
}
