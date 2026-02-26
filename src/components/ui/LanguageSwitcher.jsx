import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { locale, switchLanguage, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-9 h-9 rounded-xl
                   hover:bg-surface-tertiary transition-colors duration-200 cursor-pointer group"
        aria-label="Switch language"
        title={languages[locale].label}
      >
        <Globe size={18} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
      </button>

      <div
        className={`absolute top-full right-0 mt-2 w-40 bg-surface-primary border border-border-secondary
                     rounded-xl shadow-xl overflow-hidden z-[150]
                     transition-all duration-200 origin-top-right
                     ${open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {Object.entries(languages).map(([code, lang]) => (
          <button
            key={code}
            onClick={() => { switchLanguage(code); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer
                        ${locale === code
                          ? 'bg-brand-500/10 text-brand-600 font-semibold'
                          : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                        }`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
