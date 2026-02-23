import { useRole } from '../../contexts/RoleContext';
import { Banknote } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
// Role-specific Payroll Views
import SuperAdminPayroll from './payroll/SuperAdminPayroll';
import CompanyAdminPayroll from './payroll/CompanyAdminPayroll';
import HRManagerPayroll from './payroll/HRManagerPayroll';
import ManagerPayroll from './payroll/ManagerPayroll';
import EmployeePayroll from './payroll/EmployeePayroll';

export default function Payroll() {
  const { currentRole } = useRole();

  const renderPayrollView = () => {
    switch (currentRole.id) {
      case 'super_admin':
        return <SuperAdminPayroll />;
      case 'company_admin':
        return <CompanyAdminPayroll />;
      case 'hr':
        return <HRManagerPayroll />;
      case 'manager':
        return <ManagerPayroll />;
      case 'employee':
        return <EmployeePayroll />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-primary rounded-2xl border border-border-secondary">
            <Banknote size={48} className="text-text-tertiary mb-4" />
            <h3 className="text-lg font-bold text-text-primary">Access Denied</h3>
            <p className="text-text-secondary mt-2">You do not have permission to view payroll information.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Overview"
        description={`Manage specific payroll requests and statuses as ${currentRole.label}`}
        icon={Banknote}
      />
      {renderPayrollView()}
    </div>
  );
}
