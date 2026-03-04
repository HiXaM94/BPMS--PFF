import { Link } from 'react-router-dom';

export default function Header({ isAdmin, setIsAdmin }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
          <img 
            src="/logo_flowly.png" 
            alt="Flowly Logo" 
            className="h-8 w-auto object-contain mix-blend-multiply" 
          />
          <span className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Flowly
          </span>
        </Link>
      </div>
    </header>
  );
}
