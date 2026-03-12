
import { useState } from 'react';
import {
    Users, Calendar, AlertTriangle, ArrowRight,
    UserPlus, Sparkles, LayoutGrid
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { calculateCriticalOverlap } from './vacationUtils';

export default function TeamVacationView({ requests }) {
    // Filter for team members who are currently on leave or scheduled soon
    const onLeaveNow = requests.filter(r => r.status === 'approved' && new Date(r.startDate) <= new Date());
    const upcomingAbsences = requests.filter(r => r.status === 'approved' && new Date(r.startDate) > new Date());
    const criticalOverlap = calculateCriticalOverlap(requests);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Team Status */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Absent Now</p>
                                    <p className="text-4xl font-extrabold">{onLeaveNow.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <Users size={24} />
                                </div>
                            </div>
                            <Users size={100} className="absolute -right-4 -bottom-4 opacity-10 blur-xl" />
                        </div>
                        <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Upcoming</p>
                                    <p className="text-4xl font-extrabold">{upcomingAbsences.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
                                    <Calendar size={24} />
                                </div>
                            </div>
                            <Calendar size={100} className="absolute -right-4 -bottom-4 opacity-10 blur-xl" />
                        </div>
                    </div>

                    {/* AI Redistribution Panel */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary shadow-sm overflow-hidden group">
                        <div className="p-5 border-b border-border-secondary bg-surface-secondary/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                                </span>
                                <h3 className="text-sm font-bold text-text-primary tracking-wide">AI Task Redistribution</h3>
                            </div>
                            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 rounded-full border border-brand-200 dark:border-brand-500/20 shadow-sm">
                                Smart Suggestions
                            </span>
                        </div>
                        <div className="p-5 space-y-4">
                            {onLeaveNow.length > 0 ? (
                                onLeaveNow.map((r, idx) => (
                                    <div key={r.id || idx} className="p-4 rounded-xl bg-surface-primary border border-border-secondary shadow-sm transition-all duration-300 hover:shadow-md hover:border-brand-500/30 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br py-4 from-brand-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white dark:ring-surface-primary">
                                                    {r.employeeName?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{r.employeeName}</p>
                                                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md inline-block mt-1">
                                                        On leave until {new Date(r.endDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-2 bg-surface-secondary rounded-lg border border-border-secondary text-text-tertiary">
                                                <LayoutGrid size={16} />
                                            </div>
                                        </div>

                                        <div className="pl-[52px] space-y-2">
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles size={10} className="text-amber-500" /> Suggested Redistribution
                                            </p>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/20">
                                                <span className="text-xs text-text-primary font-bold">Priority Tasks</span>
                                                <ArrowRight size={14} className="text-emerald-500 hidden sm:block" />
                                                <div className="flex items-center gap-2 bg-white dark:bg-surface-secondary px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                    <UserPlus size={14} className="text-emerald-500" />
                                                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Auto-assigned to available team</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-10 flex flex-col items-center justify-center text-center bg-surface-secondary/30 rounded-xl border border-dashed border-border-secondary text-text-tertiary">
                                    <div className="w-12 h-12 rounded-full bg-surface-primary border border-border-secondary flex items-center justify-center mb-3 shadow-sm">
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-text-secondary">Fully Staffed</p>
                                    <p className="text-xs mt-1">Everyone is currently present. No task redistribution needed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts & Quick Stats */}
                <div className="space-y-6">
                    {/* Capacity Alerts (Neon Glowing when critical) */}
                    <div className={`bg-surface-primary rounded-2xl border p-5 transition-all duration-500 ${criticalOverlap >= 2
                            ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)] dark:shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20'
                            : criticalOverlap === 1
                                ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                                : 'border-border-secondary shadow-sm'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <AlertTriangle size={18} className={
                                    criticalOverlap >= 2 ? "text-red-500 animate-pulse" :
                                        criticalOverlap === 1 ? "text-amber-500" : "text-emerald-500"
                                } />
                                Capacity Alerts
                            </h3>
                            {criticalOverlap >= 2 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                                    ACTION NEEDED
                                </span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {criticalOverlap > 0 ? (
                                <div className={`p-4 rounded-xl border relative overflow-hidden ${criticalOverlap >= 2
                                        ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/5 border-red-200 dark:border-red-500/20'
                                        : 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/10 dark:to-yellow-500/5 border-amber-200 dark:border-amber-500/20'
                                    }`}>
                                    <div className={`absolute top-0 left-0 w-1 h-full ${criticalOverlap >= 2 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                    <p className={`text-sm font-bold ${criticalOverlap >= 2 ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                        {criticalOverlap >= 2 ? 'Critical Overlap Detected!' : 'Warning: Approaching Limit'}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-1.5 leading-relaxed font-medium">
                                        <strong className={criticalOverlap >= 2 ? 'text-red-600 dark:text-red-400 text-lg' : 'text-amber-600 dark:text-amber-400 text-lg'}>
                                            {criticalOverlap}
                                        </strong> team members will be absent simultaneously. This severely impacts delivery.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 border border-emerald-200 dark:border-emerald-500/20 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Optimal Capacity</p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">No major overlapping absences detected. Team velocity is secure.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-4">Availability Overview</h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Engineering', value: 85 },
                                { label: 'Design', value: 60 },
                                { label: 'Marketing', value: 100 }
                            ].map(dept => (
                                <div key={dept.label} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-text-tertiary">
                                        <span>{dept.label}</span>
                                        <span>{dept.value}% Available</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${dept.value < 70 ? 'bg-amber-500' : 'bg-brand-500'}`}
                                            style={{ width: `${dept.value}%` }}
                                        />
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
