import { companyDataService } from './CompanyDataService';
import { notificationService } from './NotificationService';

class AIHealthCheckService {
    async runDailyHealthCheck(userId, entrepriseId) {
        if (!userId) return;

        // Prevent spamming — only run once per session/day
        const lastCheck = sessionStorage.getItem(`health_check_${userId}`);
        if (lastCheck) return;

        try {
            const data = await companyDataService.getFullCompanyReport(entrepriseId);
            if (!data || data.error) return;

            const { analytics, hr } = data;
            const alerts = [];

            // 1. Management Issue Detection (Attendance)
            if (analytics.lateRate > 15) {
                alerts.push({
                    msg: `⚠️ High late arrival rate detected (${analytics.lateRate}%). Consider reviewing attendance policies or speaking with department heads.`,
                    type: 'warning',
                    metadata: { source: 'ai_health_check', category: 'attendance' }
                });
            }

            if (analytics.attendanceRate > 0 && analytics.attendanceRate < 85) {
                alerts.push({
                    msg: `🔴 Critical: Overall attendance rate has dropped to ${analytics.attendanceRate}%. Immediate review required.`,
                    type: 'error',
                    metadata: { source: 'ai_health_check', category: 'attendance' }
                });
            }

            // 2. Organizational Health (Recruitment & HR bottlenecks)
            if (hr.openJobs > 0 && hr.activeCandidates === 0) {
                alerts.push({
                    msg: `🔍 You have ${hr.openJobs} open positions but 0 active candidates. Consider boosting recruitment marketing.`,
                    type: 'info',
                    metadata: { source: 'ai_health_check', category: 'recruitment' }
                });
            }

            // 3. HR Compliance & Bottlenecks
            if (hr.pendingLeaves > 10) {
                alerts.push({
                    msg: `⚠️ There are ${hr.pendingLeaves} pending leave requests awaiting approval. High backlog can impact employee satisfaction.`,
                    type: 'warning',
                    metadata: { source: 'ai_health_check', category: 'compliance' }
                });
            }

            // Dispatch all detected alerts via the notification system
            for (const alert of alerts) {
                await notificationService.send(userId, alert.msg, alert.type, alert.metadata);
            }

            // Mark as checked for this session
            sessionStorage.setItem(`health_check_${userId}`, new Date().toISOString());

        } catch (err) {
            console.error('[AIHealthCheck] Failed to run:', err);
        }
    }
}

export const aiHealthCheckService = new AIHealthCheckService();
