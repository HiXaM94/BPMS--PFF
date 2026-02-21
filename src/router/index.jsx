import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import RoleGuard from '../components/ui/RoleGuard';
import Dashboard from '../pages/Dashboard';
import PlaceholderPage from '../pages/PlaceholderPage';

// Module pages
import EnterpriseManagement from '../pages/modules/EnterpriseManagement';
import UserManagement from '../pages/modules/UserManagement';
import EmployeeProfile from '../pages/modules/EmployeeProfile';
import Attendance from '../pages/modules/Attendance';
import TaskPerformance from '../pages/modules/TaskPerformance';
import VacationRequest from '../pages/modules/VacationRequest';
import DocumentRequest from '../pages/modules/DocumentRequest';
import Payroll from '../pages/modules/Payroll';
import Recruitment from '../pages/modules/Recruitment';


/**
 * Application router.
 * All authenticated routes are wrapped in MainLayout.
 * Routes use RoleGuard to enforce role-based access restrictions.
 */
const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      // Dashboard — all roles
      { index: true, element: <Dashboard /> },

      // HR & People
      { path: 'enterprise', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><EnterpriseManagement /></RoleGuard> },
      { path: 'users', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><UserManagement /></RoleGuard> },
      { path: 'profile', element: <EmployeeProfile /> },
      { path: 'attendance', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><Attendance /></RoleGuard> },
      { path: 'recruitment', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><Recruitment /></RoleGuard> },

      // Workflows
      { path: 'tasks', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><TaskPerformance /></RoleGuard> },
      { path: 'vacation', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><VacationRequest /></RoleGuard> },
      { path: 'documents', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><DocumentRequest /></RoleGuard> },
      { path: 'payroll', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><Payroll /></RoleGuard> },



      // Intelligence
      { path: 'analytics', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'manager']}><PlaceholderPage title="Analytics" /></RoleGuard> },
      { path: 'ai-assistant', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager']}><PlaceholderPage title="AI Assistant" /></RoleGuard> },
      { path: 'notifications', element: <PlaceholderPage title="Notifications" /> },

      // System
      { path: 'permissions', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><PlaceholderPage title="Permissions" /></RoleGuard> },
      { path: 'settings', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><PlaceholderPage title="Settings" /></RoleGuard> },

      // Catch-all
      { path: '*', element: <PlaceholderPage title="Page Not Found" /> },
    ],
  },
]);

export default router;
