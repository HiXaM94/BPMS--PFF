
import React from 'react';
import {
    Users, TrendingUp, Activity, Star,
    CheckCircle2, Clock, ListChecks, ArrowUpRight
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';
import DataTable from '../../../components/ui/DataTable';
import { hrData } from '../../../data/mockData';

export default function HRPerformanceView() {
    const stats = [
        { title: 'Avg Completion Rate', value: '91.2%', icon: CheckCircle2, iconColor: 'bg-emerald-500', subtitle: 'Org-wide' },
        { title: 'Active Projects', value: '24', icon: Activity, iconColor: 'bg-blue-500' },
        { title: 'Team Tasks', value: '1,280', icon: ListChecks, iconColor: 'bg-brand-500' },
        { title: 'Overall Performance', value: 'High', icon: TrendingUp, iconColor: 'bg-violet-500' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <PageHeader
                title="Organizational Performance"
                description="Monitor productivity trends, department efficiency, and top-performing teams across the company."
                icon={Activity}
                iconColor="from-blue-500 to-indigo-600"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                    <StatCard
                        key={i}
                        title={s.title}
                        value={s.value}
                        icon={s.icon}
                        iconColor={`bg-gradient-to-br from-${s.iconColor.split('-')[1]}-500 to-${s.iconColor.split('-')[1]}-600`}
                        subtitle={s.subtitle}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Performance Distribution */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">Performance Distribution</h2>
                            <p className="text-xs text-text-tertiary">Distribution of employees across performance tiers</p>
                        </div>
                        <TrendingUp size={20} className="text-brand-500" />
                    </div>
                    <div className="space-y-6">
                        {hrData.performanceDistribution.map(item => (
                            <div key={item.label} className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span className="text-text-secondary">{item.label}</span>
                                    <span className="text-text-primary font-bold">{item.value}%</span>
                                </div>
                                <div className="h-2.5 w-full bg-border-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-4 rounded-xl bg-surface-secondary border border-border-secondary">
                        <p className="text-xs text-text-tertiary leading-relaxed italic">
                            <Star size={12} className="inline mr-1 text-amber-500" />
                            "AI identifies <strong>Good</strong> to <strong>Excellent</strong> performance as the dominant organizational trend."
                        </p>
                    </div>
                </div>

                {/* Top Performers Leaderboard */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border-secondary bg-surface-secondary/30">
                        <h2 className="text-lg font-bold text-text-primary">Top Performers</h2>
                        <p className="text-xs text-text-tertiary">Leading contributors this quarter</p>
                    </div>
                    <div className="p-2 space-y-2">
                        {hrData.topPerformers.map((person, i) => (
                            <div key={person.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-primary hover:bg-surface-secondary border border-transparent hover:border-border-secondary transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold
                                                    ${i === 0 ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50' : 'bg-surface-tertiary text-text-tertiary'}`}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-bold text-text-primary">{person.name}</p>
                                        <p className="text-xs text-text-tertiary font-medium uppercase tracking-wider">{person.dept}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-brand-600">{person.completion}</p>
                                    <p className="text-[10px] text-text-tertiary uppercase font-bold">{person.tasks} tasks</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-surface-secondary/50 border-t border-border-secondary">
                        <button className="w-full py-2.5 text-xs font-bold text-text-secondary hover:text-brand-600 transition-colors uppercase tracking-widest">
                            Review All Talent Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Department Efficiency */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border-secondary flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">Department Efficiency</h2>
                        <p className="text-xs text-text-tertiary">Productivity levels segmented by department</p>
                    </div>
                    <Activity size={20} className="text-emerald-500" />
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hrData.departmentEfficiency.map(dept => (
                        <div key={dept.label} className="p-5 rounded-2xl bg-surface-secondary border border-border-secondary hover:shadow-md transition-all">
                            <div className="flex justify-between items-end mb-3">
                                <h3 className="font-bold text-text-primary">{dept.label}</h3>
                                <span className="text-sm font-black text-brand-500">{dept.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-border-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
                                    style={{ width: `${dept.value}%` }}
                                />
                            </div>
                            <div className="mt-4 flex justify-between text-[10px] text-text-tertiary font-bold uppercase tracking-widest">
                                <span>Efficiency Rate</span>
                                <span className="text-emerald-500">+2.4% ↑</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
