import { NavLink, useLocation } from 'react-router-dom';
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
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
         transition-all duration-200 ease-in-out
         ${isActive
          ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
         }
         ${isCollapsed ? 'justify-center px-2.5' : ''}
        `
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon
        size={20}
        className="shrink-0 transition-transform duration-200 group-hover:scale-110"
      />
      {!isCollapsed && (
        <span className="truncate transition-opacity duration-200">
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function SidebarSection({ section, isCollapsed }) {
  return (
    <div className="mb-2">
      {!isCollapsed && (
        <h3 className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider
                       text-sidebar-text/50 select-none">
          {section.section}
        </h3>
      )}
      <div className="flex flex-col gap-0.5">
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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`flex items-center h-16 px-4 border-b border-sidebar-border shrink-0
                       ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl
                        bg-gradient-to-br from-brand-500 to-brand-600 shadow-md">
          <Workflow size={20} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold text-white tracking-tight leading-tight">
              BPMS
            </span>
            <span className="text-[10px] text-sidebar-text/60 font-medium tracking-wide uppercase">
              Process Platform
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-1">
        {filteredNavigation.map(section => (
          <SidebarSection key={section.section} section={section} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:flex items-center justify-center h-12 border-t border-sidebar-border shrink-0">
        <button
          onClick={toggleCollapse}
          className="flex items-center justify-center w-8 h-8 rounded-lg
                     text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active
                     transition-all duration-200 cursor-pointer"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40
                    bg-sidebar-bg border-r border-sidebar-border
                    transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-64'}`}
      >
        {sidebarContent}
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
        {sidebarContent}
      </aside>
    </>
  );
}
