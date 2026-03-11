import { Link } from 'react-router-dom';
import { Briefcase, Building2 } from 'lucide-react';
import clsx from 'clsx';

export default function Header({ isAdmin, setIsAdmin }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-black font-bold text-xl hover:text-neutral-700 transition">
          <img src="/logo_flowly.png" alt="Flowly Logo" className="h-8 w-auto mix-blend-multiply" />
          <span className="text-slate-900 tracking-tight ml-1">Flowly</span>
        </Link>
      </div>
    </header>
  );
}
