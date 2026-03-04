import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center gap-3 mb-4 group hover:opacity-80 transition-opacity">
              <div className="bg-white/95 p-1.5 rounded-lg flex items-center justify-center">
                <img 
                  src="/logo_flowly.png" 
                  alt="Flowly Logo" 
                  className="h-6 w-auto object-contain mix-blend-multiply" 
                />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Flowly
              </span>
            </Link>
            <p className="text-slate-400 text-sm">Join our team of passionate builders.</p>
          </div>
          <div className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Flowly. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
