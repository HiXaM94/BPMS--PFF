import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, Loader2,
  Minimize2, Maximize2, ChevronDown, FileText, Users, TrendingUp, Calendar,
} from 'lucide-react';
import { supabase } from '../../services/supabase';

const HR_SUGGESTIONS = [
  { label: 'Rank candidates for React role', icon: Users },
  { label: 'Summarize pending leave requests', icon: Calendar },
  { label: 'Generate onboarding checklist', icon: FileText },
  { label: 'Draft employment contract', icon: FileText },
  { label: 'Analyze team performance trends', icon: TrendingUp },
  { label: 'Prepare interview questions', icon: Users },
];

function matchResponse(text) {
  const last = text.toLowerCase();

  // ── Candidate ranking / CV screening ──
  if (last.includes('candidate') || last.includes('cv') || last.includes('rank') || last.includes('screen'))
    return `**Candidate Ranking — Senior React Developer**\n\n1. 🥇 **Nadia Benali** — Score: 94/100\n   • 6 years React experience, strong portfolio, excellent technical test\n   • Stage: Offer → Recommend immediate offer\n\n2. 🥈 **Youssef Alami** — Score: 78/100\n   • 4 years experience, good portfolio\n   • Stage: Technical Interview → Schedule final round\n\n3. 🥉 **Karim Idrissi** — Score: 65/100\n   • 5 years full-stack, pending technical review\n   • Stage: HR Screen → Move to technical test\n\n**Recommendation:** Proceed with Nadia Benali — she meets all requirements and her test scores are exceptional.\n\nWould you like me to **generate an offer letter** for Nadia or **prepare interview questions** for Youssef?`;

  // ── Leave / vacation ──
  if (last.includes('leave') || last.includes('vacation') || last.includes('pending'))
    return `**Pending Leave Requests Summary**\n\n• **3 requests** awaiting approval\n• Ibrahim Rouass: Feb 20–24 (Annual Leave, 5 days)\n• Ahmed Hassan: Mar 3–7 (Annual Leave, 5 days)\n• Carlos Ruiz: Feb 25–26 (Sick Leave, 2 days)\n\n⚠️ **Conflict Alert:** Ibrahim and Ahmed's requests overlap. Engineering team coverage drops below 60%.\n\n**Recommendation:**\n1. Approve Ibrahim's request (submitted first)\n2. Ask Ahmed to shift to Mar 10–14\n3. Approve Carlos (different team, no conflict)\n\nShall I draft a **rescheduling email** for Ahmed?`;

  // ── Performance ──
  if (last.includes('performance') || last.includes('trend'))
    return `**Team Performance Analysis — Q4 2025**\n\n📈 **Top Performers:**\n• Clara Dupont — 94/100 (Exceptional HR management)\n• Ibrahim Rouass — 90/100 (Strong leadership)\n\n📉 **Needs Attention:**\n• Ahmed Hassan — 76/100 (Task delays noted)\n• Bob Tanaka — 78/100 (Documentation gaps)\n\n📊 **Department Averages:**\n• Engineering: 84/100 (+3 vs Q3)\n• Design: 88/100 (+1 vs Q3)\n• Marketing: 79/100 (-2 vs Q3)\n\n**Recommendation:** Schedule 1:1 coaching sessions for Ahmed and Bob. Consider Ibrahim for team lead promotion.\n\nShall I **generate performance review letters** or **draft improvement plans**?`;

  // ── Job description ──
  if (last.includes('job') || last.includes('description'))
    return `**Draft Job Description — UX Designer**\n\n**Position:** Senior UX Designer\n**Department:** Design\n**Location:** Casablanca, Morocco (Hybrid)\n**Salary Range:** 15,000–22,000 MAD/month\n\n**About the Role:**\nJoin Flowly's design team to shape the future of HR technology.\n\n**Responsibilities:**\n• Lead end-to-end UX design for product features\n• Conduct user research and usability testing\n• Create wireframes, prototypes, and design systems\n• Collaborate with engineering and product teams\n• Mentor junior designers\n\n**Requirements:**\n• 3+ years UX design experience\n• Proficiency in Figma, user research methods\n• Portfolio demonstrating complex product design\n• Excellent communication skills (French + English)\n\n**Benefits:**\n• Health insurance, remote work flexibility, annual training budget\n\nShall I refine this, **post it to the recruitment pipeline**, or **draft screening criteria**?`;

  // ── Onboarding ──
  if (last.includes('onboarding') || last.includes('checklist') || last.includes('new hire') || last.includes('new employee'))
    return `**New Employee Onboarding Checklist**\n\n**📋 Pre-arrival (1 week before):**\n☐ Send welcome email with start date & location\n☐ Prepare workstation (laptop, badge, access cards)\n☐ Create accounts (email, Flowly, project tools)\n☐ Assign buddy/mentor\n☐ Notify team about new member\n\n**📅 Day 1:**\n☐ Welcome meeting with HR\n☐ Office tour & team introductions\n☐ Sign employment contract & NDA\n☐ Collect required documents (CNSS, CIN, RIB, diploma)\n☐ IT setup & tool walkthrough\n\n**📅 Week 1:**\n☐ Department orientation meetings\n☐ Manager 1:1 — goals & expectations\n☐ Review company handbook & policies\n☐ Complete compliance training\n☐ Set up payroll & benefits\n\n**📅 Month 1:**\n☐ 30-day check-in with HR\n☐ First performance touchpoint\n☐ Team project assignment\n☐ Feedback survey\n\nShall I **customize this for a specific department** or **generate the welcome email**?`;

  // ── Contract / offer letter ──
  if (last.includes('contract') || last.includes('offer letter') || last.includes('employment'))
    return `**Draft Employment Contract**\n\n---\n**EMPLOYMENT AGREEMENT**\n\n**Between:** [Company Name], hereinafter "Employer"\n**And:** [Employee Full Name], hereinafter "Employee"\n\n**Position:** [Job Title]\n**Department:** [Department]\n**Start Date:** [Date]\n**Contract Type:** CDI (Permanent)\n\n**Article 1 — Compensation:**\n• Gross Monthly Salary: [Amount] MAD\n• Transportation Allowance: 500 MAD/month\n• Performance Bonus: Up to 15% of annual salary\n\n**Article 2 — Working Hours:**\n• 40 hours/week (Mon–Fri, 9:00–18:00)\n• Lunch break: 12:30–13:30\n\n**Article 3 — Leave Entitlements:**\n• Annual Leave: 18 working days/year\n• Sick Leave: As per Moroccan Labor Code\n• Maternity/Paternity: As per law\n\n**Article 4 — Probation Period:**\n• 3 months, renewable once\n\n**Article 5 — Confidentiality:**\n• Employee agrees to NDA terms (see Annex A)\n\n---\n\n⚠️ **Note:** This is a template. Consult legal counsel before issuing.\n\nShall I **adjust for a CDD (fixed-term)** contract or **add specific clauses**?`;

  // ── Interview questions ──
  if (last.includes('interview') || last.includes('question'))
    return `**Interview Questions — Technical + Behavioral**\n\n**🔧 Technical Questions:**\n1. Describe a complex UI component you built. How did you handle state management?\n2. How would you optimize a React app with 50+ components and slow rendering?\n3. Explain the difference between SSR and CSR. When would you use each?\n4. Walk me through how you'd design a role-based access control system.\n5. How do you handle API errors and loading states in a production app?\n\n**🧠 Behavioral Questions:**\n1. Tell me about a time you disagreed with a teammate. How did you resolve it?\n2. Describe a project where requirements changed mid-sprint. What did you do?\n3. How do you prioritize tasks when everything feels urgent?\n4. Give an example of mentoring or helping a junior developer.\n5. What's the most impactful feedback you've received, and how did it change you?\n\n**📊 Scoring Rubric:**\n• Technical depth: /25\n• Problem-solving: /25\n• Communication: /20\n• Culture fit: /15\n• Growth mindset: /15\n\nShall I **tailor these for a specific role** or **create a full interview scorecard**?`;

  // ── Policy / handbook ──
  if (last.includes('policy') || last.includes('handbook') || last.includes('rules') || last.includes('regulation'))
    return `**Company Policy Document — Leave Policy**\n\n**1. Annual Leave:**\n• Entitlement: 18 working days per year (accrued monthly: 1.5 days)\n• Must be requested at least 5 working days in advance\n• Maximum consecutive days: 10 (unless approved by department head)\n• Unused days carry over up to 5 days to next year\n\n**2. Sick Leave:**\n• Short-term (1–3 days): Self-certification accepted\n• Extended (4+ days): Medical certificate required within 48 hours\n• Paid sick leave: Up to 26 weeks at full salary (per labor code)\n\n**3. Remote Work:**\n• Eligible after probation period completion\n• Maximum 2 days/week unless otherwise approved\n• Must be available during core hours (10:00–16:00)\n\n**4. Special Leave:**\n• Marriage: 3 days\n• Birth of child: 3 days (father), 14 weeks (mother)\n• Bereavement: 3 days (immediate family)\n\n**5. Public Holidays:**\n• As per Moroccan official calendar (12 days/year)\n\nShall I **draft another policy** (dress code, expense, etc.) or **format this for the employee handbook**?`;

  // ── Payslip / salary ──
  if (last.includes('payslip') || last.includes('salary') || last.includes('payroll') || last.includes('compensation'))
    return `**Salary Structure Breakdown — Example**\n\n**Employee:** [Name]\n**Position:** Software Engineer\n**Grade:** E3\n\n**💰 Monthly Earnings:**\n• Base Salary: 12,000 MAD\n• Transportation: 500 MAD\n• Meal Allowance: 600 MAD\n• Performance Bonus: 1,800 MAD (15%)\n• **Gross Total: 14,900 MAD**\n\n**📉 Deductions:**\n• CNSS (Employee): 643 MAD (4.48%)\n• AMO (Health): 306 MAD (2.26%)\n• IR (Income Tax): 1,290 MAD (estimated)\n• **Total Deductions: 2,239 MAD**\n\n**✅ Net Salary: 12,661 MAD**\n\n**Employer Cost:**\n• CNSS (Employer): 1,222 MAD (8.98%)\n• AMO (Employer): 539 MAD (3.98%)\n• Professional Tax: 223 MAD\n• **Total Employer Cost: 16,884 MAD**\n\nShall I **generate payslips for the full team** or **model a salary increase scenario**?`;

  // ── Warning / disciplinary ──
  if (last.includes('warning') || last.includes('disciplinary') || last.includes('termination'))
    return `**Draft Written Warning Letter**\n\n---\n**[Company Letterhead]**\n\nDate: [Today's Date]\n\nTo: [Employee Name]\nFrom: Human Resources\nSubject: **Written Warning — [Nature of Infraction]**\n\nDear [Employee Name],\n\nThis letter serves as a formal written warning regarding [describe the specific behavior or incident, including dates].\n\n**Details of Infraction:**\n• [Incident 1 — date, description]\n• [Incident 2 — date, description, if applicable]\n\n**Company Policy Reference:**\nThis behavior violates Section [X] of the Employee Handbook regarding [policy name].\n\n**Expected Corrective Action:**\n• [Specific, measurable expectation]\n• [Timeline for improvement]\n\n**Consequences:**\nFailure to improve may result in further disciplinary action, up to and including termination of employment.\n\nPlease sign below to acknowledge receipt.\n\n---\n\n⚠️ **Legal Note:** Ensure compliance with Moroccan Labor Code Articles 37-39 regarding disciplinary procedures.\n\nShall I **adjust the severity** or **draft a termination letter** instead?`;

  // ── Certificate / attestation ──
  if (last.includes('certificate') || last.includes('attestation') || last.includes('work certificate') || last.includes('letter'))
    return `**Draft Work Certificate (Attestation de Travail)**\n\n---\n**[Company Letterhead]**\n\n**WORK CERTIFICATE**\n\nWe, the undersigned, [Company Name], located at [Address], hereby certify that:\n\n**Mr./Ms. [Full Name]**\nCIN: [National ID Number]\n\nHas been employed by our company from **[Start Date]** to **[End Date / Present]** in the capacity of:\n\n**Position:** [Job Title]\n**Department:** [Department]\n**Employment Type:** CDI / CDD\n\nDuring their tenure, [Employee Name] demonstrated [professionalism/dedication/excellence] in their role.\n\nThis certificate is issued at the request of the interested party for whatever purpose it may serve.\n\n[City], [Date]\n\n[Signature]\n[HR Manager Name]\n[Company Stamp]\n\n---\n\nShall I **generate a salary certificate** instead, or **create a recommendation letter**?`;

  // ── Default fallback ──
  return null;
}

