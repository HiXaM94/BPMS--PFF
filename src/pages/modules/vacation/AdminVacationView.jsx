import React, { useState } from 'react';
import {
    BarChart3, Settings, Shield, PieChart,
    Save, AlertCircle, Info, ChevronRight,
    Search, Filter, Download, Clock, Sun,
    Users, TrendingUp, CalendarDays, Key, CheckCircle2
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { adminData } from '../../../data/mockData';
import DataTable from '../../../components/ui/DataTable';
import PageHeader from '../../../components/ui/PageHeader';
import { calculateCriticalOverlap } from './vacationUtils';

// --- MOCK DATA SPECIFIC TO VACATION MANAGEMENT ---
const MOCK_VACATION_BALANCES = [
    { id: 1, name: 'Alice Cooper', role: 'Employee', team: 'Engineering Alpha', consumed: 12 },
    { id: 2, name: 'Michael Scott', role: 'Team Manager', team: 'Engineering Alpha', consumed: 5 },
    { id: 3, name: 'John Doe', role: 'Employee', team: 'Marketing Core', consumed: 20 },
    { id: 4, name: 'Sarah Connor', role: 'Team Manager', team: 'Marketing Core', consumed: 15 },
    { id: 5, name: 'Charlie Davis', role: 'Employee', team: 'Sales Pro', consumed: 22 },
];

export default function AdminVacationView({ requests = [] }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [exportToast, setExportToast] = useState('');

    const handleExport = () => {
        setExportToast('Generating PDF Report... Download starting soon.');
        setTimeout(() => setExportToast(''), 4000);
        // Simulated PDF Export
        // window.print();
    };

    const [policies, setPolicies] = useState({
        annualDays: 22,
        sickDays: 10,
        remoteDays: 24,
        autoApproveSick: true,
        requireReason: true
    });
    const [policiesToast, setPoliciesToast] = useState('');

    const handleSavePolicies = () => {
        setPoliciesToast('Global policies updated successfully.');
        setTimeout(() => setPoliciesToast(''), 3000);
    };

    const onVacationNow = requests.map(r => ({
        id: r.id,
        name: r.employeeName,
        role: r.position || 'Employee',
        team: 'Enterprise',
        start: r.startDate,
        end: r.endDate,
        status: (r.status === 'approved' && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date()) ? 'Active' : 'Upcoming'
    })).filter(r => r.status === 'Active' || new Date(r.start) > new Date());

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

    const pendingCount = requests.filter(r => r.status === 'pending').length;
    const criticalOverlap = calculateCriticalOverlap(requests);

    const tabs = [
        { id: 'overview', label: 'Overview & Activity', icon: Sun },
        { id: 'balances', label: 'Consumption & Balances', icon: PieChart },
        { id: 'policies', label: 'Policy Management', icon: Shield },
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {exportToast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 animate-slide-up shadow-sm">
                    <CheckCircle2 size={16} /> {exportToast}
                </div>
            )}
            {policiesToast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 animate-slide-up shadow-sm">
                    <CheckCircle2 size={16} /> {policiesToast}
                </div>
            )}
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
                    {/* Dynamic Infographic Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "On Vacation", value: onVacationNow.length, icon: Sun, color: "amber", trend: "+2%", desc: "Currently out" },
                            { title: "Pending", value: pendingCount, icon: Clock, color: "brand", trend: "-5%", desc: "Awaiting review" },
                            { title: "Attendance", value: "96.4%", icon: PieChart, color: "emerald", trend: "+1.2%", desc: "Global average" },
                            { title: "System Alerts", value: criticalOverlap, icon: AlertCircle, color: criticalOverlap >= 2 ? "rose" : "emerald", trend: "0%", desc: criticalOverlap >= 2 ? "Overlap detected" : "All clear" }
                        ].map((stat, i) => {
                            const themes = {
                                amber: "from-amber-500 to-orange-500 text-amber-600 bg-amber-50",
                                brand: "from-brand-500 to-indigo-500 text-brand-600 bg-brand-50",
                                emerald: "from-emerald-500 to-teal-500 text-emerald-600 bg-emerald-50",
                                rose: "from-rose-500 to-red-500 text-rose-600 bg-rose-50 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            };
                            return (
                                <div key={i} className={`relative bg-surface-primary rounded-2xl p-5 border border-border-secondary shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${stat.color === 'rose' && stat.value >= 2 ? 'border-rose-500/50 ' + themes.rose : ''}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${themes[stat.color].split(' ')[2]} ${themes[stat.color].split(' ')[3]} dark:bg-opacity-10 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                                            <stat.icon size={22} className="stroke-[2px]" />
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-600' : stat.trend.startsWith('-') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-surface-secondary text-text-tertiary'}`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="text-3xl font-black text-text-primary tracking-tight mb-1">{stat.value}</h4>
                                        <p className="text-sm font-bold text-text-secondary uppercase tracking-tight">{stat.title}</p>
                                        <p className="text-[10px] font-medium text-text-tertiary mt-1 opacity-80">{stat.desc}</p>
                                    </div>
                                    {/* Animated Progress Line */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-secondary">
                                        <div className={`h-full bg-gradient-to-r ${themes[stat.color].split(' ').slice(0, 2).join(' ')} w-0 group-hover:w-full transition-all duration-700 ease-out`}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Currently On Vacation Table */}
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm flex flex-col">
                            <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                                <div className="flex items-center gap-2">
                                    <Sun size={18} className="text-amber-500" />
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight">Currently On Vacation</h3>
                                </div>
                                <StatusBadge variant="warning" size="sm">{onVacationNow.length} personnel</StatusBadge>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <DataTable columns={onVacationColumns} data={onVacationNow} />
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
                                    <button onClick={handleExport} className="relative group flex items-center gap-2 px-4 py-2 bg-surface-primary border border-border-secondary rounded-xl text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-brand-600 transition-all cursor-pointer overflow-hidden backdrop-blur-md hover:border-brand-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Export Data
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-x-auto">
                                <DataTable columns={leaveColumns} data={requests.slice(0, 5)} />
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in pb-8">
                    {/* Policy Configuration */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-5 border-b border-border-secondary flex flex-wrap items-center justify-between bg-surface-secondary/40 gap-4">
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 uppercase tracking-widest">
                                <Settings size={18} className="text-brand-500 animate-spin-slow" /> Global Policies
                            </h3>
                            <button onClick={handleSavePolicies} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 cursor-pointer">
                                <Save size={14} className="drop-shadow-sm" /> Save Policies
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
                    <div className="bg-surface-primary rounded-2xl border border-brand-500/30 overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-shadow">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-gradient-to-r from-brand-500/10 to-transparent">
                            <h3 className="text-sm font-bold text-brand-700 dark:text-brand-400 flex items-center gap-2 uppercase tracking-widest">
                                <TrendingUp size={18} className="text-brand-500" /> AI Insights & Forecasting
                            </h3>
                            <StatusBadge variant="brand" size="sm" dot>Live Analytics</StatusBadge>
                        </div>
                        <div className="p-6 space-y-6 relative">
                            {/* Decorative background glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-brand-500/5 blur-3xl rounded-full pointer-events-none"></div>

                            <div className="relative z-10 p-5 rounded-2xl bg-surface-secondary/50 border border-brand-500/20 flex gap-4 backdrop-blur-sm group hover:border-brand-500/40 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Info size={24} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-black text-text-primary tracking-tight">Peak Demand Forecast</p>
                                    <p className="text-sm text-text-secondary mt-1.5 leading-relaxed font-medium">
                                        Predictive models show a <strong className="text-brand-600 dark:text-brand-400 text-lg">24% surge</strong> in leave requests across <strong>Engineering Alpha</strong> next month due to nearing annual expiration. Recommend preemptive workload balancing to maintain sprint velocity.
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-5 pt-4">
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-2">
                                    Global Leave Distribution <span className="h-px flex-1 bg-border-secondary block"></span>
                                </span>
                                {[
                                    { type: 'Annual Leave', count: 284, color: 'bg-gradient-to-r from-emerald-400 to-emerald-600', pct: 65, shadow: 'shadow-emerald-500/50' },
                                    { type: 'Sick Leave', count: 92, color: 'bg-gradient-to-r from-rose-400 to-rose-600', pct: 21, shadow: 'shadow-rose-500/50' },
                                    { type: 'Remote Work', count: 60, color: 'bg-gradient-to-r from-brand-400 to-indigo-600', pct: 14, shadow: 'shadow-brand-500/50' }
                                ].map(item => (
                                    <div key={item.type} className="space-y-2 group">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                            <span className="text-text-secondary group-hover:text-text-primary transition-colors">{item.type}</span>
                                            <span className="text-text-primary">{item.count} req</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-surface-secondary rounded-full overflow-hidden shadow-inner p-0.5 relative">
                                            <div className="absolute inset-0 bg-surface-secondary mix-blend-overlay"></div>
                                            <div className={`h-full rounded-full ${item.color} shadow-sm ${item.shadow} transition-all duration-1000 ease-out relative`} style={{ width: `${item.pct}%` }}>
                                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                            </div>
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
