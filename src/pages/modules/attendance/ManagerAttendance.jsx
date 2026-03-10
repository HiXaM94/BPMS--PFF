import { useState, useEffect, useCallback } from 'react';
import {
    Users, Clock, AlertCircle, CheckCircle2, UserCheck, Search, Send, History, Download, X, Maximize2, UserMinus
} from 'lucide-react';
import { exportAttendancePDF } from '../../../utils/pdfExport';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import QRClockIn from './QRClockIn';

function fmtTime(t) {
    if (!t) return '-';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function ManagerAttendance() {
    const { profile } = useAuth();
    const [teamAttendance, setTeamAttendance] = useState([]);
    const [teamLoading, setTeamLoading] = useState(true);
    const [stats, setStats] = useState({ present: 0, total: 0, late: 0, absent: 0 });
    const [today, setToday] = useState(null);
    const [history, setHistory] = useState([]);
    const [monthlyHours, setMonthlyHours] = useState(0);
    const [overtime, setOvertime] = useState(0);
    const [avgHours, setAvgHours] = useState(0);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showTeamHistory, setShowTeamHistory] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberHistory, setMemberHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const flash = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
    };

    const fetchAttendance = async () => {
        if (!isSupabaseReady || !profile?.id || !profile?.entreprise_id) return;
        setTeamLoading(true);
        try {
            const date = new Date().toISOString().split('T')[0];

            // 0. Fetch manager's own today presence
            const { data: todayData } = await supabase.from('presences')
                .select('*, employees!inner(user_id)')
                .eq('employees.user_id', profile.id)
                .eq('date', date)
                .maybeSingle();

            if (todayData) setToday(todayData);

            // 0.1 Fetch monthly history for manager
            const monthStart = date.slice(0, 7) + '-01';
            const { data: historyData } = await supabase.from('presences')
                .select('*, employees!inner(user_id)')
                .eq('employees.user_id', profile.id)
                .gte('date', monthStart)
                .order('date', { ascending: false });

            if (historyData) {
                setHistory(historyData);
                const hrs = historyData.reduce((s, r) => s + (r.hours_worked || 0), 0);
                const ot = historyData.reduce((s, r) => {
                    const dbOt = r.overtime_hours || 0;
                    if (dbOt > 0) return s + dbOt;
                    return s + Math.max(0, (r.hours_worked || 0) - 8);
                }, 0);
                setMonthlyHours(Math.round(hrs * 10) / 10);
                setOvertime(Math.round(ot * 10) / 10);
                setAvgHours(historyData.length > 0 ? Math.round((hrs / historyData.length) * 10) / 10 : 0);
            } else {
                setHistory([]);
                setMonthlyHours(0);
                setOvertime(0);
                setAvgHours(0);
            }

            // 1. Fetch team members
            const { data: teamMembers, error: teamErr } = await supabase
                .from('user_details')
                .select('id_user, department, phone, users!id_user(name, role)')
                .eq('reports_to', profile.id);

            if (teamErr) throw teamErr;

            // 2. Fetch today's presences for these members
            const userIds = teamMembers.map(m => m.id_user);
            let presencesMap = {};
            if (userIds.length > 0) {
                const { data: presData } = await supabase
                    .from('presences')
                    .select('*, employees!inner(user_id)')
                    .in('employees.user_id', userIds)
                    .eq('date', date);

                if (presData) {
                    presData.forEach(p => { presencesMap[p.employees.user_id] = p; });
                }
            }

            // 3. Map to UI format
            const mapped = teamMembers.map(m => {
                const p = presencesMap[m.id_user];
                return {
                    id: m.id_user,
                    name: m.users?.name || 'Unknown',
                    pos: m.users?.role || 'Employee',
                    status: p ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : 'Absent',
                    time: p?.check_in_time ? new Date(`2000-01-01T${p.check_in_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
                    color: p ? (p.status === 'late' ? 'text-amber-500' : 'text-emerald-500') : 'text-red-500',
                    bg: p ? (p.status === 'late' ? 'bg-amber-500/10' : 'bg-emerald-500/10') : 'bg-red-500/10'
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

    const fetchMemberHistory = async (member) => {
        if (!isSupabaseReady) return;
        setSelectedMember(member);
        setShowTeamHistory(true);
        setHistoryLoading(true);

        try {
            const date = new Date().toISOString().split('T')[0];
            const monthStart = date.slice(0, 7) + '-01';

            const { data, error } = await supabase.from('presences')
                .select('*, employees!inner(user_id)')
                .eq('employees.user_id', member.id)
                .gte('date', monthStart)
                .order('date', { ascending: false });

            if (error) throw error;
            setMemberHistory(data || []);
        } catch (err) {
            console.error('Error fetching member history:', err);
            flash('Failed to load history', 'error');
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [profile?.id, profile?.entreprise_id]);

    const isClockedIn = today?.check_in_time && !today?.check_out_time;

    return (
        <div className="space-y-6 animate-fade-in relative">
            {toast.message && (
                <div className={`absolute top-0 right-0 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in shadow-lg ${toast.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                    }`}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />} {toast.message}
                </div>
            )}

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
                    <StatCard title="Team Punctuality" value={`${stats.present > 0 ? Math.round(((stats.present - stats.late) / stats.present) * 100) : 0}%`} subtitle="Target: 90%" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* 1. Clock In */}
                <div className="lg:col-span-1">
                    <QRClockIn
                        isClockedIn={isClockedIn}
                        isOnTime={today?.status === 'present'}
                        checkInTime={today?.check_in_time}
                        status={today?.status}
                        companyId={profile?.entreprise_id}
                        onClockIn={async (scannedText) => {
                            try {
                                const { data, error } = await supabase.rpc('clock_in_out', {
                                    p_entreprise_id: profile.entreprise_id,
                                    p_scanned_token: scannedText,
                                    p_user_id: profile.id
                                });

                                if (error) throw error;

                                if (data?.success) {
                                    flash(data.message, 'success');
                                    await fetchAttendance();
                                } else {
                                    flash(data?.message || 'Failed to scan QR Code.', 'error');
                                }
                            } catch (err) {
                                console.error('[QR Scan Error]', err);
                                flash(`A system error occurred while clocking in: ${err.message || 'Unknown error'}`, 'error');
                            }
                        }}
                    />
                </div>

                {/* 2. Personal Quick Stats (Consolidated Card) */}
                <div className="lg:col-span-1">
                    <div className="bg-surface-primary border border-border-secondary p-6 rounded-3xl flex flex-col justify-center h-full shadow-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface-secondary rounded-xl text-slate-500 dark:text-white">
                                        <Clock size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary">Worked This Month</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{monthlyHours}h</span>
                            </div>

                            <div className="h-px bg-border-secondary w-full opacity-50"></div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface-secondary rounded-xl text-slate-500 dark:text-white">
                                        <History size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary">Overtime This Month</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{overtime}h</span>
                            </div>

                            <div className="h-px bg-border-secondary w-full opacity-50"></div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-surface-secondary rounded-xl text-slate-500 dark:text-white">
                                        <Maximize2 size={20} />
                                    </div>
                                    <span className="text-sm font-medium text-text-secondary">Average Hours / day</span>
                                </div>
                                <span className="text-xl font-bold text-text-primary">{avgHours}h</span>
                            </div>
                        </div>
                    </div>
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

            {/* MGR-02: Personal History Table (Matching Employee Style) */}
            <div className="bg-surface-primary rounded-3xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in mb-6" style={{ animationDelay: '100ms' }}>
                <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/10">
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <History size={18} className="text-brand-500" />
                        My History ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                    </h3>
                    <button
                        onClick={() => exportAttendancePDF({
                            userName: profile?.name || 'Manager',
                            title: 'My Attendance History',
                            period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                            data: history
                        })}
                        className="text-xs flex items-center gap-1.5 text-text-primary dark:text-white font-bold bg-surface-secondary dark:bg-white/10 hover:bg-surface-tertiary dark:hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 border border-border-primary dark:border-white/5"
                    >
                        <Download size={14} /> Download PDF
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-secondary/50 text-text-secondary">
                            <tr>
                                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Date</th>
                                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Clock In</th>
                                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Clock Out</th>
                                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Hours</th>
                                <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-text-primary divide-y divide-border-secondary">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-text-tertiary">
                                        No personal attendance records found for this month.
                                    </td>
                                </tr>
                            ) : (
                                history.map((record, index) => {
                                    const dateObj = new Date(record.date);
                                    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                    let statusColor = 'emerald';
                                    let statusText = record.status.charAt(0).toUpperCase() + record.status.slice(1);

                                    if (record.status === 'late') statusColor = 'amber';
                                    else if (record.status === 'absent') statusColor = 'rose';
                                    else if (record.status === 'present' && !record.check_out_time) {
                                        if (record.date === new Date().toISOString().split('T')[0]) {
                                            statusText = 'In Progress';
                                            statusColor = 'blue';
                                        } else {
                                            statusText = 'Missing Out';
                                            statusColor = 'rose';
                                        }
                                    }

                                    return (
                                        <tr key={index} className="hover:bg-surface-secondary/50 transition-colors">
                                            <td className="px-5 py-4 font-bold">{displayDate}</td>
                                            <td className="px-5 py-4 text-text-secondary font-medium">{fmtTime(record.check_in_time)}</td>
                                            <td className="px-5 py-4 text-text-secondary font-medium">{fmtTime(record.check_out_time)}</td>
                                            <td className="px-5 py-4 font-bold text-text-primary">
                                                {record.hours_worked ? `${Math.round(record.hours_worked * 10) / 10}h` : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-${statusColor}-500/10 text-${statusColor}-500 inline-block`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Team Members List (Full Width Bottom) */}
            <div className="bg-surface-primary rounded-3xl border border-border-secondary overflow-hidden shadow-sm animate-fade-in" style={{ animationDelay: '200ms' }}>
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
                                            <button
                                                onClick={() => fetchMemberHistory(row)}
                                                className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shadow-brand-500/20"
                                            >
                                                View History
                                            </button>
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
            {/* Team Member History Modal */}
            {showTeamHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-surface-primary rounded-3xl w-full max-w-4xl shadow-2xl border border-border-secondary overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-lg">
                                    {selectedMember?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-text-primary leading-tight">{selectedMember?.name}'s History</h3>
                                    <p className="text-xs text-text-tertiary">Attendance records for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowTeamHistory(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-tertiary text-text-secondary transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {historyLoading ? (
                                <div className="p-12 text-center">
                                    <div className="w-10 h-10 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-sm text-text-secondary font-medium">Fetching history...</p>
                                </div>
                            ) : memberHistory.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center">
                                    <History size={48} className="text-text-tertiary mb-4 opacity-20" />
                                    <p className="text-text-tertiary font-medium">No attendance records found for this month.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-surface-secondary/30 text-text-secondary sticky top-0 backdrop-blur-md z-10">
                                        <tr>
                                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Clock In</th>
                                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Clock Out</th>
                                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Hours</th>
                                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-secondary">
                                        {memberHistory.map((record, index) => {
                                            const dateObj = new Date(record.date);
                                            const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                                            let statusColor = 'emerald';
                                            if (record.status === 'late') statusColor = 'amber';
                                            else if (record.status === 'absent') statusColor = 'rose';

                                            return (
                                                <tr key={index} className="hover:bg-surface-secondary/50 transition-colors">
                                                    <td className="px-6 py-5 font-bold text-text-primary">{displayDate}</td>
                                                    <td className="px-6 py-5 text-text-secondary font-medium">{fmtTime(record.check_in_time)}</td>
                                                    <td className="px-6 py-5 text-text-secondary font-medium">{fmtTime(record.check_out_time)}</td>
                                                    <td className="px-6 py-5 font-bold text-text-primary">
                                                        {record.hours_worked ? `${Math.round(record.hours_worked * 10) / 10}h` : '—'}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md bg-${statusColor}-500/10 text-${statusColor}-500`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-4 border-t border-border-secondary bg-surface-secondary/20 flex justify-end">
                            <button
                                onClick={() => setShowTeamHistory(false)}
                                className="px-6 py-2.5 bg-surface-primary border border-border-secondary text-text-primary text-sm font-bold rounded-xl hover:bg-surface-secondary transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
