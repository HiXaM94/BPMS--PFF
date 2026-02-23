
import { useState } from 'react';
import {
    BarChart3, Settings, Shield, PieChart,
    Save, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function AdminVacationView() {
    const [policies, setPolicies] = useState({
        annualDays: 22,
        sickDays: 10,
        remoteDays: 24,
        autoApproveSick: true,
        requireReason: true
    });

    return (
        <div className="space-y-6">
            {/* Global Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Company Attendance" value="94.2%" icon={PieChart} iconColor="bg-brand-500" />
                <StatCard title="Most Absent Dept." value="Customer Support" icon={BarChart3} iconColor="bg-red-500" subtitle="+12% from last month" />
                <StatCard title="Active Policies" value="5" icon={Shield} iconColor="bg-emerald-500" />
                <StatCard title="Policy Violations" value="0" icon={AlertCircle} iconColor="bg-slate-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Policy Configuration */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            <Settings size={16} /> Global Leave Policies
                        </h3>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 transition-colors">
                            <Save size={14} /> Save Changes
                        </button>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: 'Annual Leave Days', key: 'annualDays', type: 'number' },
                            { label: 'Sick Leave Days', key: 'sickDays', type: 'number' },
                            { label: 'Remote Work Days', key: 'remoteDays', type: 'number' }
                        ].map(pref => (
                            <div key={pref.key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{pref.label}</p>
                                    <p className="text-xs text-text-tertiary">Standard yearly allocation</p>
                                </div>
                                <input
                                    type="number"
                                    value={policies[pref.key]}
                                    onChange={(e) => setPolicies(p => ({ ...p, [pref.key]: parseInt(e.target.value) }))}
                                    className="w-20 px-3 py-1.5 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                            </div>
                        ))}

                        <div className="pt-4 border-t border-border-secondary space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-text-primary">Auto-approve Sick Leave</p>
                                    <p className="text-xs text-text-tertiary">Allow AI to auto-validate medical absences</p>
                                </div>
                                <button
                                    onClick={() => setPolicies(p => ({ ...p, autoApproveSick: !p.autoApproveSick }))}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${policies.autoApproveSick ? 'bg-brand-500' : 'bg-border-secondary'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${policies.autoApproveSick ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Insights */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary">
                        <h3 className="text-sm font-semibold text-text-primary">Monthly Insights</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                            <Info size={20} className="text-blue-500 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Peak Absence Predicted</p>
                                <p className="text-xs text-blue-700 mt-1">AI predicts 20% increase in leave requests during December. Suggest setting black-out periods or confirming project deadlines earlier.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Top Absences by Type</p>
                            {[
                                { type: 'Annual Leave', count: 145, color: 'bg-brand-500' },
                                { type: 'Sick Leave', count: 42, color: 'bg-red-500' },
                                { type: 'Remote Work', count: 88, color: 'bg-blue-500' }
                            ].map(item => (
                                <div key={item.type} className="flex items-center gap-4">
                                    <span className="text-xs font-medium text-text-secondary w-24">{item.type}</span>
                                    <div className="flex-1 h-2 bg-border-secondary rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color}`} style={{ width: `${(item.count / 145) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-text-primary">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
