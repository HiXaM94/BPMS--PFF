import { useRole } from '../contexts/RoleContext';
import AdminDashboard from './dashboards/AdminDashboard';
import HRDashboard from './dashboards/HRDashboard';
import ManagerDashboard from './dashboards/ManagerDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';

/**
 * Dashboard page — delegates to the appropriate role-specific dashboard
 * based on the current role from RoleContext.
 */
const dashboardMap = {
  admin: AdminDashboard,
  hr: HRDashboard,
  manager: ManagerDashboard,
  employee: EmployeeDashboard,
};

export default function Dashboard() {
  const { currentRole } = useRole();
  const DashboardComponent = dashboardMap[currentRole.id] || AdminDashboard;

  return <DashboardComponent />;
}
