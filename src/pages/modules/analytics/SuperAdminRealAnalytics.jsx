import React, { useState } from 'react';
import {
    BarChart3, TrendingUp, Users, Building2,
    Activity, ArrowUpRight, ArrowDownRight, Globe
} from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import StatCard from '../../../components/ui/StatCard';

// Using simple HTML/CSS bar charts to avoid pulling in external libraries and breaking the build
export default function SuperAdminRealAnalytics() {
    const [timeRange, setTimeRange] = useState('Month');

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Global Analytics"
                description="Comprehensive platform statistics, revenue growth, and active usage metrics"
                icon={BarChart3}
                iconColor="from-indigo-500 to-purple-600"
            />

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Executive Summary</h2>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="px-4 py-2 bg-surface-secondary border border-border-secondary rounded-xl text-sm font-medium text-text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                    <option>Week</option>
                    <option>Month</option>
                    <option>Quarter</option>
                    <option>Year</option>
                </select>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { title: "Total Revenue", value: "$124,500", trend: "+14.5%", isUp: true, icon: TrendingUp, color: "from-indigo-500 to-indigo-600" },
                    { title: "Active Companies", value: "312", trend: "+5.2%", isUp: true, icon: Building2, color: "from-blue-500 to-blue-600" },
                    { title: "Total Platform Users", value: "8,405", trend: "+11.8%", isUp: true, icon: Users, color: "from-purple-500 to-purple-600" },
                    { title: "Avg Setup Time", value: "2.4 Days", trend: "-1.5%", isUp: true, icon: Activity, color: "from-emerald-500 to-emerald-600" } // Drop in setup time is good
                ].map((stat, i) => (
                    <div key={i} className="bg-surface-primary rounded-2xl border border-border-secondary p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                        {/* Background decoration */}
                        <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500 blur-2xl`} />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-sm`}>
                                <stat.icon size={20} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${stat.isUp ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.trend}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-extrabold text-text-primary tracking-tight">{stat.value}</h3>
                            <p className="text-sm font-medium text-text-tertiary mt-1">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Revenue Chart */}
                <div className="lg:col-span-2 bg-surface-primary border border-border-secondary rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">Revenue Growth</h3>
                            <p className="text-sm text-text-tertiary mt-1">Monthly recurring revenue over time</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-text-primary">$124,500</div>
                            <div className="text-sm font-medium text-emerald-500">Current MRR</div>
                        </div>
                    </div>

                    {/* CSS Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-2 md:gap-4 mt-6">
                        {[
                            { month: 'Jan', val: 30 }, { month: 'Feb', val: 45 }, { month: 'Mar', val: 40 },
                            { month: 'Apr', val: 60 }, { month: 'May', val: 75 }, { month: 'Jun', val: 85 },
                            { month: 'Jul', val: 100 }
                        ].map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="w-full relative flex items-end justify-center h-52 bg-surface-secondary/30 rounded-t-lg overflow-hidden">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs py-1 px-2 rounded font-bold z-10 whitespace-nowrap">
                                        ${(data.val * 1245).toLocaleString()}
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-md group-hover:brightness-110 transition-all duration-500"
                                        style={{ height: `${data.val}%` }}
                                    />
                                </div>
                                <span className="text-xs font-semibold text-text-tertiary mt-3 uppercase tracking-wider">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="bg-surface-primary border border-border-secondary rounded-2xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-text-primary mb-1">Plan Distribution</h3>
                    <p className="text-sm text-text-tertiary mb-6">Active subscriptions by tier</p>

                    <div className="space-y-6">
                        {[
                            { label: 'Enterprise', percent: 45, color: 'bg-indigo-500', count: 140 },
                            { label: 'Business', percent: 35, color: 'bg-purple-500', count: 109 },
                            { label: 'Starter', percent: 20, color: 'bg-emerald-500', count: 63 }
                        ].map((plan, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-text-primary">{plan.label}</span>
                                    <span className="text-sm font-semibold text-text-tertiary">{plan.count} companies</span>
                                </div>
                                <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${plan.color} rounded-full`}
                                        style={{ width: `${plan.percent}%` }}
                                    />
                                </div>
                                <div className="text-xs font-medium text-text-tertiary mt-1 text-right">{plan.percent}%</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Top Converting</span>
                                <span className="text-lg font-extrabold text-text-primary">Enterprise</span>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <Globe size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Heatmap Mock */}
            <div className="bg-surface-primary border border-border-secondary rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-text-primary mb-1">Global Platform Activity</h3>
                <p className="text-sm text-text-tertiary mb-6">Aggregated system usage across all tenants over the last 30 days</p>

                <div className="w-full h-32 flex flex-col gap-1.5">
                    {Array.from({ length: 4 }).map((_, rowIndex) => (
                        <div key={rowIndex} className="flex-1 flex gap-1.5">
                            {Array.from({ length: 30 }).map((_, colIndex) => {
                                const intensity = Math.random();
                                let colorClass = "bg-surface-secondary"; // very low
                                if (intensity > 0.8) colorClass = "bg-indigo-600 dark:bg-indigo-500";
                                else if (intensity > 0.5) colorClass = "bg-indigo-400 dark:bg-indigo-400";
                                else if (intensity > 0.2) colorClass = "bg-indigo-200 dark:bg-indigo-300";

                                return (
                                    <div
                                        key={colIndex}
                                        className={`flex-1 rounded-sm ${colorClass} hover:ring-2 hover:ring-brand-500/50 transition-all cursor-pointer`}
                                        title="Activity Level"
                                    />
                                )
                            })}
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-3 text-xs font-medium text-text-tertiary">
                    <span>Less</span>
                    <div className="w-3 h-3 rounded-sm bg-surface-secondary"></div>
                    <div className="w-3 h-3 rounded-sm bg-indigo-200 dark:bg-indigo-300"></div>
                    <div className="w-3 h-3 rounded-sm bg-indigo-400 dark:bg-indigo-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-indigo-600 dark:bg-indigo-500"></div>
                    <span>More</span>
                </div>
            </div>

        </div>
    );
}
