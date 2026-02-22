import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { RoleProvider } from './contexts/RoleContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import router from './router';

function AppInner() {
  const { profile } = useAuth();
  return (
    <RoleProvider profileRole={profile?.role}>
      <NotificationProvider>
        <SidebarProvider>
          <RouterProvider router={router} />
        </SidebarProvider>
      </NotificationProvider>
    </RoleProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
