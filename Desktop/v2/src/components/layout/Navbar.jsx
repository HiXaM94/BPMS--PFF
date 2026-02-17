import { Menu, Search, ChevronDown, User } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useRole } from '../../contexts/RoleContext';
import ThemeToggle from '../ui/ThemeToggle';
import RoleSwitcher from '../ui/RoleSwitcher';
import NotificationDropdown from '../ui/NotificationDropdown';
import Breadcrumb from '../ui/Breadcrumb';

export default function Navbar() {
  const { toggleMobile } = useSidebar();
  const { currentRole } = useRole();

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6
                 bg-surface-primary/80 backdrop-blur-xl
                 border-b border-border-secondary
                 transition-colors duration-300"
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={toggleMobile}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl
                     hover:bg-surface-tertiary transition-colors duration-200 cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={20} className="text-text-secondary" />
        </button>

        {/* Breadcrumb */}
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border-secondary mx-1" />

        {/* Search */}
        <button
          id="search-toggle"
          className="flex items-center justify-center w-10 h-10 rounded-xl
                     hover:bg-surface-tertiary transition-colors duration-200
                     cursor-pointer group"
          aria-label="Search"
        >
          <Search size={18} className="text-text-secondary group-hover:text-text-primary transition-colors" />
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notification Dropdown */}
        <NotificationDropdown />

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-border-secondary mx-1" />

        {/* User menu */}
        <button
          id="user-menu-toggle"
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl
                     hover:bg-surface-tertiary transition-all duration-200
                     cursor-pointer group"
        >
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shadow-sm
                           bg-gradient-to-br ${currentRole.color}`}>
            <User size={16} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col items-start min-w-0">
            <span className="text-sm font-semibold text-text-primary leading-tight truncate">
              Ibrahim R.
            </span>
            <span className="text-[11px] text-text-tertiary leading-tight">
              {currentRole.shortLabel}
            </span>
          </div>
          <ChevronDown
            size={14}
            className="hidden sm:block text-text-tertiary group-hover:text-text-secondary
                       transition-colors"
          />
        </button>
      </div>
    </header>
  );
}
