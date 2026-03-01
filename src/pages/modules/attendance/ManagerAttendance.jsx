import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, AlertCircle, CheckCircle2, UserCheck, Search, BellRing, UserMinus } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';

function fmtTime(t) {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

const MOCK_TEAM = [
    { name: 'Ahmed Benali', pos: 'Developer', status: 'Present', time: '8:55 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Sara Idrissi', pos: 'Developer', status: 'Present', time: '8:50 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Karim Alami', pos: 'DevOps', status: 'Late', time: '9:22 AM', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { name: 'Omar Fahmi', pos: 'QA Engineer', status: 'Absent', time: '—', color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Fatima Hassan', pos: 'Developer', status: 'Present', time: '8:45 AM', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

export default function ManagerAttendance() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ present: 21, late: 4, absent: 2, total: 23 });
    const [teamRows, setTeamRows] = useState(MOCK_TEAM);
    const [search, setSearch] = useState('');
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState(null); // null | 'approved' | 'rejected'
    const [toast, setToast] = useState('');

    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    useEffect(() => {
        if (!isSupabaseReady) return;
        const today = new Date().toISOString().split('T')[0];
        cacheService.getOrSet(`attendance:mgr:${today}`, async () => {
            const { data } = await supabase.from('presences')
                .select('status, check_in_time, employees!inner(user_id, position, users!inner(name))')
                .eq('date', today);
            return data;
        }, 60).then(data => {
            if (!data || data.length === 0) return;
            const present = data.filter(r => r.status === 'present').length;
            const late = data.filter(r => r.status === 'late').length;
            const absent = data.filter(r => r.status === 'absent').length;
            setStats({ present: present + late, late, absent, total: data.length });
            const colorMap = { present: ['text-emerald-500', 'bg-emerald-500/10', 'Present'], late: ['text-amber-500', 'bg-amber-500/10', 'Late'], absent: ['text-red-500', 'bg-red-500/10', 'Absent'] };
            setTeamRows(data.map(r => {
                const c = colorMap[r.status] || colorMap.present;
                return {
                    name: r.employees?.users?.name || 'Unknown',
                    pos: r.employees?.position || '-',
                    status: c[2],
                    time: r.check_in_time ? fmtTime(r.check_in_time) : '—',
                    color: c[0],
                    bg: c[1],
                };
            }));
        });
    }, []);

    const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
    const filteredTeam = teamRows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.pos.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 animate-fade-in">

            {/* MGR-01: Team Attendance Dashboard */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    Team Attendance ({profile?.name || 'Manager'}) - {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </h2>

                {toast && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in mb-4">
                        <CheckCircle2 size={16}/> {toast}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Present Today" value={`${stats.present}/${stats.total}`} subtitle={`${pct}% attendance`} icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value={stats.late.toString()} subtitle="Needs attention" icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Absent Today" value={stats.absent.toString()} subtitle="HR notified" icon={UserMinus} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="Team Punctuality" value={`${stats.total > 0 ? Math.round(((stats.present - stats.late) / stats.total) * 100) : 0}%`} subtitle="Target: 90%" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Team List & Alerts */}
                <div className="xl:col-span-2 space-y-6">
                    {/* MGR-03: Late Arrival Alert */}
                    {!alertDismissed && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4 animate-fade-in">
                        <div className="bg-amber-500/20 p-2 h-fit rounded-xl">
                            <BellRing size={24} className="text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-amber-500 mb-1">Late Arrival Alert - Karim Alami</h3>
                            <p className="text-sm text-amber-500/80 mb-3">
                                DevOps Engineer clocked in at 9:22 AM (22 mins late). <br />
                                This is his 4th late arrival this month. Company policy requires intervention after 5.
                            </p>
                            <div className="flex gap-2">
                                <button onClick={() => flash('Notification sent to Karim Alami')} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">Contact Karim</button>
                                <button onClick={() => setAlertDismissed(true)} className="px-3 py-1.5 border border-amber-500 text-amber-500 text-xs font-medium rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer">Dismiss</button>
                            </div>
                        </div>
                    </div>
                    )}

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="p-4 border-b border-border-secondary flex items-center justify-between">
                            <h3 className="text-base font-semibold text-text-primary">Team Members Present/Late</h3>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search team..." className="pl-8 pr-4 py-1.5 text-sm bg-surface-secondary border border-border-secondary rounded-lg focus:outline-none focus:border-brand-500" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-surface-secondary text-text-secondary">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Position</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Time</th>
                                        <th className="px-4 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary divide-y divide-border-secondary bg-surface-primary">
                                    {filteredTeam.map((row, i) => (
                                        <tr key={i} className="hover:bg-surface-secondary transition-colors">
                                            <td className="px-4 py-3 font-medium">{row.name}</td>
                                            <td className="px-4 py-3 text-text-secondary">{row.pos}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${row.color} ${row.bg}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-text-secondary">{row.time}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button className="text-brand-500 hover:text-brand-600 font-medium text-sm">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MGR-02: Manager Approves Correction */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 flex flex-col h-full">
                    <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-brand-500" /> Pending Approval (1)
                    </h3>
                    <div className="p-4 border border-border-secondary rounded-xl bg-surface-secondary mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold text-text-primary">Ahmed Benali</p>
                                <p className="text-xs text-text-secondary">Mar 17 (Missing clock-out)</p>
                            </div>
                            <StatusBadge variant="warning">Action Req</StatusBadge>
                        </div>
                        <p className="text-xs text-text-secondary italic mb-4">"Forgot to clock out yesterday. Left at 5:00 PM."</p>

                        <div className="space-y-3 mb-4 text-sm">
                            <div>
                                <p className="font-medium text-text-primary mb-1">Was Ahmed working?</p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-brand-500 text-white rounded text-xs select-none">● Yes</span>
                                    <span className="px-2 py-1 bg-surface-primary border border-border-secondary rounded text-xs text-text-secondary select-none">○ No</span>
                                </div>
                            </div>
                            <div>
                                <p className="font-medium text-text-primary mb-1">Time left?</p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-brand-500 text-white rounded text-xs select-none">● ~5:00 PM</span>
                                    <span className="px-2 py-1 bg-surface-primary border border-border-secondary rounded text-xs text-text-secondary select-none">○ Earlier</span>
                                </div>
                            </div>
                        </div>

                        <textarea
                            className="w-full bg-surface-primary border border-border-secondary rounded-lg p-2 text-xs text-text-primary resize-none h-16 focus:outline-none focus:border-brand-500"
                            readOnly
                            value="Confirm Ahmed was working on Project Alpha until 5 PM. We had a team standup at 4:30 PM..."
                        />
                    </div>

                    {approvalStatus ? (
                        <div className={`mt-auto py-2 text-center text-sm font-medium rounded-lg ${approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                            {approvalStatus === 'approved' ? 'Approved & Forwarded to HR' : 'Rejected'}
                        </div>
                    ) : (
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <button onClick={() => { setApprovalStatus('approved'); flash('Correction approved and forwarded to HR'); }} className="py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors cursor-pointer">Approve & Fwd</button>
                            <button onClick={() => { setApprovalStatus('rejected'); flash('Correction request rejected'); }} className="py-2 bg-surface-primary border border-border-secondary text-text-primary text-sm font-medium rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer">Reject</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
