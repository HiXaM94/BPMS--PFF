import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isSupabaseReady } from '../../services/supabase';
import { Loader2 } from 'lucide-react';

/**
 * Wraps protected routes. Redirects to /login if not authenticated.
 * In offline/demo mode (no Supabase), always allows access.
 */
export default function AuthGuard({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Offline / demo mode — skip auth entirely
  if (!isSupabaseReady) return children;

  if (loading) {
    return (
      <div className="min-h-screen bg-sidebar-bg flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
