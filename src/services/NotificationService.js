/**
 * NotificationService.js
 *
 * Centralized notification dispatcher for workflow events, approvals,
 * and role-based actions across the entire Flowly platform.
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
      // Maps generic metadata properties to the actual db columns
      const insertPayload = {
        user_id: userId,
        message,
        type,
        is_read: false,
      };

      if (metadata) {
        if (metadata.source || metadata.event) {
          insertPayload.related_entity = metadata.source || metadata.event;
        }
        if (metadata.note_id || metadata.entity_id) {
          insertPayload.related_id = metadata.note_id || metadata.entity_id;
        }
      }

      await supabase.from('notifications').insert(insertPayload);
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
      const rows = userIds.map(uid => {
        const payload = {
          user_id: uid,
          message,
          type,
          is_read: false,
        };

        if (metadata) {
          if (metadata.source || metadata.event) {
            payload.related_entity = metadata.source || metadata.event;
          }
          if (metadata.note_id || metadata.entity_id) {
            payload.related_id = metadata.note_id || metadata.entity_id;
          }
        }
        return payload;
      });
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

  /** Document rejected → notify employee */
  async onDocumentRejected(employeeUserId, docType, reason) {
    await this.send(employeeUserId, `❌ Your document "${docType}" was rejected. Reason: ${reason || 'Please re-upload.'}`, 'warning', { event: 'document_rejected' });
  }

  /** All onboarding docs submitted → notify HR */
  async onOnboardingDocsSubmitted(hrUserIds, employeeName) {
    await this.sendBulk(hrUserIds, `📋 ${employeeName} has submitted all onboarding documents for review.`, 'info', { event: 'onboarding_docs_submitted' });
  }

  /** Official document request → notify HR */
  async onOfficialDocRequested(hrUserIds, employeeName, docType, urgency) {
    const urgLabel = urgency === 'urgent' ? '🔴 URGENT' : '';
    await this.sendBulk(hrUserIds, `📄 ${urgLabel} ${employeeName} requested: ${docType}.`, 'info', { event: 'official_doc_requested' });
  }

  /** Official request completed → notify employee */
  async onOfficialDocCompleted(employeeUserId, docType) {
    await this.send(employeeUserId, `✅ Your requested document "${docType}" is ready.`, 'success', { event: 'official_doc_completed' });
  }

  /** Salary certificate generated → audit log */
  async onSalaryCertGenerated(employeeUserId, period) {
    await this.send(employeeUserId, `📄 Salary certificate for ${period} has been generated and downloaded.`, 'success', { event: 'salary_cert_generated' });
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
