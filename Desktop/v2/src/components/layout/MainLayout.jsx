import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../../contexts/SidebarContext';
import AIAssistant from '../ui/AIAssistant';
import PageTransition from '../ui/PageTransition';

export default function MainLayout() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-surface-secondary transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}
      >
        {/* Navbar */}
        <Navbar />

        {/* Page content with route transitions */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4
                           border-t border-border-secondary text-xs text-text-tertiary">
          <span>© 2026 BPMS Platform — Ynov Campus</span>
          <span className="hidden sm:block">v1.0.0</span>
        </footer>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
