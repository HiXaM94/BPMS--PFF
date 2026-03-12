import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import AuthGuard from '../components/ui/AuthGuard';
import RoleGuard from '../components/ui/RoleGuard';

// Eagerly loaded for fast core UX
import Login from '../pages/auth/Login';
import Dashboard from '../pages/Dashboard';
import PlaceholderPage from '../pages/PlaceholderPage';

// Suspense Loader
const PageLoader = () => (
  <div className="flex h-[50vh] items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
  </div>
);

const Loadable = (Component) => (props) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

// Lazy Loaded Pages
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));

const EnterpriseManagement = lazy(() => import('../pages/modules/EnterpriseManagement'));
const UserManagement = lazy(() => import('../pages/modules/UserManagement'));
const EmployeeProfile = lazy(() => import('../pages/modules/EmployeeProfile'));
const Attendance = lazy(() => import('../pages/modules/Attendance'));
const TaskPerformance = lazy(() => import('../pages/modules/TaskPerformance'));
const VacationRequest = lazy(() => import('../pages/modules/VacationRequest'));
const DocumentRequest = lazy(() => import('../pages/modules/DocumentRequest'));
const Payroll = lazy(() => import('../pages/modules/Payroll'));
const Recruitment = lazy(() => import('../pages/modules/Recruitment'));
const HRWorkflow = lazy(() => import('../pages/modules/HRWorkflow'));
const AIRecruitmentAssistant = lazy(() => import('../pages/modules/HR/AIRecruitmentAssistant'));
const Settings = lazy(() => import('../pages/Settings'));
const MySettings = lazy(() => import('../pages/MySettings'));
const Permissions = lazy(() => import('../pages/Permissions'));
const AIAssistant = lazy(() => import('../pages/AIAssistant'));
const Analytics = lazy(() => import('../pages/modules/Analytics'));
const RealAnalyticsRouter = lazy(() => import('../pages/modules/RealAnalyticsRouter'));
const QRKiosk = lazy(() => import('../pages/modules/attendance/qrcode/QRKiosk'));
const Notifications = lazy(() => import('../pages/modules/Notifications'));
const CompleteProfile = lazy(() => import('../pages/modules/CompleteProfile'));
const Tickets = lazy(() => import('../pages/modules/Tickets'));
const JobBoard = lazy(() => import('../pages/JobBoard'));
const JobDetail = lazy(() => import('../pages/JobDetail'));

const LoadableRegister = Loadable(Register);
const LoadableForgotPassword = Loadable(ForgotPassword);
const LoadableResetPassword = Loadable(ResetPassword);
const LoadableEnterpriseManagement = Loadable(EnterpriseManagement);
const LoadableUserManagement = Loadable(UserManagement);
const LoadableEmployeeProfile = Loadable(EmployeeProfile);
const LoadableAttendance = Loadable(Attendance);
const LoadableTaskPerformance = Loadable(TaskPerformance);
const LoadableVacationRequest = Loadable(VacationRequest);
const LoadableDocumentRequest = Loadable(DocumentRequest);
const LoadablePayroll = Loadable(Payroll);
const LoadableRecruitment = Loadable(Recruitment);
const LoadableHRWorkflow = Loadable(HRWorkflow);
const LoadableAIRecruitmentAssistant = Loadable(AIRecruitmentAssistant);
const LoadableSettings = Loadable(Settings);
const LoadableMySettings = Loadable(MySettings);
const LoadablePermissions = Loadable(Permissions);
const LoadableAIAssistant = Loadable(AIAssistant);
const LoadableAnalytics = Loadable(Analytics);
const LoadableRealAnalyticsRouter = Loadable(RealAnalyticsRouter);
const LoadableQRKiosk = Loadable(QRKiosk);
const LoadableNotifications = Loadable(Notifications);
const LoadableCompleteProfile = Loadable(CompleteProfile);
const LoadableTickets = Loadable(Tickets);
const LoadableJobBoard = Loadable(JobBoard);
const LoadableJobDetail = Loadable(JobDetail);

// Public pages
import Careers from '../pages/public/Careers';

const router = createBrowserRouter([
  // ── Public auth routes ──
  { path: '/login', element: <Login /> },
  { path: '/register', element: <LoadableRegister /> },
  { path: '/forgot-password', element: <LoadableForgotPassword /> },
  { path: '/reset-password', element: <LoadableResetPassword /> },
  { path: '/kiosk', element: <LoadableQRKiosk /> },
  { path: '/jobs', element: <LoadableJobBoard /> },
  { path: '/jobs/:id', element: <LoadableJobDetail /> },

  // ── Protected app routes ──
  {
    element: <AuthGuard><MainLayout /></AuthGuard>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'tickets', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'admin']}><LoadableTickets /></RoleGuard> },

      // HR & People
      { path: 'enterprise', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><LoadableEnterpriseManagement /></RoleGuard> },
      { path: 'users', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><LoadableUserManagement /></RoleGuard> },
      { path: 'profile', element: <LoadableEmployeeProfile /> },
      { path: 'attendance', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><LoadableAttendance /></RoleGuard> },
      { path: 'recruitment', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><LoadableRecruitment /></RoleGuard> },

      // Workflows
      { path: 'tasks', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><LoadableTaskPerformance /></RoleGuard> },
      { path: 'vacation', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><LoadableVacationRequest /></RoleGuard> },
      { path: 'documents', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr', 'manager', 'employee']}><LoadableDocumentRequest /></RoleGuard> },
      { path: 'payroll', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><LoadablePayroll /></RoleGuard> },
      { path: 'hr-workflow', element: <RoleGuard allowedRoles={['super_admin', 'hr']}><LoadableHRWorkflow /></RoleGuard> },

      // Intelligence
      { path: 'subscriptions', element: <RoleGuard allowedRoles={['super_admin']}><LoadableAnalytics /></RoleGuard> },
      { path: 'analytics', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'manager']}><LoadableRealAnalyticsRouter /></RoleGuard> },
      { path: 'ai-assistant', element: <RoleGuard allowedRoles={['super_admin', 'hr']}><LoadableAIAssistant /></RoleGuard> },
      { path: 'ai-recruitment', element: <RoleGuard allowedRoles={['hr']}><LoadableAIRecruitmentAssistant /></RoleGuard> },
      { path: 'notifications', element: <LoadableNotifications /> },

      // System
      { path: 'permissions', element: <RoleGuard allowedRoles={['super_admin', 'company_admin']}><LoadablePermissions /></RoleGuard> },
      { path: 'settings', element: <RoleGuard allowedRoles={['super_admin', 'company_admin', 'hr']}><LoadableSettings /></RoleGuard> },
      { path: 'my-settings', element: <RoleGuard allowedRoles={['manager', 'employee']}><LoadableMySettings /></RoleGuard> },
      { path: 'complete-profile', element: <RoleGuard allowedRoles={['employee', 'manager', 'team_manager']}><LoadableCompleteProfile /></RoleGuard> },

      { path: '*', element: <PlaceholderPage title="Page Not Found" /> },
    ],
  },
]);

export default router;
