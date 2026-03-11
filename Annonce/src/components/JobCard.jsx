import { Briefcase, Banknote } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobCard({ job, isAdmin }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300 flex flex-col h-full group">
      {/* Title + Status */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-slate-900 group-hover:text-black transition-colors">
          {job.title}
        </h3>
        {isAdmin && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full shrink-0 ml-3 ${job.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {job.active ? 'Active' : 'Draft'}
          </span>
        )}
      </div>

      {/* Salary + Contract Type Tags */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
          <Banknote className="w-4 h-4" />
          {job.salary || 'Negotiable'}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
          <Briefcase className="w-4 h-4 text-slate-400" />
          {job.type}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-600 line-clamp-3 mb-6 flex-grow leading-relaxed">
        {job.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <button className="text-sm font-semibold text-slate-600 hover:text-black transition-colors px-3 py-1.5 rounded-md hover:bg-neutral-100">
                Edit
              </button>
              <button className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors px-3 py-1.5 rounded-md hover:bg-red-50">
                Delete
              </button>
            </>
          ) : (
            <Link
              to={`/job/${job.id}`}
              className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-neutral-800 active:bg-neutral-900 transition shadow-sm hover:shadow"
            >
              Apply Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
