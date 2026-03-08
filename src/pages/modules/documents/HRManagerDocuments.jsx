import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, AlertTriangle, FileText, CheckCircle2,
    Send, Clock, UserPlus, FileCheck, Mail, Plus, Eye,
    XCircle, Loader2, X, MessageSquare, File
} from 'lucide-react';
import StatCard from '../../../components/ui/StatCard';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import { notificationService } from '../../../services/NotificationService';

const DOC_LABELS = { cnss: 'CNSS Card', cin: 'National ID (CIN)', diploma: 'Diploma Certificate', rib: 'Bank RIB Statement' };

export default function HRManagerDocuments() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('compliance');
    const [docStats, setDocStats] = useState({ overdue: 0, pending: 0, complete: 0, total: 0, generated: 0 });
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [loading, setLoading] = useState(true);

    // Review tab state
    const [onboardingSubmissions, setOnboardingSubmissions] = useState([]); // grouped by user
    const [officialRequests, setOfficialRequests] = useState([]);
    const [rejectComment, setRejectComment] = useState({});
    const [showRejectInput, setShowRejectInput] = useState({});
    const [actionLoading, setActionLoading] = useState({});
    const [previewFile, setPreviewFile] = useState(null);

    // Request tab state
    const [requestSent, setRequestSent] = useState(false);

    const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 4000); };

    // ── Fetch all document data ──
    const fetchData = useCallback(async () => {
        if (!isSupabaseReady || !profile?.entreprise_id) { setLoading(false); return; }
        try {
            // Stats
            const { data: allDocs } = await supabase
                .from('documents')
                .select('status, type')
                .eq('entreprise_id', profile.entreprise_id);

            if (allDocs) {
                const pending = allDocs.filter(d => d.status === 'submitted' || d.status === 'pending').length;
                const approved = allDocs.filter(d => d.status === 'approved').length;
                const rejected = allDocs.filter(d => d.status === 'rejected').length;
                const generated = allDocs.filter(d => d.type === 'salary_certificate').length;
                setDocStats({ overdue: rejected, pending, complete: approved, total: allDocs.length, generated });
            }

            // Onboarding submissions (submitted docs grouped by user)
            const { data: onboardDocs } = await supabase
                .from('documents')
                .select('*, users!documents_employee_id_fkey(id, name, email, department)')
                .eq('entreprise_id', profile.entreprise_id)
                .eq('type', 'onboarding')
                .in('status', ['submitted', 'approved', 'rejected'])
                .order('created_at', { ascending: false });

            if (onboardDocs) {
                // Group by employee_id
                const grouped = {};
                onboardDocs.forEach(doc => {
                    if (!grouped[doc.employee_id]) {
                        grouped[doc.employee_id] = {
                            employeeId: doc.employee_id,
                            employeeName: doc.users?.name || doc.users?.email || 'Unknown',
                            department: doc.users?.department || '—',
                            docs: [],
                        };
                    }
                    grouped[doc.employee_id].docs.push(doc);
                });
                setOnboardingSubmissions(Object.values(grouped));
            }

            // Official requests
            const { data: officialDocs } = await supabase
                .from('documents')
                .select('*, users!documents_employee_id_fkey(id, name, email)')
                .eq('entreprise_id', profile.entreprise_id)
                .eq('type', 'official_request')
                .order('created_at', { ascending: false });

            if (officialDocs) setOfficialRequests(officialDocs);
        } catch (err) {
            console.error('HR fetch error:', err.message);
        }
        setLoading(false);
    }, [profile?.entreprise_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Approve a single onboarding document ──
    const handleApproveDoc = useCallback(async (docId, userId, docTitle) => {
        setActionLoading(prev => ({ ...prev, [docId]: true }));
        try {
            await supabase.from('documents').update({ status: 'approved', verified_at: new Date().toISOString(), verified_by: profile?.id }).eq('id', docId);
            notificationService.onDocumentApproved(userId, DOC_LABELS[docTitle] || docTitle);
            flash(`${DOC_LABELS[docTitle] || docTitle} approved`);
            cacheService.invalidatePattern('^doc');
            await fetchData();
        } catch (err) { flash('Approve failed: ' + err.message, 'error'); }
        setActionLoading(prev => ({ ...prev, [docId]: false }));
    }, [profile?.id, fetchData]);

    // ── Reject a single onboarding document ──
    const handleRejectDoc = useCallback(async (docId, userId, docTitle) => {
        const reason = rejectComment[docId] || '';
        if (!reason.trim()) { flash('Please provide a rejection reason.', 'error'); return; }
        setActionLoading(prev => ({ ...prev, [docId]: true }));
        try {
            await supabase.from('documents').update({ status: 'rejected', notes: reason, verified_by: profile?.id }).eq('id', docId);
            notificationService.onDocumentRejected(userId, DOC_LABELS[docTitle] || docTitle, reason);
            flash(`${DOC_LABELS[docTitle] || docTitle} rejected — employee notified`);
            setShowRejectInput(prev => ({ ...prev, [docId]: false }));
            setRejectComment(prev => ({ ...prev, [docId]: '' }));
            cacheService.invalidatePattern('^doc');
            await fetchData();
        } catch (err) { flash('Reject failed: ' + err.message, 'error'); }
        setActionLoading(prev => ({ ...prev, [docId]: false }));
    }, [profile?.id, rejectComment, fetchData]);

    // ── Approve all docs for a user ──
    const handleApproveAll = useCallback(async (userId, docs) => {
        const pendingDocs = docs.filter(d => d.status === 'submitted');
        if (!pendingDocs.length) { flash('No pending documents to approve.', 'error'); return; }
        setActionLoading(prev => ({ ...prev, [`all_${userId}`]: true }));
        try {
            const ids = pendingDocs.map(d => d.id);
            await supabase.from('documents').update({ status: 'approved', verified_at: new Date().toISOString(), verified_by: profile?.id }).in('id', ids);
            pendingDocs.forEach(d => notificationService.onDocumentApproved(userId, DOC_LABELS[d.title] || d.title));
            flash(`All documents approved for employee`);
            cacheService.invalidatePattern('^doc');
            await fetchData();
        } catch (err) { flash('Bulk approve failed: ' + err.message, 'error'); }
        setActionLoading(prev => ({ ...prev, [`all_${userId}`]: false }));
    }, [profile?.id, fetchData]);

    // ── Handle official request status change ──
    const handleRequestAction = useCallback(async (reqId, newStatus, userId, title) => {
        setActionLoading(prev => ({ ...prev, [`req_${reqId}`]: true }));
        try {
            await supabase.from('documents').update({ status: newStatus, verified_by: profile?.id }).eq('id', reqId);
            if (newStatus === 'completed' || newStatus === 'approved') {
                notificationService.onOfficialDocCompleted(userId, title);
            } else if (newStatus === 'rejected') {
                notificationService.onDocumentRejected(userId, title, 'Request declined by HR.');
            }
            const labels = { in_review: 'marked as In Review', approved: 'approved', rejected: 'rejected', completed: 'completed' };
            flash(`Request ${labels[newStatus] || newStatus}`);
            cacheService.invalidatePattern('^doc');
            await fetchData();
        } catch (err) { flash('Action failed: ' + err.message, 'error'); }
        setActionLoading(prev => ({ ...prev, [`req_${reqId}`]: false }));
    }, [profile?.id, fetchData]);

    // ── Preview uploaded file ──
    const handlePreviewDoc = useCallback(async (fileUrl, fileName) => {
        if (!fileUrl) { flash('No file available', 'error'); return; }
        try {
            const { data } = await supabase.storage.from('documents').getPublicUrl(fileUrl);
            setPreviewFile({ url: data.publicUrl, name: fileName || 'Document' });
        } catch { flash('Failed to load preview', 'error'); }
    }, []);

    const pendingReviewCount = onboardingSubmissions.reduce((sum, s) => sum + s.docs.filter(d => d.status === 'submitted').length, 0) + officialRequests.filter(r => r.status === 'pending' || r.status === 'in_review').length;

    if (loading) {
        return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 size={28} className="animate-spin text-text-tertiary" /></div>;
    }

    return (
        <>
        <div className="space-y-6 animate-fade-in">

            {toast.msg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
                    toast.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}>
                    {toast.type === 'error' ? <XCircle size={16}/> : <CheckCircle2 size={16}/>} {toast.msg}
                </div>
            )}

            <div className="flex justify-between items-center mb-6 block sm:flex">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">Document Center</h2>
                <div className="flex gap-2 bg-surface-secondary p-1 rounded-xl mt-4 sm:mt-0">
                    <button onClick={() => setActiveTab('compliance')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'compliance' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('request')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'request' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>Requests & Setup</button>
                    <button onClick={() => setActiveTab('review')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'review' ? 'bg-surface-primary text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                        Reviews {pendingReviewCount > 0 && <span className="bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingReviewCount}</span>}
                    </button>
                </div>
            </div>

            {/* ═══ COMPLIANCE DASHBOARD ═══ */}
            {activeTab === 'compliance' && (
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Overdue / Rejected" value={docStats.overdue.toString()} subtitle="Immediate actions" icon={AlertTriangle} iconColor="bg-gradient-to-br from-red-500 to-rose-500" />
                        <StatCard title="Pending Review" value={docStats.pending.toString()} subtitle="HR approval needed" icon={Clock} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" />
                        <StatCard title="Complete Records" value={`${docStats.complete}/${docStats.total}`} subtitle={`${docStats.total > 0 ? Math.round((docStats.complete / docStats.total) * 100) : 0}% compliant`} icon={ShieldCheck} iconColor="bg-gradient-to-br from-emerald-500 to-teal-500" />
                        <StatCard title="Generated MTD" value={docStats.generated.toString()} subtitle="Certificates issued" icon={FileCheck} iconColor="bg-gradient-to-br from-brand-500 to-indigo-500" />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                            <div className="p-5 border-b border-border-secondary flex items-center justify-between">
                                <h3 className="text-base font-bold text-text-primary">Top Missing Documents</h3>
                            </div>
                            <div className="p-5">
                                <div className="space-y-4">
                                    {['CNSS Card', 'Updated Diploma', 'Marriage Certificate'].map((docName, i) => (
                                        <div key={docName} className={`flex justify-between items-center text-sm ${i < 2 ? 'border-b border-surface-secondary pb-3' : ''}`}>
                                            <span className="font-semibold text-text-primary">{docName}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-text-secondary">{[8, 3, 1][i]} Employees</span>
                                                <button onClick={() => flash(`Auto-reminder sent for ${docName}`)} className="px-2 py-1 bg-surface-secondary rounded hover:bg-border-secondary transition-colors text-xs font-medium cursor-pointer">Auto-Remind</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-brand-500/5 rounded-2xl border border-brand-500/20 p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-12 h-12 bg-surface-primary border border-brand-500/30 text-brand-500 rounded-xl flex justify-center items-center mb-4"><FileText size={24} /></div>
                            <h3 className="font-bold text-text-primary text-lg mb-2">Need documents from everyone?</h3>
                            <p className="text-sm text-text-secondary mb-6 max-w-sm">Use the Bulk Request feature to ask all employees for their updated documents simultaneously.</p>
                            <button onClick={() => flash('Bulk document request sent to all employees')} className="py-2.5 px-6 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm w-full cursor-pointer">Start Bulk Request</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ REQUEST & SETUP TAB ═══ */}
            {activeTab === 'request' && (
                <div className="animate-fade-in grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                        <div className="p-5 border-b border-border-secondary flex items-center justify-between bg-surface-secondary/50">
                            <h3 className="text-base font-bold text-text-primary flex items-center gap-2"><UserPlus size={18} className="text-brand-500" /> New Document Request</h3>
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
                                <p className="font-bold text-text-primary mb-3">Required Documents (Onboarding Checklist):</p>
                                <div className="space-y-2 text-text-secondary">
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-brand-500" /> CNSS Card (Front & Back)</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-brand-500" /> National ID (CIN) Card</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-brand-500" /> Diploma / Degree Certificate</label>
                                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked className="accent-brand-500" /> Bank Account Statement (RIB)</label>
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
                                    <div className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary flex items-center">
                                        <span className="flex items-center gap-1.5"><Mail size={14} className="text-text-tertiary" /> Email + App</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { setRequestSent(true); flash('Document request sent to employee'); }} disabled={requestSent}
                                className={`w-full py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer ${requestSent ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'} disabled:cursor-not-allowed`}>
                                {requestSent ? <><CheckCircle2 size={18} /> Request Sent</> : <><Send size={18} /> Send Request to Employee</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ REVIEWS TAB — Real Data ═══ */}
            {activeTab === 'review' && (
                <div className="animate-fade-in space-y-6">

                    {/* Onboarding Submissions */}
                    {onboardingSubmissions.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Onboarding Verifications</h3>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {onboardingSubmissions.map(sub => {
                                    const pendingCount = sub.docs.filter(d => d.status === 'submitted').length;
                                    const approvedCount = sub.docs.filter(d => d.status === 'approved').length;
                                    const rejectedCount = sub.docs.filter(d => d.status === 'rejected').length;
                                    return (
                                        <div key={sub.userId} className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                                            <div className={`p-5 border-b border-border-secondary flex items-center justify-between ${pendingCount > 0 ? 'bg-amber-500/5' : approvedCount === sub.docs.length ? 'bg-emerald-500/5' : 'bg-surface-secondary/50'}`}>
                                                <div>
                                                    <h3 className="text-base font-bold text-text-primary">{sub.userName}</h3>
                                                    <p className="text-xs text-text-secondary mt-1">{sub.department} — {sub.docs.length} documents</p>
                                                </div>
                                                {pendingCount > 0
                                                    ? <StatusBadge variant="brand" size="sm">{pendingCount} to Review</StatusBadge>
                                                    : approvedCount === sub.docs.length
                                                        ? <StatusBadge variant="success" size="sm">All Verified</StatusBadge>
                                                        : <StatusBadge variant="warning" size="sm">{rejectedCount} Rejected</StatusBadge>
                                                }
                                            </div>

                                            <div className="p-5 space-y-3">
                                                {sub.docs.map(doc => {
                                                    const label = DOC_LABELS[doc.title] || doc.title;
                                                    const isApproved = doc.status === 'approved';
                                                    const isRejected = doc.status === 'rejected';
                                                    return (
                                                        <div key={doc.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${
                                                            isApproved ? 'bg-emerald-500/5 border-emerald-500/20'
                                                            : isRejected ? 'bg-red-500/5 border-red-500/20'
                                                            : 'bg-surface-secondary border-border-secondary'
                                                        }`}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className={`font-bold text-sm ${isApproved ? 'text-text-primary line-through opacity-70' : 'text-text-primary'}`}>{label}</span>
                                                                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                                                                        isApproved ? 'text-emerald-600 dark:text-emerald-400' : isRejected ? 'text-red-600 dark:text-red-400' : 'text-brand-500'
                                                                    }`}>
                                                                        {isApproved ? <><CheckCircle2 size={12} /> Verified</> : isRejected ? <><XCircle size={12} /> Rejected</> : <><Clock size={12} /> Pending Review</>}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => handlePreviewDoc(doc.file_url, label)} className="text-brand-500 text-xs font-semibold hover:underline flex items-center gap-1"><Eye size={12} /> View</button>
                                                                    {!isApproved && !isRejected && (
                                                                        <>
                                                                            <button disabled={actionLoading[doc.id]} onClick={() => handleApproveDoc(doc.id, doc.user_id, doc.title)}
                                                                                className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50">
                                                                                {actionLoading[doc.id] ? <Loader2 size={10} className="animate-spin" /> : 'Approve'}
                                                                            </button>
                                                                            <button onClick={() => setShowRejectInput(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                                                                                className="px-2 py-1 bg-red-500/10 text-red-600 dark:text-red-400 rounded text-xs font-semibold hover:bg-red-500/20 transition-colors">
                                                                                Reject
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isRejected && doc.notes && (
                                                                <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-lg px-2 py-1 flex items-start gap-1"><MessageSquare size={12} className="shrink-0 mt-0.5" /> {doc.notes}</p>
                                                            )}
                                                            {showRejectInput[doc.id] && (
                                                                <div className="flex gap-2 mt-1">
                                                                    <input type="text" placeholder="Rejection reason..." value={rejectComment[doc.id] || ''} onChange={e => setRejectComment(prev => ({ ...prev, [doc.id]: e.target.value }))}
                                                                        className="flex-1 bg-surface-primary border border-border-secondary rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500/20" />
                                                                    <button disabled={actionLoading[doc.id]} onClick={() => handleRejectDoc(doc.id, doc.user_id, doc.title)}
                                                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50">
                                                                        {actionLoading[doc.id] ? <Loader2 size={10} className="animate-spin" /> : 'Confirm'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                {pendingCount > 1 && (
                                                    <button disabled={actionLoading[`all_${sub.userId}`]} onClick={() => handleApproveAll(sub.userId, sub.docs)}
                                                        className="w-full py-2 bg-brand-500 text-white rounded-xl font-bold hover:bg-brand-600 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                                                        {actionLoading[`all_${sub.userId}`] ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : `Approve All (${pendingCount})`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Official Document Requests */}
                    {officialRequests.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Official Document Requests</h3>
                            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                                <div className="divide-y divide-border-secondary">
                                    {officialRequests.map(req => {
                                        const statusVariant = { pending: 'warning', in_review: 'brand', approved: 'success', rejected: 'danger', completed: 'success' };
                                        const nextActions = {
                                            pending: [{ label: 'Start Review', status: 'in_review', color: 'bg-brand-500 text-white hover:bg-brand-600' }],
                                            in_review: [
                                                { label: 'Approve', status: 'approved', color: 'bg-emerald-500 text-white hover:bg-emerald-600' },
                                                { label: 'Reject', status: 'rejected', color: 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20' },
                                            ],
                                            approved: [{ label: 'Mark Complete', status: 'completed', color: 'bg-emerald-500 text-white hover:bg-emerald-600' }],
                                        };
                                        const actions = nextActions[req.status] || [];
                                        return (
                                            <div key={req.id} className="px-5 py-4 hover:bg-surface-secondary/50 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-500/10">
                                                            <Send size={14} className="text-brand-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-text-primary">{req.title}</p>
                                                            <p className="text-[11px] text-text-tertiary">
                                                                {req.users?.name || req.users?.email || 'Unknown'} — {req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                                {req.urgency === 'urgent' && <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">Urgent</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge variant={statusVariant[req.status] || 'neutral'} dot size="sm">{req.status}</StatusBadge>
                                                </div>
                                                {req.notes && <p className="text-xs text-text-secondary italic ml-11 mb-2">"{req.notes}"</p>}
                                                {actions.length > 0 && (
                                                    <div className="flex gap-2 ml-11">
                                                        {actions.map(a => (
                                                            <button key={a.status} disabled={actionLoading[`req_${req.id}`]} onClick={() => handleRequestAction(req.id, a.status, req.user_id, req.title)}
                                                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${a.color}`}>
                                                                {actionLoading[`req_${req.id}`] ? <Loader2 size={10} className="animate-spin" /> : a.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {onboardingSubmissions.length === 0 && officialRequests.length === 0 && (
                        <div className="text-center py-16 text-text-tertiary">
                            <CheckCircle2 size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="font-semibold">All caught up!</p>
                            <p className="text-sm">No pending reviews at this time.</p>
                        </div>
                    )}

                </div>
            )}

        </div>

        {/* File Preview Modal */}
        {previewFile && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-surface-primary rounded-2xl border border-border-secondary max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    <div className="p-4 border-b border-border-secondary flex items-center justify-between">
                        <h3 className="font-semibold text-text-primary flex items-center gap-2"><File size={18} className="text-brand-500" />{previewFile.name}</h3>
                        <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors"><X size={18} className="text-text-tertiary" /></button>
                    </div>
                    <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                        {previewFile.url.match(/\.(pdf)$/i)
                            ? <iframe src={previewFile.url} className="w-full h-[600px] border border-border-secondary rounded-lg" title="Document Preview" />
                            : <img src={previewFile.url} alt="Document Preview" className="max-w-full h-auto mx-auto rounded-lg border border-border-secondary" />
                        }
                    </div>
                    <div className="p-4 border-t border-border-secondary flex justify-end gap-2">
                        <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors flex items-center gap-2">
                            <Eye size={16} /> Open Full
                        </a>
                        <button onClick={() => setPreviewFile(null)} className="px-4 py-2 bg-surface-primary border border-border-secondary text-text-primary rounded-lg font-medium hover:bg-surface-secondary transition-colors">Close</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
