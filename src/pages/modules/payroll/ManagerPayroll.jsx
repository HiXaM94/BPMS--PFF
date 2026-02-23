import {
    Lock, ArrowUpCircle, ExternalLink, BellRing, UserCheck,
    CheckCircle2, Users, Receipt
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';

export default function ManagerPayroll() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* High Level Stats (Amount Blind) */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Users size={20} className="text-brand-500" />
                    IT Team Management (March 2026)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Team Members" value="23" subtitle="Process complete" icon={UserCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Promotions Pending" value="1" subtitle="Requires action" icon={ArrowUpCircle} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    <StatCard title="Advance Approvals" value="1" subtitle="Requires action" icon={Receipt} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                </div>
            </div>

            {/* MGR-PAY-03: Quick Notification */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-4 mb-6">
                <BellRing size={20} className="text-emerald-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-bold text-emerald-600 mb-1">March 2026 Payroll Processed</h3>
                    <p className="text-sm text-emerald-600/80">
                        All 23 payslips for the IT team have been generated and sent. Team members will receive payment on March 31.
                        If any team member has questions about their payslip, please direct them to HR.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* MGR-PAY-01: Amount-Blind Salary Increase Recommendation */}
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
                        <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary">
                            <p className="font-bold text-text-primary mb-1">Employee: Ahmed Benali</p>
                            <p className="text-text-secondary text-xs">Current Position: Developer • IT Dept • 2y 3m tenure</p>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Recommendation Type:</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" defaultChecked className="text-brand-500" /> Promotion (Developer → Senior)</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" className="text-brand-500" /> Performance-Based Increase</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="recType" className="text-brand-500" /> Market Adjustment</label>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Proposed Increase Level (Set by HR):</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="level" defaultChecked className="text-brand-500" /> Significant (20-30%) - Major Promotion</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="level" className="text-brand-500" /> Moderate (10-20%) - Standard Promotion</label>
                                <label className="flex items-center gap-2 text-text-secondary"><input type="radio" name="level" className="text-brand-500" /> Minor (5-10%) - Performance Adjustment</label>
                            </div>
                        </div>

                        <div>
                            <p className="font-semibold text-text-primary mb-2">Justification (Required):</p>
                            <textarea
                                className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary text-xs resize-none h-24 focus:outline-none focus:border-brand-500"
                                placeholder="List performance highlights, skills developed, and business impact..."
                                defaultValue="• Consistently high performance scores (92% avg)
• Led React migration project successfully
• Mentoring 2 junior developers effectively
• Reduced project bug rate by 35%"
                            />
                        </div>

                        <div className="pt-2 text-xs text-text-tertiary flex items-start gap-2">
                            <Lock size={14} className="shrink-0 mt-0.5" />
                            <p>You are recommending the promotion level. HR and Company Admin will determine the exact financial amount based on budget, market rates, and policy.</p>
                        </div>

                        <button className="w-full py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors">
                            Submit Recommendation
                        </button>
                    </div>
                </div>


                {/* MGR-PAY-02: Amount-Blind Advance Request */}
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

                        <div className="p-3 bg-surface-secondary rounded-xl border border-border-secondary mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-text-primary">Sara Idrissi</p>
                                    <p className="text-xs mt-0.5">Requested on March 15, 2026</p>
                                </div>
                            </div>
                            <p className="font-semibold text-text-primary text-xs mt-2">Employee's Reason:</p>
                            <p className="italic bg-surface-primary border border-border-secondary p-2 rounded-lg mt-1 text-xs">
                                "Medical emergency - family member hospitalized"
                            </p>
                        </div>

                        <p className="font-semibold text-text-primary mb-3">Manager Evaluation:</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="mb-1 text-xs text-text-primary">1. Will this affect work performance?</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 bg-surface-primary border border-border-secondary rounded text-xs">Yes</button>
                                    <button className="px-3 py-1 bg-brand-500 text-white rounded text-xs font-medium">No (Can Manage)</button>
                                    <button className="px-3 py-1 bg-surface-primary border border-border-secondary rounded text-xs">Unsure</button>
                                </div>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-text-primary">2. Is employee reliable and trustworthy?</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 bg-brand-500 text-white rounded text-xs font-medium">Yes</button>
                                    <button className="px-3 py-1 bg-surface-primary border border-border-secondary rounded text-xs">No</button>
                                </div>
                            </div>

                            <div>
                                <p className="mb-1 text-xs text-text-primary">3. Employee's attendance record:</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-medium border border-emerald-500/20">Excellent (98%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-3">
                            <div className="bg-surface-secondary p-3 rounded-lg border border-border-secondary flex gap-2 items-start opacity-75">
                                <Lock size={14} className="text-text-tertiary mt-0.5 shrink-0" />
                                <p className="text-[11px] leading-tight text-text-secondary">
                                    Check approved based on situation and reliability. The specific amount asked will be routed securely to HR.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-text-primary text-surface-primary rounded-xl font-bold hover:bg-black/90 dark:hover:bg-white/90 transition-colors">
                                    Approve (Fwd to HR)
                                </button>
                                <button className="py-2 px-6 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors">
                                    Reject
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
