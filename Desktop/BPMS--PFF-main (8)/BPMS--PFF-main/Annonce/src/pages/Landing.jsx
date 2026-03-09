import { useState, useEffect, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase, isSupabaseReady } from '../services/supabase';
import { jobs as mockJobs } from '../data/jobs';
import JobCard from '../components/JobCard';

export default function Landing({ isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch jobs from Supabase on mount
  useEffect(() => {
    async function fetchJobs() {
      if (!isSupabaseReady) {
        // Fallback to mock data if Supabase is not configured
        setJobs(mockJobs);
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('recrutements')
          .select('*')
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching jobs:', fetchError.message);
          setError('Failed to load job listings.');
          setJobs(mockJobs); // Fallback to mock
        } else {
          // Map Supabase columns to the shape our components expect
          const mappedJobs = (data || []).map((row) => ({
            id: row.id,
            title: row.title || 'Untitled Position',
            salary: row.salary_min && row.salary_max ? `${row.salary_min}-${row.salary_max} MAD` : 'Negotiable',
            type: row.employment_type || 'full_time',
            description: row.description || '',
            requirements: row.requirements || '',
            active: true,
            created_at: row.created_at,
          }));
          setJobs(mappedJobs);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Something went wrong.');
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // In candidate mode, show only active/open jobs
      if (!isAdmin && !job.active) return false;

      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        (job.title || '').toLowerCase().includes(term) ||
        (job.description || '').toLowerCase().includes(term) ||
        (job.type || '').toLowerCase().includes(term)
      );
    });
  }, [jobs, searchTerm, isAdmin]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="bg-black py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-20 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/20" />
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
            Join Our Team
          </h1>
          <p className="text-xl md:text-2xl text-neutral-300 mb-12 font-medium">
            Build the future of Flowly. Discover exciting opportunities <br className="hidden md:block" />
            and do the best work of your career.
          </p>

          <div className="bg-white rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto relative group">
            <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-black focus-within:border-black transition-all">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Search job title or keyword..."
                className="bg-transparent border-none outline-none w-full text-slate-700 placeholder:text-slate-400 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold tracking-wide transition-colors shadow-sm md:w-auto w-full">
                + Post New Job
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        {/* Error Banner */}
        {error && (
          <div className="mb-8 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center">
            {error} Showing cached data.
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-slate-400 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Loading job listings...</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-8 text-center">
              <p className="text-slate-500 font-medium">
                <span className="text-slate-900 font-bold">{filteredJobs.length}</span> open position{filteredJobs.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <JobCard key={job.id} job={job} isAdmin={isAdmin} />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">No jobs found</h3>
                  <p className="text-slate-500">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
