import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Available roles in the BPMS platform.
 * Each role has an id, display label, description, and color.
 */
export const ROLES = [
  {
    id: 'admin',
    label: 'Administrator',
    shortLabel: 'Admin',
    description: 'Full platform access, organization management',
    color: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    companyId: 1, // TechCorp International
  },
  {
    id: 'hr',
    label: 'HR Manager',
    shortLabel: 'HR',
    description: 'Human resources workflows and employee management',
    color: 'from-pink-500 to-rose-600',
    textColor: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    companyId: 2, // FinServe Global
  },
  {
    id: 'manager',
    label: 'Team Manager',
    shortLabel: 'Manager',
    description: 'Team oversight, approvals, and process monitoring',
    color: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    companyId: 3, // MediCare Plus
  },
  {
    id: 'employee',
    label: 'Employee',
    shortLabel: 'Employee',
    description: 'Task execution, requests, and personal dashboard',
    color: 'from-emerald-500 to-teal-600',
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    companyId: 1, // TechCorp International
  },
];

const RoleContext = createContext(undefined);

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bpms-role');
      const found = ROLES.find(r => r.id === stored);
      if (found) return found;
    }
    return ROLES[0]; // Default to admin
  });

  const switchRole = useCallback((roleId) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role) {
      setCurrentRole(role);
      localStorage.setItem('bpms-role', roleId);
    }
  }, []);

  return (
    <RoleContext.Provider value={{ currentRole, switchRole, roles: ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within RoleProvider');
  return ctx;
}
