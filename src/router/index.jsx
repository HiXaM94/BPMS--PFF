import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthGuard from '../components/ui/AuthGuard';
import RoleGuard from '../components/ui/RoleGuard';
import Dashboard from '../pages/Dashboard';
import PlaceholderPage from '../pages/PlaceholderPage';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

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
import HRWorkflow from '../pages/modules/HRWorkflow';
import Settings from '../pages/Settings';
import Permissions from '../pages/Permissions';
import AIAssistant from '../pages/AIAssistant';
import Analytics from '../pages/modules/Analytics';
import RealAnalyticsRouter from '../pages/modules/RealAnalyticsRouter';
import QRKiosk from '../pages/modules/attendance/qrcode/QRKiosk';
import Notifications from '../pages/modules/Notifications';
import CompleteProfile from '../pages/modules/CompleteProfile';
import Tickets from '../pages/modules/Tickets';

const router = createBrowserRouter([
  // ── Public auth routes ──
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/kiosk', element: <QRKiosk /> },

  // ── Protected app routes ──
  {
    element: <AuthGuard><MainLayout /></AuthGuard>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tickets', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'admin']}><Tickets /></RoleGuard> },

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
      { path: 'hr-workflow', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager']}><HRWorkflow /></RoleGuard> },

      // Intelligence
      { path: 'subscriptions', element: <RoleGuard allowedRoles={['super_admin']}><Analytics /></RoleGuard> },
      { path: 'analytics', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'manager']}><RealAnalyticsRouter /></RoleGuard> },
      { path: 'ai-assistant', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager']}><AIAssistant /></RoleGuard> },
      { path: 'notifications', element: <Notifications /> },

      // System
      { path: 'permissions', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><Permissions /></RoleGuard> },
      { path: 'settings', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><Settings /></RoleGuard> },
      { path: 'complete-profile', element: <RoleGuard allowedRoles={['employee', 'manager', 'team_manager']}><CompleteProfile /></RoleGuard> },

      { path: '*', element: <PlaceholderPage title="Page Not Found" /> },
    ],
  },
]);

export default router;
