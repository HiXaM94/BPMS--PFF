
import React from 'react';
import { useRole } from '../../../contexts/RoleContext';
import EmployeeDashboard from './EmployeeDashboard';
import ManagerDashboard from './ManagerDashboard';
import HRPerformanceView from './HRPerformanceView';

import AdminPerformanceView from './AdminPerformanceView';
import SuperAdminPerformanceView from './SuperAdminPerformanceView';

// Placeholder dashboards for other roles
// const AdminDashboard = () => <div className="p-10 text-center">Admin Dashboard (Coming Soon)</div>;
// ManagerDashboard removed as it's now imported

export default function TaskPerformance() {
    const { currentRole } = useRole();

    switch (currentRole.id) {
        case 'super_admin':
            return <SuperAdminPerformanceView />;
        case 'company_admin':
            return <AdminPerformanceView />;
        case 'hr':
            return <HRPerformanceView />;
        case 'manager':
            return <ManagerDashboard />;
        case 'employee':
            return <EmployeeDashboard />;
        default:
            return <EmployeeDashboard />;
    }
}
