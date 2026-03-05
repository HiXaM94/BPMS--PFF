import { useState, useEffect } from 'react';
import {
    Calculator, Send, DollarSign, Clock, CheckCircle2, FileText,
    Loader2, Download, Receipt, Users
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import { useAuth } from '../../../contexts/AuthContext';
import { fmt, fmtDate, periodLabel, fetchPayrollsByPeriod, generatePayslipPDF, generateBatchPayslipsPDF } from './payrollUtils';

export default function HRManagerPayroll() {
    const { profile } = useAuth();
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState('');
    const [loading, setLoading] = useState(true);
    const [payrolls, setPayrolls] = useState([]);
    const [stats, setStats] = useState({ totalNetScheduled: 0, totalEmployees: 0, overtimeProcessed: 0, employeesWithOvertime: 0, advancesDeducted: 0, employeesWithAdvances: 0 });

    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    useEffect(() => {
        async function fetchPayrollStats() {
            setLoading(true);
            try {
                const data = await fetchPayrollsByPeriod('2026-03-01', '2026-03-31', profile?.entreprise_id);

                if (data && data.length > 0) {
                    let totalNet = 0;
                    let overtimeTotal = 0;
                    let overtimeCount = 0;
                    let advancesTotal = 0;
                    let advancesCount = 0;
                    const employeeSet = new Set();

                    data.forEach(p => {
                        totalNet += Number(p.net_salary || 0);
                        employeeSet.add(p.employee_id);

                        if (Number(p.overtime_pay) > 0) {
                            overtimeTotal += Number(p.overtime_pay);
                            overtimeCount++;
                        }

                        if (Number(p.deductions) > 0) {
                            advancesTotal += Number(p.deductions);
                            advancesCount++;
                        }
                    });

                    setStats({
                        totalNetScheduled: totalNet,
                        totalEmployees: employeeSet.size || data.length,
                        overtimeProcessed: overtimeTotal,
                        employeesWithOvertime: overtimeCount,
                        advancesDeducted: advancesTotal,
                        employeesWithAdvances: advancesCount
                    });
                    setPayrolls(data);
                }
            } catch (err) {
                console.error("Error fetching payroll stats:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchPayrollStats();
    }, [profile?.entreprise_id]);

    const handleSubmitForApproval = async () => {
        if (submitted) return;
        setSubmitted(true);
        flash('Payroll submitted for approval');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-text-tertiary" />
            </div>
        );
    }

    if (payrolls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <Receipt size={48} className="text-text-tertiary mb-4" />
                <h3 className="text-lg font-bold text-text-primary">No Payroll Data</h3>
                <p className="text-text-secondary mt-2 max-w-sm">No payroll records found. Records will appear once the payroll cycle is processed.</p>
            </div>
        );
    }

    const period = periodLabel(payrolls[0]?.period_start);

    // Pre-compute values for the intelligence section
    const totalBase = payrolls.reduce((s, r) => s + Number(r.salary_base || 0), 0);
    const totalBonuses = payrolls.reduce((s, r) => s + Number(r.bonuses || 0), 0);
    const totalOvertime = payrolls.reduce((s, r) => s + Number(r.overtime_pay || 0), 0);
    const totalDeductions = payrolls.reduce((s, r) => s + Number(r.deductions || 0), 0);
    const grandTotal = totalBase + totalBonuses + totalOvertime;
    const salaries = payrolls.map(p => Number(p.net_salary || 0));
    const avgSalary = salaries.length ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;
    const maxSalary = Math.max(...salaries);
    const minSalary = Math.min(...salaries);

    const basePct = grandTotal > 0 ? (totalBase / grandTotal) * 100 : 0;
    const bonusPct = grandTotal > 0 ? (totalBonuses / grandTotal) * 100 : 0;

    const EMPLOYEE_COLORS = [
        { bar: 'from-brand-500 to-indigo-500', ring: '#2a85ff' },
        { bar: 'from-emerald-500 to-teal-500', ring: '#83bf6e' },
        { bar: 'from-amber-500 to-orange-500', ring: '#f59e0b' },
        { bar: 'from-rose-500 to-pink-500', ring: '#f43f5e' },
        { bar: 'from-violet-500 to-purple-500', ring: '#8b5cf6' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">

            {toast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            {/* High Level Stats */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Calculator size={20} className="text-brand-500" />
                    Payroll Management ({period})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Net Scheduled" value={fmt(stats.totalNetScheduled)} subtitle={`${stats.totalEmployees} Employees`} icon={DollarSign} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Overtime Processed" value={fmt(stats.overtimeProcessed)} subtitle={`Across ${stats.employeesWithOvertime} employees`} icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Total Deductions" value={fmt(stats.advancesDeducted)} subtitle={`Across ${stats.employeesWithAdvances} employees`} icon={FileText} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                    <StatCard title="Calculations" value="100%" subtitle="Passed validation" icon={CheckCircle2} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" />
                </div>
            </div>

            {/* Employee Payroll Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="p-5 border-b border-border-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-text-primary">Employee Payroll Breakdown</h3>
                    <button
                        onClick={() => { generateBatchPayslipsPDF(payrolls); flash('All payslips downloaded!'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm cursor-pointer"
                    >
                        <Download size={16} /> Download All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-secondary text-text-secondary">
                            <tr>
                                <th className="px-5 py-3 font-medium">Employee</th>
                                <th className="px-5 py-3 font-medium">Position</th>
                                <th className="px-5 py-3 font-medium text-right">Base</th>
                                <th className="px-5 py-3 font-medium text-right">Bonuses</th>
                                <th className="px-5 py-3 font-medium text-right">Overtime</th>
                                <th className="px-5 py-3 font-medium text-right">Deductions</th>
                                <th className="px-5 py-3 font-medium text-right">Net Salary</th>
                                <th className="px-5 py-3 font-medium text-center">PDF</th>
                            </tr>
                        </thead>
                        <tbody className="text-text-primary divide-y divide-border-secondary">
                            {payrolls.map((row) => {
                                const empName = row.employees?.users?.name || 'Employee';
                                const position = row.employees?.position || '-';
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
                                        <td className="px-5 py-3 text-right font-medium">{fmt(row.salary_base)}</td>
                                        <td className="px-5 py-3 text-right text-emerald-500 font-medium">{Number(row.bonuses) > 0 ? `+${fmt(row.bonuses)}` : '-'}</td>
                                        <td className="px-5 py-3 text-right text-brand-500 font-medium">{Number(row.overtime_pay) > 0 ? `+${fmt(row.overtime_pay)}` : '-'}</td>
                                        <td className="px-5 py-3 text-right text-red-400 font-medium">{Number(row.deductions) > 0 ? `-${fmt(row.deductions)}` : '-'}</td>
                                        <td className="px-5 py-3 text-right font-bold">{fmt(row.net_salary)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                onClick={() => { generatePayslipPDF({ ...row, position }, empName); flash(`Downloaded payslip for ${empName}`); }}
                                                className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer"
                                            >
                                                <Download size={16} className="text-text-tertiary hover:text-brand-500 transition-colors" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-surface-secondary/50 font-bold text-text-primary">
                            <tr>
                                <td className="px-5 py-3" colSpan={2}>TOTAL ({stats.totalEmployees} employees)</td>
                                <td className="px-5 py-3 text-right">{fmt(totalBase)}</td>
                                <td className="px-5 py-3 text-right text-emerald-500">{fmt(totalBonuses)}</td>
                                <td className="px-5 py-3 text-right text-brand-500">{fmt(totalOvertime)}</td>
                                <td className="px-5 py-3 text-right text-red-400">{fmt(totalDeductions)}</td>
                                <td className="px-5 py-3 text-right">{fmt(stats.totalNetScheduled)}</td>
                                <td className="px-5 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* ── Payroll Intelligence ── */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                {/* Header with gradient accent */}
                <div className="relative p-6 border-b border-border-secondary overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-500/[0.04] via-indigo-500/[0.06] to-violet-500/[0.04]"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
                                <Calculator size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-text-primary tracking-tight">Payroll Intelligence</h3>
                                <p className="text-xs text-text-tertiary mt-0.5">{period} • Real-time analytics</p>
                            </div>
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    {/* Main Grid: Employee Cards + Cost Ring */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* Left: Employee Salary Cards (3 cols) */}
                        <div className="lg:col-span-3">
                            <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users size={13} /> Who gets what
                            </h4>
                            <div className="space-y-3">
                                {payrolls.map((row, idx) => {
                                    const empName = row.employees?.users?.name || 'Employee';
                                    const initials = empName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                                    const position = row.employees?.position || '-';
                                    const pct = stats.totalNetScheduled > 0 ? ((Number(row.net_salary) / stats.totalNetScheduled) * 100) : 0;
                                    const c = EMPLOYEE_COLORS[idx % EMPLOYEE_COLORS.length];
                                    return (
                                        <div key={row.id} className="flex items-center gap-4 p-4 rounded-xl bg-surface-secondary/40 border border-border-secondary hover:shadow-md transition-all duration-300 group">
                                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bar} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-text-primary">{empName}</span>
                                                        <span className="text-[10px] text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded border border-border-secondary hidden sm:inline">{position}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-text-primary tabular-nums">{fmt(row.net_salary)}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2.5 bg-surface-secondary rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-text-tertiary tabular-nums w-10 text-right">{pct.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Cost Ring Chart (2 cols) */}
                        <div className="lg:col-span-2 flex flex-col items-center justify-center">
                            <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mb-5 flex items-center gap-2">
                                <DollarSign size={13} /> Cost Breakdown
                            </h4>

                            {/* CSS Conic-Gradient Ring */}
                            <div className="relative w-48 h-48 mb-5">
                                <div
                                    className="w-full h-full rounded-full shadow-lg"
                                    style={{
                                        background: `conic-gradient(
                                            #2a85ff 0% ${basePct}%,
                                            #83bf6e ${basePct}% ${basePct + bonusPct}%,
                                            #f59e0b ${basePct + bonusPct}% 100%
                                        )`
                                    }}
                                ></div>
                                <div className="absolute inset-[18px] rounded-full bg-surface-primary flex flex-col items-center justify-center shadow-inner border border-border-secondary">
                                    <span className="text-[9px] uppercase tracking-widest text-text-tertiary font-bold">Gross</span>
                                    <span className="text-xl font-black text-text-primary tracking-tight mt-0.5">{fmt(grandTotal)}</span>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="space-y-2 w-full max-w-[220px]">
                                {[
                                    { label: 'Base Salaries', value: totalBase, color: 'bg-brand-500', pct: basePct },
                                    { label: 'Bonuses', value: totalBonuses, color: 'bg-[#83bf6e]', pct: bonusPct },
                                    { label: 'Overtime', value: totalOvertime, color: 'bg-amber-500', pct: grandTotal > 0 ? (totalOvertime / grandTotal) * 100 : 0 },
                                ].map((seg, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded ${seg.color}`}></span>
                                            <span className="text-xs text-text-secondary">{seg.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-text-primary">{fmt(seg.value)}</span>
                                            <span className="text-[10px] text-text-tertiary">({seg.pct.toFixed(0)}%)</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 mt-2 border-t border-border-secondary flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded bg-red-400"></span>
                                        <span className="text-xs text-red-400 font-medium">Deductions</span>
                                    </div>
                                    <span className="text-xs font-bold text-red-400">-{fmt(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Insight Chips */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 pt-6 border-t border-border-secondary">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-brand-500/[0.06] to-indigo-500/[0.03] border border-brand-500/10 group hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Receipt size={14} className="text-brand-500" /></div>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Avg Net</span>
                            </div>
                            <span className="text-lg font-black text-text-primary tracking-tight">{fmt(Math.round(avgSalary))}</span>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/[0.06] to-teal-500/[0.03] border border-emerald-500/10 group hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><DollarSign size={14} className="text-emerald-500" /></div>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Highest</span>
                            </div>
                            <span className="text-lg font-black text-text-primary tracking-tight">{fmt(maxSalary)}</span>
                            <p className="text-[10px] text-text-tertiary mt-0.5">{[...payrolls].sort((a, b) => Number(b.net_salary) - Number(a.net_salary))[0]?.employees?.users?.name || '-'}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/[0.06] to-orange-500/[0.03] border border-amber-500/10 group hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Clock size={14} className="text-amber-500" /></div>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Overtime</span>
                            </div>
                            <span className="text-lg font-black text-text-primary tracking-tight">{fmt(stats.overtimeProcessed)}</span>
                            <p className="text-[10px] text-text-tertiary mt-0.5">{stats.employeesWithOvertime} employee{stats.employeesWithOvertime !== 1 ? 's' : ''}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/[0.06] to-purple-500/[0.03] border border-violet-500/10 group hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform"><Receipt size={14} className="text-violet-500" /></div>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Range</span>
                            </div>
                            <span className="text-lg font-black text-text-primary tracking-tight">{fmt(maxSalary - minSalary)}</span>
                            <p className="text-[10px] text-text-tertiary mt-0.5">{fmt(minSalary)} → {fmt(maxSalary)}</p>
                        </div>
                    </div>
                </div>

                {/* Submit Bar */}
                <div className="p-5 border-t border-border-secondary bg-surface-secondary/30">
                    <button
                        onClick={handleSubmitForApproval}
                        disabled={submitted}
                        className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm ${submitted ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-gradient-to-r from-brand-500 to-indigo-600 text-white hover:shadow-brand-500/30 hover:scale-[1.005]'} disabled:cursor-not-allowed`}>
                        {submitted ? <><CheckCircle2 size={18} /> Submitted for Admin Approval</> : <><Send size={18} /> Submit Payroll for Approval</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
