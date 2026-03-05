import { useState, useEffect } from 'react';
import {
    Building2, Users, DollarSign, Download, CheckCircle2,
    AlertTriangle, Eye, FileText, Lock, Loader2, Receipt
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { fmt, fmtDate, periodLabel, fetchPayrollsByPeriod, generatePayslipPDF, generateBatchPayslipsPDF } from './payrollUtils';

export default function CompanyAdminPayroll() {
    const { profile } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [stats, setStats] = useState({ totalCost: 0, totalNet: 0, totalEmployees: 0, employerContrib: 0 });
    const [loading, setLoading] = useState(true);
    const [approvalStatus, setApprovalStatus] = useState(null);
    const [uploadMarked, setUploadMarked] = useState(false);
    const [toast, setToast] = useState('');

    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    useEffect(() => {
        async function fetchAdminStats() {
            setLoading(true);
            try {
                const data = await fetchPayrollsByPeriod('2026-03-01', '2026-03-31', profile?.entreprise_id);

                if (data && data.length > 0) {
                    let totalNet = 0;
                    let totalGross = 0;
                    const employeeSet = new Set();

                    data.forEach(p => {
                        totalNet += Number(p.net_salary || 0);
                        totalGross += Number(p.salary_base || 0) + Number(p.bonuses || 0) + Number(p.overtime_pay || 0);
                        employeeSet.add(p.employee_id);
                    });

                    // Estimate employer contributions as ~24.5% of base (Moroccan standard: CNSS + AMO + etc)
                    const employerContrib = data.reduce((sum, p) => sum + Number(p.salary_base || 0) * 0.245, 0);

                    setStats({
                        totalCost: totalNet + Math.round(employerContrib),
                        totalNet,
                        totalEmployees: employeeSet.size,
                        employerContrib: Math.round(employerContrib)
                    });
                    setPayrolls(data);
                }
            } catch (err) {
                console.error("Error fetching admin stats:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAdminStats();
    }, [profile?.entreprise_id]);

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
                <p className="text-text-secondary mt-2 max-w-sm">No payroll records found for the current period. Records will appear once HR generates them.</p>
            </div>
        );
    }

    const companyName = profile?.name?.split(' ')[0] || 'Company';

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
                    <Building2 size={20} className="text-brand-500" />
                    Company Payroll ({periodLabel(payrolls[0]?.period_start)})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Cost" value={fmt(stats.totalCost)} subtitle="Net + Contributions" icon={DollarSign} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Total Net Payroll" value={fmt(stats.totalNet)} subtitle="To be transferred" icon={DollarSign} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                    <StatCard title="Employees" value={stats.totalEmployees} subtitle="Included in cycle" icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" />
                    <StatCard title="Employer Contrib." value={fmt(stats.employerContrib)} subtitle="CNSS, AMO, Taxes" icon={FileText} iconColor="bg-gradient-to-br from-orange-500 to-red-500" />
                </div>
            </div>

            {/* Employee Payroll Table */}
            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                <div className="p-5 border-b border-border-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-text-primary">Employee Payroll Details</h3>
                    <button
                        onClick={() => { generateBatchPayslipsPDF(payrolls); flash('All payslips downloaded!'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm cursor-pointer"
                    >
                        <Download size={16} /> Download All Payslips
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface-secondary text-text-secondary">
                            <tr>
                                <th className="px-5 py-3 font-medium">Employee</th>
                                <th className="px-5 py-3 font-medium">Position</th>
                                <th className="px-5 py-3 font-medium text-right">Base Salary</th>
                                <th className="px-5 py-3 font-medium text-right">Bonuses</th>
                                <th className="px-5 py-3 font-medium text-right">Deductions</th>
                                <th className="px-5 py-3 font-medium text-right">Net Salary</th>
                                <th className="px-5 py-3 font-medium text-center">Status</th>
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
                                        <td className="px-5 py-3 text-right text-red-400 font-medium">{Number(row.deductions) > 0 ? `-${fmt(row.deductions)}` : '-'}</td>
                                        <td className="px-5 py-3 text-right font-bold">{fmt(row.net_salary)}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-500">
                                                {(row.status || 'generated').charAt(0).toUpperCase() + (row.status || 'generated').slice(1)}
                                            </span>
                                        </td>
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
                                <td className="px-5 py-3 text-right">{fmt(payrolls.reduce((s, r) => s + Number(r.salary_base || 0), 0))}</td>
                                <td className="px-5 py-3 text-right text-emerald-500">{fmt(payrolls.reduce((s, r) => s + Number(r.bonuses || 0), 0))}</td>
                                <td className="px-5 py-3 text-right text-red-400">{fmt(payrolls.reduce((s, r) => s + Number(r.deductions || 0), 0))}</td>
                                <td className="px-5 py-3 text-right">{fmt(stats.totalNet)}</td>
                                <td className="px-5 py-3"></td>
                                <td className="px-5 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Approval Module */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">PAYROLL APPROVAL - {periodLabel(payrolls[0]?.period_start).toUpperCase()}</h3>
                            <p className="text-sm text-text-secondary mt-1">Submitted by HR Manager</p>
                        </div>
                        <StatusBadge variant="warning">PENDING YOUR APPROVAL</StatusBadge>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Total Employees:</span>
                                    <span className="font-semibold text-text-primary">{stats.totalEmployees}</span>
                                </div>
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Expected Pay Date:</span>
                                    <span className="font-semibold text-text-primary">{fmtDate(payrolls[0]?.period_end)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Net Payroll:</span>
                                    <span className="font-bold text-text-primary">{fmt(stats.totalNet)}</span>
                                </div>
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Payment Method:</span>
                                    <span className="font-semibold text-text-primary">Bank Transfer</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary mb-6">
                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-3">
                                <AlertTriangle size={16} className="text-amber-500" /> WHAT HAPPENS WHEN YOU APPROVE:
                            </h4>
                            <ul className="text-sm text-text-secondary space-y-2">
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Payroll is locked (no further edits)</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> {stats.totalEmployees} payslips generated & emailed automatically</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Bank transfer file created for download</li>
                                <li className="flex items-start gap-2 mt-2 pt-2 border-t border-border-secondary text-amber-600 dark:text-amber-500 font-medium">
                                    <Lock size={14} className="mt-0.5 shrink-0" />
                                    Flowly does NOT transfer funds automatically. You MUST download the file and upload to your bank portal.
                                </li>
                            </ul>
                        </div>

                        {approvalStatus ? (
                            <div className={`py-2.5 text-center text-sm font-bold rounded-xl ${approvalStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                {approvalStatus === 'approved' ? 'Payroll Approved — Files Generated' : 'Changes Requested — Sent Back to HR'}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => { setApprovalStatus('approved'); flash('Payroll approved. Payslips generated and bank file ready.'); }} className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm cursor-pointer">
                                    Approve & Generate Files
                                </button>
                                <button onClick={() => { setApprovalStatus('changes'); flash('Change request sent back to HR Manager'); }} className="py-2.5 px-6 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors cursor-pointer">
                                    Request Changes
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Post-Approval: Bank File */}
                <div className="bg-surface-primary rounded-2xl border border-emerald-500/30 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-emerald-500/5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">✅ PAYROLL APPROVED</h3>
                            <p className="text-sm text-text-secondary mt-1">Processed: {fmtDate(new Date().toISOString())}</p>
                        </div>
                        <StatusBadge variant="success">Locked</StatusBadge>
                    </div>

                    <div className="p-6">
                        <div className="bg-surface-secondary p-4 rounded-xl border border-border-secondary mb-5">
                            <h4 className="text-sm font-bold text-text-primary mb-3">📥 DOWNLOAD BANK TRANSFER FILE</h4>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-primary p-3 rounded-lg border border-border-secondary">
                                <div className="text-sm">
                                    <p className="font-semibold text-text-primary">Payroll_{periodLabel(payrolls[0]?.period_start).replace(/\s/g, '')}.xml</p>
                                    <p className="text-text-secondary text-xs mt-1">SEPA XML • {stats.totalEmployees} Transactions</p>
                                </div>
                                <button onClick={() => flash('Downloading bank transfer file...')} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>

                        <div className="mb-5">
                            <h4 className="font-semibold text-text-primary text-sm mb-3">📋 NEXT STEPS:</h4>
                            <ol className="list-decimal list-inside text-sm text-text-secondary space-y-1.5 ml-1">
                                <li>Download the XML file above</li>
                                <li>Log into your bank's online portal</li>
                                <li>Navigate to Payments → Bulk Transfer → Upload</li>
                                <li>Authorize payment in bank portal</li>
                            </ol>
                        </div>

                        <div className="pt-5 border-t border-border-secondary">
                            <h4 className="font-semibold text-text-primary text-sm mb-3">MARK UPLOAD STATUS:</h4>
                            <button
                                onClick={() => { setUploadMarked(true); flash('Bank file marked as uploaded. HR and employees notified.'); }}
                                disabled={uploadMarked}
                                className={`w-full flex justify-center items-center gap-2 py-2.5 rounded-xl font-bold transition-colors cursor-pointer ${uploadMarked ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' : 'bg-surface-primary border border-brand-500 text-brand-500 hover:bg-brand-50'} disabled:cursor-not-allowed`}>
                                {uploadMarked ? <><CheckCircle2 size={18} /> Bank File Uploaded</> : <><Download size={18} /> Mark as "Bank File Uploaded"</>}
                            </button>
                            <p className="text-xs text-text-tertiary text-center mt-3">This notifies HR and Employees that payment is processing.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
