import { useRole } from '../../contexts/RoleContext';
import { Shield } from 'lucide-react';

/**
 * Static Role Badge — displays current role label with its identifying color.
 * Updated: Now purely informational per user request to prevent role switching.
 */
export default function RoleSwitcher() {
  const { currentRole } = useRole();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
                    border border-border-secondary bg-surface-primary shadow-sm">
      <div className={`flex items-center justify-center w-6 h-6 rounded-lg
                       bg-gradient-to-br ${currentRole.color}`}>
        <Shield size={12} className="text-white" />
      </div>
      <span className="hidden sm:block text-text-primary font-semibold">
        {currentRole.label}
      </span>
    </div>
  );
}
