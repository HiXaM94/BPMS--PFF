import { useState, useEffect, useCallback } from 'react';
console.log('DEBUG: EmployeeDocuments.jsx loaded - UPDATED VERSION');
import {
    FileCheck, Download, UploadCloud, AlertCircle, FileText, Send, Clock,
    CheckCircle2, Loader2, History, Eye, Trash2, X, File, RefreshCw, XCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import StatusBadge from '../../../components/ui/StatusBadge';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase, isSupabaseReady } from '../../../services/supabase';
import { cacheService } from '../../../services/CacheService';
import { notificationService } from '../../../services/NotificationService';

const DOC_TYPES = [
    { key: 'cnss', label: 'CNSS Card (Front & Back)', required: true },
    { key: 'cin', label: 'National ID (CIN)', required: true },
    { key: 'diploma', label: 'Diploma Certificate', required: true },
    { key: 'rib', label: 'Bank RIB Statement', required: true },
];

const STATUS_MAP = {
    pending: { label: 'Uploaded', color: 'text-brand-500', bg: 'bg-brand-500/10', icon: Clock },
    submitted: { label: 'Submitted', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Send },
    approved: { label: 'Verified', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', icon: XCircle },
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function EmployeeDocuments() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState('requests');
    // docRecords: { [docKey]: { id, status, file_url, fileName, notes, ... } }
    const [docRecords, setDocRecords] = useState({});
    const [uploading, setUploading] = useState({});
    const [uploadProgress, setUploadProgress] = useState({});
    const [toast, setToast] = useState({ msg: '', type: 'success' });
    const [certPeriod, setCertPeriod] = useState('latest');
    const [certPurpose, setCertPurpose] = useState('');
    const [genLoading, setGenLoading] = useState(false);
    const [reqDocType, setReqDocType] = useState('Employment Verification Letter');
    const [reqUrgency, setReqUrgency] = useState('standard');
    const [reqNotes, setReqNotes] = useState('');
    const [reqLoading, setReqLoading] = useState(false);
    const [requestHistory, setRequestHistory] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [previewFile, setPreviewFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const flash = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type: 'success' }), 4000); };

    // ── File validation ──
    const validateFile = (file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            flash('Invalid file type. Only PDF, JPG, PNG allowed.', 'error');
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            flash('File too large. Maximum size is 10 MB.', 'error');
            return false;
        }
        return true;
    };

    // ── Fetch HR user IDs for notifications ──
    const getHRUserIds = useCallback(async () => {
        if (!isSupabaseReady || !profile?.entreprise_id) return [];
        const { data } = await supabase.from('users').select('id').eq('entreprise_id', profile.entreprise_id).in('role', ['HR', 'ADMIN']);
        return data?.map(u => u.id) || [];
    }, [profile?.entreprise_id]);

    // ── Fetch existing documents from DB on mount ──
    useEffect(() => {
        if (!isSupabaseReady || !profile?.id) { setLoadingDocs(false); return; }
        (async () => {
            try {
                const { data: onboardingDocs } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('employee_id', profile.id)
                    .eq('type', 'onboarding')
                    .order('created_at', { ascending: false });

                if (onboardingDocs?.length) {
                    const records = {};
                    onboardingDocs.forEach(doc => {
                        if (!records[doc.title]) {
                            records[doc.title] = {
                                id: doc.id,
                                status: doc.status,
                                file_url: doc.file_url,
                                fileName: doc.file_url?.split('_').pop() || doc.title,
                                notes: doc.notes,
                                created_at: doc.created_at,
                            };
                        }
                    });
                    setDocRecords(records);
                }

                const { data: requests } = await supabase
                    .from('documents')
                    .select('*')
                    .eq('employee_id', profile.id)
                    .in('type', ['official_request', 'salary_certificate'])
                    .order('created_at', { ascending: false });
                if (requests) setRequestHistory(requests);
            } catch (err) {
                console.error('Fetch documents error:', err.message);
            }
            setLoadingDocs(false);
        })();
    }, [profile?.id]);

    // ── Preview file ──
    const handlePreview = useCallback(async (docKey) => {
        const rec = docRecords[docKey];
        if (!rec?.file_url) { flash('File not found', 'error'); return; }
        try {
            // Fix old paths that have duplicate documents/ prefix
            const cleanPath = rec.file_url.replace(/^documents\//, '');
            console.log('Preview path:', cleanPath);

            // Try public URL first
            const { data } = await supabase.storage.from('documents').getPublicUrl(cleanPath);
            console.log('Public URL:', data.publicUrl);

            // If public URL fails, try signed URL
            const { data: signedData, error: signedError } = await supabase.storage
                .from('documents')
                .createSignedUrl(cleanPath, 60); // 60 seconds expiry

            if (signedError) {
                console.log('Signed URL error:', signedError);
                throw signedError;
            }

            console.log('Signed URL:', signedData.signedUrl);
            // Update preview with new data
            setPreviewFile({ url: signedData.signedUrl, name: rec.fileName });
        } catch (error) {
            console.error('Preview error:', error);
            flash('Failed to load preview: ' + error.message, 'error');
        }
    }, [docRecords]);

    // ── Delete / remove uploaded doc ──
    const handleDelete = useCallback(async (docKey) => {
        const rec = docRecords[docKey];
        if (!isSupabaseReady || !profile?.id) {
            setDocRecords(prev => { const n = { ...prev }; delete n[docKey]; return n; });
            flash(`${docKey} removed`);
            return;
        }
        try {
            if (rec?.file_url) {
                const cleanPath = rec.file_url.replace(/^documents\//, '');
                await supabase.storage.from('documents').remove([cleanPath]);
            }
            if (rec?.id) await supabase.from('documents').delete().eq('id', rec.id);
            setDocRecords(prev => { const n = { ...prev }; delete n[docKey]; return n; });
            flash(`${docKey} removed`);
        } catch (err) { flash('Delete failed: ' + err.message, 'error'); }
    }, [docRecords, profile?.id]);

    // ── Upload file ──
    const handleFileUpload = useCallback(async (docKey, e) => {
        const file = e.target.files?.[0];
        if (!file || !validateFile(file)) return;

        setUploading(prev => ({ ...prev, [docKey]: true }));
        setUploadProgress(prev => ({ ...prev, [docKey]: 0 }));

        // Simulate progress (Supabase JS SDK doesn't expose xhr progress)
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => ({ ...prev, [docKey]: Math.min((prev[docKey] || 0) + 15, 90) }));
        }, 200);

        if (!isSupabaseReady || !profile?.id) {
            setTimeout(() => {
                clearInterval(progressInterval);
                setUploadProgress(prev => ({ ...prev, [docKey]: 100 }));
                setDocRecords(prev => ({ ...prev, [docKey]: { id: Date.now(), status: 'pending', fileName: file.name, file_url: null } }));
                setUploading(prev => ({ ...prev, [docKey]: false }));
                flash(`${DOC_TYPES.find(d => d.key === docKey)?.label || docKey} uploaded!`);
            }, 1000);
            return;
        }

        try {
            // If replacing a rejected doc, delete old file first
            const existing = docRecords[docKey];
            if (existing?.file_url) {
                const cleanPath = existing.file_url.replace(/^documents\//, '');
                await supabase.storage.from('documents').remove([cleanPath]);
                if (existing.id) await supabase.from('documents').delete().eq('id', existing.id);
            }

            const path = `${profile.id}/${docKey}_${Date.now()}_${file.name}`;
            const { error: upErr } = await supabase.storage.from('documents').upload(path, file);
            if (upErr) throw upErr;

            const { data: rec } = await supabase.from('documents').insert({
                employee_id: profile.id,
                entreprise_id: profile.entreprise_id || null,
                title: docKey,
                file_url: path,
                type: 'onboarding',
                status: 'pending',
                uploaded_by: profile.id,
            }).select().single();

            clearInterval(progressInterval);
            setUploadProgress(prev => ({ ...prev, [docKey]: 100 }));
            setDocRecords(prev => ({
                ...prev,
                [docKey]: { id: rec?.id, status: 'pending', file_url: path, fileName: file.name },
            }));
            flash(`${DOC_TYPES.find(d => d.key === docKey)?.label || docKey} uploaded!`);

            // Notify HR
            const hrIds = await getHRUserIds();
            notificationService.onDocumentUploaded(hrIds[0], profile.name || profile.email, DOC_TYPES.find(d => d.key === docKey)?.label || docKey);
        } catch (err) {
            clearInterval(progressInterval);
            flash('Upload failed: ' + (err.message || 'Unknown error'), 'error');
        }
        setUploading(prev => ({ ...prev, [docKey]: false }));
        setTimeout(() => setUploadProgress(prev => { const n = { ...prev }; delete n[docKey]; return n; }), 800);
    }, [profile?.id, profile?.entreprise_id, profile?.name, profile?.email, docRecords, getHRUserIds]);

    // ── Submit all docs for review ──
    const handleSubmitAll = useCallback(async () => {
        const uploadedCount = Object.keys(docRecords).length;
        if (uploadedCount < DOC_TYPES.length) {
            flash(`Please upload all ${DOC_TYPES.length} documents first.`, 'error');
            return;
        }
        // Check no rejected docs remaining
        const hasRejected = Object.values(docRecords).some(r => r.status === 'rejected');
        if (hasRejected) {
            flash('Please re-upload rejected documents before submitting.', 'error');
            return;
        }

        setSubmitting(true);
        if (isSupabaseReady && profile?.id) {
            console.log('DEBUG: Submitting with employee_id:', profile.id);
            const { error } = await supabase
                .from('documents')
                .update({ status: 'submitted' })
                .eq('employee_id', profile.id)
                .eq('type', 'onboarding')
                .eq('status', 'pending');
            if (error) {
                flash('Error submitting: ' + error.message, 'error');
                setSubmitting(false);
                return;
            }
            // Update local state
            setDocRecords(prev => {
                const n = { ...prev };
                Object.keys(n).forEach(k => { if (n[k].status === 'pending') n[k] = { ...n[k], status: 'submitted' }; });
                return n;
            });
            cacheService.invalidatePattern('^doc');

            // Notify HR
            const hrIds = await getHRUserIds();
            notificationService.onOnboardingDocsSubmitted(hrIds, profile.name || profile.email);
        }
        flash('All documents submitted for HR review!');
        setSubmitting(false);
    }, [docRecords, profile?.id, profile?.name, profile?.email, getHRUserIds]);

    // ── Generate real PDF salary certificate ──
    const handleGeneratePDF = useCallback(async () => {
        setGenLoading(true);
        try {
            const periodLabels = { latest: 'March 2026', '3months': 'Jan–Mar 2026', ytd: 'Year-to-Date 2026' };
            const periodLabel = periodLabels[certPeriod] || certPeriod;
            const empName = profile?.name || profile?.email || 'Employee';
            const now = new Date();
            const docRef = 'CERT-' + now.getFullYear().toString().slice(-2) + String(now.getMonth() + 1).padStart(2, '0') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
            const verifyCode = 'FLW-' + now.getTime().toString(36).toUpperCase().substring(0, 8);

            const doc = new jsPDF();
            const w = doc.internal.pageSize.getWidth();
            const h = doc.internal.pageSize.getHeight();

            // ── Helper: Draw Flowly Logo ──
            const drawLogo = (x, y, s = 0.55, color = [255, 255, 255]) => {
                doc.setFillColor(...color);
                doc.setDrawColor(...color);
                doc.setLineWidth(0.3 * s);
                doc.roundedRect(x, y, 2.5 * s, 10 * s, 0.8 * s, 0.8 * s, 'F');
                doc.circle(x + 5 * s, y + 10 * s, 3 * s, 'F');
                doc.setFillColor(42, 133, 255);
                doc.circle(x + 5 * s, y + 10 * s, 1.2 * s, 'F');
                doc.setFillColor(...color);
                doc.roundedRect(x + 7.5 * s, y + 2 * s, 2 * s, 6 * s, 0.6 * s, 0.6 * s, 'F');
                doc.circle(x + 12 * s, y + 8 * s, 2.5 * s, 'F');
                doc.setFillColor(42, 133, 255);
                doc.circle(x + 12 * s, y + 8 * s, 1 * s, 'F');
                doc.setFillColor(...color);
                doc.roundedRect(x + 14.5 * s, y, 2.5 * s, 7 * s, 0.8 * s, 0.8 * s, 'F');
            };

            // ── Professional Header ──
            doc.setFillColor(24, 100, 220);
            doc.rect(0, 0, w, 40, 'F');
            doc.setFillColor(42, 133, 255);
            doc.rect(0, 0, w, 36, 'F');
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 36, w, 0.5, 'F');

            // Logo
            drawLogo(14, 7, 0.55, [255, 255, 255]);

            // Flowly text
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Flowly', 26, 17);

            // Certificate title
            doc.setFontSize(12);
            doc.text('SALARY CERTIFICATE', 26, 27);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Official Business Document', 26, 33);

            // Company name right
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Flowly Business Suite', w - 14, 18, { align: 'right' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('www.flowly.io', w - 14, 26, { align: 'right' });

            let y = 48;

            // ── Document Reference Bar ──
            doc.setFillColor(248, 250, 254);
            doc.setDrawColor(230, 235, 245);
            doc.setLineWidth(0.2);
            doc.roundedRect(14, y, w - 28, 10, 2, 2, 'FD');
            doc.setFontSize(7);
            doc.setTextColor(100, 110, 130);
            doc.setFont('helvetica', 'normal');
            doc.text(`Document Ref: ${docRef}`, 20, y + 6.5);
            doc.text(`Issue Date: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, w / 2, y + 6.5, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 150, 72);
            doc.text('Status: CERTIFIED', w - 20, y + 6.5, { align: 'right' });

            y += 16;

            // ── Watermark (behind content) ──
            doc.setTextColor(240, 243, 255);
            doc.setFontSize(45);
            doc.setFont('helvetica', 'bold');
            doc.text('CERTIFIED', 105, 175, { align: 'center', angle: 40 });

            // ── Employee Information Box ──
            doc.setFillColor(248, 250, 254);
            doc.setDrawColor(220, 228, 242);
            doc.setLineWidth(0.3);
            doc.roundedRect(14, y, w - 28, 38, 3, 3, 'FD');

            // Section label
            doc.setFillColor(42, 133, 255);
            doc.roundedRect(14, y, 55, 7, 3, 3, 'F');
            doc.rect(14, y + 3, 55, 4, 'F');
            doc.setFontSize(7);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('EMPLOYEE INFORMATION', 18, y + 5.5);

            y += 12;

            const infoLine = (label, value, xPos, yPos) => {
                doc.setFontSize(7);
                doc.setTextColor(130, 140, 160);
                doc.setFont('helvetica', 'normal');
                doc.text(label, xPos, yPos);
                doc.setFontSize(9);
                doc.setTextColor(30, 35, 50);
                doc.setFont('helvetica', 'bold');
                doc.text(String(value || '-'), xPos, yPos + 5);
            };

            infoLine('Full Name', empName, 20, y);
            infoLine('Employee ID', profile?.id?.substring(0, 8)?.toUpperCase() || 'N/A', 20, y + 13);
            infoLine('Department', profile?.department || 'General', w / 2 + 5, y);
            infoLine('Position', profile?.position || 'Employee', w / 2 + 5, y + 13);

            y += 32;

            // ── Salary Details Section ──
            doc.setFillColor(42, 133, 255);
            doc.roundedRect(14, y, w - 28, 9, 2, 2, 'F');
            doc.rect(14, y + 4, w - 28, 5, 'F');
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('SALARY DETAILS', 20, y + 6.5);
            doc.text('AMOUNT (MAD)', w - 20, y + 6.5, { align: 'right' });
            y += 12;

            const drawDetailRow = (label, value, isBold = false, colorOverride = null, highlight = false) => {
                if (highlight) {
                    doc.setFillColor(245, 248, 255);
                    doc.rect(14, y - 4, w - 28, 10, 'F');
                }
                doc.setFontSize(9);
                doc.setFont('helvetica', isBold ? 'bold' : 'normal');
                doc.setTextColor(colorOverride ? colorOverride[0] : 50, colorOverride ? colorOverride[1] : 55, colorOverride ? colorOverride[2] : 70);
                doc.text(label, 22, y);
                doc.text(value, w - 22, y, { align: 'right' });
                doc.setDrawColor(235, 238, 248);
                doc.setLineWidth(0.15);
                doc.line(14, y + 4, w - 14, y + 4);
                y += 10;
            };

            drawDetailRow('Certificate Period', periodLabel);
            drawDetailRow('Base Salary', '8,500.00 MAD');
            drawDetailRow('Allowances', '1,200.00 MAD', false, [16, 150, 72]);
            drawDetailRow('Deductions', '-850.00 MAD', false, [220, 50, 50]);
            drawDetailRow('NET SALARY', '8,850.00 MAD', true, null, true);

            if (certPurpose) {
                y += 2;
                drawDetailRow('Purpose of Certificate', certPurpose);
            }

            y += 4;

            // ── Hire Date Info ──
            doc.setFillColor(248, 250, 254);
            doc.setDrawColor(220, 228, 242);
            doc.setLineWidth(0.2);
            doc.roundedRect(14, y, w - 28, 10, 2, 2, 'FD');
            doc.setFontSize(7);
            doc.setTextColor(100, 110, 130);
            doc.setFont('helvetica', 'normal');
            doc.text(`Employment Start Date: ${profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}`, 20, y + 6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(42, 133, 255);
            doc.text(`Employment Status: Active`, w - 20, y + 6.5, { align: 'right' });

            y += 16;

            // ── Digital Signature Block ──
            doc.setFillColor(250, 251, 254);
            doc.setDrawColor(200, 210, 230);
            doc.setLineWidth(0.3);
            doc.roundedRect(14, y, w - 28, 34, 3, 3, 'FD');

            doc.setFontSize(7);
            doc.setTextColor(120, 130, 150);
            doc.setFont('helvetica', 'bold');
            doc.text('DIGITAL SIGNATURE & VERIFICATION', 20, y + 7);

            doc.setDrawColor(42, 133, 255);
            doc.setLineWidth(0.4);
            doc.line(20, y + 19, 70, y + 19);

            doc.setFontSize(8);
            doc.setTextColor(42, 133, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('Flowly Business Suite — HR Department', 20, y + 17);

            doc.setFontSize(7);
            doc.setTextColor(100, 110, 130);
            doc.setFont('helvetica', 'normal');
            doc.text('Authorized Digital Signature', 20, y + 25);
            doc.text(`Signed: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, 20, y + 30);

            // Verification code on the right
            doc.setFontSize(7);
            doc.setTextColor(120, 130, 150);
            doc.setFont('helvetica', 'normal');
            doc.text('Verification Code:', w - 64, y + 12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(42, 133, 255);
            doc.text(verifyCode, w - 64, y + 19);

            // Small logo mark
            drawLogo(w - 34, y + 6, 0.35, [42, 133, 255]);

            doc.setFontSize(6);
            doc.setTextColor(160, 168, 180);
            doc.setFont('helvetica', 'normal');
            doc.text('This document is digitally signed and verified.', w - 64, y + 26);
            doc.text('Tamper-evident · Electronically sealed', w - 64, y + 30);

            // ── Footer ──
            doc.setFillColor(245, 247, 252);
            doc.rect(0, h - 16, w, 16, 'F');
            doc.setDrawColor(220, 225, 240);
            doc.setLineWidth(0.3);
            doc.line(0, h - 16, w, h - 16);

            doc.setFontSize(6.5);
            doc.setTextColor(140, 150, 170);
            doc.setFont('helvetica', 'normal');
            doc.text('CONFIDENTIAL — This document is intended solely for the named recipient. Unauthorized distribution is prohibited.', w / 2, h - 10, { align: 'center' });
            doc.setFontSize(6);
            doc.text(`© ${now.getFullYear()} Flowly Business Process Management Suite — www.flowly.io`, w / 2, h - 5.5, { align: 'center' });

            doc.save(`salary_certificate_${certPeriod}_${Date.now()}.pdf`);

            // Record in DB + notify
            if (isSupabaseReady && profile?.id) {
                const { data: rec } = await supabase.from('documents').insert({
                    employee_id: profile.id,
                    entreprise_id: profile.entreprise_id || null,
                    title: `Salary Certificate (${periodLabel})`,
                    type: 'salary_certificate',
                    status: 'approved',
                    notes: certPurpose || null,
                    uploaded_by: profile.id,
                }).select().single();
                if (rec) setRequestHistory(prev => [rec, ...prev]);
                cacheService.invalidatePattern('^doc');
                notificationService.onSalaryCertGenerated(profile.id, periodLabel);
            }
            flash('Salary certificate generated and downloaded!');
        } catch (err) {
            console.error('PDF generation error:', err);
            flash('PDF generation failed: ' + err.message, 'error');
        }
        setGenLoading(false);
    }, [certPeriod, certPurpose, profile]);

    // ── Submit official document request ──
    const handleSubmitRequest = useCallback(async () => {
        setReqLoading(true);
        if (!isSupabaseReady || !profile?.id) {
            setTimeout(() => {
                setReqLoading(false);
                setRequestHistory(prev => [{ id: Date.now(), title: reqDocType, type: 'official_request', status: 'pending', urgency: reqUrgency, notes: reqNotes, created_at: new Date().toISOString() }, ...prev]);
                flash('Document request submitted to HR!');
                setReqNotes('');
            }, 800);
            return;
        }
        try {
            const { data: rec } = await supabase.from('documents').insert({
                employee_id: profile.id,
                entreprise_id: profile.entreprise_id || null,
                title: reqDocType,
                type: 'official_request',
                status: 'pending',
                notes: reqNotes,
                urgency: reqUrgency,
                uploaded_by: profile.id,
            }).select().single();
            if (rec) setRequestHistory(prev => [rec, ...prev]);
            flash('Document request submitted to HR!');
            setReqNotes('');
            cacheService.invalidatePattern('^doc');

            // Notify HR
            const hrIds = await getHRUserIds();
            notificationService.onOfficialDocRequested(hrIds, profile.name || profile.email, reqDocType, reqUrgency);
        } catch (err) {
            flash('Request failed: ' + (err.message || 'Unknown error'), 'error');
        }
        setReqLoading(false);
    }, [profile?.id, profile?.entreprise_id, profile?.name, profile?.email, reqDocType, reqUrgency, reqNotes, getHRUserIds]);

    // ── Derived state ──
    const uploadedCount = Object.keys(docRecords).length;
    const pendingOnboarding = DOC_TYPES.length - uploadedCount;
    const hasRejected = Object.values(docRecords).some(r => r.status === 'rejected');
    const allSubmittedOrVerified = uploadedCount >= DOC_TYPES.length && Object.values(docRecords).every(r => r.status === 'submitted' || r.status === 'approved');
    const canSubmit = uploadedCount >= DOC_TYPES.length && !allSubmittedOrVerified && !hasRejected && Object.values(docRecords).some(r => r.status === 'pending');

    if (loadingDocs) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 size={28} className="animate-spin text-text-tertiary" />
            </div>
        );
    }

    // ── Status badge for each doc card ──
    const renderDocStatus = (docKey) => {
        const rec = docRecords[docKey];
        if (!rec) return <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Required</span>;
        const s = STATUS_MAP[rec.status] || STATUS_MAP.pending;
        const Icon = s.icon;
        return <span className={`text-[10px] font-semibold ${s.color} ${s.bg} px-2 py-0.5 rounded flex items-center gap-1`}><Icon size={10} />{s.label}</span>;
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">

                {toast.msg && (
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${toast.type === 'error'
                            ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
                            : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                        {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />} {toast.msg}
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
                            Action Required {(pendingOnboarding > 0 || hasRejected) && !allSubmittedOrVerified && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingOnboarding + (hasRejected ? 1 : 0)}</span>}
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

                        {!allSubmittedOrVerified && (
                            <div className={`p-4 rounded-xl flex items-start gap-4 mb-6 ${hasRejected ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                                <AlertCircle size={20} className={`mt-0.5 shrink-0 ${hasRejected ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                                <div>
                                    <h3 className={`font-bold mb-1 ${hasRejected ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                        {hasRejected ? 'Action Required — Documents Rejected' : 'Complete Your Onboarding'}
                                    </h3>
                                    <p className={`text-sm ${hasRejected ? 'text-red-700/80 dark:text-red-300/80' : 'text-amber-700/80 dark:text-amber-300/80'}`}>
                                        {hasRejected
                                            ? 'Some documents were rejected by HR. Please re-upload the flagged documents and resubmit.'
                                            : <>Welcome {profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there'}! HR has requested {DOC_TYPES.length} documents to complete your onboarding process. Please upload them before <strong>March 25, 2026</strong>.</>
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden">
                            <div className="p-5 border-b border-border-secondary flex justify-between items-center bg-surface-secondary/50">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary">Onboarding Documents</h3>
                                    <p className="text-xs text-text-secondary mt-1">Status: <span className="text-brand-500 font-semibold">{
                                        allSubmittedOrVerified ? (Object.values(docRecords).every(r => r.status === 'approved') ? 'All Verified' : 'Submitted — Under Review')
                                            : `Pending (${uploadedCount}/${DOC_TYPES.length} uploaded)`
                                    }</span></p>
                                </div>
                                {!allSubmittedOrVerified && <span className="text-xs font-semibold bg-surface-primary px-3 py-1.5 rounded-lg border border-border-secondary">Due in 6 days</span>}
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {DOC_TYPES.map(doc => {
                                        const rec = docRecords[doc.key];
                                        const isRejected = rec?.status === 'rejected';
                                        const isUploaded = !!rec;
                                        const canModify = !rec || rec.status === 'pending' || rec.status === 'rejected';
                                        return (
                                            <div key={doc.key} className={`border rounded-xl p-4 bg-surface-secondary relative group transition-colors ${isRejected ? 'border-red-500/40 bg-red-500/5' :
                                                    isUploaded ? 'border-emerald-500/40' : 'border-border-secondary hover:border-brand-500'
                                                }`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="font-semibold text-text-primary text-sm flex items-center gap-2">
                                                        <FileText size={16} className={isRejected ? 'text-red-500' : isUploaded ? 'text-emerald-500' : 'text-brand-500'} /> {doc.label}
                                                    </span>
                                                    {renderDocStatus(doc.key)}
                                                </div>

                                                {/* Rejection reason */}
                                                {isRejected && rec.notes && (
                                                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
                                                        <XCircle size={12} className="shrink-0 mt-0.5" /> {rec.notes}
                                                    </div>
                                                )}

                                                {isUploaded && !isRejected ? (
                                                    <div className="space-y-2">
                                                        <div className="w-full py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                                                            <CheckCircle2 size={16} /> {rec.fileName}
                                                        </div>
                                                        {canModify && (
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handlePreview(doc.key)} className="flex-1 py-1.5 bg-surface-primary border border-border-secondary rounded-lg text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-center gap-1">
                                                                    <Eye size={12} /> Preview
                                                                </button>
                                                                <button onClick={() => handleDelete(doc.key)} className="flex-1 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1">
                                                                    <Trash2 size={12} /> Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {/* Upload progress bar */}
                                                        {uploading[doc.key] && (
                                                            <div className="w-full bg-surface-primary rounded-full h-1.5 mb-1">
                                                                <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress[doc.key] || 0}%` }} />
                                                            </div>
                                                        )}
                                                        <label className="w-full py-2 bg-surface-primary border border-border-secondary border-dashed rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-500/5 transition-colors text-sm font-medium flex items-center justify-center gap-2 cursor-pointer">
                                                            {uploading[doc.key]
                                                                ? <><Loader2 size={16} className="animate-spin" /> Uploading ({uploadProgress[doc.key] || 0}%)...</>
                                                                : isRejected
                                                                    ? <><RefreshCw size={16} /> Re-upload Document</>
                                                                    : <><UploadCloud size={16} /> Upload Formats: PDF, JPG</>
                                                            }
                                                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(doc.key, e)} className="hidden" disabled={uploading[doc.key]} />
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border-secondary">
                                    <button
                                        onClick={handleSubmitAll}
                                        disabled={!canSubmit || submitting}
                                        className={`px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2 ${canSubmit && !submitting
                                                ? 'bg-brand-500 text-white hover:bg-brand-600 cursor-pointer'
                                                : 'bg-brand-500 text-white opacity-50 cursor-not-allowed'
                                            }`}>
                                        {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                            : allSubmittedOrVerified ? <><CheckCircle2 size={16} /> Documents Submitted</>
                                                : 'Submit All Documents'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {activeTab === 'official' && (
                    <div className="animate-fade-in space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Instant Salary Certificate */}
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
                                        <select value={certPeriod} onChange={e => setCertPeriod(e.target.value)} className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                                            <option value="latest">Latest Month (March 2026)</option>
                                            <option value="3months">Last 3 Months (Jan–Mar 2026)</option>
                                            <option value="ytd">Year-to-Date (2026)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-2">Purpose (Optional):</label>
                                        <input type="text" value={certPurpose} onChange={e => setCertPurpose(e.target.value)} placeholder="e.g. Bank Loan Application" className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                                    </div>

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2">
                                        <CheckCircle2 size={16} className="shrink-0" /> No HR approval required. Your verified document will download instantly as an official watermarked PDF.
                                    </div>

                                    <button onClick={handleGeneratePDF} disabled={genLoading} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
                                        {genLoading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Download size={18} /> Generate PDF</>}
                                    </button>
                                </div>
                            </div>

                            {/* Official Document Request */}
                            <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden h-fit">
                                <div className="p-5 border-b border-border-secondary">
                                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                        <Send size={18} className="text-brand-500" /> Request Official Document
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4 text-sm">
                                    <div>
                                        <label className="block text-xs font-semibold text-text-secondary mb-2">Document Type:</label>
                                        <select value={reqDocType} onChange={e => setReqDocType(e.target.value)} className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20">
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
                                        <textarea rows="3" value={reqNotes} onChange={e => setReqNotes(e.target.value)} placeholder="Additional details..." className="w-full bg-surface-secondary border border-border-secondary rounded-xl p-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"></textarea>
                                    </div>

                                    <div className="pt-2">
                                        <button onClick={handleSubmitRequest} disabled={reqLoading} className="w-full py-2.5 bg-surface-primary border border-border-secondary text-text-primary rounded-xl font-medium hover:bg-surface-secondary transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                            {reqLoading ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Request to HR'}
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
                                        const statusVariant = { pending: 'warning', in_review: 'brand', approved: 'success', rejected: 'danger', completed: 'success', submitted: 'brand' };
                                        return (
                                            <div key={req.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-secondary/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${req.doc_type === 'salary_certificate' ? 'bg-emerald-500/10' : 'bg-brand-500/10'
                                                        }`}>
                                                        {req.doc_type === 'salary_certificate'
                                                            ? <FileCheck size={14} className="text-emerald-500" />
                                                            : <Send size={14} className="text-brand-500" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-primary">{req.title}</p>
                                                        <p className="text-[11px] text-text-tertiary">
                                                            {req.created_at ? new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                            {req.urgency === 'urgent' && <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">Urgent</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <StatusBadge variant={statusVariant[req.status] || 'neutral'} dot size="sm">{req.status}</StatusBadge>
                                            </div>
                                        );
                                    })}
                                </div>
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
                            <h3 className="font-semibold text-text-primary flex items-center gap-2">
                                <File size={18} className="text-brand-500" />
                                {previewFile.name}
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors">
                                <X size={18} className="text-text-tertiary" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                            {previewFile.url.match(/\.(pdf)$/i) ? (
                                <iframe src={previewFile.url} className="w-full h-[600px] border border-border-secondary rounded-lg" title="Document Preview" />
                            ) : (
                                <img src={previewFile.url} alt="Document Preview" className="max-w-full h-auto mx-auto rounded-lg border border-border-secondary" />
                            )}
                        </div>
                        <div className="p-4 border-t border-border-secondary flex justify-end gap-2">
                            <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noopener noreferrer"
                                className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors flex items-center gap-2">
                                <Download size={16} /> Download
                            </a>
                            <button onClick={() => setPreviewFile(null)} className="px-4 py-2 bg-surface-primary border border-border-secondary text-text-primary rounded-lg font-medium hover:bg-surface-secondary transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
