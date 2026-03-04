import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRole } from '../../contexts/RoleContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, Check, Shield, AlertTriangle } from 'lucide-react';
import { cacheService } from '../../services/CacheService';
import { auditService } from '../../services/AuditService';

/**
 * Role switcher dropdown for simulating role-based views.
 * Displays the current role with its color and allows switching.
 */
export default function RoleSwitcher() {
  const { currentRole, switchRole, roles } = useRole();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmRole, setConfirmRole] = useState(null);
  const dropdownRef = useRef(null);

  const handleSwitch = (roleId) => {
    if (roleId === currentRole.id) { setIsOpen(false); return; }
    setConfirmRole(roles.find(r => r.id === roleId));
  };

  const confirmSwitch = () => {
    if (!confirmRole) return;
    // Log role switch to localStorage + Supabase audit trail
    const logEntry = {
      timestamp: new Date().toISOString(),
      from: currentRole.id,
      to: confirmRole.id,
    };
    const history = JSON.parse(localStorage.getItem('flowly_role_audit') || '[]');
    history.push(logEntry);
    localStorage.setItem('flowly_role_audit', JSON.stringify(history.slice(-50)));
    // Fire-and-forget Supabase audit log
    auditService.log(
      'ROLE_SWITCH',
      'role',
      confirmRole.id,
      { from: currentRole.id, fromLabel: currentRole.label },
      { to: confirmRole.id, toLabel: confirmRole.label }
    ).catch(() => {});
    cacheService.clear();
    switchRole(confirmRole.id);
    setConfirmRole(null);
    setIsOpen(false);
  };

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

      {/* Dropdown (Desktop Only) */}
      {isOpen && (
        <div className="hidden md:block absolute right-0 top-full mt-2 w-72 rounded-2xl
                        bg-surface-elevated border border-border-secondary
                        shadow-xl animate-scale-in origin-top-right z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border-secondary">
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
              {t('roleSwitcher.switchRole')}
            </p>
          </div>

          {/* Role list */}
          <div className="py-1.5">
            {roles.map((role) => {
              const isActive = role.id === currentRole.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleSwitch(role.id)}
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
              {t('roleSwitcher.currentRole')}: {currentRole.label}
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmRole && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setConfirmRole(null)} />
          <div className="relative bg-surface-primary rounded-2xl shadow-2xl border border-border-secondary p-6 w-full max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">{t('roleSwitcher.switchRole')}</h3>
                <p className="text-xs text-text-tertiary">{t('roleSwitcher.confirmSwitch')} {confirmRole.label}?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${currentRole.color}`}>
                <Shield size={14} className="text-white" />
              </div>
              <span className="text-xs text-text-tertiary">{currentRole.label}</span>
              <span className="text-xs text-text-tertiary">→</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${confirmRole.color}`}>
                <Shield size={14} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-text-primary">{confirmRole.label}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRole(null)} className="flex-1 py-2.5 rounded-xl bg-surface-secondary text-text-secondary text-sm font-medium hover:bg-surface-tertiary transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={confirmSwitch} className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors">
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Bottom Sheet (Using the same pattern but styled as a sheet) */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface-primary rounded-t-2xl shadow-xl flex flex-col max-h-[85vh] animate-slide-in-up">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-3 mb-1" />
            <div className="px-6 py-4 border-b border-border-secondary">
              <h3 className="text-lg font-bold text-text-primary">{t('roleSwitcher.switchRole')}</h3>
            </div>
            <div className="p-4 space-y-2 overflow-y-auto">
              {roles.map((role) => {
                const isActive = role.id === currentRole.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleSwitch(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all
                                           ${isActive
                        ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200'
                        : 'bg-surface-primary border-border-secondary'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${role.color} shadow-sm shrink-0`}>
                      <Shield size={18} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-bold text-text-primary flex items-center gap-2">
                        {role.label}
                        {isActive && <Check size={16} className="text-brand-600" />}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">{role.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-border-secondary">
              <button onClick={() => setIsOpen(false)} className="w-full py-3 rounded-xl bg-surface-secondary text-text-secondary font-medium hover:bg-surface-tertiary transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
