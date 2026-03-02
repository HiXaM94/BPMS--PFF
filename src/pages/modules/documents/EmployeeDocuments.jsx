import { useState, useCallback, useEffect } from 'react';
import {
    FileCheck, Download, UploadCloud, AlertCircle, FileText, Send, Clock, CheckCircle2, Loader2, History
} from 'lucide-react';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';

const DOC_TYPES = [
    { key: 'cnss', label: 'CNSS Card (Front & Back)', required: true },
    { key: 'cin', label: 'National ID (CIN)', required: true },
    { key: 'diploma', label: 'Diploma Certificate', required: true },
    { key: 'rib', label: 'Bank RIB Statement', required: true },
];

export default function EmployeeDocuments() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('requests');
    const [uploads, setUploads] = useState({});
    const [uploading, setUploading] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState('');
    const [certPeriod, setCertPeriod] = useState('latest');
    const [certPurpose, setCertPurpose] = useState('');
    const [genLoading, setGenLoading] = useState(false);
    const [reqDocType, setReqDocType] = useState('Employment Verification Letter');
    const [reqUrgency, setReqUrgency] = useState('standard');
    const [reqNotes, setReqNotes] = useState('');
    const [reqLoading, setReqLoading] = useState(false);
    const [requestHistory, setRequestHistory] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);

    const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    // ── Fetch existing documents from DB on mount ──
    useEffect(() => {
        if (!isSupabaseReady || !profile?.id) { setLoadingDocs(false); return; }
        (async () => {
            try {
                // Fetch onboarding docs
                const { data: onboardingDocs } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('doc_type', 'onboarding')
                    .order('created_at', { ascending: false });

                if (onboardingDocs && onboardingDocs.length > 0) {
                    const uploadMap = {};
                    let allSubmitted = true;
                    onboardingDocs.forEach(doc => {
                        if (!uploadMap[doc.title]) {
                            uploadMap[doc.title] = doc.file_url?.split('_').pop() || doc.title;
                        }
                        if (doc.status === 'pending') allSubmitted = false;
                    });
                    setUploads(uploadMap);
                    if (Object.keys(uploadMap).length >= DOC_TYPES.length && onboardingDocs.some(d => d.status === 'submitted' || d.status === 'approved')) {
                        setSubmitted(true);
                    }
                }

                // Fetch official request history
                const { data: requests } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('user_id', profile.id)
                    .in('doc_type', ['official_request', 'salary_certificate'])
                    .order('created_at', { ascending: false });

                if (requests) setRequestHistory(requests);
            } catch (err) {
                console.error('Fetch documents error:', err.message);
            }
            setLoadingDocs(false);
        })();
    }, [profile?.id]);

    const handleFileUpload = useCallback(async (docKey, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(prev => ({ ...prev, [docKey]: true }));

        if (!isSupabaseReady || !profile?.id) {
            // Mock upload
            setTimeout(() => {
                setUploads(prev => ({ ...prev, [docKey]: file.name }));
                setUploading(prev => ({ ...prev, [docKey]: false }));
                flash(`${docKey} uploaded successfully!`);
            }, 800);
            return;
        }

        try {
            const path = `documents/${profile.id}/${docKey}_${Date.now()}_${file.name}`;
            const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
            if (upErr) throw upErr;

            await supabase.from('documents').insert({
                user_id: profile.id,
                title: docKey,
                file_url: path,
                doc_type: 'onboarding',
                status: 'pending',
            });
            setUploads(prev => ({ ...prev, [docKey]: file.name }));
            flash(`${docKey} uploaded successfully!`);
        } catch (err) {
            flash('Upload failed: ' + (err.message || 'Unknown error'));
        }
        setUploading(prev => ({ ...prev, [docKey]: false }));
    }, [profile?.id]);

    const handleSubmitAll = useCallback(async () => {
        const uploadedCount = Object.keys(uploads).length;
        if (uploadedCount < DOC_TYPES.length) {
            flash(`Please upload all ${DOC_TYPES.length} documents first.`);
            return;
        }
        setSubmitted(true);
        flash('All documents submitted for review!');

        if (isSupabaseReady && profile?.id) {
            const { error } = await supabase
                .from('documents')
                .update({ status: 'submitted' })
                .eq('user_id', profile.id)
                .eq('doc_type', 'onboarding')
                .eq('status', 'pending');
            if (error) {
                console.error('Submit all error:', error.message);
                flash('Error updating status: ' + error.message);
                setSubmitted(false);
                return;
            }
            cacheService.invalidatePattern('^doc:');
        }
    }, [uploads, profile?.id]);

    const handleGeneratePDF = useCallback(async () => {
        setGenLoading(true);

        // Record generation in DB
        if (isSupabaseReady && profile?.id) {
            try {
                const { data: rec } = await supabase.from('documents').insert({
                    user_id: profile.id,
                    title: `Salary Certificate (${certPeriod})`,
                    doc_type: 'salary_certificate',
                    status: 'approved',
                    notes: certPurpose || null,
                }).select().single();
                if (rec) setRequestHistory(prev => [rec, ...prev]);
                cacheService.invalidatePattern('^doc:');
            } catch (err) {
                console.error('Record cert error:', err.message);
            }
        }

        // Generate PDF (in real app this would call a serverless function)
        const blob = new Blob(['Salary Certificate PDF Content'], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `salary_certificate_${certPeriod}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setGenLoading(false);
        flash('Salary certificate generated!');
    }, [certPeriod, certPurpose, profile?.id]);

    const handleSubmitRequest = useCallback(async () => {
        setReqLoading(true);
        if (!isSupabaseReady || !profile?.id) {
            setTimeout(() => {
                setReqLoading(false);
                setRequestHistory(prev => [{ id: Date.now(), title: reqDocType, doc_type: 'official_request', status: 'pending', urgency: reqUrgency, notes: reqNotes, created_at: new Date().toISOString() }, ...prev]);
                flash('Document request submitted to HR!');
                setReqNotes('');
            }, 800);
            return;
        }
        try {
            const { data: rec } = await supabase.from('documents').insert({
                user_id: profile.id,
                title: reqDocType,
                doc_type: 'official_request',
                status: 'pending',
                notes: reqNotes,
                urgency: reqUrgency,
            }).select().single();
            if (rec) setRequestHistory(prev => [rec, ...prev]);
            flash('Document request submitted to HR!');
            setReqNotes('');
            cacheService.invalidatePattern('^doc:');
        } catch (err) {
            flash('Request failed: ' + (err.message || 'Unknown error'));
        }
        setReqLoading(false);
    }, [profile?.id, reqDocType, reqUrgency, reqNotes]);

    const uploadedCount = Object.keys(uploads).length;
    const pendingOnboarding = DOC_TYPES.length - uploadedCount;

    if (loadingDocs) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 size={28} className="animate-spin text-text-tertiary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">

            {toast && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
                    <CheckCircle2 size={16}/> {toast}
                </div>
            )}

            <div className="flex justify-between items-center mb-6 block sm:flex">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    My Documents
                </h2>
                <div className="flex gap-2 bg-surface-secondary p-1 rounded-xl mt-4 sm:mt-0">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'requests' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Action Required {pendingOnboarding > 0 && !submitted && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOnboarding}</span>}
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
                                Welcome {profile?.name?.split(' ')[0] || 'there'}! HR has requested {DOC_TYPES.length} documents to complete your onboarding process.
                                Please upload them before <strong>March 25, 2026</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Onboarding Documents</h3>
                                <p className="text-xs text-text-secondary mt-1">Status: <span className="text-brand-500 font-semibold">{submitted ? 'Submitted' : `Pending (${uploadedCount}/${DOC_TYPES.length} uploaded)`}</span></p>
                            </div>
                            <span className="text-xs font-semibold bg-surface-primary px-3 py-1.5 rounded-lg border border-border-secondary">Due in 6 days</span>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {DOC_TYPES.map(doc => (
                                    <div key={doc.key} className={`border rounded-xl p-4 bg-surface-secondary relative group transition-colors ${uploads[doc.key] ? 'border-emerald-500/40' : 'border-border-secondary hover:border-brand-500'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                                <FileText size={16} className={uploads[doc.key] ? 'text-emerald-500' : 'text-brand-500'} /> {doc.label}
                                            </span>
                                            {uploads[doc.key]
                                                ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10}/>Uploaded</span>
                                                : <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>
                                            }
                                        </div>
                                        {uploads[doc.key] ? (
                                            <div className="w-full py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-600 text-sm font-medium flex items-center justify-center gap-2">
                                                <CheckCircle2 size={16} /> {uploads[doc.key]}
                                            </div>
                                        ) : (
                                            <label className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                                {uploading[doc.key] ? <><Loader2 size={16} className="animate-spin"/> Uploading...</> : <><UploadCloud size={16} /> Upload Formats: PDF, JPG</>}
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(doc.key, e)} className="hidden" disabled={uploading[doc.key]} />
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border-secondary">
                                <button
                                    onClick={handleSubmitAll}
                                    disabled={uploadedCount < DOC_TYPES.length || submitted}
                                    className={`px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm ${uploadedCount >= DOC_TYPES.length && !submitted ? 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer' : 'bg-brand-500 text-white opacity-50 cursor-not-allowed'}`}>
                                    {submitted ? 'Documents Submitted' : 'Submit All Documents'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {activeTab === 'official' && (
                <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                                <select value={certPeriod} onChange={e => setCertPeriod(e.target.value)} className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none">
                                    <option value="latest">Latest Month (March 2026)</option>
                                    <option value="3months">Last 3 Months (Jan-Mar 2026)</option>
                                    <option value="ytd">Year-to-Date (2026)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Purpose (Optional):</label>
                                <input type="text" value={certPurpose} onChange={e => setCertPurpose(e.target.value)} placeholder="e.g. Bank Loan Application" className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none" />
                            </div>

                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs p-3 rounded-xl flex items-start gap-2">
                                <CheckCircle2 size={16} className="shrink-0" /> No HR approval required. Your verified document will download instantly as an official watermarked PDF.
                            </div>

                            <button onClick={handleGeneratePDF} disabled={genLoading} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                                {genLoading ? <><Loader2 size={18} className="animate-spin"/> Generating...</> : <><Download size={18} /> Generate PDF</>}
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
                                <select value={reqDocType} onChange={e => setReqDocType(e.target.value)} className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none">
                                    <option>Employment Verification Letter</option>
                                    <option>Work Experience Certificate</option>
                                    <option>Reference Letter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Urgency:</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setReqUrgency('standard')} className={`flex-1 py-1.5 rounded-lg font-medium text-xs border transition-colors ${reqUrgency === 'standard' ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface-secondary text-text-secondary border-border-secondary hover:bg-surface-primary'}`}>Standard (3-5 days)</button>
                                    <button type="button" onClick={() => setReqUrgency('urgent')} className={`flex-1 py-1.5 rounded-lg font-medium text-xs border transition-colors ${reqUrgency === 'urgent' ? 'bg-brand-500 text-white border-brand-500' : 'bg-surface-secondary text-text-secondary border-border-secondary hover:bg-surface-primary'}`}>Urgent (24h)</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-2">Notes to HR:</label>
                                <textarea rows="3" value={reqNotes} onChange={e => setReqNotes(e.target.value)} placeholder="Additional details..." className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none resize-none"></textarea>
                            </div>

                            <div className="pt-2">
                                <button onClick={handleSubmitRequest} disabled={reqLoading} className="w-full py-2.5 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors disabled:opacity-50">
                                    {reqLoading ? 'Submitting...' : 'Submit Request to HR'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Request History */}
                {requestHistory.length > 0 && (
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                        <div className="p-5 border-b border-border-secondary flex items-center gap-2">
                            <History size={18} className="text-text-tertiary" />
                            <h3 className="text-base font-bold text-text-primary">Request History</h3>
                        </div>
                        <div className="divide-y divide-border-secondary">
                            {requestHistory.map(req => {
                                const statusMap = { pending: 'warning', approved: 'success', rejected: 'danger', submitted: 'brand' };
                                return (
                                    <div key={req.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                req.doc_type === 'salary_certificate' ? 'bg-emerald-500/10' : 'bg-brand-500/10'
                                            }`}>
                                                {req.doc_type === 'salary_certificate'
                                                    ? <FileCheck size={14} className="text-emerald-500" />
                                                    : <Send size={14} className="text-brand-500" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-text-primary">{req.title}</p>
                                                <p className="text-[11px] text-text-tertiary">
                                                    {req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    {req.urgency === 'urgent' && <span className="ml-2 text-amber-600 font-semibold">Urgent</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge variant={statusMap[req.status] || 'neutral'} dot size="sm">{req.status}</StatusBadge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
            )}

        </div>
    );
}