async function callAI(messages) {
  if (!supabase) {
    const last = messages[messages.length - 1].content;
    const matched = matchResponse(last);
    if (matched) return matched;
    return `I'm your **HR AI Assistant**. I can help you with:\n\n**📋 Recruitment & Candidates:**\n• Rank & screen candidates from your pipeline\n• Generate interview questions & scorecards\n• Draft job descriptions\n\n**� HR Documentation:**\n• Employment contracts & offer letters\n• Work certificates & attestations\n• Warning letters & disciplinary actions\n• Company policies & handbook sections\n\n**👥 People Management:**\n• Analyze team performance trends\n• Summarize leave requests & flag conflicts\n• Generate onboarding checklists\n• Model salary & compensation structures\n\n**🔄 Workflows:**\n• Onboarding process automation\n• Leave approval chain configuration\n• Performance review cycle setup\n\nWhat would you like to explore?`;
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-hr-assistant', {
      body: { messages },
    });
    if (error) throw error;
    return data.reply;
  } catch {
    return `I encountered an issue connecting to the AI service. Please check your OpenAI API key configuration in the Supabase Edge Function settings.\n\nIn the meantime, I can still help with basic HR queries using my built-in knowledge.`;
  }
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-surface-tertiary text-xs font-mono">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre class="mt-2 p-3 rounded-lg bg-surface-tertiary text-xs font-mono overflow-x-auto whitespace-pre-wrap">$1</pre>')
    .replace(/\n/g, '<br />');
}

