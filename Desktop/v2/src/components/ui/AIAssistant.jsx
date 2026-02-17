import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, Loader2,
  Minimize2, Maximize2, ChevronDown,
} from 'lucide-react';

const MOCK_SUGGESTIONS = [
  'Optimize onboarding workflow',
  'Show bottleneck analysis',
  'Summarize pending approvals',
  'Draft a vacation policy rule',
];

const MOCK_RESPONSES = {
  default: `I've analyzed your current workflows. Here are my observations:\n\n• **3 processes** have avg completion time above target\n• The **approval step** in "Employee Onboarding" averages **2.4 days** — consider adding an auto-escalation rule\n• Your team's task completion rate is **87%** this sprint, up from 82% last sprint\n\nWould you like me to suggest specific optimizations?`,
  optimize: `Based on the "Employee Onboarding" workflow analysis:\n\n**Recommended Optimizations:**\n1. 🔄 Merge "Prepare Profile" and "IT Setup" into parallel tasks — saves ~1 day\n2. ⏱ Add 48h auto-escalation on "Manager Approval" step\n3. 📋 Convert manual background check to automated API verification\n\n**Estimated Impact:** Reduce total onboarding time from 8 days → 5 days (37% improvement)`,
  bottleneck: `**Bottleneck Analysis — Last 30 Days**\n\n🔴 **Critical:** "Manager Approval" — avg 2.4 days (target: 1 day)\n🟠 **Warning:** "Document Verification" — avg 1.8 days (target: 1 day)\n🟢 **Healthy:** All other steps within targets\n\n**Root Cause:** 68% of delays occur when the primary approver is unavailable. Recommendation: Add a **delegate approver** rule for absences exceeding 24h.`,
  summary: `**Pending Approvals Summary:**\n\n• **7 vacation requests** — 3 pending manager review\n• **4 document requests** — 2 processing, 2 pending\n• **2 workflow changes** — awaiting admin sign-off\n• **1 new hire onboarding** — stuck at background check (3 days)\n\n⚡ **Priority Action:** The onboarding for Diana Kim has exceeded SLA. Recommend immediate escalation.`,
  draft: `Here's a draft vacation policy rule:\n\n\`\`\`\nRule: Auto-Approve Short Leave\nCondition: leave_days <= 2 AND leave_balance >= 5\nAction: Auto-approve without manager review\nNotify: Manager (FYI only)\nEscalation: None\n\`\`\`\n\nThis would auto-approve **~40%** of vacation requests, reducing manager workload. Shall I refine this further?`,
};

function getResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('optim')) return MOCK_RESPONSES.optimize;
  if (lower.includes('bottleneck') || lower.includes('block')) return MOCK_RESPONSES.bottleneck;
  if (lower.includes('summary') || lower.includes('pending') || lower.includes('approval')) return MOCK_RESPONSES.summary;
  if (lower.includes('draft') || lower.includes('rule') || lower.includes('policy')) return MOCK_RESPONSES.draft;
  return MOCK_RESPONSES.default;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-surface-tertiary text-xs font-mono">$1</code>')
    .replace(/```([\s\S]*?)```/g, '<pre class="mt-2 p-3 rounded-lg bg-surface-tertiary text-xs font-mono overflow-x-auto whitespace-pre-wrap">$1</pre>')
    .replace(/\n/g, '<br />');
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1, role: 'assistant',
      content: 'Hello! I\'m your BPMS AI assistant. I can help you optimize workflows, analyze bottlenecks, summarize processes, and draft business rules.\n\nWhat would you like to explore?',
      time: '14:30',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: msg, time }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: getResponse(msg),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      }]);
    }, 1200 + Math.random() * 800);
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
                     : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 hover:scale-110 hover:shadow-2xl hover:shadow-violet-500/30'
                   }`}
        aria-label="AI Assistant"
      >
        {isOpen ? (
          <ChevronDown size={20} className="text-text-secondary" />
        ) : (
          <>
            <Sparkles size={22} className="text-white" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl border-2 border-violet-400 animate-ping opacity-20" />
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
                        bg-gradient-to-r from-violet-600 to-purple-600 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg
                            bg-white/20 backdrop-blur-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">AI Assistant</h3>
              <span className="text-[10px] text-white/70">BPMS Intelligence</span>
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
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600'
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
                              bg-gradient-to-br from-violet-500 to-purple-600">
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
            {MOCK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium
                           bg-violet-500/8 text-violet-600 dark:text-violet-400
                           border border-violet-200 dark:border-violet-800
                           hover:bg-violet-500/15 hover:border-violet-300
                           transition-all duration-200 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-2 border-t border-border-secondary shrink-0">
          <div className="flex items-end gap-2 bg-surface-secondary rounded-xl border border-border-secondary
                          focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-400
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
                           ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-105'
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
