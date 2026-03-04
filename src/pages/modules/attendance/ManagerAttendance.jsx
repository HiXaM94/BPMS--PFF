import { Users, Clock, AlertCircle, CheckCircle2, UserCheck, Search, BellRing, UserMinus, X, Send } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import QRClockIn from './QRClockIn';
import { useState, useEffect } from 'react';

export default function ManagerAttendance() {
    const { profile } = useAuth();
    const [today, setToday] = useState(null);
    const [showContactModal, setShowContactModal] = useState(false);

    useEffect(() => {
        if (!isSupabaseReady || !profile?.id) return;
        const date = new Date().toISOString().split('T')[0];

        // Fetch Today's presence
        cacheService.getOrSet(`attendance:mgr:${profile.id}:${date}`, async () => {
            const { data } = await supabase.from('presences')
                .select('*, employees!inner(user_id)')
                .eq('employees.user_id', profile.id)
                .eq('date', date)
                .maybeSingle();
            return data;
        }, 60).then((data) => { if (data) setToday(data); });
    }, [profile?.id]);

    const isClockedIn = today?.check_in_time && !today?.check_out_time;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* MGR-01: Team Attendance Dashboard */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    IT Team Attendance (Youssef Tazi) - 9:15 AM
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Present Today" value="21/23" subtitle="91.3% attendance" icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value="4" subtitle="Needs attention" icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Absent Today" value="2" subtitle="HR notified" icon={UserMinus} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="Team Punctuality" value="89.2%" subtitle="Target: 90% ⚠️" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* 1. Clock In */}
                <div className="lg:col-span-1">
                    <QRClockIn
                        isClockedIn={isClockedIn}
                        isOnTime={today?.status === 'present'}
                        checkInTime={today?.check_in_time}
                        status={today?.status || "present"}
                        onClockIn={(scannedText) => {
                            console.log("Manager scanned:", scannedText);
                            setToday({
                                ...today,
                                check_in_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                                status: 'present'
                            });
                        }}
                    />
                </div>

                {/* 2. Late Arrival Alert */}
                <div className="lg:col-span-1 h-full">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col gap-4 animate-fade-in h-full">
                        <div className="flex gap-4">
                            <div className="bg-amber-500/20 p-3 h-fit rounded-2xl mt-1 shrink-0">
                                <BellRing size={24} className="text-amber-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-amber-500 mb-2">Late Arrival Alert</h3>
                                <span className="font-semibold text-text-primary block mb-1">Karim Alami (DevOps)</span>
                                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                                    Clocked in at 9:22 AM (22 mins late). <br />
                                    This is his 4th late arrival this month. Requires intervention.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-auto">
                            <button onClick={() => setShowContactModal(true)} className="flex-1 py-3 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all active:scale-95">Contact Karim</button>
                            <button className="flex-1 py-3 border-2 border-amber-500 text-amber-500 text-sm font-bold rounded-xl hover:bg-amber-500/10 transition-colors">Dismiss</button>
                        </div>
                    </div>
                </div>

                {/* 3. Pending Approval */}
                <div className="lg:col-span-1 h-full">
                    <div className="bg-surface-primary rounded-3xl border border-border-secondary p-6 flex flex-col h-full shadow-sm relative overflow-hidden">
                        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-brand-500" /> Pending Approval (1)
                        </h3>

                        <div className="p-4 border border-border-secondary rounded-2xl bg-surface-secondary mb-4 flex-1">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-text-primary">Ahmed Benali</p>
                                    <p className="text-xs font-medium text-text-secondary">Missing clock-out (Mar 17)</p>
                                </div>
                                <StatusBadge variant="warning">Action Req</StatusBadge>
                            </div>
                            <p className="text-xs text-text-secondary italic mb-4 p-3 bg-surface-primary rounded-xl border border-border-secondary/50">"Forgot to clock out yesterday. Left at 5:00 PM."</p>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="font-semibold text-text-primary mb-2">Was Ahmed working?</p>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1.5 bg-brand-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-brand-500/20">Yes</span>
                                        <span className="px-3 py-1.5 bg-surface-primary border border-border-secondary rounded-lg text-xs text-text-secondary font-medium cursor-pointer hover:bg-surface-tertiary transition-colors">No</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-3">
                            <button className="py-3 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all active:scale-95">Approve</button>
                            <button className="py-3 bg-surface-primary border border-border-secondary text-text-secondary text-sm font-bold rounded-xl hover:text-text-primary hover:bg-surface-secondary transition-colors">Reject</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List (Full Width Bottom) */}
            <div className="bg-surface-primary rounded-3xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Users size={18} className="text-brand-500" />
                        Team Members Present/Late
                    </h3>
                    <div className="relative">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input type="text" placeholder="Search team..." className="pl-10 pr-4 py-2.5 text-sm font-medium bg-surface-primary border border-border-secondary rounded-xl focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all w-64" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-secondary/50 text-text-secondary">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Name</th>
                                <th className="px-5 py-4 font-semibold">Position</th>
                                <th className="px-5 py-4 font-semibold">Status</th>
                                <th className="px-5 py-4 font-semibold">Time</th>
                                <th className="px-5 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-text-primary divide-y divide-border-secondary">
                            {[
                                { name: 'Ahmed Benali', pos: 'Developer', status: 'Present', time: '8:55 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { name: 'Sara Idrissi', pos: 'Developer', status: 'Present', time: '8:50 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { name: 'Karim Alami', pos: 'DevOps', status: 'Late', time: '9:22 AM', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { name: 'Omar Fahmi', pos: 'QA Engineer', status: 'Absent', time: '—', color: 'text-red-500', bg: 'bg-red-500/10' },
                                { name: 'Fatima Hassan', pos: 'Developer', status: 'Present', time: '8:45 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-surface-secondary/50 transition-colors group cursor-pointer">
                                    <td className="px-5 py-4 font-bold">{row.name}</td>
                                    <td className="px-5 py-4 text-text-secondary font-medium">{row.pos}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${row.color} ${row.bg}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-text-secondary font-medium">{row.time}</td>
                                    <td className="px-5 py-4 text-right">
                                        <button className="text-brand-500 hover:text-brand-600 font-bold text-sm bg-brand-500/10 hover:bg-brand-500/20 px-4 py-2 rounded-xl transition-colors">View Profile</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-primary rounded-3xl w-full max-w-lg shadow-2xl border border-border-secondary overflow-hidden animate-slide-up">
                        <div className="p-4 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                                <Send size={20} className="text-brand-500" />
                                Message Karim Alami
                            </h3>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-tertiary text-text-secondary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-56 bg-surface-secondary border border-border-secondary rounded-xl p-4 text-sm text-text-primary focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none leading-relaxed"
                                defaultValue={`Hi Karim,\n\nI hope you're doing well. I noticed that you clocked in today at 9:22 AM, which marks your 4th late arrival this month.\n\nPlease let me know if everything is okay or if there's anything affecting your schedule. It's important for us to maintain consistency, so I’d appreciate your attention to this matter.\n\nFeel free to reach out if you’d like to discuss.\n\nThank you.`}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowContactModal(false);
                                        // Usually would send to backend here
                                    }}
                                    className="px-5 py-2.5 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                                >
                                    <Send size={16} /> Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
