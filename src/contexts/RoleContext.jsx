import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Available roles in the BPMS platform.
 * Each role has an id, display label, description, and color.
 */
export const ROLES = [
  {
    id: 'super_admin',
    label: 'Super Admin',
    shortLabel: 'S-Admin',
    description: 'SaaS Platform Owner, cross-company monitoring',
    color: 'from-[#8e55ea] to-[#b38cf5]',
    textColor: 'text-[#8e55ea]',
    bgColor: 'bg-[#8e55ea]/10',
    companyId: 0, // Platform level
  },
  {
    id: 'company_admin',
    label: 'Company Admin',
    shortLabel: 'Company Admin',
    description: 'Director/Manager Principal, full company control',
    color: 'from-[#f43f5e] to-[#fb7185]',
    textColor: 'text-[#f43f5e]',
    bgColor: 'bg-[#f43f5e]/10',
    companyId: 1, // Acme Corp
  },
  {
    id: 'hr',
    label: 'HR Manager',
    shortLabel: 'HR',
    description: 'Human resources workflows and employee management',
    color: 'from-[#2a85ff] to-[#6cb4ff]',
    textColor: 'text-[#2a85ff]',
    bgColor: 'bg-[#2a85ff]/10',
    companyId: 1, // Acme Corp
  },
  {
    id: 'manager',
    label: 'Team Manager',
    shortLabel: 'Manager',
    description: 'Team oversight, approvals, and process monitoring',
    color: 'from-[#ff9a55] to-[#ffbe7b]',
    textColor: 'text-[#ff9a55]',
    bgColor: 'bg-[#ff9a55]/10',
    companyId: 1, // Acme Corp
  },
  {
    id: 'employee',
    label: 'Employee',
    shortLabel: 'Employee',
    description: 'Task execution, requests, and personal dashboard',
    color: 'from-[#83bf6e] to-[#a8d99a]',
    textColor: 'text-[#83bf6e]',
    bgColor: 'bg-[#83bf6e]/10',
    companyId: 1, // Acme Corp
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
