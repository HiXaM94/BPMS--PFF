import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Briefcase, MapPin, Clock, Building2, ChevronLeft,
    Upload, FileText, CheckCircle2, AlertCircle, Loader2,
    Phone, Mail, User
} from 'lucide-react';
import { supabase, isSupabaseReady } from '../services/supabase';

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        async function fetchJob() {
            if (!isSupabaseReady) {
                setError("Supabase not configured.");
                setLoading(false);
                return;
            }

            try {
                const { data, error: err } = await supabase
                    .from('recrutements')
                    .select('*, entreprises(name)')
                    .eq('id', id)
                    .single();

                if (err) throw err;
                setJob(data);
            } catch (err) {
                console.error('Error:', err);
                setError("Job posting not found.");
            } finally {
                setLoading(false);
            }
        }
        fetchJob();
    }, [id]);

    const handleFileUpload = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
        } else {
            alert("Please upload a PDF file.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Please upload your CV (PDF).");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Upload CV to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `candidates/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('flowly-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('flowly-files')
                .getPublicUrl(filePath);

            // 2. Insert Candidate Record (include entreprise_id for multitenancy)
            const { error: insertError } = await supabase
                .from('candidates')
                .insert({
                    recrutement_id: id,
                    entreprise_id: job?.entreprise_id || null,
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    cv_url: publicUrl,
                    status: 'new',
                    stage: 'HR Screen'
                });

            if (insertError) throw insertError;

            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Submission error:', err);
            alert("Failed to submit application: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-6">
                <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-6">
                <div className="bg-surface-primary rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-text-primary mb-2">Notice</h2>
                    <p className="text-text-tertiary mb-6">{error || "This job posting is no longer available."}</p>
                    <Link to="/jobs" className="text-brand-500 font-bold hover:underline">Back to Job Board</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary pb-20">
            {/* Navbar / Back Link */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-sm font-bold text-text-tertiary hover:text-brand-500 transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back to Listings
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Job Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface-primary border border-border-secondary rounded-2xl p-8 shadow-sm">
                        {isSuccess ? (
                            <div className="text-center py-12 animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-black text-text-primary mb-2">Application Sent!</h2>
                                <p className="text-text-tertiary mb-8 max-w-sm mx-auto">
                                    Thank you for applying for the <strong>{job.title}</strong> position. Our team will review your application and get back to you soon.
                                </p>
                                <Link to="/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-all">
                                    Browse More Jobs
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded">
                                            {job.employment_type?.replace('_', ' ') || 'Full Time'}
                                        </span>
                                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl font-black text-text-primary tracking-tight mb-4">
                                        {job.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                                        <span className="flex items-center gap-1.5 font-bold text-text-secondary">
                                            <Building2 size={16} className="text-brand-500" />
                                            {job.entreprises?.name || 'Department'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={16} />
                                            {job.location}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 border-l-4 border-brand-500 pl-3">About the Role</h3>
                                        <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-line prose prose-sm max-w-none">
                                            {job.description}
                                        </div>
                                    </div>

                                    {job.requirements && (
                                        <div>
                                            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 border-l-4 border-brand-500 pl-3">Requirements</h3>
                                            <div className="text-text-secondary text-sm leading-relaxed whitespace-pre-line prose prose-sm max-w-none">
                                                {job.requirements}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 rounded-xl bg-surface-secondary border border-border-secondary flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Expected Salary</p>
                                            <p className="text-lg font-black text-text-primary">
                                                {job.salary_min && job.salary_max
                                                    ? `${job.salary_min / 1000}K - ${job.salary_max / 1000}K MAD`
                                                    : 'Negotiable'}
                                            </p>
                                        </div>
                                        <Briefcase className="text-brand-500 opacity-20" size={32} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Application Form */}
                {!isSuccess && (
                    <div className="lg:col-span-1">
                        <div className="bg-surface-primary border border-border-secondary rounded-2xl p-6 shadow-sm sticky top-6">
                            <h3 className="text-lg font-bold text-text-primary mb-6">Apply for this position</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-text-tertiary" size={16} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Jane Doe"
                                            value={form.name}
                                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-text-tertiary" size={16} />
                                        <input
                                            required
                                            type="email"
                                            placeholder="jane@example.com"
                                            value={form.email}
                                            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 text-text-tertiary" size={16} />
                                        <input
                                            required
                                            type="tel"
                                            placeholder="+212 6..."
                                            value={form.phone}
                                            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-secondary border border-border-secondary text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Upload CV (PDF)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                        />
                                        <div className={`w-full py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border-secondary group-hover:border-brand-500/50 group-hover:bg-brand-500/5'}`}>
                                            {file ? (
                                                <>
                                                    <FileText className="text-emerald-500 mb-2" size={24} />
                                                    <p className="text-xs font-bold text-emerald-600 truncate max-w-[150px]">{file.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="text-text-tertiary group-hover:text-brand-500 transition-colors mb-2" size={24} />
                                                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-tighter">Click or drag PDF</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3.5 bg-text-primary text-text-inverse rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="animate-spin" size={18} /> Submitting...</>
                                    ) : (
                                        "Submit Application"
                                    )}
                                </button>

                                <p className="text-[10px] text-text-tertiary text-center leading-tight">
                                    By clicking submit, you agree to our terms and conditions regarding data processing.
                                </p>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
