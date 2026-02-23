import { NavLink } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import { useRole } from '../../contexts/RoleContext';
import { navigationItems } from '../../config/navigation';
import {
  ChevronsLeft,
  ChevronsRight,
  X,
  Workflow,
} from 'lucide-react';

function SidebarLink({ item, isCollapsed }) {
  const Icon = item.icon;

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
      title={isCollapsed ? item.label : undefined}
    >
      <Icon
        size={20}
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
      />
      {!isCollapsed && (
        <span className="text-sm font-medium truncate">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function SidebarSection({ section, isCollapsed }) {
  return (
    <div className="mb-3">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider
                       text-sidebar-text/40 select-none">
          {section.section}
        </h3>
      )}
      {isCollapsed && (
        <div className="w-6 h-px bg-sidebar-border mx-auto mb-2" />
      )}
      <div className={`flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
        {section.items.map(item => (
          <SidebarLink key={item.id} item={item} isCollapsed={isCollapsed} />
        ))}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const { currentRole } = useRole();

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
                    bg-sidebar-bg
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-60'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center h-[72px] shrink-0
                           ${isCollapsed ? 'justify-center' : 'px-5 gap-3'}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl
                            bg-[#272b30] shadow-sm">
              <Workflow size={20} className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white tracking-tight leading-tight">
                  BPMS
                </span>
                <span className="text-[10px] text-sidebar-text/50 font-medium tracking-wide">
                  Platform
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto py-3 space-y-1
                           ${isCollapsed ? 'px-3' : 'px-3'}`}>
            {filteredNavigation.map(section => (
              <SidebarSection key={section.section} section={section} isCollapsed={isCollapsed} />
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
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed
                ? <ChevronsRight size={18} />
                : (
                  <>
                    <ChevronsLeft size={18} />
                    <span className="text-sm font-medium">Collapse</span>
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
                    bg-sidebar-bg
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
            <div className="flex items-center justify-center w-10 h-10 rounded-xl
                            bg-[#272b30]">
              <Workflow size={20} className="text-white" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white tracking-tight leading-tight">
                BPMS
              </span>
              <span className="text-[10px] text-sidebar-text/50 font-medium tracking-wide">
                Platform
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {filteredNavigation.map(section => (
              <SidebarSection key={section.section} section={section} isCollapsed={false} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
