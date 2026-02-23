import { useState, useEffect, useCallback } from 'react';
import {
  Palmtree, Send, CheckCircle2, Loader2, Sparkles, CalendarDays
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { useRole } from '../../contexts/RoleContext';
import { useAuth } from '../../contexts/AuthContext';
import { vacationController } from '../../controllers/VacationController';
import { LeaveBalance } from '../../models/Vacation';

// Role-specific views
import EmployeeVacationView from './vacation/EmployeeVacationView';
import TeamVacationView from './vacation/TeamVacationView';
import HRVacationView from './vacation/HRVacationView';
import AdminVacationView from './vacation/AdminVacationView';

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
  const [leaveBalance, setLeaveBalance] = useState(new LeaveBalance());
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const [teamRequests, setTeamRequests] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const isManager = currentRole.id === 'manager';
      const isEmployee = currentRole.id === 'employee';

      const [personalReqs, bal, allReqs] = await Promise.all([
        vacationController.getRequests({ userId: profile?.id }),
        vacationController.getBalance(profile?.id),
        (isManager || currentRole.id === 'hr' || currentRole.id === 'company_admin')
          ? vacationController.getRequests({})
          : Promise.resolve([])
      ]);

      setRequests(personalReqs);
      setLeaveBalance(bal);
      setTeamRequests(allReqs);
    } catch (err) {
      console.error('Error fetching vacation data:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, currentRole.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const days = calcDays(form.startDate, form.endDate);
      await vacationController.submitRequest({
        userId: profile?.id,
        ...form,
        daysCount: days
      });
      // Close modal first for better UX
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

  const handleApprove = async (id) => {
    const reason = prompt('Add an approval note (optional):');
    if (reason === null) return;
    await vacationController.approveRequest(id, reason);
    showToast('Request approved.');
    fetchData();
    setViewRequest(null);
  };

  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason (required):');
    if (!reason) return;
    await vacationController.rejectRequest(id, reason);
    showToast('Request rejected.');
    fetchData();
    setViewRequest(null);
  };

  const renderRoleView = () => {
    switch (currentRole.id) {
      case 'company_admin':
      case 'super_admin':
        return <AdminVacationView />;
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
            onNewRequest={() => setShowNewModal(true)}
            onViewRequest={setViewRequest}
          />
        );
    }
  };

  const previewDays = calcDays(form.startDate, form.endDate);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Vacation & Leave"
        description="Submit and manage leave requests with AI-powered conflict detection"
        icon={Palmtree}
        iconColor="from-emerald-500 to-teal-600"
        actionLabel={(currentRole.id === 'employee' || currentRole.id === 'manager') ? "New Request" : null}
        actionIcon={Send}
        onAction={() => setShowNewModal(true)}
      />

      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-medium animate-slide-up">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-sm text-text-tertiary">Analyzing leave data and conflicts...</p>
        </div>
      ) : (
        renderRoleView()
      )}

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
    </div>
  );
}
