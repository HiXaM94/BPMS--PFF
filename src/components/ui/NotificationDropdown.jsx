import { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckCircle2, AlertCircle, GitBranch, UserPlus,
  Clock, FileText, X, Check, ExternalLink,
} from 'lucide-react';

const notifications = [
  { id: 1, type: 'approval', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
    title: 'Leave request approved', description: 'Your vacation request for Feb 20–24 has been approved by Mohamed A.',
    time: '2 min ago', read: false },
  { id: 2, type: 'alert', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10',
    title: 'Onboarding SLA exceeded', description: "Diana Kim's onboarding has exceeded the 5-day SLA at background check stage.",
    time: '15 min ago', read: false },
  { id: 3, type: 'workflow', icon: GitBranch, color: 'text-violet-500', bg: 'bg-violet-500/10',
    title: 'Workflow updated', description: '"Employee Onboarding" workflow was modified and saved as v1.3.',
    time: '1h ago', read: false },
  { id: 4, type: 'task', icon: Clock, color: 'text-brand-500', bg: 'bg-brand-500/10',
    title: 'Task assigned to you', description: 'You have been assigned "Implement Multi-tenant Isolation" in Sprint 14.',
    time: '2h ago', read: true },
  { id: 5, type: 'user', icon: UserPlus, color: 'text-pink-500', bg: 'bg-pink-500/10',
    title: 'New team member', description: 'Youssef El Amrani has joined the Engineering team.',
    time: '3h ago', read: true },
  { id: 6, type: 'document', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10',
    title: 'Document ready', description: 'Your salary certificate (PDF) is ready for download.',
    time: '5h ago', read: true },
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const dropdownRef = useRef(null);

  const unreadCount = items.filter(n => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const dismiss = (id) => {
    setItems(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        id="notifications-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl
                   hover:bg-surface-tertiary transition-all duration-200
                   cursor-pointer group"
        aria-label="Notifications"
      >
        <Bell size={18} className={`transition-colors duration-200
          ${isOpen ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`} />
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center
                          min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold
                          bg-danger-500 text-white ring-2 ring-surface-primary
                          animate-scale-in">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className={`absolute top-full right-0 mt-2 w-[min(380px,calc(100vw-2rem))]
                       bg-surface-primary border border-border-secondary rounded-2xl
                       shadow-xl overflow-hidden z-[150]
                       transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                       origin-top-right
                       ${isOpen
                         ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                         : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                       }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                              text-[10px] font-bold bg-danger-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
                    className="text-[11px] font-medium text-brand-500 hover:text-brand-600
                               transition-colors cursor-pointer flex items-center gap-1">
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <Bell size={28} className="mb-2 opacity-30" />
              <span className="text-sm">All caught up!</span>
            </div>
          ) : (
            items.map((notif, i) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  className={`relative flex gap-3 px-4 py-3.5 cursor-pointer group
                             transition-all duration-200 animate-fade-in
                             ${!notif.read
                               ? 'bg-brand-500/3 hover:bg-brand-500/6'
                               : 'hover:bg-surface-secondary/50'
                             }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => markRead(notif.id)}
                >
                  {/* Unread dot */}
                  {!notif.read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full
                                    bg-brand-500 animate-pulse-slow" />
                  )}
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                                  ${notif.bg} transition-transform duration-200 group-hover:scale-105`}>
                    <Icon size={16} className={notif.color} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight truncate
                      ${!notif.read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.description}
                    </p>
                    <span className="text-[10px] text-text-tertiary mt-1 block">{notif.time}</span>
                  </div>
                  {/* Dismiss */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(notif.id); }}
                    className="flex items-center justify-center w-6 h-6 rounded-md shrink-0
                               opacity-0 group-hover:opacity-100 hover:bg-surface-tertiary
                               transition-all duration-200 cursor-pointer mt-0.5"
                  >
                    <X size={12} className="text-text-tertiary" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-secondary px-4 py-2.5">
          <button className="w-full text-center text-xs font-medium text-brand-500 hover:text-brand-600
                             transition-colors cursor-pointer py-1 flex items-center justify-center gap-1">
            View all notifications <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
