import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import RoleSwitcher from '../ui/RoleSwitcher';
import NotificationDropdown from '../ui/NotificationDropdown';
import Breadcrumb from '../ui/Breadcrumb';

export default function Navbar() {
  const { toggleMobile } = useSidebar();
  const { currentRole } = useRole();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const initials = profile?.avatar_initials || profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const displayName = profile?.name ? profile.name.split(' ')[0] + ' ' + (profile.name.split(' ')[1]?.[0] ?? '') + '.' : 'User';

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8
                  transition-all duration-300 ease-in-out
                  ${scrolled
                    ? 'mx-3 mt-3 rounded-2xl bg-surface-primary/80 backdrop-blur-xl shadow-md border border-border-secondary/50'
                    : 'lg:rounded-t-[20px] bg-surface-secondary/95 backdrop-blur-xl'
                  }`}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={toggleMobile}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl
                     hover:bg-surface-tertiary transition-colors duration-200 cursor-pointer"
          aria-label="Toggle menu">
          <Menu size={20} className="text-text-secondary" />
        </button>
        <div className="hidden sm:block"><Breadcrumb /></div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <RoleSwitcher />
        <div className="hidden sm:block w-px h-7 bg-border-secondary mx-1" />
        <button className="flex items-center justify-center w-9 h-9 rounded-xl
                           hover:bg-surface-tertiary transition-colors duration-200 cursor-pointer group"
          aria-label="Search">
          <Search size={18} className="text-text-tertiary group-hover:text-text-primary transition-colors" />
        </button>
        <ThemeToggle />
        <NotificationDropdown />
        <div className="hidden sm:block w-px h-7 bg-border-secondary mx-1.5" />

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl
                       hover:bg-surface-tertiary transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full
                            bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[100px]">
                {displayName}
              </span>
              <span className="text-[11px] text-text-tertiary leading-tight">{currentRole.shortLabel}</span>
            </div>
            <ChevronDown size={14} className={`hidden sm:block text-text-tertiary transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          <div className={`absolute top-full right-0 mt-2 w-48 bg-surface-primary border border-border-secondary
                           rounded-2xl shadow-xl overflow-hidden z-[150]
                           transition-all duration-200 origin-top-right
                           ${userMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
            <div className="px-4 py-3 border-b border-border-secondary">
              <p className="text-sm font-semibold text-text-primary truncate">{profile?.name || 'User'}</p>
              <p className="text-xs text-text-tertiary truncate">{profile?.email || ''}</p>
            </div>
            <div className="py-1">
              <button onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                           hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer">
                <User size={15} /> My Profile
              </button>
              <button onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary
                           hover:bg-surface-secondary hover:text-text-primary transition-colors cursor-pointer">
                <Settings size={15} /> Settings
              </button>
            </div>
            <div className="border-t border-border-secondary py-1">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500
                           hover:bg-red-500/8 transition-colors cursor-pointer">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
