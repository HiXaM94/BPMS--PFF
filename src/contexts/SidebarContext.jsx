import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(undefined);

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bpms-sidebar-collapsed');
      if (stored !== null) return stored === 'true';
      // Default to collapsed (icon-only) on desktop — matches template
      return true;
    }
    return true;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('bpms-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isMobileOpen, toggleCollapse, toggleMobile, closeMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
