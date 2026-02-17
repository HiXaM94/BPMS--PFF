import { useState } from 'react';
import {
  FileText, Plus, Download, Eye, Clock, CheckCircle2,
  AlertCircle, File, FileCheck, FileClock, Send,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';

const documentRequests = [
  { id: 1, title: 'Salary Certificate', employee: 'Ibrahim Rouass', type: 'Certificate', requestDate: 'Feb 10, 2026', dueDate: 'Feb 14, 2026', status: 'completed', format: 'PDF' },
  { id: 2, title: 'Employment Verification', employee: 'Sarah Martinez', type: 'Verification', requestDate: 'Feb 11, 2026', dueDate: 'Feb 15, 2026', status: 'processing', format: 'PDF' },
  { id: 3, title: 'Tax Statement 2025', employee: 'Ahmed Hassan', type: 'Tax', requestDate: 'Feb 12, 2026', dueDate: 'Feb 19, 2026', status: 'pending', format: 'PDF' },
  { id: 4, title: 'Work Experience Letter', employee: 'John Chen', type: 'Letter', requestDate: 'Feb 8, 2026', dueDate: 'Feb 12, 2026', status: 'completed', format: 'PDF' },
  { id: 5, title: 'Annual Leave Balance', employee: 'Fatima Zahra', type: 'Report', requestDate: 'Feb 13, 2026', dueDate: 'Feb 17, 2026', status: 'pending', format: 'Excel' },
  { id: 6, title: 'Training Completion Cert', employee: 'Carlos Ruiz', type: 'Certificate', requestDate: 'Feb 9, 2026', dueDate: 'Feb 13, 2026', status: 'rejected', format: 'PDF' },
  { id: 7, title: 'Payslip — January 2026', employee: 'Diana Kim', type: 'Payroll', requestDate: 'Feb 5, 2026', dueDate: 'Feb 7, 2026', status: 'completed', format: 'PDF' },
  { id: 8, title: 'Visa Support Letter', employee: 'Bob Tanaka', type: 'Letter', requestDate: 'Feb 13, 2026', dueDate: 'Feb 20, 2026', status: 'processing', format: 'PDF' },
];

const documentTypes = [
  { type: 'Certificate', count: 2, icon: FileCheck, color: 'brand' },
  { type: 'Verification', count: 1, icon: FileCheck, color: 'violet' },
  { type: 'Letter', count: 2, icon: FileText, color: 'info' },
  { type: 'Tax', count: 1, icon: File, color: 'warning' },
  { type: 'Report', count: 1, icon: FileClock, color: 'success' },
  { type: 'Payroll', count: 1, icon: File, color: 'pink' },
];

const columns = [
  { key: 'title', label: 'Document', render: (val, row) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl
                      bg-gradient-to-br from-brand-500/10 to-brand-600/10 shrink-0">
        <FileText size={16} className="text-brand-500" />
      </div>
      <div>
        <span className="font-semibold text-text-primary block text-sm">{val}</span>
        <span className="text-[11px] text-text-tertiary">{row.format} • {row.type}</span>
      </div>
    </div>
  )},
  { key: 'employee', label: 'Requested By', cellClassName: 'text-text-secondary text-sm' },
  { key: 'requestDate', label: 'Requested', cellClassName: 'text-text-tertiary text-xs' },
  { key: 'dueDate', label: 'Due Date', cellClassName: 'text-text-secondary text-xs font-medium' },
  { key: 'status', label: 'Status', render: (val) => {
    const map = { completed: 'success', processing: 'brand', pending: 'warning', rejected: 'danger' };
    return <StatusBadge variant={map[val]} dot size="sm">{val}</StatusBadge>;
  }},
  { key: 'actions', label: '', render: (_, row) => (
    <div className="flex items-center gap-1">
      {row.status === 'completed' && (
        <button className="p-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer" title="Download">
          <Download size={14} className="text-emerald-500" />
        </button>
      )}
      <button className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer" title="View">
        <Eye size={14} className="text-text-tertiary" />
      </button>
    </div>
  )},
];

export default function DocumentRequest() {
  const pending = documentRequests.filter(r => r.status === 'pending').length;
  const processing = documentRequests.filter(r => r.status === 'processing').length;
  const completed = documentRequests.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Document Requests"
        description="Request, track, and download HR documents and certificates"
        icon={FileText}
        iconColor="from-blue-500 to-indigo-600"
        actionLabel="New Request"
        actionIcon={Send}
        actionColor="from-blue-500 to-indigo-600"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={documentRequests.length.toString()} icon={FileText} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" delay={0} />
        <StatCard title="Pending" value={pending.toString()} icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" delay={80} />
        <StatCard title="Processing" value={processing.toString()} icon={Clock} iconColor="bg-gradient-to-br from-blue-500 to-indigo-600" delay={160} />
        <StatCard title="Completed" value={completed.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={240} />
      </div>

      {/* Document Types */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
           style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Document Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {documentTypes.map(dt => (
            <div key={dt.type} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-surface-secondary
                                          border border-border-secondary hover:border-brand-200
                                          transition-all duration-200 cursor-pointer group">
              <dt.icon size={20} className="text-text-tertiary group-hover:text-brand-500 transition-colors" />
              <span className="text-xs font-medium text-text-primary">{dt.type}</span>
              <StatusBadge variant={dt.color} size="sm">{dt.count}</StatusBadge>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '450ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">All Requests</h2>
          <div className="flex gap-1.5">
            <StatusBadge variant="warning" size="sm" dot>{pending} pending</StatusBadge>
            <StatusBadge variant="brand" size="sm" dot>{processing} processing</StatusBadge>
          </div>
        </div>
        <DataTable columns={columns} data={documentRequests} />
      </div>
    </div>
  );
}