const INITIAL_MESSAGE = {
  id: 1, role: 'assistant',
  content: `Hello! I'm your **HR AI Assistant**. I can help you with:\n\n**📋 Recruitment & Candidates:**\n• Rank & screen candidates from your pipeline\n• Generate interview questions & scorecards\n• Draft job descriptions & offer letters\n\n**📄 HR Documentation:**\n• Employment contracts & work certificates\n• Warning letters & disciplinary actions\n• Company policies & handbook sections\n\n**� People Management:**\n• Analyze team performance trends\n• Summarize leave requests & flag conflicts\n• Generate onboarding checklists\n• Model salary & compensation structures\n\nWhat would you like to explore?`,
  time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const userMsg = { id: Date.now(), role: 'user', content: msg, time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Build conversation history for context
    const history = [...messages, userMsg]
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const reply = await callAI(history);

    setIsTyping(false);
    setMessages(prev => [...prev, {
      id: Date.now() + 1, role: 'assistant', content: reply,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center
                   w-14 h-14 rounded-2xl shadow-xl cursor-pointer
                   transition-all duration-300 group
                   ${isOpen
                     ? 'bg-surface-primary border border-border-secondary rotate-0 scale-100'
                     : 'bg-gradient-to-br from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:scale-110 hover:shadow-2xl hover:shadow-brand-500/30'
                   }`}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <ChevronDown size={20} className="text-text-secondary" />
        ) : (
          <>
            <Sparkles size={22} className="text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-brand-400 animate-ping opacity-20" />
          </>
        )}
      </button>

      {/* ── Chat Panel ── */}
      <div
        className={`fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
                   ${isExpanded
                     ? 'bottom-0 right-0 w-full sm:w-[560px] h-full sm:h-[90vh] sm:bottom-4 sm:right-4 sm:rounded-2xl'
                     : 'bottom-24 right-6 w-[380px] h-[560px] rounded-2xl'
                   }
                   ${isOpen
                     ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                     : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
                   }
                   bg-surface-primary border border-border-secondary shadow-2xl
                   flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
                        bg-gradient-to-r from-brand-600 to-brand-700 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                            bg-white/20 backdrop-blur-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">AI Assistant</h3>
              <span className="text-[10px] text-white/70">Flowly Intelligence</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer hidden sm:flex"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? <Minimize2 size={14} className="text-white/80" /> : <Maximize2 size={14} className="text-white/80" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X size={14} className="text-white/80" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5
                ${msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-brand-500 to-brand-600'
                  : 'bg-gradient-to-br from-brand-500 to-brand-600'
                }`}>
                {msg.role === 'assistant'
                  ? <Bot size={14} className="text-white" />
                  : <User size={14} className="text-white" />
                }
              </div>
              {/* Bubble */}
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.role === 'assistant'
                    ? 'bg-surface-secondary text-text-primary rounded-tl-md'
                    : 'bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-tr-md'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
                <span className="block text-[10px] text-text-tertiary mt-1 px-1">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2.5 animate-fade-in">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0
                              bg-gradient-to-br from-brand-500 to-brand-600">
                <Bot size={14} className="text-white" />
              </div>
              <div className="inline-flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-md
                              bg-surface-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-tertiary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 2 && !isTyping && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {HR_SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
                             bg-brand-500/8 text-brand-600 dark:text-brand-400
                             border border-brand-200 dark:border-brand-800
                             hover:bg-brand-500/15 hover:border-brand-300
                             transition-all duration-200 cursor-pointer"
                >
                  <Icon size={11} />
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-2 border-t border-border-secondary shrink-0">
          <div className="flex items-end gap-2 bg-surface-secondary rounded-xl border border-border-secondary
                          focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-400
                          transition-all duration-200 px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI assistant..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary
                         resize-none outline-none max-h-24 leading-relaxed"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0
                         transition-all duration-200 cursor-pointer
                         ${input.trim() && !isTyping
                           ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-sm hover:shadow-md hover:scale-105'
                           : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
                         }`}
            >
              {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          <span className="text-[9px] text-text-tertiary mt-1.5 block text-center">
            AI responses are simulated for demo purposes
          </span>
        </div>
      </div>
    </>
  );
}
