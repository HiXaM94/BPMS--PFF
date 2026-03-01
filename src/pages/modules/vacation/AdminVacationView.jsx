import { useState } from 'react';
import {
    BarChart3, Settings, Shield, PieChart,
    Save, AlertCircle, Info, ChevronRight,
    Search, Filter, Download, Clock
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { adminData } from '../../../data/mockData';
import DataTable from '../../../components/ui/DataTable';

export default function AdminVacationView() {
    const [policies, setPolicies] = useState({
        annualDays: 22,
        sickDays: 10,
        remoteDays: 24,
        autoApproveSick: true,
        requireReason: true
    });

    const [globalRequests] = useState(adminData.globalLeaveRequests || []);

    const leaveColumns = [
        {
            key: 'employeeName',
            label: 'Employee',
            render: (val, row) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 font-bold text-[10px]">
                        {(val || 'U').charAt(0)}
                    </div>
                    <span className="font-semibold text-text-primary text-sm">{val}</span>
                </div>
            )
        },
        { key: 'org', label: 'Organization', cellClassName: 'text-text-tertiary text-[10px] font-bold uppercase' },
        {
            key: 'type',
            label: 'Type',
            render: (val) => (
                <StatusBadge variant="neutral" size="sm">{val}</StatusBadge>
            )
        },
        { key: 'dates', label: 'Period', cellClassName: 'text-text-secondary text-xs' },
        {
            key: 'status',
            label: 'Status',
            render: (val) => {
                const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
                return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
            },
        },
    ];

    const pendingCount = globalRequests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Global Attendance" value="96.4%" icon={PieChart} iconColor="bg-emerald-500" />
                <StatCard title="Pending Approvals" value={pendingCount.toString()} icon={Clock} iconColor="bg-amber-500" subtitle="Across all orgs" />
                <StatCard title="Active Policies" value="12" icon={Shield} iconColor="bg-brand-500" />
                <StatCard title="System Alerts" value="2" icon={AlertCircle} iconColor="bg-rose-500" />
            </div>

            {/* Global Activity Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/20">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-text-primary">Global Leave Activity</h3>
                        <StatusBadge variant="info" size="sm">System Wide</StatusBadge>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-text-tertiary hover:text-brand-500 transition-colors"><Search size={16} /></button>
                        <button className="p-2 text-text-tertiary hover:text-brand-500 transition-colors"><Filter size={16} /></button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-[10px] font-bold uppercase text-text-secondary hover:border-brand-500/30 transition-all">
                            <Download size={14} /> Export Report
                        </button>
                    </div>
                </div>
                <DataTable columns={leaveColumns} data={globalRequests} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policy Configuration */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Settings size={16} /> Default Global Policies
                        </h3>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors shadow-sm">
                            <Save size={14} /> Update Defaults
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: 'Annual Leave Days', key: 'annualDays', type: 'number' },
                            { label: 'Sick Leave Days', key: 'sickDays', type: 'number' },
                            { label: 'Remote Work Days', key: 'remoteDays', type: 'number' }
                        ].map(pref => (
                            <div key={pref.key} className="flex items-center justify-between group">
                                <div>
                                    <p className="text-sm font-medium text-text-primary group-hover:text-brand-500 transition-colors">{pref.label}</p>
                                    <p className="text-xs text-text-tertiary">Baseline for new organizations</p>
                                </div>
                                <input
                                    type="number"
                                    value={policies[pref.key]}
                                    onChange={(e) => setPolicies(p => ({ ...p, [pref.key]: parseInt(e.target.value) }))}
                                    className="w-20 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                />
                            </div>
                        ))}

                        <div className="pt-4 border-t border-border-secondary space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">AI Auto-validation</p>
                                    <p className="text-xs text-text-tertiary">Allow AI to auto-flag policy violations</p>
                                </div>
                                <button
                                    onClick={() => setPolicies(p => ({ ...p, autoApproveSick: !p.autoApproveSick }))}
                                    className={`w-10 h-5 rounded-full transition-all relative ${policies.autoApproveSick ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${policies.autoApproveSick ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Insights & Trends */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-text-primary">AI Workforce Insights</h3>
                        <StatusBadge variant="brand" size="sm">Live Trends</StatusBadge>
                    </div>
                    <div className="p-5 space-y-5">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4 animate-pulse-subtle">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <Info size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Peak Demand Alert</p>
                                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                                    AI models predict a 24% surge in leave requests across <strong>TechCorp</strong> and <strong>FinServe</strong> next month. Recommend load balancing.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Global Leave Distribution</p>
                            {[
                                { type: 'Annual Leave', count: 284, color: 'bg-brand-500', pct: 65 },
                                { type: 'Sick Leave', count: 92, color: 'bg-rose-500', pct: 21 },
                                { type: 'Remote Work', count: 60, color: 'bg-amber-500', pct: 14 }
                            ].map(item => (
                                <div key={item.type} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-medium">
                                        <span className="text-text-secondary">{item.type}</span>
                                        <span className="text-text-primary font-bold">{item.count} req.</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} transition-all duration-1000 ease-out`} style={{ width: `${item.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
