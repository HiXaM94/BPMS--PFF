import { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, CheckCircle2, FileText, Download, UserCheck, MessageSquare, Settings } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { supabase, isSupabaseReady } from '../../../services/supabase';

export default function HRManagerAttendance() {
    const [stats, setStats] = useState({ present: 78, late: 11, absent: 9, total: 87 });

    useEffect(() => {
        if (!isSupabaseReady) return;
        const today = new Date().toISOString().split('T')[0];
        supabase
            .from('presences')
            .select('status')
            .eq('date', today)
            .then(({ data }) => {
                if (!data || data.length === 0) return;
                const present = data.filter(r => r.status === 'present').length;
                const late    = data.filter(r => r.status === 'late').length;
                const absent  = data.filter(r => r.status === 'absent').length;
                setStats({ present: present + late, late, absent, total: data.length });
            });
    }, []);

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Real-Time Monitor (HR-01) */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-brand-500" />
                    Real-Time Attendance Monitor ({now})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Clocked In" value={`${stats.present}/${stats.total}`} subtitle={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 90}% present`} icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value={stats.late.toString()} subtitle="Clocked in after 9:15" icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Not Clocked In" value={stats.absent.toString()} subtitle="Action required" icon={AlertCircle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="On Break" value="3" subtitle="Coffee/Other" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-base font-semibold text-text-primary mb-4 flex justify-between items-center">
                            <span>Employees Not Clocked In</span>
                            <button className="text-xs text-brand-500 hover:text-brand-600 font-medium">Send Mass Reminder</button>
                        </h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Omar Fahmi', dept: 'IT', status: 'absent', meta: 'Yesterday 5PM • No leave request', actions: ['Send SMS', 'Mark Leave'] },
                                { name: 'Layla Bennani', dept: 'Finance', status: 'absent', meta: 'Sick leave request pending', actions: ['Approve Leave', 'Contact'] },
                                { name: 'Rachid Moussi', dept: 'Ops', status: 'expected', meta: 'Usually arrives 9:30', actions: ['Monitor', 'Reminder'] },
                            ].map((emp, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-secondary gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${emp.status === 'absent' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            <AlertCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">{emp.name} <span className="text-xs font-normal text-text-tertiary">({emp.dept})</span></p>
                                            <p className="text-xs text-text-secondary mt-0.5">{emp.meta}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {emp.actions.map(act => (
                                            <button key={act} className="px-3 py-1.5 text-xs font-medium bg-surface-primary border border-border-secondary rounded-lg hover:border-brand-500 transition-colors">
                                                {act}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Late Arrivals (Clocked In)</h3>
                        <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
                            <span className="px-3 py-1 bg-surface-secondary border border-border-secondary rounded-full">Ahmed Benali (IT) <strong className="text-amber-500">+22m</strong></span>
                            <span className="px-3 py-1 bg-surface-secondary border border-border-secondary rounded-full">Sara Amrani (Mkt) <strong className="text-amber-500">+18m</strong></span>
                            <span className="px-3 py-1 bg-surface-secondary border border-amber-500/30 rounded-full border-dashed">Karim Alami (Log) <strong className="text-red-500">+35m</strong> (Notify Mgr)</span>
                        </div>
                    </div>

                    {/* Correction Request (HR-02) */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary flex flex-col">
                        <div className="p-4 border-b border-border-secondary flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text-primary">REQUEST #CR-0342</h3>
                            <StatusBadge variant="warning">HR Review</StatusBadge>
                        </div>
                        <div className="p-5 flex-1 flex flex-col text-sm text-text-secondary">
                            <div className="mb-4 text-center">
                                <div className="w-12 h-12 bg-surface-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <UserCheck size={20} className="text-brand-500" />
                                </div>
                                <p className="font-semibold text-text-primary">Ahmed Benali</p>
                                <p className="text-xs">IT • Software Dev</p>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between p-2 bg-surface-secondary rounded-lg">
                                    <span>Issue:</span> <span className="font-medium text-text-primary">Missing Clock-Out</span>
                                </div>
                                <div className="flex justify-between p-2 bg-rose-500/5 text-rose-500 rounded-lg">
                                    <span>Requested:</span> <span className="font-bold">5:00 PM (Mar 17)</span>
                                </div>
                            </div>

                            <div className="bg-surface-secondary p-3 rounded-xl border border-border-secondary mb-4 italic text-xs leading-relaxed">
                                "I forgot to clock out yesterday. I left the office at exactly 5:00 PM after finishing my tasks. I went directly to the parking lot..."
                            </div>

                            <div className="space-y-2 mb-6">
                                <p className="font-semibold text-text-primary text-xs flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Check recent block pattern ✓</p>
                                <p className="font-semibold text-text-primary text-xs flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Security log exit 5:03 PM ✓</p>
                                <p className="font-semibold text-text-primary text-xs flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Manager confirmed ✓</p>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-2">
                                <button className="py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors">Approve</button>
                                <button className="py-2 bg-surface-secondary text-text-primary font-medium rounded-lg border border-border-secondary hover:bg-border-secondary transition-colors">Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payroll Report Generation (HR-03) */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6">
                <div className="flex items-center justify-between mb-6 block lg:flex">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <FileText size={20} className="text-brand-500" /> Generate Payroll Report
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">Monthly Payroll Attendance Summary (March 1-31, 2026)</p>
                    </div>
                    <div className="mt-4 lg:mt-0 flex gap-3">
                        <button className="px-4 py-2 border border-border-secondary text-text-primary rounded-xl font-medium flex items-center gap-2 hover:bg-surface-secondary transition-colors">
                            <Settings size={16} /> Schedule Export
                        </button>
                        <button className="px-4 py-2 bg-brand-500 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors">
                            <Download size={16} /> Generate .xlsx
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="space-y-2 text-sm">
                        <p className="font-semibold text-text-primary mb-3">Include Data:</p>
                        <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked readOnly className="rounded text-brand-500" /> All Active Emp (87)</label>
                        <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" readOnly className="rounded text-brand-500" /> Selected Depts Only</label>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="font-semibold text-text-primary mb-3">Fields to Export:</p>
                        <div className="grid grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked readOnly className="rounded" /> Days Work</label>
                            <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked readOnly className="rounded" /> Overtime</label>
                            <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked readOnly className="rounded" /> Late Count</label>
                            <label className="flex items-center gap-2 text-text-secondary"><input type="checkbox" checked readOnly className="rounded" /> Absences</label>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-2 text-sm bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                        <p className="font-semibold text-text-primary mb-2 flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 size={16} /> Verification Status
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-emerald-700/80">
                            <span>✅ All corrections processed</span>
                            <span>✅ No pending issues</span>
                            <span>✅ All leave approved</span>
                            <span>✅ Data validated</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
