import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminTickets from './Tickets/AdminTickets';
import SuperAdminTickets from './Tickets/SuperAdminTickets';

export default function Tickets() {
    const { profile } = useAuth();
    const role = profile?.role?.toLowerCase();

    // Route to appropriate ticket view based on role
    if (role === 'super_admin') {
        return <SuperAdminTickets />;
    }

    if (role === 'company_admin' || role === 'admin') {
        return <AdminTickets />;
    }

    // Fallback for roles that shouldn't normally reach here (handled by RoleGuard but safe to have)
    return (
        <div className="flex items-center justify-center p-8 text-text-secondary">
            You do not have permission to view support tickets.
        </div>
    );
}
