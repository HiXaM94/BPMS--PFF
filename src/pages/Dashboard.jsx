import { useRole } from '../contexts/RoleContext';
import SuperAdminDashboard from './dashboards/SuperAdmin/SuperAdminDashboard';
import AdminDashboard from './dashboards/Admin/AdminDashboard';
import HRDashboard from './dashboards/HR/HRDashboard';
import ManagerDashboard from './dashboards/Manager/ManagerDashboard';
import EmployeeDashboard from './dashboards/Employee/EmployeeDashboard';

/**
 * Dashboard page — delegates to the appropriate role-specific dashboard
 * based on the current role from RoleContext.
 */
const dashboardMap = {
  super_admin: SuperAdminDashboard,
  company_admin: AdminDashboard,
  admin: AdminDashboard, // fallback
  hr: HRDashboard,
  manager: ManagerDashboard,
  employee: EmployeeDashboard,
};

export default function Dashboard() {
  const { currentRole } = useRole();
  const DashboardComponent = dashboardMap[currentRole.id] || AdminDashboard;

  return <DashboardComponent />;
}
