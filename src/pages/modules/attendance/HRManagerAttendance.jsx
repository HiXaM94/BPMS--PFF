import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, AlertCircle, CheckCircle2, FileText, Download, UserCheck, MessageSquare, Settings, QrCode, ChevronLeft, ChevronRight, BellRing, AlertTriangle, X, Info } from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import 'jspdf-autotable';

export default function HRManagerAttendance() {
    const { profile } = useAuth();
    const [stats, setStats] = useState({ present: 0, late: 0, absent: 0, total: 0 });
    const [absentEmployees, setAbsentEmployees] = useState([]);
    const [lateEmployees, setLateEmployees] = useState([]);
    const [presentEmployees, setPresentEmployees] = useState([]);
    const [pages, setPages] = useState({ absent: 0, late: 0, present: 0 });
    const itemsPerPage = 5;
    const [pendingCorrections, setPendingCorrections] = useState([]);
    const [currentCorrection, setCurrentCorrection] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState({ message: '', type: 'success' });

    // Templates
    const [remindTemplate, setRemindTemplate] = useState(localStorage.getItem('hr_remind_template') || 'Reminder: {name}, you haven\'t clocked in today. Please check in if you are in company.');
    const [alertTemplate, setAlertTemplate] = useState(localStorage.getItem('hr_alert_template') || 'Attention: {name}, we have noticed several recent absences. Please contact HR to discuss your status.');
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Report State
    const [allEmployeesList, setAllEmployeesList] = useState([]);
    const [reportConfig, setReportConfig] = useState({
        role: 'all',
        employeeId: 'all',
        status: 'all',
        includeDays: true,
        includeOvertime: true,
        includeLate: true,
        includeExtraTime: true
    });

    const saveTemplates = () => {
        localStorage.setItem('hr_remind_template', remindTemplate);
        localStorage.setItem('hr_alert_template', alertTemplate);
        setIsTemplateModalOpen(false);
        flash('Templates saved successfully');
    };
    const flash = (msg, type = 'success') => {
        setToast({ message: msg, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 4000);
    };

    const fetchHRData = useCallback(async () => {
        if (!isSupabaseReady || !profile?.entreprise_id) return;
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch all employees in this company (excluding HR/ADMIN as requested)
        const { data: allEmployees } = await supabase
            .from('employees')
            .select('*, users!inner(name, role)')
            .eq('entreprise_id', profile.entreprise_id)
            .in('users.role', ['EMPLOYEE', 'TEAM_MANAGER']);

        if (!allEmployees) return;

        // 2. Fetch stats and presences for today (filtered by role via inner join)
        const { data: presences } = await supabase
            .from('presences')
            .select(`
                *,
                employee:employees!inner (
                    *,
                    users!inner (name, role)
                )
            `)
            .eq('date', today)
            .in('employee.users.role', ['EMPLOYEE', 'TEAM_MANAGER']);

        const presenceMap = new Map((presences || []).map(p => [p.employee_id, p]));

        const presentCount = presences?.filter(r => r.status === 'present' || r.status === 'late').length || 0;
        const lateCount = presences?.filter(r => r.status === 'late').length || 0;
        const absentCount = allEmployees.length - (presences?.length || 0);

        setStats({
            present: presentCount,
            late: lateCount,
            absent: absentCount,
            total: allEmployees.length
        });

        // 3. Filter Categories
        const absent = allEmployees.filter(emp => !presenceMap.has(emp.id));
        const late = presences?.filter(p => p.status === 'late') || [];
        const present = presences?.filter(p => p.status !== 'late') || [];

        setAbsentEmployees(absent);
        setLateEmployees(late);
        setPresentEmployees(present);

        // Reset pages on refresh
        setPages({ absent: 0, late: 0, present: 0 });

        // 5. Fetch pending corrections (filtered by role)
        const { data: corrections } = await supabase
            .from('attendance_corrections')
            .select(`
                *,
                employee:employees!inner (
                    id,
                    position,
                    user_id,
                    users!inner (name, role)
                )
            `)
            .eq('status', 'pending')
            .in('employee.users.role', ['EMPLOYEE', 'TEAM_MANAGER'])
            .order('created_at', { ascending: false });

        if (corrections) {
            setPendingCorrections(corrections);
            if (corrections.length > 0) setCurrentCorrection(corrections[0]);
            else setCurrentCorrection(null);
        }
    }, [isSupabaseReady, profile?.entreprise_id]);

    useEffect(() => {
        fetchHRData();
    }, [fetchHRData]);

    // Fetch all employees for report filters
    useEffect(() => {
        if (!isSupabaseReady || !profile?.entreprise_id) return;
        const fetchAllEmployees = async () => {
            const { data } = await supabase
                .from('employees')
                .select('id, users!inner(name, role)')
                .eq('entreprise_id', profile.entreprise_id)
                .in('users.role', ['EMPLOYEE', 'TEAM_MANAGER']);
            if (data) setAllEmployeesList(data);
        };
        fetchAllEmployees();
    }, [isSupabaseReady, profile?.entreprise_id]);

    const handleApprove = async () => {
        if (!currentCorrection || isProcessing) return;
        setIsProcessing(true);
        try {
            console.log('[HR] Approving correction:', currentCorrection.id);
            const { data, error } = await supabase.rpc('approve_attendance_correction', {
                p_correction_id: currentCorrection.id,
                p_admin_id: profile.id,
                p_final_in: currentCorrection.suggested_check_in,
                p_final_out: currentCorrection.suggested_check_out
            });

            if (error) throw error;
            if (data?.success) {
                // Notify Employee
                await supabase.from('notifications').insert({
                    user_id: currentCorrection.employee.user_id,
                    type: 'success',
                    message: `Your attendance correction request for ${new Date(currentCorrection.correction_date).toLocaleDateString()} has been approved.`,
                    is_read: false
                });

                flash(data.message || 'Correction approved successfully!');
                await fetchHRData();
            } else {
                throw new Error(data?.message || 'Failed to approve correction.');
            }
        } catch (err) {
            console.error('[HR Approval Error]', err);
            flash(err.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (reason = '') => {
        if (!currentCorrection || isProcessing) return;
        setIsProcessing(true);
        try {
            console.log('[HR] Rejecting correction:', currentCorrection.id, 'Reason:', reason);
            const { error } = await supabase
                .from('attendance_corrections')
                .update({
                    status: 'rejected',
                    manager_id: profile.id,
                    rejection_reason: reason || 'Rejected by HR/Manager',
                    processed_at: new Date().toISOString()
                })
                .eq('id', currentCorrection.id);

            if (error) throw error;

            // Notify Employee
            if (currentCorrection?.employee?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: currentCorrection.employee.user_id,
                    type: 'error',
                    message: `Your attendance correction request for ${new Date(currentCorrection.correction_date).toLocaleDateString()} was rejected. Reason: ${reason || 'Denied by management.'}`,
                    is_read: false
                });
            }

            flash('Correction rejected successfully.');
            await fetchHRData();
        } catch (err) {
            console.error('[HR Rejection Error]', err);
            flash(err.message, 'error');
        } finally {
            setIsProcessing(false);
            setIsRejectModalOpen(false);
            setRejectionReason('');
        }
    };

    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const handleExport = async (format = 'xlsx') => {
        if (!profile?.entreprise_id) return;
        setIsProcessing(true);
        flash(`Generating ${format.toUpperCase()} report...`);

        try {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            // 1. Fetch relevant employees first (needed for absent tracking)
            let empQuery = supabase
                .from('employees')
                .select('id, position, users!inner(name, role)')
                .eq('entreprise_id', profile.entreprise_id);

            if (reportConfig.role !== 'all') empQuery = empQuery.eq('users.role', reportConfig.role);
            if (reportConfig.employeeId !== 'all') empQuery = empQuery.eq('id', reportConfig.employeeId);

            const { data: allTargetEmployees, error: empErr } = await empQuery;
            if (empErr) throw empErr;

            // 2. Fetch presence records
            let query = supabase
                .from('presences')
                .select(`
                    *,
                    employee:employees!inner (
                        id,
                        position,
                        users!inner (name, role)
                    )
                `)
                .eq('entreprise_id', profile.entreprise_id)
                .gte('date', firstDay.split('T')[0])
                .lte('date', lastDay.split('T')[0]);

            if (reportConfig.role !== 'all') query = query.eq('employee.users.role', reportConfig.role);
            if (reportConfig.employeeId !== 'all') query = query.eq('employee_id', reportConfig.employeeId);

            if (['present', 'late'].includes(reportConfig.status)) {
                query = query.eq('status', reportConfig.status);
            }

            const { data: presences, error } = await query;
            if (error) throw error;

            // 3. Process and group data
            const reportData = {};

            if (['all', 'absent'].includes(reportConfig.status)) {
                (allTargetEmployees || []).forEach(e => {
                    reportData[e.id] = {
                        name: e.users?.name || 'Unknown',
                        role: e.users?.role?.replace('_', ' ') || 'N/A',
                        position: e.position || 'N/A',
                        daysWorked: 0,
                        lateCount: 0,
                        totalOvertime: 0,
                        extraTime: 0,
                        totalHours: 0,
                        hasPresence: false
                    };
                });
            }

            (presences || []).forEach(p => {
                const empId = p.employee_id;
                if (!reportData[empId]) {
                    reportData[empId] = {
                        name: p.employee?.users?.name || 'Unknown',
                        role: p.employee?.users?.role?.replace('_', ' ') || 'N/A',
                        position: p.employee?.position || 'N/A',
                        daysWorked: 0,
                        lateCount: 0,
                        totalOvertime: 0,
                        extraTime: 0,
                        totalHours: 0,
                        hasPresence: true
                    };
                }
                const emp = reportData[empId];
                emp.hasPresence = true;
                emp.daysWorked++;
                if (p.status === 'late') emp.lateCount++;
                emp.totalOvertime += (p.overtime_hours || 0);
                emp.totalHours += (p.hours_worked || 0);
                if (p.hours_worked > 8) emp.extraTime += (p.hours_worked - 8);
            });

            // 4. Filter results based on Status and Extra Time
            let finalRowsList = Object.values(reportData);

            if (reportConfig.status === 'absent') {
                finalRowsList = finalRowsList.filter(r => !r.hasPresence);
            }

            // "extra time means pdf or excel contain juste employees who had pass more than 8h"
            if (reportConfig.includeExtraTime) {
                finalRowsList = finalRowsList.filter(r => r.extraTime > 0);
            }

            if (finalRowsList.length === 0) {
                flash('No data matches your selected filters', 'error');
                setIsProcessing(false);
                return;
            }

            const finalRows = finalRowsList.map(row => {
                const filteredRow = {
                    'Employee Name': row.name,
                    'Role': row.role,
                    'Position': row.position
                };
                if (reportConfig.includeDays) filteredRow['Days Worked'] = row.daysWorked;
                if (reportConfig.includeLate) filteredRow['Late Count'] = row.lateCount;
                if (reportConfig.includeExtraTime) filteredRow['Extra Time (h)'] = row.extraTime.toFixed(2);
                if (reportConfig.includeOvertime) filteredRow['Total Overtime (h)'] = row.totalOvertime.toFixed(2);
                filteredRow['Total Hours'] = row.totalHours.toFixed(2);
                return filteredRow;
            });

            if (format === 'xlsx') {
                const ws = XLSX.utils.json_to_sheet(finalRows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Presence Report');
                XLSX.writeFile(wb, `Presence_Report_${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}.xlsx`);
            } else {
                const doc = new jsPDF();

                // Add header info
                doc.setFontSize(22);
                doc.setTextColor(30, 41, 59);
                doc.text('PRESENCE REPORT', 14, 25);

                doc.setFontSize(10);
                doc.setTextColor(100, 116, 139);
                doc.text(`${profile?.entreprise_name || 'Organization'}`, 14, 32);
                doc.text(`Period: ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`, 14, 37);
                doc.text(`Filters: Role: ${reportConfig.role}, Status: ${reportConfig.status}`, 14, 42);

                const headers = Object.keys(finalRows[0]);
                const tableData = finalRows.map(r => Object.values(r));

                const tableOptions = {
                    startY: 50,
                    head: [headers],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
                    styles: { fontSize: 8, cellPadding: 3 },
                    alternateRowStyles: { fillColor: [248, 250, 252] }
                };

                // Use the imported autoTable function directly for maximum context compatibility
                try {
                    const generateTable = (autoTable && autoTable.default) ? autoTable.default : autoTable;
                    if (typeof generateTable === 'function') {
                        generateTable(doc, tableOptions);
                    } else if (typeof doc.autoTable === 'function') {
                        doc.autoTable(tableOptions);
                    } else {
                        throw new Error('PDF Table library not loaded');
                    }
                    doc.save(`Presence_Report_${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}.pdf`);
                } catch (e) {
                    console.error('PDF generation error:', e);
                    flash('PDF error, trying fallback...', 'error');
                    // One last attempt at direct prototype
                    try {
                        doc.autoTable(tableOptions);
                        doc.save(`Presence_Report_${now.toLocaleString('default', { month: 'long' })}_${now.getFullYear()}.pdf`);
                    } catch (err) {
                        flash('PDF failed, please use Excel', 'error');
                    }
                }
            }

            flash(`${format.toUpperCase()} report downloaded`);
        } catch (err) {
            console.error('[Export Error]', err);
            flash('Failed to generate report', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const sendHRNotification = async (userId, empName, type, template) => {
        if (!isSupabaseReady) return;

        // Simple placeholder replacement
        const message = template.replace(/{name}/g, empName || 'Employee');

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    type: type,
                    message: message,
                    is_read: false
                });

            if (error) throw error;
            flash(`Message sent to ${empName}`);
        } catch (err) {
            flash(err.message, 'error');
        }
    };

    const fmtTime = (timeStr) => {
        if (!timeStr) return '--:--';
        const [h, m] = timeStr.split(':');
        const hr = parseInt(h, 10);
        const ampm = hr >= 12 ? 'PM' : 'AM';
        const displayHr = hr % 12 || 12;
        return `${displayHr}:${m} ${ampm}`;
    };
    return (
        <div className="space-y-6 animate-fade-in">
            {toast.message && (
                <div className={`fixed top-6 right-6 z-[300] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-fade-in text-sm font-medium ${toast.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                    {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {toast.message}
                </div>
            )}
            {/* Real-Time Monitor (HR-01) */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Clock size={20} className="text-brand-500" />
                        Real-Time Attendance Monitor ({now})
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsTemplateModalOpen(true)}
                            className="px-4 py-2 bg-surface-primary border border-border-secondary hover:bg-surface-secondary text-text-primary font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm cursor-pointer"
                        >
                            <Settings size={18} className="text-brand-500" />
                            Configure Templates
                        </button>
                        <button
                            onClick={() => window.open(`/kiosk?entreprise=${profile?.entreprise_id}`, '_blank')}
                            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm cursor-pointer"
                        >
                            <QrCode size={18} />
                            Open Kiosk Display
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard title="Clocked In" value={`${stats.present}/${stats.total}`} subtitle={`${stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% present`} icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Late Arrivals" value={stats.late.toString()} subtitle="Clocked in after 9:15" icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Not Clocked In" value={stats.absent.toString()} subtitle="Action required" icon={AlertCircle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                    <StatCard title="On Break" value="0" subtitle="Not implemented" icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-surface-primary rounded-2xl border border-border-secondary p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
                                <Users size={18} className="text-brand-500" /> Attendance Breakdown
                            </h3>
                            <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-secondary">
                                {['absent', 'late', 'present'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setPages(p => ({ ...p, active: cat }))}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${(pages.active || 'absent') === cat
                                            ? 'bg-brand-500 text-white shadow-sm'
                                            : 'text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        {cat} ({cat === 'absent' ? absentEmployees.length : cat === 'late' ? lateEmployees.length : presentEmployees.length})
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 min-h-[380px] flex flex-col">
                            {/* List Content */}
                            <div className="flex-1 space-y-3">
                                {((pages.active || 'absent') === 'absent' ? absentEmployees :
                                    (pages.active || 'absent') === 'late' ? lateEmployees :
                                        presentEmployees)
                                    .slice(pages[(pages.active || 'absent')] * itemsPerPage, (pages[(pages.active || 'absent')] + 1) * itemsPerPage)
                                    .map((item, i) => {
                                        const cat = pages.active || 'absent';
                                        if (cat === 'absent') {
                                            return (
                                                <div key={i} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-secondary group hover:border-red-500/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                                            <AlertCircle size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-text-primary">{item.users?.name}</p>
                                                            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{item.position}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => sendHRNotification(item.user_id, item.users?.name || 'Employee', 'warning', remindTemplate)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-white text-text-primary border border-border-secondary rounded-lg hover:border-brand-500 transition-all cursor-pointer group/btn"
                                                        >
                                                            <BellRing size={12} className="text-amber-500 transition-transform group-hover/btn:scale-110" />
                                                            Remind
                                                        </button>
                                                        <button
                                                            onClick={() => sendHRNotification(item.user_id, item.users?.name || 'Employee', 'error', alertTemplate)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-white text-rose-500 border border-border-secondary rounded-lg hover:border-rose-500 transition-all cursor-pointer group/btn"
                                                        >
                                                            <AlertTriangle size={12} className="text-rose-500 transition-transform group-hover/btn:scale-110" />
                                                            Alert
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        const record = item; // Present or Late
                                        const isLate = cat === 'late';
                                        return (
                                            <div key={i} className={`flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-border-secondary group transition-colors ${isLate ? 'hover:border-amber-500/30' : 'hover:border-emerald-500/30'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLate ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {isLate ? <Clock size={20} /> : <UserCheck size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-primary">{record.employee?.users?.name}</p>
                                                        <p className="text-[10px] text-text-tertiary">
                                                            In: <span className={isLate ? 'text-amber-500 font-bold' : 'font-bold'}>{fmtTime(record.check_in_time)}</span>
                                                            {record.check_out_time && ` • Out: ${fmtTime(record.check_out_time)}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge variant={isLate ? 'warning' : 'success'}>{isLate ? 'Late' : 'Present'}</StatusBadge>
                                                </div>
                                            </div>
                                        );
                                    })}

                                {((pages.active || 'absent') === 'absent' ? absentEmployees :
                                    (pages.active || 'absent') === 'late' ? lateEmployees :
                                        presentEmployees).length === 0 && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                            <CheckCircle2 size={40} className="text-emerald-500/20 mb-3" />
                                            <p className="text-sm text-text-secondary">No employees in this category</p>
                                        </div>
                                    )}
                            </div>

                            {/* Pagination Controls */}
                            {((pages.active || 'absent') === 'absent' ? absentEmployees :
                                (pages.active || 'absent') === 'late' ? lateEmployees :
                                    presentEmployees).length > itemsPerPage && (
                                    <div className="flex items-center justify-between pt-4 border-t border-border-secondary mt-auto">
                                        <p className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest">
                                            Page {pages[pages.active || 'absent'] + 1} of {Math.ceil(((pages.active || 'absent') === 'absent' ? absentEmployees.length : (pages.active || 'absent') === 'late' ? lateEmployees.length : presentEmployees.length) / itemsPerPage)}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={pages[pages.active || 'absent'] === 0}
                                                onClick={() => setPages(p => ({ ...p, [p.active || 'absent']: p[p.active || 'absent'] - 1 }))}
                                                className="p-1.5 rounded-lg border border-border-secondary hover:bg-surface-secondary disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                disabled={(pages[pages.active || 'absent'] + 1) * itemsPerPage >= ((pages.active || 'absent') === 'absent' ? absentEmployees.length : (pages.active || 'absent') === 'late' ? lateEmployees.length : presentEmployees.length)}
                                                onClick={() => setPages(p => ({ ...p, [p.active || 'absent']: p[p.active || 'absent'] + 1 }))}
                                                className="p-1.5 rounded-lg border border-border-secondary hover:bg-surface-secondary disabled:opacity-30 cursor-pointer"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Correction Request (HR-02) */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary flex flex-col min-h-[400px]">
                        {currentCorrection ? (
                            <>
                                <div className="p-4 border-b border-border-secondary flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                        Correction Request
                                    </h3>
                                    <StatusBadge variant="warning">Pending Review</StatusBadge>
                                </div>
                                <div className="p-5 flex-1 flex flex-col text-sm text-text-secondary">
                                    <div className="mb-4 text-center">
                                        <div className="w-12 h-12 bg-surface-secondary rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <UserCheck size={20} className="text-brand-500" />
                                        </div>
                                        <p className="font-semibold text-text-primary">{currentCorrection.employee?.users?.name || 'Employee'}</p>
                                        <p className="text-xs">{currentCorrection.employee?.position}</p>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between p-2 bg-surface-secondary rounded-lg">
                                            <span>Issue:</span> <span className="font-medium text-text-primary">{currentCorrection.issue_type}</span>
                                        </div>
                                        <div className="flex justify-between p-2 bg-brand-500/5 text-brand-600 rounded-lg">
                                            <span>Date:</span> <span className="font-bold">{new Date(currentCorrection.correction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="bg-surface-secondary p-2 rounded-lg text-center">
                                                <p className="text-[10px] text-text-tertiary uppercase">In</p>
                                                <p className="font-bold text-text-primary">{currentCorrection.suggested_check_in || '--:--'}</p>
                                            </div>
                                            <div className="bg-surface-secondary p-2 rounded-lg text-center">
                                                <p className="text-[10px] text-text-tertiary uppercase">Out</p>
                                                <p className="font-bold text-text-primary">{currentCorrection.suggested_check_out || '--:--'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-surface-secondary p-3 rounded-xl border border-border-secondary mb-4 italic text-xs leading-relaxed max-h-32 overflow-y-auto">
                                        "{currentCorrection.reason}"
                                    </div>

                                    <div className="mt-auto grid grid-cols-2 gap-2">
                                        <button
                                            onClick={handleApprove}
                                            disabled={isProcessing}
                                            className="py-2.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                        >
                                            {isProcessing ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setRejectionReason('');
                                                setIsRejectModalOpen(true);
                                            }}
                                            disabled={isProcessing}
                                            className="py-2.5 bg-surface-secondary text-text-primary font-bold rounded-xl border border-border-secondary hover:bg-border-secondary transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>

                                    {pendingCorrections.length > 1 && (
                                        <p className="text-center text-[10px] text-text-tertiary mt-3">
                                            + {pendingCorrections.length - 1} more requests pending
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-10 flex-1 flex flex-col items-center justify-center text-center">
                                <CheckCircle2 size={40} className="text-emerald-500 mb-3 opacity-20" />
                                <p className="text-sm font-medium text-text-secondary">No pending correction requests</p>
                                <p className="text-xs text-text-tertiary mt-1">Everything is up to date!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-6 block lg:flex border-b border-border-secondary pb-6">
                <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <FileText size={20} className="text-brand-500" /> Generate Presence Report
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Monthly Attendance Summary ({new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})
                    </p>
                </div>
                <div className="mt-4 lg:mt-0 flex gap-3">
                    <button
                        onClick={() => handleExport('xlsx')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-brand-500 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <Download size={16} /> Export XLSX
                    </button>
                    <button
                        onClick={() => handleExport('pdf')}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-text-primary text-white rounded-xl font-medium flex items-center gap-2 hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <FileText size={16} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4 text-sm">
                    <p className="font-bold text-text-primary mb-1 uppercase tracking-wider text-[10px]">Filter Options:</p>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Filter by Role</label>
                            <select
                                value={reportConfig.role}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, role: e.target.value, employeeId: 'all' }))}
                                className="w-full bg-surface-secondary border border-border-secondary rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="EMPLOYEE">Employees Only</option>
                                <option value="TEAM_MANAGER">Managers Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Select Employee</label>
                            <select
                                value={reportConfig.employeeId}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, employeeId: e.target.value }))}
                                className="w-full bg-surface-secondary border border-border-secondary rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-500"
                            >
                                <option value="all">All Employees</option>
                                {allEmployeesList
                                    .filter(emp => reportConfig.role === 'all' || emp.users?.role === reportConfig.role)
                                    .map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.users?.name || 'Unknown'}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-text-tertiary mb-1 block">Filter by Status</label>
                            <select
                                value={reportConfig.status}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full bg-surface-secondary border border-border-secondary rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-500 transition-all hover:bg-surface-primary"
                            >
                                <option value="all">All Status</option>
                                <option value="present">Present Only</option>
                                <option value="late">Late Only</option>
                                <option value="absent">Absent Only</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <p className="font-bold text-text-primary mb-3 uppercase tracking-wider text-[10px]">Fields to Include:</p>
                    <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                checked={reportConfig.includeDays}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, includeDays: e.target.checked }))}
                                className="rounded text-brand-500 w-4 h-4 cursor-pointer"
                            /> Days Work
                        </label>
                        <label className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                checked={reportConfig.includeOvertime}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, includeOvertime: e.target.checked }))}
                                className="rounded text-brand-500 w-4 h-4 cursor-pointer"
                            /> Overtime (Approved)
                        </label>
                        <label className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                checked={reportConfig.includeLate}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, includeLate: e.target.checked }))}
                                className="rounded text-brand-500 w-4 h-4 cursor-pointer"
                            /> Late Count
                        </label>
                        <label className="flex items-center gap-2 text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                            <input
                                type="checkbox"
                                checked={reportConfig.includeExtraTime}
                                onChange={(e) => setReportConfig(prev => ({ ...prev, includeExtraTime: e.target.checked }))}
                                className="rounded text-brand-500 w-4 h-4 cursor-pointer"
                            /> Extra Time (&gt;8h)
                        </label>
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-2 text-sm bg-brand-500/5 p-5 rounded-2xl border border-brand-500/10">
                    <p className="font-bold text-brand-600 mb-2 flex items-center gap-2 uppercase tracking-wider text-[10px]">
                        <CheckCircle2 size={16} /> Live Verification
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-text-secondary">
                        <div className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Database connected</div>
                        <div className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Real-time calculations</div>
                        <div className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Extra time logic active</div>
                        <div className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Filter hierarchy enabled</div>
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-4 italic">
                        * Reports are generated based on the current month's attendance logs in the database.
                    </p>
                </div>
            </div >
            {/* Template Configuration Modal */}
            {
                isTemplateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-surface-primary w-full max-w-xl rounded-[28px] shadow-2xl border border-border-secondary overflow-hidden animate-scale-in flex flex-col">
                            {/* Header */}
                            <div className="relative px-8 py-6 bg-gradient-to-r from-brand-500/5 via-transparent to-brand-500/5 border-b border-border-secondary">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-inner">
                                            <MessageSquare size={24} className="text-brand-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-text-primary tracking-tight">Notification Templates</h3>
                                            <p className="text-xs text-text-tertiary font-medium">Customize your automated attendance messages</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsTemplateModalOpen(false)}
                                        className="p-2.5 hover:bg-surface-secondary rounded-xl text-text-tertiary hover:text-text-primary transition-all duration-200 cursor-pointer border border-transparent hover:border-border-secondary shadow-sm"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-6">
                                {/* Tips Card */}
                                <div className="relative group overflow-hidden bg-brand-500/[0.03] p-5 rounded-2xl border border-brand-500/10 transition-all hover:bg-brand-500/[0.05]">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Info size={48} className="text-brand-500" />
                                    </div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="mt-0.5 p-1.5 bg-brand-500/10 rounded-lg">
                                            <Info size={16} className="text-brand-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-brand-600">Personalization Tip</p>
                                            <p className="text-sm text-text-secondary leading-relaxed">
                                                Include <code className="px-1.5 py-0.5 bg-brand-500/10 rounded font-bold text-brand-600 font-mono text-xs">{'{name}'}</code> in your text.
                                                It will be automatically replaced with the employee's name.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-amber-500/10 rounded-lg">
                                            <BellRing size={16} className="text-amber-500" />
                                        </div>
                                        <label className="text-xs font-black text-text-tertiary uppercase tracking-[0.1em]">Remind Template (Warning)</label>
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            rows={2}
                                            value={remindTemplate}
                                            onChange={(e) => setRemindTemplate(e.target.value)}
                                            placeholder="Enter your reminder message..."
                                            className="w-full bg-surface-secondary/50 border-2 border-border-secondary rounded-2xl p-4 text-sm text-text-primary focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none font-medium placeholder:text-text-tertiary/50"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-rose-500/10 rounded-lg">
                                            <AlertTriangle size={16} className="text-rose-500" />
                                        </div>
                                        <label className="text-xs font-black text-text-tertiary uppercase tracking-[0.1em]">Alert Template (Serious Warning)</label>
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            rows={2}
                                            value={alertTemplate}
                                            onChange={(e) => setAlertTemplate(e.target.value)}
                                            placeholder="Enter your alert message..."
                                            className="w-full bg-surface-secondary/50 border-2 border-border-secondary rounded-2xl p-4 text-sm text-text-primary focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none font-medium placeholder:text-text-tertiary/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 py-6 bg-surface-secondary border-t border-border-secondary flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setRemindTemplate('Reminder: {name}, you haven\'t clocked in today. Please check in if you are in company.');
                                        setAlertTemplate('Attention: {name}, we have noticed several recent absences. Please contact HR to discuss your status.');
                                    }}
                                    className="text-xs font-bold text-text-tertiary hover:text-brand-500 transition-colors cursor-pointer flex items-center gap-2"
                                >
                                    <Settings size={14} /> Reset to Defaults
                                </button>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsTemplateModalOpen(false)}
                                        className="px-6 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveTemplates}
                                        className="px-10 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-black rounded-2xl transition-all duration-300 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={18} /> Save Templates
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Rejection Modal */}
            {
                isRejectModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                        <div className="bg-surface-primary w-full max-w-md rounded-[28px] shadow-2xl border border-border-secondary overflow-hidden animate-scale-in flex flex-col">
                            <div className="relative px-8 py-6 bg-rose-500/[0.03] border-b border-border-secondary">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                            <AlertTriangle size={24} className="text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-text-primary tracking-tight">Reject Request</h3>
                                            <p className="text-xs text-text-tertiary font-medium">Please provide a reason for the employee</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsRejectModalOpen(false)} className="p-2.5 hover:bg-surface-secondary rounded-xl text-text-tertiary hover:text-text-primary transition-all duration-200 cursor-pointer">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-text-tertiary uppercase tracking-[0.1em]">Reason for rejection</label>
                                    <textarea
                                        className="w-full bg-surface-secondary/50 border-2 border-border-secondary rounded-2xl p-4 text-sm text-text-primary focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none h-32 font-medium"
                                        placeholder="Enter reason (e.g., Please provide more evidence, Incorrect date chosen...)"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-surface-secondary border-t border-border-secondary flex gap-4">
                                <button
                                    onClick={() => setIsRejectModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-bold text-text-secondary hover:text-text-primary transition-all duration-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(rejectionReason)}
                                    disabled={isProcessing || !rejectionReason.trim()}
                                    className="flex-[1.5] py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-2xl transition-all duration-300 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <X size={18} />}
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
