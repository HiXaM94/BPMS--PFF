import { useRole } from '../../contexts/RoleContext';
import PlaceholderPage from '../PlaceholderPage';
import SuperAdminAnalytics from './analytics/SuperAdminAnalytics';

/**
 * Main Analytics entry point that routes to the correct dashboard view
 * based on the current role from RoleContext.
 */
export default function Analytics() {
    const { currentRole } = useRole();
    const isSuperAdmin = currentRole.id === 'super_admin';

    if (isSuperAdmin) {
        return <SuperAdminAnalytics />;
    }

    // Fallback for other roles mapped to Analytics currently
    return <PlaceholderPage title="Analytics" />;
}
