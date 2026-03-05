import { useState, useEffect } from 'react';
import {
    Lock, ArrowUpCircle, BellRing, UserCheck,
    CheckCircle2, Users, Receipt, Loader2, Download
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { fmt, periodLabel, fetchTeamPayrolls, generatePayslipPDF, fetchEmployeePayrolls } from './payrollUtils';

export default function ManagerPayroll() {
    const { profile } = useAuth();
    const [teamPayrolls, setTeamPayrolls] = useState([]);
    const [myPayroll, setMyPayroll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recSubmitted, setRecSubmitted] = useState(false);
    const [advanceStatus, setAdvanceStatus] = useState(null);
    const [toast, setToast] = useState('');
    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch team payrolls
                const teamData = await fetchTeamPayrolls(profile?.id, '2026-03-01', '2026-03-31');
                setTeamPayrolls(teamData);

                // Fetch manager's own payroll
                const myData = await fetchEmployeePayrolls(profile?.id, 1);
                if (myData.length > 0) setMyPayroll(myData[0]);
            } catch (err) {
                console.error('Error loading manager payroll data:', err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [profile?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-text-tertiary" />
            </div>
        );
    }

    const processedCount = teamPayrolls.length;
    const period = teamPayrolls.length > 0 ? periodLabel(teamPayrolls[0].period_start) : 'March 2026';

    return (
        <div className="space-y-6 animate-fade-in">

            {toast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            {/* High Level Stats (Amount Blind) */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    Team Payroll Management ({period})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Team Members" value={processedCount} subtitle="Payrolls processed" icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Period" value={period} subtitle="Current cycle" icon={Receipt} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Status" value="Processed" subtitle="All payslips generated" icon={CheckCircle2} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                </div>
            </div>

            {/* Notification Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4">
                <BellRing size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">{period} Payroll Processed</h3>
                    <p className="text-sm text-emerald-600/80 dark:text-emerald-400/70">
                        All {processedCount} payslips for your team have been generated and sent. Team members will receive payment on the last day of the month.
                        If any team member has questions about their payslip, please direct them to HR.
                    </p>
                </div>
            </div>

            {/* My Payslip Quick Download */}
            {myPayroll && (
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-text-primary flex items-center gap-2 mb-1">
                                <Receipt size={18} className="text-brand-500" /> My Payslip — {period}
                            </h3>
                            <p className="text-sm text-text-secondary">
                                Net Salary: <span className="font-bold text-text-primary">{fmt(myPayroll.net_salary)}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => { generatePayslipPDF(myPayroll, profile?.name || 'Manager'); flash('Payslip downloaded!'); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors shadow-sm cursor-pointer text-sm"
                        >
                            <Download size={16} /> Download My Payslip
                        </button>
                    </div>
                </div>
            )}

            {/* Team Payroll Status Table (Amount-Blind!) */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-primary">Team Payroll Status</h3>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary bg-surface-secondary px-2.5 py-1 rounded-md border border-border-secondary">
                        <Lock size={12} /> Financial Data Hidden
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-secondary text-text-secondary">
                            <tr>
                                <th className="px-5 py-3 font-medium">Team Member</th>
                                <th className="px-5 py-3 font-medium">Position</th>
                                <th className="px-5 py-3 font-medium text-center">Payslip Generated</th>
                                <th className="px-5 py-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-text-primary divide-y divide-border-secondary">
                            {teamPayrolls.length > 0 ? teamPayrolls.map((row) => {
                                const empName = row.employees?.users?.name || 'Employee';
                                const position = row.employees?.position || '-';
                                const status = row.status || 'generated';
                                return (
                                    <tr key={row.id} className="hover:bg-surface-secondary/50 transition-colors">
                                        <td className="px-5 py-3 font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xs shrink-0">
                                                    {empName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                                </div>
                                                <span>{empName}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-text-secondary">{position}</td>
                                        <td className="px-5 py-3 text-center">
                                            <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-text-tertiary">No team payroll data found for this period</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Salary Increase Recommendation */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="bg-brand-500/5 p-4 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <ArrowUpCircle size={18} className="text-brand-500" /> Salary Increase Recommendation
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-text-tertiary bg-surface-secondary px-2 py-1 rounded-md">
                            <Lock size={12} /> Financial Data Hidden
                        </span>
                    </div>

                    <div className="p-5 text-sm space-y-4">
                        {teamPayrolls.length > 0 && (
                            <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary">
                                <p className="font-bold text-text-primary mb-1">Employee: {teamPayrolls[0]?.employees?.users?.name || 'Team Member'}</p>
                                <p className="text-text-secondary text-xs">Position: {teamPayrolls[0]?.employees?.position || 'N/A'}</p>
                            </div>
                        )}

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Recommendation Type:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" defaultChecked className="text-brand-500" /> Promotion</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" className="text-brand-500" /> Performance-Based Increase</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" className="text-brand-500" /> Market Adjustment</label>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Justification (Required):</p>
                            <textarea
                                className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary text-xs resize-none h-24 focus:outline-none focus:border-brand-500"
                                placeholder="List performance highlights, skills developed, and business impact..."
                            />
                        </div>

                        <div className="pt-2 text-xs text-text-tertiary flex items-start gap-2">
                            <Lock size={14} className="shrink-0 mt-0.5" />
                            <p>You are recommending the promotion level. HR and Company Admin will determine the exact financial amount.</p>
                        </div>

                        <button
                            onClick={() => { setRecSubmitted(true); flash('Salary increase recommendation submitted to HR'); }}
                            disabled={recSubmitted}
                            className={`w-full py-2 rounded-xl font-bold transition-colors cursor-pointer ${recSubmitted ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'} disabled:cursor-not-allowed`}>
                            {recSubmitted ? 'Recommendation Submitted' : 'Submit Recommendation'}
                        </button>
                    </div>
                </div>

                {/* Advance Request Approval */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary flex flex-col">
                    <div className="bg-amber-500/5 p-4 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                            <Receipt size={18} className="text-amber-500" /> Salary Advance Approval
                        </h3>
                        <span className="flex items-center gap-1 text-xs font-semibold text-text-tertiary bg-surface-secondary px-2 py-1 rounded-md">
                            <Lock size={12} /> Amount Hidden
                        </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col text-sm text-text-secondary">
                        {teamPayrolls.length > 1 && (
                            <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-bold text-text-primary">{teamPayrolls[1]?.employees?.users?.name || 'Team Member'}</p>
                                        <p className="text-xs mt-0.5">Advance request pending review</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-text-primary text-xs mt-2">Employee's Reason:</p>
                                <p className="italic bg-surface-primary border border-border-secondary p-2 rounded-lg mt-1 text-xs">
                                    "Personal emergency — requesting advance on next month's salary"
                                </p>
                            </div>
                        )}

                        <div className="mt-auto space-y-3">
                            <div className="bg-surface-secondary p-3 rounded-lg border border-border-secondary flex gap-2 items-start opacity-75">
                                <Lock size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                                <p className="text-[11px] leading-tight text-text-secondary">
                                    Approval based on situation and reliability. The specific amount asked will be routed securely to HR.
                                </p>
                            </div>
                            {advanceStatus ? (
                                <div className={`py-2 text-center text-sm font-medium rounded-xl ${advanceStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                    {advanceStatus === 'approved' ? 'Approved & Forwarded to HR' : 'Advance Request Rejected'}
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => { setAdvanceStatus('approved'); flash('Salary advance approved and forwarded to HR'); }} className="flex-1 py-2 bg-text-primary text-surface-primary rounded-xl font-bold hover:bg-black/90 dark:hover:bg-white/90 transition-colors cursor-pointer">
                                        Approve (Fwd to HR)
                                    </button>
                                    <button onClick={() => { setAdvanceStatus('rejected'); flash('Salary advance request rejected'); }} className="py-2 px-6 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors cursor-pointer">
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
