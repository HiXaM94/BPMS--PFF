import { useState } from 'react';
import {
  Palmtree, Calendar, CheckCircle2, XCircle,
  AlertCircle, CalendarDays, Send, Eye, Check, X,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';

const initialRequests = [
  { id: 1, employee: 'Ibrahim Rouass', type: 'Annual Leave', startDate: 'Feb 20, 2026', endDate: 'Feb 24, 2026', days: 5, reason: 'Family vacation', status: 'pending', submittedAt: 'Feb 10, 2026' },
  { id: 2, employee: 'Sarah Martinez', type: 'Sick Leave', startDate: 'Feb 14, 2026', endDate: 'Feb 14, 2026', days: 1, reason: 'Medical appointment', status: 'approved', submittedAt: 'Feb 13, 2026' },
  { id: 3, employee: 'Ahmed Hassan', type: 'Annual Leave', startDate: 'Mar 3, 2026', endDate: 'Mar 7, 2026', days: 5, reason: 'Personal time off', status: 'pending', submittedAt: 'Feb 12, 2026' },
  { id: 4, employee: 'Fatima Zahra', type: 'Maternity', startDate: 'Mar 1, 2026', endDate: 'May 31, 2026', days: 90, reason: 'Maternity leave', status: 'approved', submittedAt: 'Jan 15, 2026' },
  { id: 5, employee: 'Carlos Ruiz', type: 'Annual Leave', startDate: 'Feb 25, 2026', endDate: 'Feb 26, 2026', days: 2, reason: 'Moving to new apartment', status: 'rejected', submittedAt: 'Feb 8, 2026' },
  { id: 6, employee: 'Bob Tanaka', type: 'Remote Work', startDate: 'Feb 17, 2026', endDate: 'Feb 21, 2026', days: 5, reason: 'Working from home', status: 'approved', submittedAt: 'Feb 5, 2026' },
  { id: 7, employee: 'Diana Kim', type: 'Unpaid Leave', startDate: 'Mar 10, 2026', endDate: 'Mar 14, 2026', days: 5, reason: 'Personal emergency', status: 'pending', submittedAt: 'Feb 13, 2026' },
];

const leaveBalance = [
  { type: 'Annual Leave', total: 22, used: 8, remaining: 14, color: 'brand' },
  { type: 'Sick Leave', total: 10, used: 2, remaining: 8, color: 'danger' },
  { type: 'Remote Work', total: 24, used: 15, remaining: 9, color: 'info' },
  { type: 'Unpaid Leave', total: 10, used: 0, remaining: 10, color: 'neutral' },
];

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Remote Work', 'Maternity', 'Unpaid Leave'];

const typeColorMap = { 'Annual Leave': 'brand', 'Sick Leave': 'danger', 'Remote Work': 'info', 'Maternity': 'pink', 'Unpaid Leave': 'neutral' };
const statusColorMap = { approved: 'success', pending: 'warning', rejected: 'danger' };
const statusIconMap = { approved: CheckCircle2, pending: AlertCircle, rejected: XCircle };

const inputCls = `w-full px-3 py-2.5 rounded-xl text-sm bg-surface-secondary border border-border-secondary
                  focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400
                  transition-all duration-200 text-text-primary placeholder:text-text-tertiary`;
const labelCls = 'block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider';

const emptyForm = { type: 'Annual Leave', startDate: '', endDate: '', reason: '' };

function calcDays(start, end) {
  if (!start || !end) return 0;
  const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
  return diff < 0 ? 0 : diff + 1;
}

export default function VacationRequest() {
  const { currentRole } = useRole();
  const [requests, setRequests] = useState(initialRequests);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isManager = ['company_admin', 'hr', 'manager', 'super_admin'].includes(currentRole.id);

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const totalDays = requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.days, 0);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      const days = calcDays(form.startDate, form.endDate);
      const newReq = {
        id: Date.now(),
        employee: currentRole.label,
        type: form.type,
        startDate: new Date(form.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        endDate: new Date(form.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        days,
        reason: form.reason,
        status: 'pending',
        submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      setRequests(prev => [newReq, ...prev]);
      setForm(emptyForm);
      setShowNewModal(false);
      setSubmitting(false);
      showToast('Leave request submitted successfully!');
    }, 600);
  };

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setViewRequest(null);
    showToast('Request approved.');
  };

  const handleReject = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    setViewRequest(null);
    showToast('Request rejected.');
  };

  const columns = [
    { key: 'employee', label: 'Employee', cellClassName: 'font-semibold text-text-primary text-sm' },
    { key: 'type', label: 'Type', render: (val) => (
      <StatusBadge variant={typeColorMap[val] || 'neutral'} size="sm">{val}</StatusBadge>
    )},
    { key: 'startDate', label: 'From', cellClassName: 'text-text-secondary text-xs' },
    { key: 'endDate', label: 'To', cellClassName: 'text-text-secondary text-xs' },
    { key: 'days', label: 'Days', cellClassName: 'font-semibold text-text-primary text-center' },
    { key: 'status', label: 'Status', render: (val) => {
      const Icon = statusIconMap[val];
      return (
        <div className="flex items-center gap-1.5">
          <Icon size={14} className={val === 'approved' ? 'text-emerald-500' : val === 'pending' ? 'text-amber-500' : 'text-red-500'} />
          <StatusBadge variant={statusColorMap[val]} size="sm">{val}</StatusBadge>
        </div>
      );
    }},
    { key: 'submittedAt', label: 'Submitted', cellClassName: 'text-text-tertiary text-xs' },
    { key: 'actions', label: '', render: (_, row) => (
      <button
        onClick={() => setViewRequest(row)}
        className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"
        title="View details"
      >
        <Eye size={14} className="text-text-tertiary" />
      </button>
    )},
  ];

  const previewDays = calcDays(form.startDate, form.endDate);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vacation Requests"
        description="Submit and manage leave requests and time-off balances"
        icon={Palmtree}
        iconColor="from-emerald-500 to-teal-600"
        actionLabel="New Request"
        actionIcon={Send}
        actionColor="from-emerald-500 to-teal-600"
        onAction={() => setShowNewModal(true)}
      />

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10
                        border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-fade-in">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Pending Requests" value={pendingCount.toString()} icon={AlertCircle} iconColor="bg-gradient-to-br from-amber-500 to-orange-500" delay={0} />
        <StatCard title="Approved" value={approvedCount.toString()} icon={CheckCircle2} iconColor="bg-gradient-to-br from-emerald-500 to-teal-600" delay={80} />
        <StatCard title="Days Approved" value={totalDays.toString()} icon={CalendarDays} iconColor="bg-gradient-to-br from-brand-500 to-brand-600" subtitle="total across all" delay={160} />
        <StatCard title="Total Requests" value={requests.length.toString()} icon={Calendar} iconColor="bg-gradient-to-br from-violet-500 to-purple-600" delay={240} />
      </div>

      {/* Leave Balance */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5 animate-fade-in"
           style={{ animationDelay: '350ms' }}>
        <h2 className="text-sm font-semibold text-text-primary mb-4">My Leave Balance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {leaveBalance.map(lb => {
            const usedPct = Math.min((lb.used / lb.total) * 100, 100);
            return (
              <div key={lb.type} className="p-4 rounded-xl bg-surface-secondary border border-border-secondary
                                            hover:border-brand-200 transition-all duration-200">
                <StatusBadge variant={lb.color} size="sm">{lb.type}</StatusBadge>
                <div className="flex items-end justify-between mt-3 mb-2">
                  <span className="text-2xl font-bold text-text-primary">{lb.remaining}</span>
                  <span className="text-xs text-text-tertiary">of {lb.total} days</span>
                </div>
                <div className="h-1.5 rounded-full bg-border-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500
                    ${lb.color === 'brand' ? 'bg-brand-500' : lb.color === 'danger' ? 'bg-red-500' :
                      lb.color === 'info' ? 'bg-blue-500' : 'bg-gray-400'}`}
                    style={{ width: `${usedPct}%` }} />
                </div>
                <span className="text-[10px] text-text-tertiary mt-1.5 block">{lb.used} days used</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
           style={{ animationDelay: '450ms' }}>
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">All Requests</h2>
          <StatusBadge variant="warning" size="sm" dot>{pendingCount} pending</StatusBadge>
        </div>
        <DataTable columns={columns} data={requests} />
      </div>

      {/* ── New Request Modal ── */}
      <Modal
        isOpen={showNewModal}
        onClose={() => { setShowNewModal(false); setForm(emptyForm); }}
        title="Submit Leave Request"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setShowNewModal(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-secondary
                         hover:bg-surface-tertiary border border-border-secondary transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" form="leave-form" disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                         bg-gradient-to-r from-emerald-500 to-teal-600
                         shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                         transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center gap-2">
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
              ) : (
                <><Send size={14} /> Submit Request</>
              )}
            </button>
          </div>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Leave Type *</label>
            <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className={inputCls + ' cursor-pointer'}>
              {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date *</label>
              <input type="date" required value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date *</label>
              <input type="date" required value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                min={form.startDate || new Date().toISOString().split('T')[0]}
                className={inputCls} />
            </div>
          </div>

          {previewDays > 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-brand-500/8 border border-brand-500/20 text-brand-500 text-sm">
              <CalendarDays size={14} />
              <span><strong>{previewDays}</strong> working day{previewDays !== 1 ? 's' : ''} requested</span>
            </div>
          )}

          <div>
            <label className={labelCls}>Reason *</label>
            <textarea required rows={3} value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Briefly describe the reason for your leave…"
              className={inputCls + ' resize-none'} />
          </div>
        </form>
      </Modal>

      {/* ── View / Approve Request Modal ── */}
      <Modal
        isOpen={!!viewRequest}
        onClose={() => setViewRequest(null)}
        title="Leave Request Details"
        maxWidth="max-w-md"
        footer={
          viewRequest && isManager && viewRequest.status === 'pending' ? (
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => handleReject(viewRequest.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                           bg-gradient-to-r from-red-500 to-rose-600
                           shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer
                           flex items-center gap-2">
                <X size={14} /> Reject
              </button>
              <button onClick={() => handleApprove(viewRequest.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                           bg-gradient-to-r from-emerald-500 to-teal-600
                           shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer
                           flex items-center gap-2">
                <Check size={14} /> Approve
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button onClick={() => setViewRequest(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                           bg-gradient-to-r from-brand-500 to-brand-600
                           shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                Close
              </button>
            </div>
          )
        }
      >
        {viewRequest && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{viewRequest.employee}</span>
              <StatusBadge variant={statusColorMap[viewRequest.status]} size="sm" dot>{viewRequest.status}</StatusBadge>
            </div>
            <div className="divide-y divide-border-secondary">
              {[
                { label: 'Leave Type', value: <StatusBadge variant={typeColorMap[viewRequest.type] || 'neutral'} size="sm">{viewRequest.type}</StatusBadge> },
                { label: 'Period', value: `${viewRequest.startDate} → ${viewRequest.endDate}` },
                { label: 'Duration', value: `${viewRequest.days} day${viewRequest.days !== 1 ? 's' : ''}` },
                { label: 'Reason', value: viewRequest.reason },
                { label: 'Submitted', value: viewRequest.submittedAt },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-2.5 gap-4">
                  <span className="text-xs text-text-tertiary uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-sm text-text-primary text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
