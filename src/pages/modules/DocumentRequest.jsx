import { useRole } from '../../contexts/RoleContext';
import { FileText } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

// Role-specific Document Views
import SuperAdminDocuments from './documents/SuperAdminDocuments';
import CompanyAdminDocuments from './documents/CompanyAdminDocuments';
import HRManagerDocuments from './documents/HRManagerDocuments';
import ManagerDocuments from './documents/ManagerDocuments';
import EmployeeDocuments from './documents/EmployeeDocuments';

export default function DocumentRequest() {
  const { currentRole } = useRole();

  const renderDocumentView = () => {
    switch (currentRole.id) {
      case 'super_admin':
        return <SuperAdminDocuments />;
      case 'company_admin':
        return <CompanyAdminDocuments />;
      case 'hr':
        return <HRManagerDocuments />;
      case 'manager':
        return <ManagerDocuments />;
      case 'employee':
        return <EmployeeDocuments />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-primary rounded-2xl border border-border-secondary">
            <FileText size={48} className="text-text-tertiary mb-4" />
            <h3 className="text-lg font-bold text-text-primary">Access Denied</h3>
            <p className="text-text-secondary mt-2">You do not have permission to view document requests.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Requests & Compliance"
        description={`Manage document storage, requests, and verification as ${currentRole.label}`}
        icon={FileText}
      />
      {renderDocumentView()}
    </div>
  );
}
