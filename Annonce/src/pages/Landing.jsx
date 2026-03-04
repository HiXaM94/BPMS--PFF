import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { jobs as mockJobs, departments } from '../data/jobs';
import JobCard from '../components/JobCard';

export default function Landing({ isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [jobs, setJobs] = useState(mockJobs);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // If candidate mode, show only active jobs
      if (!isAdmin && !job.active) return false;

      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            job.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'All' || job.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [jobs, searchTerm, selectedDept, isAdmin]);

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
                placeholder="Search job title or location..."
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
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                selectedDept === dept
                  ? 'bg-black text-white shadow-md ring-2 ring-black ring-offset-2'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-neutral-400 hover:text-black'
              }`}
            >
              {dept}
            </button>
          ))}
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
              <p className="text-slate-500">Try adjusting your search criteria or filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
