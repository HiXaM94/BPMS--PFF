import {
    Users, Calculator, Send, FileCheck, DollarSign, Clock, CheckCircle2, AlertCircle, FileText
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function HRManagerPayroll() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* High Level Stats */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Calculator size={20} className="text-brand-500" />
                    Payroll Management (March 2026)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Net Scheduled" value="1,058,250 MAD" subtitle="87 Employees" icon={DollarSign} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Overtime Processed" value="12,450 MAD" subtitle="Across 18 employees" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                    <StatCard title="Advances Deducted" value="8,000 MAD" subtitle="Across 4 employees" icon={FileText} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                    <StatCard title="Calculations" value="100%" subtitle="Passed validation" icon={CheckCircle2} iconColor="bg-gradient-to-br from-violet-500 to-purple-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* HR-PAY-01: Submit for Approval */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">PAYROLL CALCULATION COMPLETE</h3>
                        </div>
                        <StatusBadge variant="default">Draft Ready</StatusBadge>
                    </div>

                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600">
                            <CheckCircle2 size={24} className="shrink-0" />
                            <p className="text-sm font-medium">87 employees processed successfully. All validations passed (Attendance, Leaves, Taxes, Bank Details).</p>
                        </div>

                        <div className="space-y-4 mb-6 text-sm">
                            <h4 className="font-semibold text-text-primary">Submit to Company Admin</h4>
                            <p className="text-text-secondary">This payroll will be sent to <strong className="text-text-primary">Hassan Benjelloun</strong> for final approval and bank file generation.</p>

                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Notes for Approver (Optional):</label>
                                <textarea
                                    className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary resize-none h-24 focus:outline-none focus:border-brand-500"
                                    readOnly
                                    value="March payroll ready. All Q1 performance bonuses included. Two employees had absence deductions. Overtime higher due to project deadlines."
                                />
                            </div>
                        </div>

                        <div className="bg-surface-secondary p-4 rounded-xl border border-border-secondary mb-6 text-sm">
                            <h4 className="font-semibold text-text-primary mb-2 flex items-center gap-2"><Send size={16} /> WHAT HAPPENS NEXT:</h4>
                            <ul className="text-text-secondary space-y-1 ml-6 list-disc">
                                <li>Hassan receives approval notification</li>
                                <li>Payslips auto-generated upon approval</li>
                                <li>Bank file created for manual upload</li>
                            </ul>
                        </div>

                        <button className="w-full py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                            <Send size={18} /> Submit for Approval
                        </button>
                    </div>
                </div>

                {/* HR-PAY-02: Payment Status Tracker */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary p-6 h-fit">
                    <h3 className="text-base font-bold text-text-primary mb-6">PAYROLL TRACKER - MARCH 2026</h3>

                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-brand-500 before:to-border-secondary">

                        {/* Step 1 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-primary bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-text-primary text-sm">HR Calculation</h4>
                                    <span className="text-[10px] text-text-tertiary">Mar 27, 2:30 PM</span>
                                </div>
                                <p className="text-xs text-text-secondary">Completed by Amina. 87 employees.</p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-primary bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-text-primary text-sm">Admin Approval</h4>
                                    <span className="text-[10px] text-text-tertiary">Mar 28, 10:15 AM</span>
                                </div>
                                <p className="text-xs text-text-secondary">Approved by Hassan Benjelloun.</p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-primary bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-text-primary text-sm">Bank File Uploaded</h4>
                                    <span className="text-[10px] text-text-tertiary">Mar 28, 11:30 AM</span>
                                </div>
                                <p className="text-xs text-text-secondary">Uploaded to Attijariwafa Bank manually.</p>
                            </div>
                        </div>

                        {/* Step 4 (Current) */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-primary bg-surface-secondary text-brand-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 animate-pulse">
                                <Clock size={18} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-brand-500/30 bg-surface-primary shadow-sm">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-brand-500 text-sm">Bank Processing</h4>
                                    <span className="text-[10px] text-brand-500 font-medium">Expected Mar 31</span>
                                </div>
                                <p className="text-xs text-text-secondary">Awaiting bank completion.</p>
                            </div>
                        </div>

                        {/* Step 5 (Future) */}
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface-primary bg-surface-secondary text-text-tertiary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle2 size={18} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-secondary bg-surface-primary/50 opacity-60">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-text-tertiary text-sm">Payment Complete</h4>
                                </div>
                                <p className="text-xs text-text-tertiary">Funds in employee accounts.</p>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 pt-6 border-t border-border-secondary">
                        <div className="flex justify-between items-center bg-surface-secondary p-3 rounded-lg border border-border-secondary text-sm font-medium">
                            <span className="text-text-primary flex items-center gap-2"><FileText size={16} className="text-text-secondary" /> Employee Notification</span>
                            <span className="text-emerald-500">✅ Payslips Sent (87/87)</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
