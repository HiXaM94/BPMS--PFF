import { Construction } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/**
 * Placeholder page for routes not yet implemented.
 * Displays the current route name and a friendly message.
 */
export default function PlaceholderPage({ title }) {
  const { pathname } = useLocation();
  const displayTitle = title || pathname
    .split('/')
    .filter(Boolean)
    .map(s => s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    .join(' — ') || 'Page';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl
                      bg-surface-tertiary border border-border-secondary mb-6">
        <Construction size={36} className="text-text-tertiary" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{displayTitle}</h1>
      <p className="text-sm text-text-secondary text-center max-w-md">
        This module is under construction. It will be available once implemented
        in the BPMS platform.
      </p>
    </div>
  );
}
