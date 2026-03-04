import { MapPin, Briefcase, Building } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JobCard({ job, isAdmin }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-300 flex flex-col h-full group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 group-hover:text-black transition-colors">
            {job.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md font-medium text-slate-700">
              <Building className="w-4 h-4" />
              {job.department}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {job.location}
            </span>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${job.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {job.active ? 'Active' : 'Draft'}
            </span>
          </div>
        )}
      </div>

      <p className="text-slate-600 line-clamp-3 mb-6 flex-grow">
        {job.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <Briefcase className="w-4 h-4 text-slate-400" />
          {job.type}
        </span>
        
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
              className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-neutral-800 active:bg-neutral-900 transition shadow-sm hover:shadow"
            >
              Apply Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
