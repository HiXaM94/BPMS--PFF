import {
    Building2, Users, DollarSign, Activity, FileText, BadgeAlert,
    TrendingUp, Building, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function SuperAdminPayroll() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* Platform Overview */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-brand-500" />
                    Platform Payroll Processing (March 2026)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Volume" value="14.2M MAD" subtitle="Processed across 45 SMEs" icon={DollarSign} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Active Companies" value="45" subtitle="Using Payroll Module" icon={Building2} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Payslips Generated" value="3,240" subtitle="This cycle" icon={FileText} iconColor="bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <StatCard title="Bank Files Created" value="45/45" subtitle="100% completion" icon={CheckCircle2} iconColor="bg-gradient-to-br from-violet-500 to-purple-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Top Companies Usage */}
                <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-base font-semibold text-text-primary">Top Companies by Payroll Volume</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-surface-secondary text-text-secondary">
                                <tr>
                                    <th className="px-5 py-3 font-medium">Company</th>
                                    <th className="px-5 py-3 font-medium">Employees</th>
                                    <th className="px-5 py-3 font-medium">Monthly Payroll</th>
                                    <th className="px-5 py-3 font-medium">Bank Export</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-text-primary divide-y divide-border-secondary">
                                {[
                                    { id: 1, name: 'Acme Corporation', employees: 87, volume: '1.05M MAD', bankFormat: 'Attijariwafa XML', status: 'Completed', color: 'bg-emerald-500/10 text-emerald-500' },
                                    { id: 2, name: 'TechSolutions Ltd', employees: 142, volume: '2.1M MAD', bankFormat: 'CIH Excel', status: 'Completed', color: 'bg-emerald-500/10 text-emerald-500' },
                                    { id: 3, name: 'Global Logistics', employees: 210, volume: '1.8M MAD', bankFormat: 'BMCE CSV', status: 'Processing', color: 'bg-amber-500/10 text-amber-500' },
                                    { id: 4, name: 'Innovate SA', employees: 45, volume: '650K MAD', bankFormat: 'SGMB XML', status: 'Completed', color: 'bg-emerald-500/10 text-emerald-500' },
                                ].map((row) => (
                                    <tr key={row.id} className="hover:bg-surface-secondary/50">
                                        <td className="px-5 py-3 font-medium flex items-center gap-2">
                                            <Building size={14} className="text-text-tertiary" /> {row.name}
                                        </td>
                                        <td className="px-5 py-3 text-text-secondary">{row.employees}</td>
                                        <td className="px-5 py-3 font-medium">{row.volume}</td>
                                        <td className="px-5 py-3 text-text-secondary">{row.bankFormat}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${row.color}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Health Module */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 h-fit">
                    <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-text-secondary" /> Payroll System Health
                    </h3>
                    <div className="space-y-4 text-sm">
                        <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary flex justify-between items-center">
                            <span className="text-text-secondary">Calculation Engine</span>
                            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                            </span>
                        </div>

                        <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary flex justify-between items-center">
                            <span className="text-text-secondary">PDF Payslip Generator</span>
                            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                            </span>
                        </div>

                        <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary flex justify-between items-center">
                            <span className="text-text-secondary">Bank Format Exporter</span>
                            <span className="flex items-center gap-1.5 font-medium text-emerald-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
                            </span>
                        </div>

                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-6">
                            <h4 className="font-semibold text-emerald-600 mb-2">Zero Downtime this Cycle</h4>
                            <p className="text-xs text-emerald-600/80">
                                The payroll module successfully handled 3,240 calculations without any performance degradation or service interruptions during the end-of-month peak.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
