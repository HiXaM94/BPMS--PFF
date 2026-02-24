import { Settings, BarChart2, Users, AlertTriangle, CheckSquare, XSquare, Clock, ShieldCheck, MapPin } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import DataTable from '../../../components/ui/DataTable';

export default function CompanyAdminAttendance() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* Company Overview (CA-02) */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart2 size={20} className="text-brand-500" />
                    Acme Corporation Attendance - March 2026
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Present Today" value="82/87" subtitle="94.3% attendance" icon={CheckSquare} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value="8" subtitle="9.2% of workforce" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Absent Today" value="5" subtitle="5.7% of workforce" icon={XSquare} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="Avg Punctuality" value="88.1%" subtitle="Month-to-date" icon={Users} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Department Breakdown & Alerts */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-base font-semibold text-text-primary mb-4">Department Breakdown</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'HR', rate: '98.5%', color: 'bg-emerald-500' },
                                { name: 'Sales', rate: '97.2%', color: 'bg-emerald-400' },
                                { name: 'Finance', rate: '96.7%', color: 'bg-teal-400' },
                                { name: 'IT Department', rate: '95.8%', color: 'bg-brand-400' },
                                { name: 'Marketing', rate: '94.1%', color: 'bg-blue-400' },
                                { name: 'Operations', rate: '91.3%', color: 'bg-amber-500' },
                            ].map(dept => (
                                <div key={dept.name} className="flex items-center gap-3">
                                    <span className="w-24 text-sm font-medium text-text-secondary">{dept.name}</span>
                                    <div className="flex-1 bg-surface-secondary rounded-full h-2">
                                        <div className={`${dept.color} h-2 rounded-full`} style={{ width: dept.rate }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-text-primary w-12 text-right">{dept.rate}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Mass Attendance Correction (CA-03) */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="bg-brand-500/5 p-4 border-b border-border-secondary flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <ShieldCheck size={18} className="text-brand-500" /> Mass Attendance Correction
                            </h3>
                            <StatusBadge variant="warning">Pending Approval</StatusBadge>
                        </div>
                        <div className="p-5 text-sm">
                            <p className="text-text-secondary mb-3">
                                <strong className="text-text-primary">Situation:</strong> Power outage on March 15, 2026. <br />
                                87 employees have missing clock-out times. Submitted by Amina (HR Manager).
                            </p>
                            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary mb-4">
                                <p className="font-semibold text-text-primary">PROPOSED CORRECTION:</p>
                                <p className="text-text-secondary mt-1">Apply standard clock-out time: <span className="font-bold text-text-primary">5:00 PM</span> to all 87 employees.</p>
                                <div className="mt-3 flex items-center gap-2 text-xs text-text-secondary bg-surface-primary p-2 rounded-lg border border-border-secondary">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    No additional payroll impact (Standard hours, no overtime).
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button className="flex-1 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">Approve All</button>
                                <button className="flex-1 py-2 bg-surface-secondary text-text-primary rounded-lg font-medium border border-border-secondary hover:bg-border-secondary transition-colors">Review Individually</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Policy Configuration (CA-01) */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 h-fit">
                    <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Settings size={18} className="text-text-secondary" /> Attendance Policies
                    </h3>
                    <div className="space-y-5 text-sm">
                        <div>
                            <p className="font-semibold text-text-primary mb-2">Standard Shift</p>
                            <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary space-y-2">
                                <div className="flex justify-between"><span className="text-text-secondary">Start Time</span><span className="font-medium text-text-primary">9:00 AM</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">End Time</span><span className="font-medium text-text-primary">5:00 PM</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">Grace Period</span><span className="font-medium text-amber-500">15 mins</span></div>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Verification & Location</p>
                            <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary space-y-2">
                                <div className="flex items-center gap-2 text-text-secondary"><CheckSquare size={14} className="text-emerald-500" /> GPS Location (200m)</div>
                                <div className="flex items-center gap-2 text-text-secondary"><CheckSquare size={14} className="text-emerald-500" /> QR Code Required</div>
                                <div className="flex items-center gap-2 text-text-secondary mt-1 py-1 px-2 bg-surface-primary border border-border-secondary rounded-lg">
                                    <MapPin size={14} className="text-brand-500" />
                                    <span className="truncate">HQ: Ave Mohammed V</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Overtime Rules</p>
                            <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary space-y-2">
                                <div className="flex justify-between"><span className="text-text-secondary">Starts after</span><span className="font-medium text-text-primary">8 hours</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">Weekday Rate</span><span className="font-medium text-text-primary">1.5x</span></div>
                                <div className="flex justify-between"><span className="text-text-secondary">Approval</span><span className="font-medium text-text-primary">Manager Req.</span></div>
                            </div>
                        </div>

                        <button className="w-full py-2 bg-surface-secondary text-brand-500 font-medium rounded-lg hover:bg-brand-500/10 transition-colors">
                            Edit Policies
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
