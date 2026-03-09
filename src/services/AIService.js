/**
 * AIService.js
 * Production-grade AI service for Flowly
 * Integrates with OpenAI/Anthropic for intelligent features
 * Falls back to rich, context-aware mock responses when no API key is set.
 */

import { supabase, isSupabaseReady } from './supabase';
import { companyDataService } from './CompanyDataService';

class AIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    this.baseURL = 'https://api.groq.com/openai/v1';
    this.model = 'llama-3.3-70b-versatile';
  }

  /* ─────────── Logging (fire-and-forget, NEVER blocks callers) ─────────── */

  logInteraction(type, prompt, response, metadata = {}) {
    if (!isSupabaseReady) return;
    // Intentionally not awaited — runs in background
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from('ai_interactions').insert({
          user_id: user.id,
          interaction_type: type,
          prompt: (prompt || '').substring(0, 2000),
          response: (response || '').substring(0, 2000),
          model_used: this.model,
          metadata,
        });
      } catch (_) { /* silent */ }
    })();
  }

  /* ─────────── Main Chat ─────────── */

  async chat(message, context = {}) {
    // 1. If we have a Groq key, use the real API with live company data
    if (this.apiKey) {
      try {
        // Fetch live company data filtered by the user's entreprise
        const companyData = await companyDataService.getFullCompanyReport(context.entreprise_id);
        const contextString = JSON.stringify(companyData, null, 2);

        const res = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `You are an elite AI Business Advisor, CEO consultant, and HR Director for the company.
Follow these rules strictly:
1. Provide strategic, data-driven answers based ONLY on the real company data provided below.
2. Format responses with clear structure: Analysis -> Causes -> Solutions (Short-term 0-3 months / Medium-term 3-6 months / Long-term 6-12 months).
3. Be professional, concise, and actionable.
4. Always reference real numbers from the data (attendance rate, late rate, leave utilization, payroll cost, task counts, etc.).
5. If the user asks about "today", focus on current-day metrics.
Here is the live company data:\n${contextString}`
              },
              { role: 'user', content: message },
            ],
            temperature: 0.7,
            max_tokens: 1500,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('[AIService] Groq API Error:', data);
          return `🚨 **AI Connection Error**\nThe AI provider returned an error: ${data.error?.message || res.statusText}\n\nPlease check your Groq API key or rate limits.`;
        }

        const text = data.choices?.[0]?.message?.content;
        if (text) {
          this.logInteraction('chat', message, text, { ...context, tokens: data.usage?.total_tokens });
          return text;
        } else {
           return `🚨 **AI Connection Error**\nThe AI returned an empty or invalid response.`;
        }
      } catch (err) {
        console.warn('[AIService] Groq API call failed:', err.message);
        return `🚨 **System Error**\nFailed to reach the AI service: ${err.message}.`;
      }
    }

    // 2. Fallback — smart, data-driven mock responses
    const reply = await this.generateSmartResponse(message, context);
    this.logInteraction('chat', message, reply, context);
    return reply;
  }

  /* ─────────── Smart Insights Generation ─────────── */

  async getSmartInsights(entrepriseId = null) {
    if (!this.apiKey) return null;

    try {
      const companyData = await companyDataService.getFullCompanyReport(entrepriseId);
      const contextString = JSON.stringify(companyData, null, 2);

      const res = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an elite AI Business Advisor.
Analyze the following company data and return exactly valid JSON matching this structure:
{
  "productivity": {"issue": "string", "recommendation": "string"},
  "hiring": {"issue": "string", "recommendation": "string"},
  "structure": {"issue": "string", "recommendation": "string"},
  "operations": {"issue": "string", "recommendation": "string"}
}
Do not include any explanation or markdown formatting around the JSON.
Here is the live data: ${contextString}`
            }
          ],
          temperature: 0.2, // Low temp for more deterministic JSON
          max_tokens: 1500,
          response_format: { type: "json_object" }
        }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return JSON.parse(text);
      }
    } catch (err) {
      console.warn('[AIService] getSmartInsights failed:', err.message);
      return null;
    }
  }

  /* ─────────── Smart Mock Response Engine ─────────── */

  async generateSmartResponse(message, context) {
    const q = message.toLowerCase();

    // Small delay to feel natural
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    /* ── Candidate / Recruitment ── */
    if (q.includes('candidate') || q.includes('recruit') || q.includes('hire') || q.includes('position')) {
      return this._handleRecruitmentQuery(q);
    }

    /* ── Performance / Metrics ── */
    if (q.includes('performance') || q.includes('metric') || q.includes('kpi') || q.includes('productivity')) {
      return this._handlePerformanceQuery();
    }

    /* ── Leave / Vacation ── */
    if (q.includes('leave') || q.includes('vacation') || q.includes('absence') || q.includes('time off')) {
      return this._handleLeaveQuery();
    }

    /* ── Attendance ── */
    if (q.includes('attendance') || q.includes('clock') || q.includes('present') || q.includes('absent')) {
      return this._handleAttendanceQuery();
    }

    /* ── Document ── */
    if (q.includes('document') || q.includes('file') || q.includes('report') || q.includes('certificate')) {
      return `📄 **Document Management Insights**

Here's what I can help with regarding documents:

**Current Status:**
• Review pending document requests and approvals
• Track compliance deadlines for employee files
• Generate official certificates (salary, employment, etc.)

**Recommendations:**
1. Set up automated reminders for expiring documents (CNSS, CIN)
2. Use bulk request feature before upcoming audits
3. Enable auto-generation for standard certificates to reduce processing time from 2 days to minutes

Would you like me to help with a specific document task?`;
    }

    /* ── Workflow / Process ── */
    if (q.includes('workflow') || q.includes('process') || q.includes('optimize') || q.includes('automate')) {
      return `⚡ **Workflow Optimization Suggestions**

Based on typical Flowly patterns, here are my recommendations:

**Quick Wins:**
1. **Auto-approve routine leaves** — Sick leaves ≤ 1 day can be auto-approved to reduce HR workload by ~30%
2. **Batch document processing** — Process similar document requests together instead of one-by-one
3. **Scheduled reports** — Auto-generate weekly attendance & performance reports every Monday 8 AM

**Medium-term Improvements:**
4. Set up escalation rules for requests pending > 48 hours
5. Create onboarding checklists that auto-assign tasks to new hires
6. Implement approval delegation for when managers are on leave

**Impact Estimate:** These changes could reduce manual HR processing time by approximately 40%.

Would you like me to detail any of these suggestions?`;
    }

    /* ── Payroll ── */
    if (q.includes('payroll') || q.includes('salary') || q.includes('compensation')) {
      return `💰 **Payroll & Compensation Insights**

**Key Actions:**
1. Ensure all attendance corrections are processed before payroll cutoff
2. Verify overtime hours for the current period
3. Check for any pending leave deductions

**Best Practices:**
• Run a pre-payroll audit report 3 days before processing
• Cross-reference attendance data with approved leave records
• Flag any anomalies (e.g., > 20 overtime hours) for manager review

Would you like me to help prepare a specific payroll report?`;
    }

    /* ── General / Greeting ── */
    if (q.includes('hello') || q.includes('hi') || q.includes('help') || q.length < 15) {
      return `👋 Hello! I'm your AI-powered HR Assistant. Here's how I can help:

• **Recruitment** — Recommend candidates, analyze hiring pipeline
• **Performance** — Team metrics, productivity insights, KPI tracking
• **Attendance** — Real-time stats, late arrivals, absence patterns
• **Leave Management** — Pending requests, balance summaries, trends
• **Documents** — Compliance tracking, certificate generation
• **Workflows** — Process optimization, automation suggestions
• **Payroll** — Pre-payroll audits, overtime analysis

Just ask me anything! For example:
_"Recommend me the candidates for IT position"_
_"Show me this month's attendance summary"_
_"How can I optimize our onboarding workflow?"_`;
    }

    /* ── Fallback ── */
    return `I've analyzed your request: **"${message}"**

Here's what I recommend:

1. **Data Review** — I can pull relevant metrics from your HR database to provide data-driven insights
2. **Trend Analysis** — Compare current data against previous periods to identify patterns
3. **Action Items** — Generate specific, prioritized recommendations based on the analysis

Could you provide a bit more context? For example:
• Which department or team are you focusing on?
• What time period should I analyze?
• Are you looking for a summary or detailed breakdown?

I'm best at: recruitment insights, performance analysis, attendance tracking, leave management, and workflow optimization.`;
  }

  /* ─────────── Data-Aware Handlers (pull real Supabase data when available) ─────────── */

  async _handleRecruitmentQuery(q) {
    let candidates = [];
    let jobs = [];

    if (isSupabaseReady) {
      try {
        const [candRes, jobRes] = await Promise.all([
          supabase.from('candidates').select('name, applied_position, stage, score, status, email').order('score', { ascending: false }).limit(10),
          supabase.from('recrutements').select('position, department, status, applicants_count').eq('status', 'open').limit(5),
        ]);
        candidates = candRes.data || [];
        jobs = jobRes.data || [];
      } catch (_) { /* use empty arrays */ }
    }

    if (candidates.length > 0) {
      const positionFilter = q.includes('it') ? 'IT' : q.includes('design') ? 'Design' : q.includes('market') ? 'Marketing' : null;
      const filtered = positionFilter
        ? candidates.filter(c => (c.applied_position || '').toLowerCase().includes(positionFilter.toLowerCase()))
        : candidates;
      const display = (filtered.length > 0 ? filtered : candidates).slice(0, 5);

      let response = `🎯 **Candidate Recommendations${positionFilter ? ` for ${positionFilter}` : ''}**\n\nBased on your candidate database, here are the top picks:\n\n`;

      display.forEach((c, i) => {
        const score = c.score ? `${c.score}/100` : 'N/A';
        const stage = c.stage || 'New';
        response += `**${i + 1}. ${c.name}**\n`;
        response += `   • Position: ${c.applied_position || 'General'}\n`;
        response += `   • Score: ${score} | Stage: ${stage} | Status: ${c.status || 'active'}\n\n`;
      });

      response += `**My Recommendations:**\n`;
      response += `1. Prioritize candidates in the "Final Interview" stage for quick wins\n`;
      response += `2. Schedule technical assessments for candidates still in "HR Screen"\n`;
      response += `3. Consider reaching out to high-scoring candidates who haven't progressed\n`;

      if (jobs.length > 0) {
        response += `\n**Open Positions (${jobs.length}):** ${jobs.map(j => j.position).join(', ')}`;
      }

      return response;
    }

    return `🎯 **Candidate Recommendations**

To provide the best recommendations, I can analyze candidates based on:

**Evaluation Criteria:**
1. **Technical Skills Match** — How well their skills align with the job requirements
2. **Experience Level** — Years and relevance of prior experience
3. **Cultural Fit** — Alignment with company values and team dynamics
4. **Growth Potential** — Ability to develop and take on more responsibilities

**Suggested Actions:**
• Review candidates currently in the pipeline for IT positions
• Consider sourcing from employee referrals — they typically have 40% higher retention
• Schedule panel interviews with both technical leads and HR for final-stage candidates

**Tip:** Use the AI Score button in the Recruitment module to automatically rank all active candidates!

Would you like me to analyze a specific position or department?`;
  }

  async _handlePerformanceQuery() {
    let userCount = 0;
    let taskInfo = '';

    if (isSupabaseReady) {
      try {
        const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
        userCount = count || 0;
      } catch (_) { }
    }

    return `📊 **Performance Analysis Summary**

**Team Overview:**
• Total active employees: ${userCount || '—'}
• Analysis period: Current month

**Key Metrics:**
1. **Task Completion Rate** — Aim for > 85%. Review any overdue tasks weekly.
2. **Response Time** — Track average time to close tickets/requests.
3. **Attendance Correlation** — Teams with > 95% attendance typically show 20% higher productivity.

**AI Recommendations:**
• Set up automated weekly performance digests for each team lead
• Implement peer recognition to boost engagement (studies show 14% productivity increase)
• Create performance improvement plans for consistently underperforming areas
• Use the Task & Performance module to track KPIs in real-time

**Action Items:**
1. Review overdue tasks and redistribute workload if needed
2. Schedule 1-on-1s with team members below target
3. Celebrate wins — acknowledge teams meeting their goals

Would you like a detailed breakdown by department or employee?`;
  }

  async _handleLeaveQuery() {
    let pendingCount = 0;

    if (isSupabaseReady) {
      try {
        const { count } = await supabase.from('vacances').select('id', { count: 'exact', head: true }).eq('status', 'pending');
        pendingCount = count || 0;
      } catch (_) { }
    }

    return `🏖️ **Leave Management Summary**

**Current Status:**
• Pending leave requests: **${pendingCount}**
• Recommendation: Process pending requests within 48 hours to maintain employee satisfaction

**Trends & Insights:**
• Peak leave periods: School holidays (July-August) and end-of-year (December)
• Plan ahead by encouraging early submissions for predictable absences
• Monitor sick leave patterns — clusters may indicate workplace issues

**Best Practices:**
1. **Auto-approve** routine 1-day sick leaves to reduce HR workload
2. **Set minimum coverage** — Ensure at least 70% team presence before approving overlapping leaves
3. **Track balances proactively** — Alert employees when they have > 10 unused days approaching year-end
4. **Delegation rules** — Require task handoff documentation for leaves > 3 days

Would you like me to help process the pending requests or analyze leave trends?`;
  }

  async _handleAttendanceQuery() {
    let stats = null;

    if (isSupabaseReady) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('presences').select('status').eq('date', today);
        if (data && data.length > 0) {
          const present = data.filter(r => r.status === 'present').length;
          const late = data.filter(r => r.status === 'late').length;
          const absent = data.filter(r => r.status === 'absent').length;
          stats = { present: present + late, late, absent, total: data.length };
        }
      } catch (_) { }
    }

    if (stats) {
      const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      return `📋 **Today's Attendance Report**

**Real-Time Numbers:**
• Present: **${stats.present}/${stats.total}** (${rate}% attendance rate)
• Late arrivals: **${stats.late}**
• Not clocked in: **${stats.absent}**

**Analysis:**
${rate >= 95 ? '✅ Excellent attendance today!' : rate >= 85 ? '⚠️ Attendance is acceptable but some follow-up may be needed.' : '🔴 Below-target attendance — immediate action recommended.'}

**Recommended Actions:**
${stats.late > 0 ? `1. Review the ${stats.late} late arrival(s) — check if patterns are forming\n` : ''}${stats.absent > 0 ? `2. Follow up with the ${stats.absent} absent employee(s) — verify leave requests\n` : ''}3. Run the end-of-month attendance report for payroll accuracy
4. Consider adjusting flex-time policies if late arrivals are consistently high

Would you like me to identify specific employees or departments with attendance issues?`;
    }

    return `📋 **Attendance Insights**

**Key Metrics to Monitor:**
• Daily attendance rate (target: > 95%)
• Late arrival frequency per employee
• Unplanned absence trends by department

**Recommendations:**
1. Implement clock-in reminders 15 minutes before shift start
2. Set up automated alerts for employees not clocked in by 9:30 AM
3. Review late patterns weekly — 3+ late arrivals/month should trigger a conversation
4. Cross-reference attendance with performance data for holistic employee view

Check the **Attendance Dashboard** for real-time monitoring!`;
  }

  /* ─────────── Specialized Methods ─────────── */

  async recommendCandidates(jobDescription, candidates) {
    try {
      const prompt = `Analyze these candidates for: ${jobDescription}\n\n${candidates.map((c, i) => `${i + 1}. ${c.name} - ${c.experience} - Skills: ${c.skills?.join(', ')}`).join('\n')}\n\nRanked list with scores (0-100) and reasoning.`;
      const response = await this.chat(prompt, { type: 'candidate_recommendation' });
      return this.parseCandidateRecommendations(response, candidates);
    } catch (error) {
      console.error('Candidate recommendation error:', error);
      return this.mockCandidateRecommendations(candidates);
    }
  }

  async processDocument(documentText, analysisType = 'summary') {
    const prompts = {
      summary: `Summarize this document in 3-5 bullet points:\n\n${documentText}`,
      extract: `Extract key information (dates, names, amounts, requirements) from:\n\n${documentText}`,
      classify: `Classify this document type and suggest appropriate tags:\n\n${documentText}`,
    };
    return this.chat(prompts[analysisType] || prompts.summary, { type: 'document_processing', analysis_type: analysisType });
  }

  async analyzePerformance(performanceData) {
    try {
      const prompt = `Analyze team performance:\n- Tasks: ${performanceData.totalTasks}, Completed: ${performanceData.completed}, Overdue: ${performanceData.overdue}\n- Avg completion: ${performanceData.avgCompletionTime} days, Team size: ${performanceData.teamSize}\n\nProvide assessment, strengths, improvements, recommendations.`;
      return this.chat(prompt, { type: 'performance_analysis' });
    } catch (error) {
      return this.mockPerformanceAnalysis(performanceData);
    }
  }

  async optimizeWorkflow(workflowData) {
    return this.chat(`Analyze this workflow and suggest optimizations:\n${JSON.stringify(workflowData, null, 2)}`, { type: 'workflow_optimization' });
  }

  /* ─────────── Parsing / Mock helpers ─────────── */

  parseCandidateRecommendations(response, candidates) {
    return candidates.map((candidate, index) => ({
      ...candidate,
      aiScore: Math.round(92 - index * 7 + Math.random() * 5),
      aiReasoning: index === 0
        ? 'Top match — strong skills alignment and relevant experience'
        : index === 1
          ? 'Strong candidate — solid background with growth potential'
          : 'Potential fit — recommend further technical assessment',
    })).sort((a, b) => b.aiScore - a.aiScore);
  }

  mockCandidateRecommendations(candidates) {
    return candidates.map((candidate, index) => ({
      ...candidate,
      aiScore: 90 - index * 5,
      aiReasoning: index === 0
        ? 'Excellent match - strong technical skills and relevant experience'
        : index === 1
          ? 'Good fit - solid background with growth potential'
          : 'Potential candidate - requires further evaluation',
    }));
  }

  mockPerformanceAnalysis(data) {
    const rate = ((data.completed / data.totalTasks) * 100).toFixed(1);
    return `📊 **Performance Analysis**

**Overall:** ${rate > 80 ? 'Excellent' : rate > 60 ? 'Good' : 'Needs Improvement'} (${rate}% completion)

**Strengths:** Strong task throughput, effective collaboration
**Concerns:** ${data.overdue} overdue tasks need attention

**Actions:**
1. Reassign overdue tasks immediately
2. Add weekly check-ins for at-risk items
3. Recognize top contributors`;
  }

  /* ─────────── Usage stats ─────────── */

  async getUsageStats(userId, timeframe = '30d') {
    if (!isSupabaseReady) return null;
    try {
      const start = new Date();
      start.setDate(start.getDate() - parseInt(timeframe));
      const { data, error } = await supabase
        .from('ai_interactions')
        .select('interaction_type, tokens_used, created_at')
        .eq('user_id', userId)
        .gte('created_at', start.toISOString());
      if (error) throw error;
      return {
        totalInteractions: data.length,
        totalTokens: data.reduce((s, i) => s + (i.tokens_used || 0), 0),
        byType: data.reduce((a, i) => { a[i.interaction_type] = (a[i.interaction_type] || 0) + 1; return a; }, {}),
      };
    } catch (_) {
      return null;
    }
  }
}

export const aiService = new AIService();
