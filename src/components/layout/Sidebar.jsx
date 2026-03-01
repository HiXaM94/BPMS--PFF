import { NavLink } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import { useRole } from '../../contexts/RoleContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { navigationItems } from '../../config/navigation';
import {
  ChevronsLeft,
  ChevronsRight,
  X,
  Workflow,
} from 'lucide-react';

/* Flowly icon — black on light, white on dark */
const FlowlyIcon = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 30.54 21.4" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path className="fill-[#231f20] stroke-[#231f20] dark:fill-white dark:stroke-white" strokeMiterlimit="10" strokeWidth="2" d="M26.58,1v6.31c0,1.84-1.49,3.32-3.32,3.32s-3.32-1.49-3.32-3.32v-1.81c0-1.12-.41-2.14-1.08-2.93-.82-.96-2.05-1.57-3.42-1.57-1.87,0-3.47,1.14-4.15,2.75-.2.46-.32.96-.35,1.49,0,.09,0,.17,0,.26s0,.17,0,.26v8.47c-.22,1.62-1.61,2.86-3.29,2.86-1.83,0-3.32-1.49-3.32-3.32V1H1v12.94c0,3.57,2.9,6.47,6.47,6.47s6.47-2.9,6.47-6.47c0-.22-.01-.43-.03-.64v-3.56s.02,0,.03.01v-4.66c0-.74.6-1.34,1.34-1.34s1.34.6,1.34,1.34v2.38c0,.79.14,1.55.4,2.25.92,2.46,3.29,4.22,6.07,4.22,3.44,0,6.26-2.69,6.46-6.09h.01V1h-2.96Z"/>
  </svg>
);

// Map navigation item ids → i18n keys
const navLabelKeys = {
  dashboard: 'nav.dashboard',
  enterprise: 'nav.enterprise',
  users: 'nav.userManagement',
  profile: 'nav.employeeProfile',
  attendance: 'nav.attendance',
  recruitment: 'nav.recruitment',
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
  const { t } = useLanguage();

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
          {/* Logo */}
          <div className={`flex items-center h-[72px] shrink-0
                           ${isCollapsed ? 'justify-center' : 'px-5 gap-3'}`}>
            <FlowlyIcon className="w-10 h-10 shrink-0" />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-text-primary tracking-tight leading-tight">
                  Flowly
                </span>
                <span className="text-[10px] text-text-tertiary font-medium tracking-wide">
                  Business Suite
                </span>
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
          {/* Logo */}
          <div className="flex items-center h-[72px] px-5 gap-3 shrink-0">
            <FlowlyIcon className="w-10 h-10 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-text-primary tracking-tight leading-tight">
                Flowly
              </span>
              <span className="text-[10px] text-text-tertiary font-medium tracking-wide">
                Business Suite
              </span>
            </div>
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
