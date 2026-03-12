import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { RoleProvider } from './contexts/RoleContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import router from './router';
import ProfileDataModal from './components/ui/ProfileDataModal';
import PasswordChangeModal from './components/ui/PasswordChangeModal';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import { useDefaultPasswordCheck } from './hooks/useDefaultPasswordCheck';

function AppInner() {
  const { profile } = useAuth();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const { showPasswordModal, hidePasswordModal } = useDefaultPasswordCheck();

  useEffect(() => {
    const handler = () => setShowProfileForm(true);
    window.addEventListener('open-hr-profile-form', handler);
    return () => window.removeEventListener('open-hr-profile-form', handler);
  }, []);

  return (
    <RoleProvider profileRole={profile?.role}>
      <NotificationProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
          <ProfileDataModal
            isOpen={showProfileForm}
            onClose={() => setShowProfileForm(false)}
          />
          <PasswordChangeModal
            isOpen={showPasswordModal}
            onClose={hidePasswordModal}
            role={profile?.role || 'EMPLOYEE'}
          />
          <PWAInstallPrompt />
        </SidebarProvider>
      </NotificationProvider>
    </RoleProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
