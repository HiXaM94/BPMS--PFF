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
    const [teamAttendance, setTeamAttendance] = useState([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, total: 0, late: 0, absent: 0 });

    useEffect(() => {
        if (!isSupabaseReady || !profile?.id || !profile?.entreprise_id) return;

        const fetchTeamData = async () => {
            setTeamLoading(true);
            try {
                const date = new Date().toISOString().split('T')[0];

                // 1. Fetch team members
                const { data: teamMembers, error: teamErr } = await supabase
                    .from('user_details')
                    .select('id_user, department, phone, users(name, role)')
                    .eq('reports_to', profile.id);

                if (teamErr) throw teamErr;

                // 2. Fetch today's presences for these members
                const userIds = teamMembers.map(m => m.id_user);
                let presencesMap = {};
                if (userIds.length > 0) {
                    const { data: presData } = await supabase
                        .from('presences')
                        .select('*')
                        .in('id_user', userIds)
                        .eq('date', date);

                    if (presData) {
                        presData.forEach(p => { presencesMap[p.id_user] = p; });
                    }
                }

                // 3. Map to UI format
                const mapped = teamMembers.map(m => {
                    const p = presencesMap[m.id_user];
                    return {
                        id: m.id_user,
                        name: m.users?.name || 'Unknown',
                        pos: m.users?.role || 'Employee',
                        status: p ? (p.status === 'present' ? 'Present' : p.status === 'late' ? 'Late' : 'Absent') : 'Absent',
                        time: p?.check_in_time ? new Date(`2000-01-01T${p.check_in_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                        color: p?.status === 'late' ? 'text-amber-500' : (p?.status === 'present' ? 'text-emerald-500' : 'text-red-500'),
                        bg: p?.status === 'late' ? 'bg-amber-500/10' : (p?.status === 'present' ? 'bg-emerald-500/10' : 'bg-red-500/10')
                    };
                });

                setTeamAttendance(mapped);

                // 4. Calculate stats
                const present = mapped.filter(m => m.status === 'Present' || m.status === 'Late').length;
                const late = mapped.filter(m => m.status === 'Late').length;
                const absent = mapped.length - present;
                setStats({ present, total: mapped.length, late, absent });

            } catch (err) {
                console.error('Error fetching team attendance:', err);
            } finally {
                setTeamLoading(false);
            }
        };

        fetchTeamData();
    }, [profile?.id, profile?.entreprise_id]);

    const isClockedIn = today?.check_in_time && !today?.check_out_time;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* MGR-01: Team Attendance Dashboard */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    {profile?.name || 'Team'}'s Attendance - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Present Today" value={`${stats.present}/${stats.total}`} subtitle={`${stats.total ? Math.round((stats.present / stats.total) * 100) : 0}% attendance`} icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value={stats.late.toString()} subtitle="Requires attention" icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Absent Today" value={stats.absent.toString()} subtitle="Unexcused" icon={UserMinus} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="Team Punctuality" value={`${stats.present ? Math.round(((stats.present - stats.late) / stats.present) * 100) : 100}%`} subtitle="Target: 90%" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
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

                {/* 2. Late Arrival Alert — Placeholder or first late member */}
                <div className="lg:col-span-1 h-full">
                    {teamAttendance.find(m => m.status === 'Late') ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex flex-col gap-4 animate-fade-in h-full">
                            <div className="flex gap-4">
                                <div className="bg-amber-500/20 p-3 h-fit rounded-2xl mt-1 shrink-0">
                                    <BellRing size={24} className="text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-amber-500 mb-2">Late Arrival Alert</h3>
                                    <span className="font-semibold text-text-primary block mb-1">{teamAttendance.find(m => m.status === 'Late').name}</span>
                                    <p className="text-sm text-text-secondary leading-relaxed mb-4">
                                        Clocked in at {teamAttendance.find(m => m.status === 'Late').time}. <br />
                                        Requires intervention for consistency.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-auto">
                                <button onClick={() => setShowContactModal(true)} className="flex-1 py-3 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all active:scale-95">Contact</button>
                                <button className="flex-1 py-3 border-2 border-amber-500 text-amber-500 text-sm font-bold rounded-xl hover:bg-amber-500/10 transition-colors">Dismiss</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 animate-fade-in h-full text-center">
                            <CheckCircle2 size={40} className="text-emerald-500" />
                            <div>
                                <h3 className="text-base font-bold text-emerald-600 mb-1">Excellent Punctuality</h3>
                                <p className="text-sm text-emerald-700/80">No late arrivals reported for your team today.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Pending Approval — Mocked but updated status */}
                <div className="lg:col-span-1 h-full">
                    <div className="bg-surface-primary rounded-3xl border border-border-secondary p-6 flex flex-col h-full shadow-sm relative overflow-hidden">
                        <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-brand-500" /> Requests (0)
                        </h3>

                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <div className="w-12 h-12 rounded-2xl bg-surface-secondary flex items-center justify-center mb-3">
                                <CheckCircle2 size={24} className="text-text-tertiary" />
                            </div>
                            <p className="text-sm font-medium text-text-primary">All Caught Up!</p>
                            <p className="text-xs text-text-tertiary mt-1">No pending attendance corrections for your team.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Team Members List (Full Width Bottom) */}
            <div className="bg-surface-primary rounded-3xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/30">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Users size={18} className="text-brand-500" />
                        Team Attendance
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
                            {teamLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-5 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : teamAttendance.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-text-tertiary">No team members found reporting to you.</td>
                                </tr>
                            ) : (
                                teamAttendance.map((row, i) => (
                                    <tr key={i} className="hover:bg-surface-secondary/50 transition-colors group">
                                        <td className="px-5 py-4 font-bold">{row.name}</td>
                                        <td className="px-5 py-4 text-text-secondary font-medium">{row.pos}</td>
                                        <td className="px-5 py-4">
                                            <span className={`px-3 py-1.5 text-xs font-bold rounded-lg ${row.color} ${row.bg}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-text-secondary font-medium">{row.time}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button className="text-brand-500 hover:text-brand-600 font-bold text-sm bg-brand-500/10 hover:bg-brand-500/20 px-4 py-2 rounded-xl transition-colors">View History</button>
                                        </td>
                                    </tr>
                                ))
                            )}
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
