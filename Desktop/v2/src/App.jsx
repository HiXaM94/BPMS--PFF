import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { RoleProvider } from './contexts/RoleContext';
import router from './router';

export default function App() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <RoleProvider>
          <RouterProvider router={router} />
        </RoleProvider>
      </SidebarProvider>
    </ThemeProvider>
  );
}
