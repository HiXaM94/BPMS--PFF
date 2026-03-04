import React, { useState } from 'react';
import {
    BarChart3, Settings, Shield, PieChart,
    Save, AlertCircle, Info, ChevronRight,
    Search, Filter, Download, Clock, Sun,
    Users, TrendingUp, CalendarDays, Key
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { adminData } from '../../../data/mockData';
import DataTable from '../../../components/ui/DataTable';
import PageHeader from '../../../components/ui/PageHeader';

// --- MOCK DATA SPECIFIC TO VACATION MANAGEMENT ---
const MOCK_ON_VACATION = [
    { id: 1, name: 'Alice Cooper', role: 'Employee', team: 'Engineering Alpha', start: '2026-02-25', end: '2026-03-05', status: 'Active' },
    { id: 2, name: 'Michael Scott', role: 'Team Manager', team: 'Engineering Alpha', start: '2026-02-28', end: '2026-03-02', status: 'Active' },
    { id: 3, name: 'John Doe', role: 'Employee', team: 'Marketing Core', start: '2026-02-20', end: '2026-02-28', status: 'Returning Tomorrow' },
];

const MOCK_VACATION_BALANCES = [
    { id: 1, name: 'Alice Cooper', role: 'Employee', team: 'Engineering Alpha', consumed: 12 },
    { id: 2, name: 'Michael Scott', role: 'Team Manager', team: 'Engineering Alpha', consumed: 5 },
    { id: 3, name: 'John Doe', role: 'Employee', team: 'Marketing Core', consumed: 20 },
    { id: 4, name: 'Sarah Connor', role: 'Team Manager', team: 'Marketing Core', consumed: 15 },
    { id: 5, name: 'Charlie Davis', role: 'Employee', team: 'Sales Pro', consumed: 22 },
];

export default function AdminVacationView() {
    const [activeTab, setActiveTab] = useState('overview');

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
                    <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 border border-brand-500/20 font-bold text-[10px]">
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

    const onVacationColumns = [
        {
            key: 'name', label: 'Name', render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${row.role === 'Team Manager' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-brand-500/10 text-brand-600 border border-brand-500/20'}`}>
                        {val.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-text-primary text-sm">{val}</p>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase flex items-center gap-1">
                            {row.role === 'Team Manager' && <Key size={10} className="text-amber-500" />} {row.role}
                        </p>
                    </div>
                </div>
            )
        },
        { key: 'team', label: 'Team', cellClassName: 'text-text-secondary text-xs' },
        { key: 'start', label: 'From', cellClassName: 'text-text-secondary text-xs font-medium' },
        { key: 'end', label: 'To', cellClassName: 'text-text-secondary text-xs font-medium' },
        {
            key: 'status', label: 'Status', render: (val) => (
                <StatusBadge variant={val === 'Active' ? 'brand' : 'warning'} size="sm" dot>{val}</StatusBadge>
            )
        }
    ];

    const balanceColumns = [
        {
            key: 'name', label: 'Name', render: (val, row) => (
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${row.role === 'Team Manager' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 'bg-brand-500/10 text-brand-600 border border-brand-500/20'}`}>
                        {val.charAt(0)}
                    </div>
                    <div>
                        <p className="font-semibold text-text-primary text-sm">{val}</p>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase">{row.role}</p>
                    </div>
                </div>
            )
        },
        { key: 'team', label: 'Team', cellClassName: 'text-text-secondary text-xs' },
        {
            key: 'annualAllowance', label: 'Annual Allowance', render: () => (
                <span className="font-bold text-text-primary text-sm">{policies.annualDays} <span className="text-xs font-medium text-text-secondary">days</span></span>
            )
        },
        {
            key: 'consumed', label: 'Consumed', render: (val) => (
                <span className="font-bold text-text-primary text-sm">{val} <span className="text-xs font-medium text-text-secondary">days</span></span>
            )
        },
        {
            key: 'progress', label: 'Consumption Rate', render: (_, row) => {
                const consumed = row.consumed;
                const total = policies.annualDays;
                const progress = Math.min(Math.round((consumed / total) * 100), 100);

                let barColor = 'bg-brand-500';
                if (progress >= 100) barColor = 'bg-red-500';
                else if (progress >= 80) barColor = 'bg-amber-500';

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-border-secondary rounded-full overflow-hidden min-w-[100px] max-w-[150px]">
                            <div className={`h-full ${barColor}`} style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-text-secondary">{progress}%</span>
                    </div>
                );
            }
        },
        {
            key: 'remaining', label: 'Remaining', render: (_, row) => {
                const remaining = Math.max(policies.annualDays - row.consumed, 0);
                return (
                    <span className={`inline-flex px-2 py-1 rounded-md text-sm font-bold ${remaining <= 3 ? 'bg-red-500/10 text-red-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {remaining} days
                    </span>
                );
            }
        }
    ];

    const pendingCount = globalRequests.filter(r => r.status === 'pending').length;

    const tabs = [
        { id: 'overview', label: 'Overview & Activity', icon: Sun },
        { id: 'balances', label: 'Consumption & Balances', icon: PieChart },
        { id: 'policies', label: 'Policy Management', icon: Shield },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <PageHeader
                title="Admin Vacation Management"
                description="Monitor vacation status, track annual consumption, and manage global leave policies."
                icon={CalendarDays}
                iconColor="from-emerald-500 to-teal-600"
            />

            {/* Tabs */}
            <div className="flex space-x-2 bg-surface-secondary/50 p-1 rounded-xl w-fit border border-border-secondary shadow-sm">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                            ? 'bg-surface-primary text-text-primary shadow-sm ring-1 ring-border-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: OVERVIEW & ACTIVITY */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Global Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Currently on Vacation" value={MOCK_ON_VACATION.length.toString()} icon={Sun} iconColor="bg-amber-500" />
                        <StatCard title="Pending Approvals" value={pendingCount.toString()} icon={Clock} iconColor="bg-brand-500" subtitle="Across all orgs" />
                        <StatCard title="Global Attendance" value="96.4%" icon={PieChart} iconColor="bg-emerald-500" />
                        <StatCard title="System Alerts" value="2" icon={AlertCircle} iconColor="bg-rose-500" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Currently On Vacation Table */}
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm flex flex-col">
                            <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                                <div className="flex items-center gap-2">
                                    <Sun size={18} className="text-amber-500" />
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Currently On Vacation</h3>
                                </div>
                                <StatusBadge variant="warning" size="sm">{MOCK_ON_VACATION.length} personnel</StatusBadge>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <DataTable columns={onVacationColumns} data={MOCK_ON_VACATION} />
                            </div>
                        </div>

                        {/* Recent Requests / Activity Table */}
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm flex flex-col">
                            <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-brand-500" />
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Recent Leave Activity</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-[10px] font-bold uppercase text-text-secondary hover:border-brand-500/30 transition-all cursor-pointer">
                                        <Download size={14} /> Export
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <DataTable columns={leaveColumns} data={globalRequests.slice(0, 5)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BALANCES & CONSUMPTION */}
            {activeTab === 'balances' && (
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/20">
                        <div className="flex items-center gap-3">
                            <PieChart className="text-emerald-500" size={20} />
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Vacation Balances & Consumption</h3>
                                <p className="text-xs text-text-tertiary">Track used vs remaining vacation days for all personnel, mapped to the global allowance.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <Settings size={14} className="text-emerald-600" />
                                <span className="text-xs font-bold text-emerald-700">Annual Allowance: {policies.annualDays} Days</span>
                            </div>
                            <div className="flex bg-surface-secondary rounded-lg border border-border-secondary p-1">
                                <button className="p-1 text-text-secondary hover:text-brand-500 transition-colors"><Filter size={16} /></button>
                                <button className="p-1 text-text-secondary hover:text-brand-500 transition-colors"><Search size={16} /></button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <DataTable columns={balanceColumns} data={MOCK_VACATION_BALANCES} />
                    </div>
                </div>
            )}

            {/* TAB: POLICY MANAGEMENT */}
            {activeTab === 'policies' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    {/* Policy Configuration */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                                <Settings size={16} className="text-text-secondary" /> Global Vacation Policies
                            </h3>
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer">
                                <Save size={14} /> Save Policies
                            </button>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sun size={60} className="text-emerald-500" />
                                </div>
                                <div className="relative z-10 flex items-center justify-between group-hover:pr-4 transition-all">
                                    <div>
                                        <p className="text-sm font-bold text-text-primary mb-1">Annual Leave Global Allowance</p>
                                        <p className="text-xs text-text-tertiary max-w-[280px]">Set the baseline number of vacation days granted to all employees and team managers per year. This automatically recalculates their remaining balances.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={policies.annualDays}
                                            onChange={(e) => setPolicies(p => ({ ...p, annualDays: parseInt(e.target.value) || 0 }))}
                                            className="w-24 px-4 py-2 bg-surface-primary border border-emerald-500/30 font-black text-xl text-emerald-600 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                                        />
                                        <span className="text-xs font-bold text-text-secondary uppercase">Days</span>
                                    </div>
                                </div>
                            </div>

                            {[
                                { label: 'Sick Leave Days', key: 'sickDays', type: 'number', desc: 'Paid sick leave limit per year.' },
                                { label: 'Remote Work Days', key: 'remoteDays', type: 'number', desc: 'Permitted WFH allowance.' }
                            ].map(pref => (
                                <div key={pref.key} className="flex items-center justify-between group p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">{pref.label}</p>
                                        <p className="text-xs text-text-tertiary">{pref.desc}</p>
                                    </div>
                                    <input
                                        type="number"
                                        value={policies[pref.key]}
                                        onChange={(e) => setPolicies(p => ({ ...p, [pref.key]: parseInt(e.target.value) || 0 }))}
                                        className="w-20 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                    />
                                </div>
                            ))}

                            <div className="pt-4 border-t border-border-secondary space-y-4">
                                <div className="flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">AI Auto-validation</p>
                                        <p className="text-xs text-text-tertiary">Allow AI to auto-flag policy violations before manual approval</p>
                                    </div>
                                    <button
                                        onClick={() => setPolicies(p => ({ ...p, autoApproveSick: !p.autoApproveSick }))}
                                        className={`w-10 h-5 rounded-full transition-all relative cursor-pointer shadow-inner ${policies.autoApproveSick ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
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
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-tight">
                                <TrendingUp size={16} className="text-brand-500" /> AI Workforce Insights
                            </h3>
                            <StatusBadge variant="brand" size="sm" dot>Live Trends</StatusBadge>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4 animate-pulse-subtle">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Peak Demand Alert</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                                        AI models predict a 24% surge in leave requests across <strong>Engineering Alpha</strong> next month due to nearing annual expiration. Recommend preemptive workload balancing.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Global Leave Distribution</p>
                                {[
                                    { type: 'Annual Leave', count: 284, color: 'bg-emerald-500', pct: 65 },
                                    { type: 'Sick Leave', count: 92, color: 'bg-rose-500', pct: 21 },
                                    { type: 'Remote Work', count: 60, color: 'bg-amber-500', pct: 14 }
                                ].map(item => (
                                    <div key={item.type} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-medium">
                                            <span className="text-text-secondary">{item.type}</span>
                                            <span className="text-text-primary font-bold">{item.count} req.</span>
                                        </div>
                                        <div className="h-2 w-full bg-surface-secondary rounded-full overflow-hidden shadow-inner">
                                            <div className={`h-full ${item.color} transition-all duration-1000 ease-out`} style={{ width: `${item.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
