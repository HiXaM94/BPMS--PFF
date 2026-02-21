import { useRole } from '../../contexts/RoleContext';
import SuperAdminAttendance from './attendance/SuperAdminAttendance';
import CompanyAdminAttendance from './attendance/CompanyAdminAttendance';
import HRManagerAttendance from './attendance/HRManagerAttendance';
import ManagerAttendance from './attendance/ManagerAttendance';
import EmployeeAttendance from './attendance/EmployeeAttendance';
import PageHeader from '../../components/ui/PageHeader';
import { Clock } from 'lucide-react';

export default function Attendance() {
  const { currentRole } = useRole();

  // Return the appropriate dashboard based on the user's role
  const renderDashboard = () => {
    switch (currentRole.id) {
      case 'super_admin':
        return <SuperAdminAttendance />;
      case 'company_admin':
        return <CompanyAdminAttendance />;
      case 'hr':
        return <HRManagerAttendance />;
      case 'manager':
        return <ManagerAttendance />;
      case 'employee':
        return <EmployeeAttendance />;
      default:
        return (
          <div className="p-6 text-center text-text-secondary">
            Role not recognized for Attendance module.
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Attendance Dashboard"
        description={`Logged in as: ${currentRole.label}`}
        icon={Clock}
        iconColor="from-cyan-500 to-blue-600"
      />
      {renderDashboard()}
    </div>
  );
}
