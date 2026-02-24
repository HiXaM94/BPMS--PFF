import { Navigate } from 'react-router-dom';
import { useRole } from '../../contexts/RoleContext';
import { ShieldAlert } from 'lucide-react';

/**
 * Route guard that checks the current role against allowed roles.
 * If the role is not allowed, shows an "Access Denied" card and redirects to dashboard.
 *
 * Usage:
 *   <RoleGuard allowedRoles={['admin', 'hr']}><SomeModule /></RoleGuard>
 */
export default function RoleGuard({ allowedRoles = [], children }) {
  const { currentRole } = useRole();

  // 'all' means every role is allowed
  if (allowedRoles.includes('all') || allowedRoles.includes(currentRole.id)) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-8 max-w-md text-center shadow-lg">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4
                        bg-gradient-to-br from-red-500/15 to-rose-500/15">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Access Denied</h2>
        <p className="text-sm text-text-secondary mb-6">
          Your current role <strong className="text-text-primary">({currentRole.label})</strong> does not have
          permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                     bg-gradient-to-r from-brand-500 to-brand-600 text-white
                     text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5
                     active:translate-y-0 transition-all duration-200"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
