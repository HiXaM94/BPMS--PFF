import { useState, useEffect, useCallback } from 'react';
import {
  Palmtree, Send, CheckCircle2, Loader2, Sparkles, CalendarDays, Trash2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import {
  fetchLeaveBalances,
  fetchLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus,
  generateAIRecommendations
} from './vacation/vacationUtils';

// Role-specific views
import EmployeeVacationView from './vacation/EmployeeVacationView';
import TeamVacationView from './vacation/TeamVacationView';
import HRVacationView from './vacation/HRVacationView';
import AdminVacationView from './vacation/AdminVacationView';
import SuperAdminVacationView from './vacation/SuperAdminVacationView';

const leaveTypes = ['Annual Leave', 'Sick Leave', 'Remote Work', 'Maternity', 'Unpaid Leave'];

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
  const { profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', requestId: null, reason: '' });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const [teamRequests, setTeamRequests] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const isManager = currentRole.id === 'manager';

      // Load balances
      const bal = await fetchLeaveBalances(profile?.id);
      if (bal) setLeaveBalance(bal);

      // Load personal requests
      const personalReqs = await fetchLeaveRequests({ userId: profile?.id });
      setRequests(personalReqs);

      // Load team/company requests depending on role
      let allReqs = [];
      if (isManager) {
        allReqs = await fetchLeaveRequests({ managerId: profile?.id });
      } else if (currentRole.id === 'hr' || currentRole.id === 'company_admin') {
        allReqs = await fetchLeaveRequests({ entrepriseId: profile?.entreprise_id });
      }
      setTeamRequests(allReqs);

      // Generate AI Recommendations for Team Workload / Absence Overlap
      if (allReqs.length > 0) {
        setAiRecommendation(generateAIRecommendations(allReqs));
      }

    } catch (err) {
      console.error('Error fetching vacation data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, profile?.entreprise_id, currentRole.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const days = calcDays(form.startDate, form.endDate);

      // Basic validation: AI check if enough balance
      const typeMap = {
        'Annual Leave': 'annual',
        'Sick Leave': 'sick',
        'Remote Work': 'remote_work',
        'Unpaid Leave': 'unpaid'
      };
      const bType = typeMap[form.type] || 'annual';
      if (leaveBalance && leaveBalance[bType] && leaveBalance[bType].remaining < days) {
        showToast(`Error: Insufficient balance for ${form.type}. You only have ${leaveBalance[bType].remaining} days left.`);
        setSubmitting(false);
        return;
      }

      await submitLeaveRequest(profile?.id, { ...form, daysCount: days });

      setShowNewModal(false);
      setForm(emptyForm);
      showToast('Leave request submitted successfully!');
      fetchData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = (id) => {
    setActionModal({ isOpen: true, type: 'approve', requestId: id, reason: '' });
  };

  const handleReject = (id) => {
    setActionModal({ isOpen: true, type: 'reject', requestId: id, reason: '' });
  };

  const confirmAction = async () => {
    const { type, requestId } = actionModal;
    try {
      setSubmitting(true);
      if (type === 'approve') {
        await updateLeaveStatus(requestId, 'approved');
        showToast('Request approved.');
      } else {
        await updateLeaveStatus(requestId, 'rejected'); // Rejection reasons will be stored if schema supports it later
        showToast('Request rejected.');
      }
      setActionModal({ isOpen: false, type: '', requestId: null, reason: '' });
      setViewRequest(null);
      fetchData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = (req) => setCancelTarget(req);
  const confirmCancelRequest = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await updateLeaveStatus(cancelTarget.id, 'cancelled');
      showToast('Leave request cancelled.');
      fetchData();
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
      setCancelTarget(null);
    }
  };

  const renderRoleView = () => {
    switch (currentRole.id) {
      case 'super_admin':
        return <SuperAdminVacationView />;
      case 'company_admin':
        return <AdminVacationView requests={teamRequests} />;
      case 'hr':
        return (
          <HRVacationView
            requests={teamRequests}
            loading={loading}
            onApprove={handleApprove}
            onReject={handleReject}
            onView={setViewRequest}
          />
        );
      case 'manager':
        return (
          <div className="space-y-12">
            <EmployeeVacationView
              requests={requests}
              leaveBalance={leaveBalance}
              loading={loading}
              onNewRequest={() => setShowNewModal(true)}
              onViewRequest={setViewRequest}
            />
            <div className="pt-12 border-t border-border-secondary">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-text-primary">Team Management</h2>
                <p className="text-sm text-text-tertiary">Monitor team absences and redistribute tasks</p>
              </div>
              <TeamVacationView requests={teamRequests} />
            </div>
          </div>
        );
      case 'employee':
      default:
        return (
          <EmployeeVacationView
            requests={requests}
            leaveBalance={leaveBalance}
            loading={loading}
            onNewRequest={() => setShowNewModal(true)}
            onViewRequest={setViewRequest}
            onCancelRequest={handleCancelRequest}
          />
        );
    }
  };

  const previewDays = calcDays(form.startDate, form.endDate);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vacation Requests"
        description="Submit and manage leave requests and time-off balances"
        icon={Palmtree}
        iconColor="from-emerald-500 to-teal-600"
        actionLabel={(currentRole.id === 'employee' || currentRole.id === 'manager') ? "New Request" : null}
        actionIcon={Send}
        onAction={() => setShowNewModal(true)}
      />

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-slide-up ${toast.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* AI Automation Engine Insights */}
      {aiRecommendation && (currentRole.id === 'manager' || currentRole.id === 'hr') && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-5 flex gap-4 items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={80} className="text-brand-500" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-600 shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-brand-700 dark:text-brand-400 mb-1">AI Supervisor Intelligence</h3>
            <p className="text-sm text-text-secondary mb-2">{aiRecommendation.message}</p>
            {aiRecommendation.tasksTip && (
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-2">
                <CheckCircle2 size={14} /> {aiRecommendation.tasksTip}
              </p>
            )}
          </div>
        </div>
      )}

      {renderRoleView()}

      {/* New Request Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => { setShowNewModal(false); setForm(emptyForm); }}
        title="Submit Leave Request"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              form="leave-form"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Request
            </button>
          </div>
        }
      >
        <form id="leave-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Leave Type</label>
            <select required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}>
              {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" required value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" required value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {previewDays > 0 && (
            <div className="p-3 rounded-xl bg-brand-500/5 border border-brand-500/10 flex items-center gap-2 text-brand-600 text-sm">
              <CalendarDays size={16} />
              <span><strong>{previewDays}</strong> working days requested</span>
            </div>
          )}
          <div>
            <label className={labelCls}>Reason</label>
            <textarea rows={3} required value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={inputCls + ' resize-none'} placeholder="Why are you taking leave?" />
          </div>
        </form>
      </Modal>

      {/* View Request Modal */}
      <Modal
        isOpen={!!viewRequest}
        onClose={() => setViewRequest(null)}
        title="Request Details"
        maxWidth="max-w-md"
      >
        {viewRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">{viewRequest.employeeName}</span>
              <StatusBadge variant={viewRequest.status === 'approved' ? 'success' : viewRequest.status === 'pending' ? 'warning' : 'danger'} size="sm">
                {viewRequest.status}
              </StatusBadge>
            </div>
            <div className="space-y-3 pt-4 border-t border-border-secondary">
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Type</span>
                <span className="text-text-primary font-medium">{viewRequest.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Period</span>
                <span className="text-text-primary">{viewRequest.startDate} - {viewRequest.endDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-tertiary">Duration</span>
                <span className="text-text-primary">{viewRequest.daysCount} days</span>
              </div>
              <div className="pt-2 text-sm">
                <p className="text-text-tertiary mb-1">Reason</p>
                <p className="p-3 bg-surface-secondary rounded-xl text-text-secondary italic">"{viewRequest.reason}"</p>
              </div>
            </div>
            {viewRequest.status === 'pending' && (currentRole.id === 'hr' || currentRole.id === 'company_admin') && (
              <div className="flex items-center gap-3 pt-6">
                <button onClick={() => handleReject(viewRequest.id)} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                  Reject
                </button>
                <button onClick={() => handleApprove(viewRequest.id)} className="flex-1 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600">
                  Approve
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action (Approve/Reject) Modal */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        title={actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setActionModal({ ...actionModal, isOpen: false })}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              disabled={submitting}
              className={`px-5 py-2.5 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
                          ${actionModal.type === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            {actionModal.type === 'approve'
              ? 'You are about to approve this leave request. You can optionally provide a note for the employee.'
              : 'Please provide a reason for rejecting this leave request. This will be shared with the employee.'}
          </p>
          <div>
            <label className={labelCls}>{actionModal.type === 'approve' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}</label>
            <textarea
              rows={3}
              value={actionModal.reason}
              onChange={e => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder={actionModal.type === 'approve' ? "Good luck with your time off!" : "Conflict with project deadline..."}
              className={inputCls + ' resize-none'}
              required={actionModal.type === 'reject'}
            />
          </div>
        </div>
      </Modal>

      {/* Cancel Request Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancelRequest}
        title="Cancel Leave Request"
        message={cancelTarget ? `Are you sure you want to cancel your ${cancelTarget.leaveType || cancelTarget.type || 'leave'} request? This action cannot be undone.` : ''}
        confirmLabel="Cancel Request"
        variant="warning"
        loading={cancelling}
      />
    </div>
  );
}
