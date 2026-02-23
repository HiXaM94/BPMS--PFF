import { useState, useEffect } from 'react';
import {
    ShieldCheck, AlertTriangle, FileText, CheckCircle2,
    Send, Clock, UserPlus, FileCheck, Mail
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { supabase, isSupabaseReady } from '../../../services/supabase';

export default function HRManagerDocuments() {
    const [activeTab, setActiveTab] = useState('compliance');
    const [docStats, setDocStats] = useState({ overdue: 3, pending: 2, complete: 72, total: 87, generated: 14 });

    useEffect(() => {
        if (!isSupabaseReady) return;
        supabase.from('documents').select('status').then(({ data }) => {
            if (!data || data.length === 0) return;
            const pending   = data.filter(d => d.status === 'pending').length;
            const approved  = data.filter(d => d.status === 'approved').length;
            const rejected  = data.filter(d => d.status === 'rejected').length;
            const total     = data.length;
            setDocStats({
                overdue:   rejected,
                pending,
                complete:  approved,
                total,
                generated: approved,
            });
        });
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 7.3 Compliance Dashboard Overview */}
            <div className="flex justify-between items-center mb-6 block sm:flex">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    Document Center
                </h2>
                <div className="flex gap-2 bg-surface-secondary p-1 rounded-xl mt-4 sm:mt-0">
                    <button
                        onClick={() => setActiveTab('compliance')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'compliance' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('request')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'request' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Requests & Setup
                    </button>
                    <button
                        onClick={() => setActiveTab('review')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'review' ? 'bg-surface-primary text-text-primary shadow-sm flex items-center gap-1.5' : 'text-text-secondary hover:text-text-primary flex items-center gap-1.5'}`}
                    >
                        Reviews <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{docStats.pending}</span>
                    </button>
                </div>
            </div>

            {activeTab === 'compliance' && (
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Overdue Files" value={docStats.overdue.toString()} subtitle="Immediate actions" icon={AlertTriangle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                        <StatCard title="Pending Review" value={docStats.pending.toString()} subtitle="HR approval needed" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                        <StatCard title="Complete Records" value={`${docStats.complete}/${docStats.total}`} subtitle={`${docStats.total > 0 ? Math.round((docStats.complete / docStats.total) * 100) : 0}% compliant`} icon={ShieldCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                        <StatCard title="Generated MTD" value={docStats.generated.toString()} subtitle="Official docs issued" icon={FileCheck} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                        {/* 7.3 Dashboard Specifics */}
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                            <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                                <h3 className="text-base font-bold text-text-primary">Top Missing Documents</h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-surface-secondary pb-3">
                                        <span className="font-semibold text-text-primary">CNSS Card</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-secondary">8 Employees</span>
                                            <button className="px-2 py-1 bg-surface-secondary rounded hover:bg-border-secondary transition-colors text-xs font-medium">Auto-Remind</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-surface-secondary pb-3">
                                        <span className="font-semibold text-text-primary">Updated Diploma</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-secondary">3 Employees</span>
                                            <button className="px-2 py-1 bg-surface-secondary rounded hover:bg-border-secondary transition-colors text-xs font-medium">Auto-Remind</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-text-primary">Marriage Certificate</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-secondary">1 Employee</span>
                                            <button className="px-2 py-1 bg-surface-secondary rounded hover:bg-border-secondary transition-colors text-xs font-medium">Auto-Remind</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 7.4 Bulk Action Banner */}
                        <div className="bg-brand-500/5 rounded-2xl border border-brand-500/20 p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 bg-surface-primary border border-brand-500/30 text-brand-500 rounded-xl flex justify-center items-center mb-4">
                                <FileText size={24} />
                            </div>
                            <h3 className="font-bold text-text-primary text-lg mb-2">Need documents from everyone?</h3>
                            <p className="text-sm text-text-secondary mb-6 max-w-sm">
                                Upcoming CNSS audit? Use the Bulk Request feature to ask all 87 employees for their updated cards simultaneously, complete with auto-reminders.
                            </p>
                            <button className="py-2.5 px-6 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm w-full font-semibold">
                                Start Bulk Request
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {activeTab === 'request' && (
                <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* 7.1 HR Creates Document Request */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                <UserPlus size={18} className="text-brand-500" /> New Document Request
                            </h3>
                        </div>
                        <div className="p-6 space-y-5 text-sm">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Employee:</label>
                                <div className="w-full bg-surface-secondary border border-brand-500/30 rounded-xl p-3 text-text-primary flex items-center gap-2">
                                    <div className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold">O</div>
                                    <span className="font-semibold">Omar Fahmi</span> <span className="text-text-tertiary ml-auto text-xs">New Hire - IT</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Request Type:</label>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1.5 bg-brand-500 text-white rounded-lg font-medium text-xs border border-brand-500 cursor-pointer">Onboarding Pack</span>
                                    <span className="px-3 py-1.5 bg-surface-secondary text-text-secondary rounded-lg font-medium text-xs border border-border-secondary cursor-pointer hover:bg-surface-primary transition-colors">Custom Pack</span>
                                </div>
                            </div>

                            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary">
                                <p className="font-bold text-text-primary mb-3">Required Documents (Onboarding Checkist):</p>
                                <div className="space-y-2 text-text-secondary">
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="text-brand-500 accent-brand-500" /> CNSS Card (Front & Back)</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="text-brand-500 accent-brand-500" /> National ID (CIN) Card</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="text-brand-500 accent-brand-500" /> Diploma / Degree Certificate</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="text-brand-500 accent-brand-500" /> Bank Account Statement (RIB)</label>
                                    <label className="flex items-center gap-2 pt-2 border-t border-border-secondary mt-2"><Plus size={14} /> Add Additional Document</label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2">Deadline:</label>
                                    <input type="text" readOnly value="March 25, 2026" className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-secondary mb-2">Notifications:</label>
                                    <div className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary flex items-center justify-between">
                                        <span className="flex items-center gap-1.5"><Mail size={14} className="text-text-tertiary" /> Email + App</span> {/* FIXED missing import if any, wait standard uses Mail */}
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm flex items-center justify-center gap-2">
                                <Send size={18} /> Send Request to Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'review' && (
                <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* 7.1 HR Reviews Uploaded Docs */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Omar Fahmi Onboarding</h3>
                                <p className="text-xs text-text-secondary mt-1">Submitted: 30 mins ago</p>
                            </div>
                            <StatusBadge variant="brand" size="sm">Action Required</StatusBadge>
                        </div>

                        <div className="p-6">
                            <h4 className="font-semibold text-text-primary text-sm mb-3">Documents to Verify (4/4 Uploaded):</h4>
                            <div className="space-y-3 mb-6">

                                <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-text-primary text-sm line-through opacity-70">CNSS Card (Front & Back)</span>
                                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Verified</span>
                                    </div>
                                    <button className="text-emerald-600 text-xs font-semibold hover:underline">View PDF</button>
                                </div>

                                <div className="flex items-center justify-between bg-surface-secondary border border-border-secondary p-3 rounded-xl relative">
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full border-2 border-surface-primary"></div>
                                    <div className="flex flex-col gap-1 ml-2">
                                        <span className="font-bold text-text-primary text-sm">National ID (CIN)</span>
                                        <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-1"><Clock size={12} /> Pending Review</span>
                                    </div>
                                    <button className="text-brand-500 text-xs font-semibold hover:underline">Open Upload</button>
                                </div>

                                <div className="flex items-center justify-between bg-surface-secondary border border-border-secondary p-3 rounded-xl relative">
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full border-2 border-surface-primary"></div>
                                    <div className="flex flex-col gap-1 ml-2">
                                        <span className="font-bold text-text-primary text-sm">Bachelor's Diploma</span>
                                        <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-1"><Clock size={12} /> Pending Review</span>
                                    </div>
                                    <button className="text-brand-500 text-xs font-semibold hover:underline">Open Upload</button>
                                </div>

                                <div className="flex items-center justify-between bg-surface-secondary border border-border-secondary p-3 rounded-xl relative">
                                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-brand-500 rounded-full border-2 border-surface-primary"></div>
                                    <div className="flex flex-col gap-1 ml-2">
                                        <span className="font-bold text-text-primary text-sm">Bank RIB Statement</span>
                                        <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-1"><Clock size={12} /> Pending Review</span>
                                    </div>
                                    <button className="text-brand-500 text-xs font-semibold hover:underline">Open Upload</button>
                                </div>

                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm text-sm opacity-50 cursor-not-allowed">
                                    Approve Application
                                </button>
                                <button className="flex-1 py-2.5 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors text-sm">
                                    Request Changes
                                </button>
                            </div>
                            <p className="text-xs text-text-tertiary text-center mt-3">You must review remaining 3 documents before approving.</p>
                        </div>
                    </div>

                    {/* 7.2 HR Processes Employee Request */}
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit opacity-80 scale-95 origin-top">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-amber-500/5">
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Req #45: Salary Certificate</h3>
                                <p className="text-xs text-text-secondary mt-1">Requested by: Ahmed Benali</p>
                            </div>
                            <StatusBadge variant="warning" size="sm">Urgent</StatusBadge>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-text-secondary mb-4 italic">"Purpose: Needed before tomorrow for bank loan application. Thanks!"</p>

                            <div className="bg-surface-secondary rounded-xl p-4 border border-border-secondary text-sm mb-6">
                                <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
                                    <FileCheck size={16} className="text-emerald-500" /> Auto-Generated Draft Ready
                                </h4>
                                <p className="text-text-secondary mb-3">System successfully pulled Mar 2026 data. Employee is active. Purpose aligned with policy.</p>
                                <button className="w-full py-2 bg-surface-primary border border-border-secondary text-text-primary font-medium rounded-lg hover:bg-border-secondary transition-colors flex items-center justify-center gap-2">
                                    <Eye size={16} /> Preview Certificate PDF
                                </button>
                            </div>

                            <button className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm text-sm">
                                Generate & Send Document
                            </button>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
