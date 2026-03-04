import { useState } from 'react';
import { Shield, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { auditService } from '../../services/AuditService';
import Modal from '../ui/Modal';

export default function RoleSwitchRequest({ currentRole, userId, onRequestSubmitted }) {
  const [showModal, setShowModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const availableRoles = [
    { value: 'EMPLOYEE', label: 'Employee', description: 'Standard user access' },
    { value: 'TEAM_MANAGER', label: 'Team Manager', description: 'Manage team and projects' },
    { value: 'HR', label: 'HR Manager', description: 'Manage employees and HR operations' },
    { value: 'ADMIN', label: 'Administrator', description: 'Full system access' }
  ].filter(role => role.value !== currentRole);

  const handleSubmit = async () => {
    if (!selectedRole || !reason.trim()) {
      setError('Please select a role and provide a reason');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Create role change request
      const { error: insertError } = await supabase
        .from('role_change_requests')
        .insert({
          user_id: userId,
          from_role: currentRole,
          to_role: selectedRole,
          reason: reason.trim(),
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Log audit trail
      await auditService.log(
        'ROLE_CHANGE_REQUEST',
        'user',
        userId,
        { role: currentRole },
        { requested_role: selectedRole, reason }
      );

      setSuccess(true);
      
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
        setSelectedRole('');
        setReason('');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 text-brand-600 hover:bg-brand-50 border border-brand-200 rounded-lg transition-colors"
      >
        <Shield size={18} />
        Request Role Change
      </button>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError(null);
          setSuccess(false);
        }}
        title="Request Role Change"
      >
        <div className="space-y-4">
          {success ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Request Submitted Successfully
              </h3>
              <p className="text-gray-600">
                Your role change request has been submitted for approval.
                You will be notified once it's reviewed.
              </p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm text-amber-900">
                      Role change requests require approval from an administrator or HR manager.
                      Your current role is <strong>{currentRole}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="">Select a role...</option>
                  {availableRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Request
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Please explain why you need this role change..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedRole || !reason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
