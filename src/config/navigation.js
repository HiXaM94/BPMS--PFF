import {
  LayoutDashboard,
  Settings,
  Users,
  Bell,
  BarChart3,
  Sparkles,
  Building2,
  Shield,
  User,
  Clock,
  Target,
  Palmtree,
  File,
  Banknote,
  Briefcase,
} from 'lucide-react';

/**
 * Main navigation items for the sidebar.
 * `section` groups items visually. `roles` can be used later for RBAC filtering.
 */
export const navigationItems = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['all'] },
    ],
  },
  {
    section: 'HR & People',
    items: [
      { id: 'enterprise', label: 'Enterprise', icon: Building2, path: '/enterprise', roles: ['super_admin', 'company_admin'] },
      { id: 'users', label: 'User Management', icon: Users, path: '/users', roles: ['super_admin', 'company_admin', 'hr'] },
      { id: 'profile', label: 'Employee Profile', icon: User, path: '/profile', roles: ['all'] },
      { id: 'attendance', label: 'Attendance', icon: Clock, path: '/attendance', roles: ['super_admin', 'company_admin', 'hr', 'manager', 'employee'] },
      { id: 'recruitment', label: 'Recruitment', icon: Briefcase, path: '/recruitment', roles: ['super_admin', 'company_admin', 'hr'] },
    ],
  },
  {
    section: 'Workflows',
    items: [
      { id: 'tasks', label: 'Task & Performance', icon: Target, path: '/tasks', roles: ['super_admin', 'company_admin', 'hr', 'manager', 'employee'] },
      { id: 'vacation', label: 'Vacation Request', icon: Palmtree, path: '/vacation', roles: ['super_admin', 'company_admin', 'hr', 'manager', 'employee'] },
      { id: 'documents', label: 'Document Request', icon: File, path: '/documents', roles: ['super_admin', 'company_admin', 'hr', 'manager', 'employee'] },
      { id: 'payroll', label: 'Payroll', icon: Banknote, path: '/payroll', roles: ['super_admin', 'company_admin', 'hr'] },
    ],
  },

  {
    section: 'Intelligence',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['super_admin', 'company_admin', 'manager'] },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, path: '/ai-assistant', roles: ['super_admin', 'company_admin', 'hr', 'manager'] },
      { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', roles: ['all'] },
    ],
  },
  {
    section: 'System',
    items: [
      { id: 'permissions', label: 'Permissions', icon: Shield, path: '/permissions', roles: ['super_admin', 'company_admin'] },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', roles: ['super_admin', 'company_admin'] },
    ],
  },
];
