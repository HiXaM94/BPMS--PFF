import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, Search, Building2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseReady } from '../services/supabase';

export default function JobBoard() {
    const [searchParams] = useSearchParams();
    const companyId = searchParams.get('company');
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [companyName, setCompanyName] = useState('');

    useEffect(() => {
        async function fetchJobs() {
            if (!isSupabaseReady) {
                setError("Supabase is not configured.");
                setLoading(false);
                return;
            }

            try {
                let query = supabase
                    .from('recrutements')
                    .select('*, entreprises(name)')
                    .eq('status', 'open')
                    .order('created_at', { ascending: false });

                if (companyId) {
                    query = query.eq('entreprise_id', companyId);
                }

                const { data, error: err } = await query;
                if (err) throw err;

                setJobs(data || []);
                if (data && data.length > 0 && data[0].entreprises) {
                    setCompanyName(data[0].entreprises.name);
                }
            } catch (err) {
                console.error('Error fetching jobs:', err);
                setError("Failed to load job postings.");
            } finally {
                setLoading(false);
            }
        }

        fetchJobs();
    }, [companyId]);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-brand-500 mx-auto mb-4" />
                    <p className="text-text-secondary font-medium">Loading opportunities...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-secondary pb-20">
            {/* Header */}
            <div className="bg-surface-primary border-b border-border-secondary pt-12 pb-20 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 text-xs font-bold uppercase tracking-wider mb-6">
                        <Briefcase size={14} />
                        Careers {companyName ? `at ${companyName}` : ''}
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-text-primary tracking-tight mb-6">
                        Find your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600">adventure</span>
                    </h1>
                    <p className="text-lg text-text-tertiary max-w-2xl mx-auto mb-10">
                        Join our mission to build the future of enterprise management. We're looking for passionate people to join our global team.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-brand-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search roles, skills, or keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface-secondary border border-border-secondary focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all text-text-primary shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Job List */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10">
                {error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 font-bold">{error}</p>
                        <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-red-500 hover:underline">Try Again</button>
                    </div>
                ) : filteredJobs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className="bg-surface-primary rounded-2xl border border-border-secondary p-6 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded">
                                            {job.employment_type?.replace('_', ' ') || 'Full Time'}
                                        </span>
                                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary group-hover:text-brand-500 transition-colors mb-2">
                                        {job.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
                                        <span className="flex items-center gap-1.5 font-medium">
                                            <Building2 size={16} />
                                            {job.entreprises?.name || 'Department'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={16} />
                                            {job.location}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest">Salary Range</p>
                                        <p className="text-sm font-bold text-text-primary">
                                            {job.salary_min && job.salary_max
                                                ? `${job.salary_min / 1000}K - ${job.salary_max / 1000}K MAD`
                                                : 'Negotiable'}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center text-text-tertiary group-hover:bg-brand-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                        <ArrowRight size={20} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-surface-primary rounded-2xl border border-border-secondary p-12 text-center shadow-sm">
                        <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-text-tertiary opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">No roles found</h3>
                        <p className="text-text-tertiary max-w-xs mx-auto">
                            We couldn't find any job postings matching your current filters. Try searching for something else!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
