import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Banknote, Loader2 } from 'lucide-react';
import { supabase, isSupabaseReady } from '../services/supabase';
import { jobs as mockJobs } from '../data/jobs';

export default function JobDetails({ isAdmin }) {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJob() {
      if (!isSupabaseReady) {
        // Fallback to mock data
        const found = mockJobs.find((j) => j.id === id);
        setJob(found || null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('recrutements')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.error('Error fetching job:', error?.message);
          setJob(null);
        } else {
          setJob({
            id: data.id,
            title: data.title || 'Untitled Position',
            salary: data.salary_min && data.salary_max ? `${data.salary_min}-${data.salary_max} MAD` : 'Negotiable',
            type: data.employment_type || 'full_time',
            description: data.description || '',
            requirements: data.requirements || '',
            active: true,
            created_at: data.created_at,
          });
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setJob(null);
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center">
        <h2 className="text-3xl font-bold text-slate-800">Job Not Found</h2>
        <Link to="/" className="text-black font-medium hover:underline mt-4 inline-block">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-black transition-colors mb-8 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all jobs
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{job.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium">
                <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <Banknote className="w-5 h-5" /> {job.salary}
                </span>
                <span className="flex items-center gap-2 bg-neutral-100 text-black px-3 py-1.5 rounded-lg border border-neutral-200">
                  <Briefcase className="w-5 h-5" /> {job.type}
                </span>
              </div>
            </div>
            
            {!isAdmin && (
              <Link
                to={`/apply/${job.id}`}
                className="w-full md:w-auto text-center bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg shadow-neutral-300/50 shrink-0 text-lg"
              >
                Apply Now
              </Link>
            )}
            
            {isAdmin && (
              <button className="w-full md:w-auto text-center bg-white border-2 border-slate-200 hover:border-black text-slate-700 hover:text-neutral-700 px-8 py-3 rounded-xl font-bold transition-all shrink-0">
                Edit Job
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">About the Role</h2>
            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">{job.description}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
