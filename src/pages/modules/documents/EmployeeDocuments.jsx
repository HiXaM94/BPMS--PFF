import { useState } from 'react';
import {
    FileCheck, Download, UploadCloud, AlertCircle, FileText, Send, Clock
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';

export default function EmployeeDocuments() {
    const [activeTab, setActiveTab] = useState('requests');

    return (
        <div className="space-y-6 animate-fade-in">

            <div className="flex justify-between items-center mb-6 block sm:flex">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    My Documents
                </h2>
                <div className="flex gap-2 bg-surface-secondary p-1 rounded-xl mt-4 sm:mt-0">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'requests' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Action Required <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">1</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('official')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'official' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Official Documents
                    </button>
                </div>
            </div>

            {activeTab === 'requests' && (
                <div className="animate-fade-in space-y-6">

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-4 mb-6">
                        <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <h3 className="font-bold text-amber-700 mb-1">Complete Your Onboarding</h3>
                            <p className="text-sm text-amber-700/80">
                                Welcome Omar! HR has requested 4 documents to complete your onboarding process.
                                Please upload them before <strong>March 25, 2026</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Onboarding Documents</h3>
                                <p className="text-xs text-text-secondary mt-1">Status: <span className="text-brand-500 font-semibold">Pending (0/4 uploaded)</span></p>
                            </div>
                            <span className="text-xs font-semibold bg-surface-primary px-3 py-1.5 rounded-lg border border-border-secondary">Due in 6 days</span>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Item 1 */}
                                <div className="border border-border-secondary rounded-xl p-4 bg-surface-secondary relative group hover:border-brand-500 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-semibold text-text-primary text-sm flex items-center gap-2"><FileText size={16} className="text-brand-500" /> CNSS Card (Front & Back)</span>
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>
                                    </div>
                                    <button className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                        <UploadCloud size={16} /> Upload Formats: PDF, JPG
                                    </button>
                                </div>
                                {/* Item 2 */}
                                <div className="border border-border-secondary rounded-xl p-4 bg-surface-secondary relative group hover:border-brand-500 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-semibold text-text-primary text-sm flex items-center gap-2"><FileText size={16} className="text-brand-500" /> National ID (CIN)</span>
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>
                                    </div>
                                    <button className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                        <UploadCloud size={16} /> Upload Formats: PDF, JPG
                                    </button>
                                </div>
                                {/* Item 3 */}
                                <div className="border border-border-secondary rounded-xl p-4 bg-surface-secondary relative group hover:border-brand-500 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-semibold text-text-primary text-sm flex items-center gap-2"><FileText size={16} className="text-brand-500" /> Diploma Certificate</span>
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>
                                    </div>
                                    <button className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                        <UploadCloud size={16} /> Upload Formats: PDF, JPG
                                    </button>
                                </div>
                                {/* Item 4 */}
                                <div className="border border-border-secondary rounded-xl p-4 bg-surface-secondary relative group hover:border-brand-500 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-semibold text-text-primary text-sm flex items-center gap-2"><FileText size={16} className="text-brand-500" /> Bank RIB Statement</span>
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>
                                    </div>
                                    <button className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                        <UploadCloud size={16} /> Upload Formats: PDF, JPG
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border-secondary">
                                <button className="px-6 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm opacity-50 cursor-not-allowed">
                                    Submit All Documents
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'official' && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 7.5 Auto-Generate Self-Service UI */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary bg-emerald-500/5">
                            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                <FileCheck size={18} className="text-emerald-500" /> Instant Salary Certificate
                            </h3>
                            <p className="text-xs text-text-secondary mt-1">Generated dynamically from payroll data.</p>
                        </div>
                        <div className="p-6 space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Select Period:</label>
                                <select className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none">
                                    <option>Latest Month (March 2026)</option>
                                    <option>Last 3 Months (Jan-Mar 2026)</option>
                                    <option>Year-to-Date (2026)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Purpose (Optional):</label>
                                <input type="text" placeholder="e.g. Bank Loan Application" className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none" />
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3 rounded-xl flex items-start gap-2">
                                <CheckCircle2 size={16} className="shrink-0" /> No HR approval required. Your verified document will download instantly as an official watermarked PDF.
                            </div>

                            <button className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2">
                                <Download size={18} /> Generate PDF
                            </button>
                        </div>
                    </div>

                    {/* 7.2 Manual Official Request (Complex docs) */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary">
                            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                <Send size={18} className="text-brand-500" /> Request Official Document
                            </h3>
                        </div>
                        <div className="p-6 space-y-4 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Document Type:</label>
                                <select className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none">
                                    <option>Employment Verification Letter</option>
                                    <option>Work Experience Certificate</option>
                                    <option>Reference Letter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Urgency:</label>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 bg-brand-500 text-white rounded-lg font-medium text-xs border border-brand-500">Standard (3-5 days)</button>
                                    <button className="flex-1 py-1.5 bg-surface-secondary text-text-secondary rounded-lg font-medium text-xs border border-border-secondary hover:bg-surface-primary">Urgent (24h)</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Notes to HR:</label>
                                <textarea rows="3" placeholder="Additional details..." className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none resize-none"></textarea>
                            </div>

                            <div className="pt-2">
                                <button className="w-full py-2.5 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors">
                                    Submit Request to HR
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
