import { useState, useRef, useEffect } from 'react';
import {
  Sparkles, X, Send, Bot, User, Loader2,
  Minimize2, Maximize2, ChevronDown, FileText, Users, TrendingUp, Calendar,
} from 'lucide-react';
import { supabase } from '../../services/supabase';

const HR_SUGGESTIONS = [
  { label: 'Rank candidates for React role', icon: Users },
  { label: 'Summarize pending leave requests', icon: Calendar },
  { label: 'Analyze team performance trends', icon: TrendingUp },
  { label: 'Draft job description for UX Designer', icon: FileText },
];

async function callAI(messages) {
  if (!supabase) {
    // Fallback smart mock when Supabase not configured
    const last = messages[messages.length - 1].content.toLowerCase();
    if (last.includes('candidate') || last.includes('cv') || last.includes('rank'))
      return `**Candidate Ranking — Senior React Developer**\n\n1. 🥇 **Nadia Benali** — Score: 94/100\n   • 6 years React experience, strong portfolio, excellent technical test\n   • Stage: Offer → Recommend immediate offer\n\n2. 🥈 **Youssef Alami** — Score: 78/100\n   • 4 years experience, good portfolio\n   • Stage: Technical Interview → Schedule final round\n\n3. 🥉 **Karim Idrissi** — Score: 65/100\n   • 5 years full-stack, pending technical review\n   • Stage: HR Screen → Move to technical test\n\n**Recommendation:** Proceed with Nadia Benali — she meets all requirements and her test scores are exceptional.`;
    if (last.includes('leave') || last.includes('vacation') || last.includes('pending'))
      return `**Pending Leave Requests Summary**\n\n• **3 requests** awaiting approval\n• Ibrahim Rouass: Feb 20–24 (Annual Leave, 5 days)\n• Ahmed Hassan: Mar 3–7 (Annual Leave, 5 days)\n• Carlos Ruiz: Feb 25–26 (Sick Leave, 2 days — rejected)\n\n⚡ **Action needed:** Ibrahim and Ahmed's requests overlap. Recommend staggering approvals to maintain team coverage.`;
    if (last.includes('performance') || last.includes('trend'))
      return `**Team Performance Analysis — Q4 2025**\n\n� **Top Performers:**\n• Clara Dupont — 94/100 (Exceptional HR management)\n• Ibrahim Rouass — 90/100 (Strong leadership)\n\n� **Needs Attention:**\n• Ahmed Hassan — 76/100 (Task delays noted)\n• Bob Tanaka — 78/100 (Documentation gaps)\n\n**Recommendation:** Schedule 1:1 coaching sessions for Ahmed and Bob. Consider Ibrahim for team lead promotion.`;
    if (last.includes('job') || last.includes('description') || last.includes('draft'))
      return `**Draft Job Description — UX Designer**\n\n**Position:** Senior UX Designer\n**Department:** Design\n**Location:** Casablanca, Morocco\n\n**Responsibilities:**\n• Lead end-to-end UX design for BPMS platform features\n• Conduct user research and usability testing\n• Create wireframes, prototypes, and design systems\n• Collaborate with engineering and product teams\n\n**Requirements:**\n• 3+ years UX design experience\n• Proficiency in Figma, user research methods\n• Portfolio demonstrating complex product design\n\nShall I refine this further or adjust the requirements?`;
    return `I'm your **HR AI Assistant**. I can help you:\n\n• 📋 **Rank & screen candidates** from your recruitment pipeline\n• 📊 **Analyze performance** trends across your team\n• 🗓 **Summarize leave requests** and flag conflicts\n• ✍️ **Draft job descriptions** and HR policies\n• 🔍 **Parse CVs** and extract key qualifications\n\nWhat would you like to explore?`;
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
  content: `Hello! I'm your **HR AI Assistant**. I can help you:\n\n• 📋 **Rank & screen candidates** from your recruitment pipeline\n• 📊 **Analyze performance** trends across your team\n• 🗓 **Summarize leave requests** and flag conflicts\n• ✍️ **Draft job descriptions** and HR policies\n• 🔍 **Parse CVs** and extract key qualifications\n\nWhat would you like to explore?`,
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
            {HR_SUGGESTIONS.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(s.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium
                             bg-violet-500/8 text-violet-600 dark:text-violet-400
                             border border-violet-200 dark:border-violet-800
                             hover:bg-violet-500/15 hover:border-violet-300
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
