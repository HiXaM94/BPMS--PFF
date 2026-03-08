
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
                        <StatCard title="Team Members Absent" value={onLeaveNow.length.toString()} icon={Users} iconColor="bg-amber-500" />
                        <StatCard title="Upcoming Leaves" value={upcomingAbsences.length.toString()} icon={Calendar} iconColor="bg-brand-500" />
                    </div>

                    {/* AI Redistribution Panel */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-brand-500" />
                                <h3 className="text-sm font-semibold text-text-primary">AI Task Redistribution</h3>
                            </div>
                            <StatusBadge variant="info" size="sm">Smart Suggestions</StatusBadge>
                        </div>
                        <div className="p-5 space-y-4">
                            {onLeaveNow.length > 0 ? (
                                onLeaveNow.map(r => (
                                    <div key={r.id} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-500 font-bold text-xs">
                                                    {r.employeeName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-text-primary">{r.employeeName}</p>
                                                    <p className="text-xs text-text-tertiary">On leave until {new Date(r.endDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <LayoutGrid size={16} className="text-text-tertiary" />
                                        </div>

                                        <div className="pl-11 space-y-2">
                                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Suggested Redistribution</p>
                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                                                <span className="text-xs text-text-primary font-medium">Task: Frontend Refactor</span>
                                                <ArrowRight size={12} className="text-text-tertiary" />
                                                <div className="flex items-center gap-1.5">
                                                    <UserPlus size={12} className="text-emerald-500" />
                                                    <span className="text-xs text-emerald-600 font-semibold">Assign to: Sarah M.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center bg-surface-secondary/50 rounded-xl border border-dashed border-border-secondary text-text-tertiary">
                                    <p className="text-sm">Everyone is currently present. No redistribution needed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Alerts & Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} className={criticalOverlap >= 2 ? "text-red-500" : "text-amber-500"} />
                            Capacity Alerts
                        </h3>
                        <div className="space-y-3">
                            {criticalOverlap > 0 ? (
                                <div className={`p-3 rounded-lg border ${criticalOverlap >= 2 ? 'bg-red-500/10 border-red-500/20 text-red-700' : 'bg-amber-500/10 border-amber-500/20 text-amber-700'}`}>
                                    <p className="text-xs font-semibold">{criticalOverlap >= 2 ? 'Critical Overlap Detected' : 'Upcoming Absences'}</p>
                                    <p className="text-[10px] opacity-80 mt-1">
                                        {criticalOverlap} team member{criticalOverlap > 1 ? 's' : ''} will be absent simultaneously in the coming period.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700">
                                    <p className="text-xs font-semibold">Optimal Capacity</p>
                                    <p className="text-[10px] opacity-80 mt-1">No major overlapping absences detected for the team.</p>
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
