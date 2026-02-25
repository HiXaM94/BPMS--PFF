import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Loader2, User, Bot, ThumbsUp, ThumbsDown,
  FileText, Users, TrendingUp, Lightbulb, X, Copy, Check
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { aiService } from '../services/AIService';

// Lightweight markdown-to-JSX for AI responses
function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    // Convert **bold**
    let parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return <strong key={j} className="font-semibold">{seg.slice(2, -2)}</strong>;
      }
      // Convert _italic_
      return seg.split(/(_[^_]+_)/g).map((s2, k) => {
        if (s2.startsWith('_') && s2.endsWith('_') && s2.length > 2) {
          return <em key={k} className="italic text-gray-500">{s2.slice(1, -1)}</em>;
        }
        return s2;
      });
    });
    return <span key={i}>{parts}{i < text.split('\n').length - 1 && <br />}</span>;
  });
}

export default function AIAssistant() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    {
      icon: Users,
      title: 'Analyze Team Performance',
      prompt: 'Analyze my team\'s performance for the last month and provide insights',
      color: 'blue'
    },
    {
      icon: FileText,
      title: 'Document Summary',
      prompt: 'Help me summarize and extract key information from documents',
      color: 'green'
    },
    {
      icon: TrendingUp,
      title: 'Recruitment Insights',
      prompt: 'Provide recommendations for improving our recruitment process',
      color: 'purple'
    },
    {
      icon: Lightbulb,
      title: 'Workflow Optimization',
      prompt: 'Suggest ways to optimize our current workflows and processes',
      color: 'orange'
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat(messageText, {
        user_id: profile?.id,
        entreprise_id: profile?.entreprise_id
      });

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  const handleFeedback = async (messageId, rating) => {
    // Update message with feedback
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback: rating } : msg
    ));

    // Log feedback to database
    try {
      await aiService.logInteraction(
        'feedback',
        '',
        '',
        { message_id: messageId, rating }
      );
    } catch (error) {
      console.error('Failed to log feedback:', error);
    }
  };

  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader
        title="AI Assistant"
        subtitle="Get intelligent insights and recommendations powered by AI"
        icon={Sparkles}
        actions={
          messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} />
              Clear Chat
            </button>
          )
        }
      />

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="text-purple-600" size={40} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to AI Assistant
                </h3>
                <p className="text-gray-600 max-w-md mb-6">
                  I can help you with team performance analysis, candidate recommendations, 
                  document processing, and workflow optimization.
                </p>
                <p className="text-sm text-gray-500">
                  Try one of the quick prompts or ask me anything!
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}

                    <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-brand-600 text-white'
                            : message.error
                            ? 'bg-red-50 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderMarkdown(message.content)}</div>
                      </div>
                      
                      {message.role === 'assistant' && !message.error && (
                        <div className="flex items-center gap-2 mt-2 ml-2">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === message.id ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'positive')}
                            className={`p-1.5 rounded transition-colors ${
                              message.feedback === 'positive'
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, 'negative')}
                            className={`p-1.5 rounded transition-colors ${
                              message.feedback === 'negative'
                                ? 'text-red-600 bg-red-50'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-1 ml-2">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-gray-600" />
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        
          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about HR, team performance, or workflows..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Prompts Sidebar */}
        <div className="w-80 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Prompts</h3>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => {
                const Icon = prompt.icon;
                const colorClasses = {
                  blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
                  green: 'bg-green-50 text-green-700 hover:bg-green-100',
                  purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
                  orange: 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                };

                return (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.prompt)}
                    disabled={loading}
                    className={`w-full text-left p-3 rounded-lg transition-colors disabled:opacity-50 ${
                      colorClasses[prompt.color]
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={20} className="flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{prompt.title}</p>
                        <p className="text-xs opacity-75 mt-1">{prompt.prompt}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="text-purple-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-gray-900 mb-1">AI Capabilities</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Team performance analysis</li>
                  <li>• Candidate recommendations</li>
                  <li>• Document processing</li>
                  <li>• Workflow optimization</li>
                  <li>• Data insights & trends</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
