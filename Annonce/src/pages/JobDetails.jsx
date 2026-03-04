import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Briefcase, GraduationCap, Banknote, CheckCircle2 } from 'lucide-react';
import { jobs } from '../data/jobs';

export default function JobDetails({ isAdmin }) {
  const { id } = useParams();
  const job = jobs.find((j) => j.id === id);

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
              
              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-medium whitespace-nowrap">
                <span className="flex items-center gap-2 bg-neutral-100 text-black px-3 py-1.5 rounded-lg border border-neutral-200">
                  <Building2 className="w-5 h-5" /> {job.department}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-slate-400" /> {job.location}
                </span>
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-slate-400" /> {job.type}
                </span>
                {job.salary && (
                  <span className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <Banknote className="w-5 h-5" /> {job.salary}
                  </span>
                )}
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
        <div className="p-8 md:p-12 space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">About the Role</h2>
            <p className="text-slate-600 leading-relaxed text-lg">{job.description}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Requirements</h2>
            <ul className="space-y-4">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start text-slate-600 text-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-3 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-black" /> Experience & Skills
            </h2>
            <p className="text-slate-700 font-medium mb-4">Required Experience: <span className="bg-white px-3 py-1 rounded-md border border-slate-200 ml-2 shadow-sm">{job.experience}</span></p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, i) => (
                <span key={i} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
