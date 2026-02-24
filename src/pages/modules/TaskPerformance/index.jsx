
import React from 'react';
import { useRole } from '../../../contexts/RoleContext';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';

// Placeholder dashboards for other roles
const AdminDashboard = () => <div className="p-10 text-center">Admin Dashboard (Coming Soon)</div>;
const HRDashboard = () => <div className="p-10 text-center">HR Dashboard (Coming Soon)</div>;
// ManagerDashboard removed as it's now imported

export default function TaskPerformance() {
    const { currentRole } = useRole();

    switch (currentRole.id) {
        case 'super_admin':
        case 'company_admin':
            return <AdminDashboard />;
        case 'hr':
            return <HRDashboard />;
        case 'manager':
            return <ManagerDashboard />;
        case 'employee':
            return <EmployeeDashboard />;
        default:
            return <EmployeeDashboard />;
    }
}
