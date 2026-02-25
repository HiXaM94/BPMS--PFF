/**
 * NotificationService.js
 *
 * Centralized notification dispatcher for workflow events, approvals,
 * and role-based actions across the entire BPMS platform.
 *
 * - Inserts notifications into Supabase `notifications` table
 * - Real-time delivery via Supabase Realtime (NotificationContext subscribes)
 * - Fire-and-forget pattern — never blocks calling code
 * - Email dispatch hooks (ready for Supabase Edge Functions / SMTP integration)
 */

import { supabase, isSupabaseReady } from './supabase';

class NotificationService {

  /**
   * Send an in-app notification to a specific user.
   * @param {string} userId - Target user UUID
   * @param {string} message - Notification body text
   * @param {string} type - 'info' | 'success' | 'warning' | 'error'
   * @param {object} metadata - Optional extra data (link, entity_id, etc.)
   */
  async send(userId, message, type = 'info', metadata = {}) {
    if (!isSupabaseReady || !userId) return;
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        message,
        type,
        metadata,
        is_read: false,
      });
    } catch (err) {
      console.error('[NotificationService] send failed:', err.message);
    }
  }

  /**
   * Send the same notification to multiple users.
   */
  async sendBulk(userIds, message, type = 'info', metadata = {}) {
    if (!isSupabaseReady || !userIds?.length) return;
    try {
      const rows = userIds.map(uid => ({
        user_id: uid,
        message,
        type,
        metadata,
        is_read: false,
      }));
      await supabase.from('notifications').insert(rows);
    } catch (err) {
      console.error('[NotificationService] sendBulk failed:', err.message);
    }
  }

  /* ─── Workflow Event Helpers ─── */

  /** Leave request submitted → notify manager + HR */
  async onLeaveRequested(employeeName, managerUserId, hrUserId) {
    const msg = `📋 New leave request from ${employeeName} awaiting approval.`;
    const ids = [managerUserId, hrUserId].filter(Boolean);
    await this.sendBulk(ids, msg, 'info', { event: 'leave_requested' });
  }

  /** Leave approved → notify employee */
  async onLeaveApproved(employeeUserId, approverName) {
    await this.send(employeeUserId, `✅ Your leave request has been approved by ${approverName}.`, 'success', { event: 'leave_approved' });
  }

  /** Leave rejected → notify employee */
  async onLeaveRejected(employeeUserId, approverName, reason) {
    await this.send(employeeUserId, `❌ Your leave request was rejected by ${approverName}. Reason: ${reason || 'N/A'}`, 'warning', { event: 'leave_rejected' });
  }

  /** Document uploaded → notify HR */
  async onDocumentUploaded(hrUserId, employeeName, docType) {
    await this.send(hrUserId, `📄 ${employeeName} uploaded a new document: ${docType}.`, 'info', { event: 'document_uploaded' });
  }

  /** Document approved → notify employee */
  async onDocumentApproved(employeeUserId, docType) {
    await this.send(employeeUserId, `✅ Your document "${docType}" has been approved.`, 'success', { event: 'document_approved' });
  }

  /** Task assigned → notify assignee */
  async onTaskAssigned(assigneeUserId, taskTitle, assignerName) {
    await this.send(assigneeUserId, `📌 New task assigned to you: "${taskTitle}" by ${assignerName}.`, 'info', { event: 'task_assigned' });
  }

  /** Task completed → notify manager */
  async onTaskCompleted(managerUserId, taskTitle, employeeName) {
    await this.send(managerUserId, `✅ ${employeeName} completed task: "${taskTitle}".`, 'success', { event: 'task_completed' });
  }

  /** Recruitment: candidate stage change → notify HR */
  async onCandidateStageChanged(hrUserId, candidateName, newStage) {
    await this.send(hrUserId, `🎯 ${candidateName} moved to stage: ${newStage}.`, 'info', { event: 'candidate_stage_changed' });
  }

  /** Role changed → notify user */
  async onRoleChanged(userId, newRole) {
    await this.send(userId, `🔐 Your role has been updated to: ${newRole}.`, 'warning', { event: 'role_changed' });
  }

  /** Payroll submitted → notify company admin */
  async onPayrollSubmitted(adminUserId, submitterName, period) {
    await this.send(adminUserId, `💰 Payroll for ${period} submitted by ${submitterName} — awaiting approval.`, 'info', { event: 'payroll_submitted' });
  }

  /** Payroll approved → notify HR */
  async onPayrollApproved(hrUserId, period) {
    await this.send(hrUserId, `✅ Payroll for ${period} has been approved. Payslips are being generated.`, 'success', { event: 'payroll_approved' });
  }

  /** Onboarding started → notify new hire + manager */
  async onOnboardingStarted(newHireUserId, managerUserId, newHireName) {
    await this.send(newHireUserId, `🎉 Welcome aboard! Your onboarding process has started.`, 'success', { event: 'onboarding_started' });
    if (managerUserId) {
      await this.send(managerUserId, `👤 New hire ${newHireName} onboarding has been initiated.`, 'info', { event: 'onboarding_started' });
    }
  }

  /** Performance review cycle started → notify employees */
  async onReviewCycleStarted(employeeUserIds, cycleName) {
    await this.sendBulk(employeeUserIds, `📊 Performance review cycle "${cycleName}" has started. Please complete your self-evaluation.`, 'info', { event: 'review_cycle_started' });
  }

  /** Attendance anomaly → notify manager */
  async onAttendanceAnomaly(managerUserId, employeeName, issue) {
    await this.send(managerUserId, `⚠️ Attendance alert: ${employeeName} — ${issue}.`, 'warning', { event: 'attendance_anomaly' });
  }
}

export const notificationService = new NotificationService();
