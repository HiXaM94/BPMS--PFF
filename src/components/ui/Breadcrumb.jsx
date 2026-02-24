import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { navigationItems } from '../../config/navigation';

/**
 * Generates breadcrumb trail from the current path by matching against navigation config.
 */
function useBreadcrumbs() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const crumbs = [{ label: 'Home', path: '/', icon: Home }];

    if (pathname === '/') return crumbs;

    // Find matching navigation item
    for (const section of navigationItems) {
      for (const item of section.items) {
        if (item.path === pathname) {
          crumbs.push({ label: item.label, path: item.path });
          return crumbs;
        }
      }
    }

    // Fallback: build from path segments
    const segments = pathname.split('/').filter(Boolean);
    segments.forEach((segment, idx) => {
      const path = '/' + segments.slice(0, idx + 1).join('/');
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      crumbs.push({ label, path });
    });

    return crumbs;
  }, [pathname]);
}

export default function Breadcrumb() {
  const breadcrumbs = useBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = crumb.icon;

        return (
          <span key={crumb.path} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight size={14} className="text-text-tertiary" />
            )}
            {isLast ? (
              <span className="flex items-center gap-1.5 font-medium text-text-primary">
                {Icon && <Icon size={14} />}
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="flex items-center gap-1.5 text-text-secondary hover:text-brand-500
                           transition-colors duration-200"
              >
                {Icon && <Icon size={14} />}
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
