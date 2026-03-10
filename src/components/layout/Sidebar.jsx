import { NavLink } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import { useRole } from '../../contexts/RoleContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { navigationItems } from '../../config/navigation';
import {
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import IconWhite from '../../logo/ICONWHITE.svg';
import IconBlack from '../../logo/ICONBLACK.svg';
import LogoDemo from '../../logo/logo-demo.png';


// Map navigation item ids → i18n keys
const navLabelKeys = {
  dashboard: 'nav.dashboard',
  enterprise: 'nav.enterprise',
  users: 'nav.userManagement',
  profile: 'nav.employeeProfile',
  attendance: 'nav.attendance',
  recruitment: 'nav.recruitment',
  'ai-recruitment': 'nav.aiRecruitment',
  tasks: 'nav.taskPerformance',
  vacation: 'nav.vacationRequest',
  documents: 'nav.documentRequest',
  payroll: 'nav.payroll',
  analytics: 'nav.analytics',
  'ai-assistant': 'nav.aiAssistant',
  notifications: 'nav.notifications',
  permissions: 'nav.permissions',
  settings: 'nav.settings',
  'hr-workflow': 'nav.hrWorkflow',
};
const sectionKeys = {
  'Overview': 'nav.overview',
  'HR & People': 'nav.hrPeople',
  'Workflows': 'nav.workflows',
  'Intelligence': 'nav.intelligence',
  'System': 'nav.system',
};

function SidebarLink({ item, isCollapsed, t }) {
  const Icon = item.icon;
  const label = navLabelKeys[item.id] ? t(navLabelKeys[item.id]) : item.label;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl
         transition-all duration-200 ease-in-out
         ${isCollapsed
          ? 'justify-center w-11 h-11'
          : 'w-full gap-3 px-3 py-2.5'
        }
         ${isActive
          ? 'bg-sidebar-active text-sidebar-text-active'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
        }
        `
      }
      title={isCollapsed ? label : undefined}
    >
      <Icon
        size={20}
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
      />
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">
          {label}
        </span>
      )}
    </NavLink>
  );
}

function SidebarSection({ section, isCollapsed, t }) {
  const sectionLabel = sectionKeys[section.section] ? t(sectionKeys[section.section]) : section.section;
  return (
    <div className="mb-3">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider
                       text-sidebar-text/40 select-none">
          {sectionLabel}
        </h3>
      )}
      {isCollapsed && (
        <div className="w-6 h-px bg-sidebar-border mx-auto mb-2" />
      )}
      <div className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
        {section.items.map(item => (
          <SidebarLink key={item.id} item={item} isCollapsed={isCollapsed} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const { currentRole } = useRole();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Filter navigation items based on current role
  const filteredNavigation = navigationItems
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.roles.includes('all') || item.roles.includes(currentRole.id)
      ),
    }))
    .filter(section => section.items.length > 0);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40
                    bg-sidebar-bg border-r border-sidebar-border
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-60'}`}
      >
        <div className="flex flex-col h-full">
          {/* Main Logo Section */}
          <div className="flex flex-col gap-4 py-4 shrink-0 border-b border-sidebar-border/50">
            {/* SaaS Branding */}
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-5 gap-3'}`}>
              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                <img src={isDark ? IconWhite : IconBlack} alt="Flowly" className="w-7 h-7 object-contain" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary leading-tight">Flowly</span>
                  <span className="text-[10px] text-text-tertiary font-medium">Business Suite</span>
                </div>
              )}
            </div>

            {/* Company Card Section - Only for non-super admins */}
            {currentRole?.id !== 'super_admin' && (
              <div className={`${isCollapsed ? 'px-2' : 'px-3'}`}>
                <div className={`group flex items-center transition-all duration-500 rounded-2xl
                                ${isCollapsed
                    ? 'justify-center w-12 h-12 mx-auto bg-surface-primary border border-border-secondary shadow-sm hover:border-brand-500/30'
                    : 'w-full gap-3 p-2.5 bg-surface-primary border border-brand-500/5 shadow-sm hover:shadow-md hover:border-brand-500/20 transition-all'}`}>

                  <div className={`shrink-0 overflow-hidden rounded-xl shadow-inner border border-border-secondary/50 bg-surface-primary
                                  ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'}`}>
                    <img
                      src={profile?.entreprise?.logo_url || LogoDemo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt="Company"
                    />
                  </div>

                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0">
                      <span className="text-[7.5px] font-black text-brand-500/70 uppercase tracking-[0.18em] leading-none mb-1.5 antialiased">Organization</span>
                      <span className="text-sm font-black text-text-primary truncate leading-tight tracking-tight antialiased">
                        {profile?.entreprise?.name || 'Company Name'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto py-3 space-y-1
                           ${isCollapsed ? 'px-3' : 'px-3'}`}>
            {filteredNavigation.map(section => (
              <SidebarSection key={section.section} section={section} isCollapsed={isCollapsed} t={t} />
            ))}
          </nav>

          {/* Expand / Collapse toggle at bottom */}
          <div className="flex items-center justify-center py-4 shrink-0">
            <button
              onClick={toggleCollapse}
              className={`flex items-center justify-center rounded-xl
                         bg-sidebar-hover text-sidebar-text
                         hover:bg-sidebar-active hover:text-sidebar-text-active
                         transition-all duration-200 cursor-pointer
                         ${isCollapsed ? 'w-10 h-10' : 'w-full mx-3 h-10 gap-2'}`}
              aria-label={isCollapsed ? 'Expand sidebar' : t('nav.collapse')}
            >
              {isCollapsed
                ? <ChevronsRight size={18} />
                : (
                  <>
                    <ChevronsLeft size={18} />
                    <span className="text-sm font-medium">{t('nav.collapse')}</span>
                  </>
                )
              }
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden
                     animate-fade-in"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-72 z-50 lg:hidden
                    bg-sidebar-bg border-r border-sidebar-border
                    transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="absolute top-4 right-4 flex items-center justify-center w-8 h-8
                     rounded-lg text-sidebar-text hover:bg-sidebar-hover
                     transition-colors duration-200 cursor-pointer"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col h-full">
          {/* Main Logo Section */}
          <div className="flex flex-col gap-4 py-4 shrink-0 border-b border-sidebar-border/50">
            {/* SaaS Branding */}
            <div className="flex items-center px-5 gap-3">
              <div className="flex items-center justify-center w-8 h-8 shrink-0">
                <img src={isDark ? IconWhite : IconBlack} alt="Flowly" className="w-7 h-7 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text-primary leading-tight">Flowly</span>
                <span className="text-[10px] text-text-tertiary font-medium">Business Suite</span>
              </div>
            </div>

            {/* Company Card Section - Only for non-super admins */}
            {currentRole?.id !== 'super_admin' && (
              <div className="px-3">
                <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-primary border border-brand-500/5 shadow-sm">
                  <div className="w-9 h-9 shrink-0 overflow-hidden rounded-xl shadow-inner border border-border-secondary/50 bg-surface-primary">
                    <img
                      src={profile?.entreprise?.logo_url || LogoDemo}
                      className="w-full h-full object-cover"
                      alt="Company"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7.5px] font-black text-brand-500/70 uppercase tracking-[0.18em] leading-none mb-1.5 antialiased">Organization</span>
                    <span className="text-sm font-black text-text-primary truncate leading-tight tracking-tight antialiased">
                      {profile?.entreprise?.name || 'Company Name'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {filteredNavigation.map(section => (
              <SidebarSection key={section.section} section={section} isCollapsed={false} t={t} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
