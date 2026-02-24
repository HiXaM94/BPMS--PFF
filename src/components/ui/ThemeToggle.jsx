import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl
                 bg-surface-tertiary hover:bg-surface-overlay
                 border border-border-secondary
                 transition-all duration-300 ease-in-out
                 hover:shadow-md hover:scale-105 active:scale-95
                 group cursor-pointer"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun icon */}
      <Sun
        size={18}
        className={`absolute transition-all duration-500 ease-in-out
          ${isDark
            ? 'opacity-100 rotate-0 scale-100 text-amber-400'
            : 'opacity-0 rotate-90 scale-50 text-amber-500'
          }`}
      />
      {/* Moon icon */}
      <Moon
        size={18}
        className={`absolute transition-all duration-500 ease-in-out
          ${isDark
            ? 'opacity-0 -rotate-90 scale-50 text-brand-300'
            : 'opacity-100 rotate-0 scale-100 text-brand-600'
          }`}
      />
    </button>
  );
}
