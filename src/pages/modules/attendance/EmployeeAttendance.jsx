import { useState, useEffect, useCallback } from 'react';
import {
    Clock, Download, CheckCircle2, Loader2, History, X, AlertCircle, ScanLine, LogIn, Maximize2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import { exportAttendancePDF } from '../../../utils/pdfExport';
import QRClockIn from './QRClockIn';

function fmtTime(t) {
    if (!t) return '-';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function EmployeeAttendance() {
    const { profile } = useAuth();
    const [today, setToday] = useState(null);
    const [monthlyHours, setMonthlyHours] = useState(0);
    const [overtime, setOvertime] = useState(0);
    const [history, setHistory] = useState([]);
    const [toast, setToast] = useState({ message: '', type: 'success' });
    const [correctionForm, setCorrectionForm] = useState({ date: '', type: 'Missing Clock-Out', reason: '', in_time: '', out_time: '' });
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const flash = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
    };

    // Generate list of last 7 days for correction
    const availableDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (i + 1));
        return {
            value: d.toISOString().split('T')[0],
            display: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
    });

    useEffect(() => {
        if (availableDates[0]) setCorrectionForm(prev => ({ ...prev, date: availableDates[0].value }));
    }, []);

    const fetchAttendance = async () => {
        if (!isSupabaseReady || !profile?.id) return;
        const date = new Date().toISOString().split('T')[0];
        const monthStart = date.slice(0, 7) + '-01';

        // Fetch today's presence directly
        const { data: todayData } = await supabase.from('presences')
            .select('*, employees!inner(user_id)')
            .eq('employees.user_id', profile.id)
            .eq('date', date)
            .maybeSingle();

        if (todayData) setToday(todayData);

        // Fetch monthly history directly
        const { data: historyData } = await supabase.from('presences')
            .select('*, employees!inner(user_id)')
            .eq('employees.user_id', profile.id)
            .gte('date', monthStart)
            .order('date', { ascending: false });

        if (historyData && historyData.length > 0) {
            const hrs = historyData.reduce((s, r) => s + (r.hours_worked || 0), 0);
            const ot = historyData.reduce((s, r) => s + (r.overtime_hours || 0), 0);
            setMonthlyHours(Math.round(hrs * 10) / 10);
            setOvertime(Math.round(ot * 10) / 10);
            setHistory(historyData);
        }

        // Fetch employee record first to get employee_id
        const { data: empRecord } = await supabase
            .from('employees')
            .select('id')
            .eq('user_id', profile.id)
            .single();

        if (!empRecord) return;

        // Fetch last pending correction for THIS employee
        const { data: corrData } = await supabase.from('attendance_corrections')
            .select('*')
            .eq('employee_id', empRecord.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (corrData) setPendingRequest(corrData);
    };

    useEffect(() => {
        fetchAttendance();
    }, [profile?.id]);

    const firstName = profile?.name?.split(' ')[0] || 'there';
    const isClockedIn = today?.check_in_time && !today?.check_out_time;
    const isOnTime = today?.status === 'present';

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

            {/* Employee Greeting */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Hello, {firstName}! 👋</h2>
                    <p className="text-sm text-text-secondary mt-1">{profile?.position || 'Employee'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* EMP-01: Clock In Block */}
                <div className="lg:col-span-1 space-y-6">
                    <QRClockIn
                        isClockedIn={isClockedIn}
                        isOnTime={isOnTime}
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
                                    // Refresh all state immediately
                                    await fetchAttendance();
                                } else {
                                    flash(data?.message || 'Failed to scan QR Code.', 'error');
                                }
                            } catch (err) {
                                console.error('[QR Scan Error]', err);
                                flash(`A system error occurred while clocking in: ${err.message || 'Unknown error'}`, 'error');
                            }
                        }}
                        onStartLunch={() => {
                            console.log('Lunch break started');
                        }}
                    />

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-primary border border-border-secondary p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <Clock size={24} className="text-text-tertiary mb-2" />
                            <span className="text-2xl font-bold text-text-primary">{monthlyHours}h</span>
                            <span className="text-xs font-medium text-text-secondary mt-1">Worked This Month</span>
                        </div>
                        <div className="bg-surface-primary border border-border-secondary p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                            <History size={24} className="text-text-tertiary mb-2" />
                            <span className="text-2xl font-bold text-text-primary">{overtime}h</span>
                            <span className="text-xs font-medium text-text-secondary mt-1">Overtime This Month</span>
                        </div>
                    </div>
                </div>

                {/* EMP-02: Personal History Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                            <h3 className="text-base font-semibold text-text-primary">
                                My History ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                            </h3>
                            <button
                                onClick={() => exportAttendancePDF({
                                    userName: profile?.name || 'Employee',
                                    title: 'Attendance History',
                                    period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                                    data: history
                                })}
                                className="text-xs flex items-center gap-1.5 text-text-primary dark:text-white font-medium bg-surface-secondary dark:bg-white/10 hover:bg-surface-tertiary dark:hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 border border-border-primary dark:border-white/5"
                            >
                                <Download size={14} /> Download PDF
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-surface-secondary text-text-secondary">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Date</th>
                                        <th className="px-5 py-3 font-medium">Clock In</th>
                                        <th className="px-5 py-3 font-medium">Clock Out</th>
                                        <th className="px-5 py-3 font-medium">Hours</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary divide-y divide-border-secondary">
                                    {history.map((record, index) => {
                                        const dateObj = new Date(record.date);
                                        const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                                        // Status colors based on real data
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
                                            <tr key={index} className="hover:bg-surface-secondary/50">
                                                <td className="px-5 py-3/5 my-1.5 font-medium">{displayDate}</td>
                                                <td className="px-5 py-3/5 my-1.5 text-text-secondary">{fmtTime(record.check_in_time)}</td>
                                                <td className="px-5 py-3/5 my-1.5 text-text-secondary">{fmtTime(record.check_out_time)}</td>
                                                <td className="px-5 py-3/5 my-1.5 font-medium">
                                                    {record.hours_worked ? `${Math.round(record.hours_worked * 10) / 10}h` : '—'}
                                                </td>
                                                <td className="px-5 py-3/5 my-1.5">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-md bg-${statusColor}-500/10 text-${statusColor}-500 inline-block`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-5 py-8 text-center text-text-secondary">
                                                No attendance records found for this month.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Handle Correction Request */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <AlertCircle size={18} className={`text-${pendingRequest ? 'emerald' : 'amber'}-500`} />
                            {pendingRequest ? 'Correction Request Sent' : 'Request Attendance Correction'}
                        </h3>

                        <div className={`bg-surface-secondary rounded-xl p-4 border border-border-secondary ${isSubmitting ? 'animate-pulse pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm font-medium">
                                <div>
                                    <label className="text-xs text-text-tertiary block mb-1">Date</label>
                                    <select
                                        className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500"
                                        value={pendingRequest?.correction_date || correctionForm.date}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                                        disabled={!!pendingRequest}
                                    >
                                        {availableDates.map(d => <option key={d.value} value={d.value}>{d.display}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-text-tertiary block mb-1">Issue</label>
                                    <select
                                        className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500"
                                        value={pendingRequest?.issue_type || correctionForm.type}
                                        onChange={(e) => setCorrectionForm({ ...correctionForm, type: e.target.value })}
                                        disabled={!!pendingRequest}
                                    >
                                        <option>Missing Clock-Out</option>
                                        <option>Missing Clock-In</option>
                                        <option>Wrong Time Record</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary block mb-1">Time In (Suggested)</label>
                                <input
                                    type="time"
                                    className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500"
                                    value={pendingRequest?.suggested_check_in || correctionForm.in_time}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, in_time: e.target.value })}
                                    disabled={!!pendingRequest}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-text-tertiary block mb-1">Time Out (Suggested)</label>
                                <input
                                    type="time"
                                    className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-500"
                                    value={pendingRequest?.suggested_check_out || correctionForm.out_time}
                                    onChange={(e) => setCorrectionForm({ ...correctionForm, out_time: e.target.value })}
                                    disabled={!!pendingRequest}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-text-tertiary block mb-1">Reason for request</label>
                            <textarea
                                className="w-full bg-surface-primary border border-border-secondary rounded-lg px-3 py-2 text-text-primary text-sm h-20 resize-none focus:outline-none focus:border-brand-500"
                                placeholder="I forgot to clock out when leaving yesterday..."
                                value={pendingRequest?.reason || correctionForm.reason}
                                onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                                readOnly={!!pendingRequest}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${!!pendingRequest
                                    ? 'bg-emerald-500/10 text-emerald-600 cursor-default border border-emerald-500/20'
                                    : 'bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-500/10 active:scale-95'
                                    }`}
                                disabled={!!pendingRequest || isSubmitting || !correctionForm.reason}
                                onClick={async () => {
                                    setIsSubmitting(true);
                                    console.log('[CorrectionRequest] Starting submission...', correctionForm);
                                    try {
                                        const { data: emp, error: empError } = await supabase.from('employees')
                                            .select('id')
                                            .eq('user_id', profile.id)
                                            .single();

                                        if (empError) throw empError;
                                        if (!emp) throw new Error('Employee profile not found.');

                                        console.log('[CorrectionRequest] Employee found:', emp.id);

                                        const { error } = await supabase.from('attendance_corrections').insert([{
                                            employee_id: emp.id,
                                            entreprise_id: profile.entreprise_id,
                                            correction_date: correctionForm.date,
                                            issue_type: correctionForm.type,
                                            reason: correctionForm.reason,
                                            suggested_check_in: correctionForm.in_time || null,
                                            suggested_check_out: correctionForm.out_time || null
                                        }]);

                                        if (error) throw error;

                                        console.log('[CorrectionRequest] Success!');
                                        flash('Your request has been submitted to your manager.');
                                        // Refresh all state from database immediately
                                        await fetchAttendance();
                                    } catch (err) {
                                        console.error('[CorrectionRequest] Submission failed:', err);
                                        flash(err.message || 'Submission failed.', 'error');
                                    } finally {
                                        setIsSubmitting(false);
                                    }
                                }}
                            >
                                {pendingRequest ? 'Request Sent' : (isSubmitting ? 'Sending...' : 'Submit Request')}
                            </button>
                            {pendingRequest && (
                                <div className="flex-1 py-2 text-center text-xs text-amber-500 font-medium flex items-center justify-center gap-1.5">
                                    <Clock size={14} /> Pending Review (Manager)
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
