import {
    Building2, Users, DollarSign, Download, CheckCircle2,
    AlertTriangle, UploadCloud, Eye, FileText, Lock
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function CompanyAdminPayroll() {
    return (
        <div className="space-y-6 animate-fade-in">

            {/* High Level Stats */}
            <div>
                <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-brand-500" />
                    Acme Corporation Payroll (March 2026)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Cost" value="1,316,865 MAD" subtitle="Net + Contributions" icon={DollarSign} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                    <StatCard title="Total Net Payroll" value="1,058,250 MAD" subtitle="To be transferred" icon={DollarSign} iconColor="bg-gradient-to-br from-blue-500 to-indigo-500" />
                    <StatCard title="Employees" value="87" subtitle="Included in cycle" icon={Users} iconColor="bg-gradient-to-br from-brand-500 to-purple-500" />
                    <StatCard title="Employer Contrib." value="258,615 MAD" subtitle="CNSS, AMO, Taxes" icon={FileText} iconColor="bg-gradient-to-br from-orange-500 to-red-500" />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* CA-PAY-01: Payroll Approval Module */}
                <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">PAYROLL APPROVAL - MARCH 2026</h3>
                            <p className="text-sm text-text-secondary mt-1">Submitted by Amina (HR Manager) on Mar 27</p>
                        </div>
                        <StatusBadge variant="warning">PENDING YOUR APPROVAL</StatusBadge>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Total Employees:</span>
                                    <span className="font-semibold text-text-primary">87</span>
                                </div>
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Expected Pay Date:</span>
                                    <span className="font-semibold text-text-primary">Mar 31, 2026</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Net Payroll:</span>
                                    <span className="font-bold text-text-primary">1,058,250 MAD</span>
                                </div>
                                <div className="flex justify-between border-b border-border-secondary pb-1">
                                    <span className="text-text-secondary">Payment Method:</span>
                                    <span className="font-semibold text-text-primary">Manual Bank Transfer</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary mb-6">
                            <h4 className="font-bold text-text-primary text-sm flex items-center gap-2 mb-3">
                                <AlertTriangle size={16} className="text-amber-500" /> WHAT HAPPENS WHEN YOU APPROVE:
                            </h4>
                            <ul className="text-sm text-text-secondary space-y-2">
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Payroll is locked (no further edits)</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> 87 payslips generated & emailed automatically</li>
                                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Bank transfer XML file created for download</li>
                                <li className="flex items-start gap-2 mt-2 pt-2 border-t border-border-secondary text-amber-600 dark:text-amber-500 font-medium">
                                    <Lock size={14} className="mt-0.5 shrink-0" />
                                    Flowly does NOT transfer funds automatically. You MUST download the XML file and manually upload it to your Attijariwafa Bank portal.
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm">
                                Approve & Generate Files
                            </button>
                            <button className="py-2.5 px-6 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors">
                                Request Changes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Post-Approval: Bank File Management (Simulated UI side-by-side for demo) */}
                <div className="bg-surface-primary rounded-2xl border border-emerald-500/30 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                    <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-emerald-500/5">
                        <div>
                            <h3 className="text-base font-bold text-text-primary">✅ PAYROLL APPROVED</h3>
                            <p className="text-sm text-text-secondary mt-1">Processed: Mar 28, 2026 - 10:16 AM</p>
                        </div>
                        <StatusBadge variant="success">Locked</StatusBadge>
                    </div>

                    <div className="p-6">
                        <div className="bg-surface-secondary p-4 rounded-xl border border-border-secondary mb-5">
                            <h4 className="text-sm font-bold text-text-primary mb-3">📥 DOWNLOAD BANK TRANSFER FILE</h4>
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-primary p-3 rounded-lg border border-border-secondary">
                                <div className="text-sm">
                                    <p className="font-semibold text-text-primary">ACME_Payroll_March2026.xml</p>
                                    <p className="text-text-secondary text-xs mt-1">SEPA XML (Attijariwafa) • 47 KB • 87 Transactions</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>

                        <div className="mb-5">
                            <h4 className="font-semibold text-text-primary text-sm mb-3">📋 NEXT STEPS:</h4>
                            <ol className="list-decimal list-inside text-sm text-text-secondary space-y-1.5 ml-1">
                                <li>Download the XML file above</li>
                                <li>Log into Attijariwafa online portal</li>
                                <li>Navigate to: Payments → Bulk Transfer → Upload</li>
                                <li>Authorize payment in bank portal</li>
                            </ol>
                        </div>

                        <div className="pt-5 border-t border-border-secondary">
                            <h4 className="font-semibold text-text-primary text-sm mb-3">MARK UPLOAD STATUS:</h4>
                            <button className="w-full flex justify-center items-center gap-2 py-2.5 bg-surface-primary border border-brand-500 text-brand-500 rounded-xl font-bold hover:bg-brand-50 transition-colors">
                                <UploadCloud size={18} /> Mark as "Bank File Uploaded"
                            </button>
                            <p className="text-xs text-text-tertiary text-center mt-3">This notifies HR and Employees that payment is processing.</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
