import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSidebar } from '../../contexts/SidebarContext';
import AIAssistant from '../ui/AIAssistant';
import PageTransition from '../ui/PageTransition';

export default function MainLayout() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-sidebar-bg transition-colors duration-300">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content wrapper — has margin around it so dark bg shows as a frame */}
      <div
        className={`transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'}
                    p-0 lg:p-3 lg:pl-0`}
      >
        {/* Rounded content panel */}
        <div className="min-h-screen lg:min-h-[calc(100vh-24px)] bg-surface-secondary
                        lg:rounded-[20px] overflow-hidden
                        flex flex-col">
          {/* Floating Navbar */}
          <Navbar />

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 lg:px-10 lg:pt-4 lg:pb-8">
            <div className="mx-auto max-w-7xl">
              <PageTransition>
                <Outlet />
              </PageTransition>
            </div>
          </main>

          {/* Footer */}
          <footer className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4
                             text-xs text-text-tertiary">
            <span>© 2026 BPMS Platform — Ynov Campus</span>
            <span className="hidden sm:block">v1.2.0</span>
          </footer>
        </div>
      </div>

      {/* Floating AI Assistant */}
      <AIAssistant />
    </div>
  );
}
