import { useState, useRef, useEffect } from 'react';
import { useRole } from '../../contexts/RoleContext';
import { ChevronDown, Check, Shield } from 'lucide-react';

/**
 * Role switcher dropdown for simulating role-based views.
 * Displays the current role with its color and allows switching.
 */
export default function RoleSwitcher() {
  const { currentRole, switchRole, roles } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="role-switcher"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium
                   border border-border-secondary hover:border-brand-300
                   bg-surface-primary hover:bg-surface-tertiary
                   transition-all duration-200 cursor-pointer group`}
      >
        <div className={`flex items-center justify-center w-6 h-6 rounded-lg
                         bg-gradient-to-br ${currentRole.color}`}>
          <Shield size={12} className="text-white" />
        </div>
        <span className="hidden sm:block text-text-primary">{currentRole.shortLabel}</span>
        <ChevronDown
          size={14}
          className={`text-text-tertiary transition-transform duration-200
                     ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl
                        bg-surface-elevated border border-border-secondary
                        shadow-xl animate-scale-in origin-top-right z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-secondary">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              Switch Role (Demo)
            </p>
          </div>

          {/* Role list */}
          <div className="py-1.5">
            {roles.map((role) => {
              const isActive = role.id === currentRole.id;
              return (
                <button
                  key={role.id}
                  onClick={() => {
                    switchRole(role.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3
                             transition-colors duration-150 cursor-pointer text-left
                             ${isActive
                              ? 'bg-brand-500/5'
                              : 'hover:bg-surface-tertiary'
                             }`}
                >
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                                   bg-gradient-to-br ${role.color} shadow-sm`}>
                    <Shield size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold
                        ${isActive ? 'text-brand-500' : 'text-text-primary'}`}>
                        {role.label}
                      </span>
                      {isActive && <Check size={14} className="text-brand-500" />}
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5 truncate">
                      {role.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 border-t border-border-secondary bg-surface-secondary/50">
            <p className="text-[10px] text-text-tertiary text-center">
              Role simulation for demo purposes only
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
