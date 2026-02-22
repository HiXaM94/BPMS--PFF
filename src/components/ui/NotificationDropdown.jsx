import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCircle2, AlertCircle, Info, X, Check, ExternalLink, Loader2,
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

function typeStyle(type) {
  switch (type) {
    case 'success': return { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'warning': return { Icon: AlertCircle,  color: 'text-amber-500',   bg: 'bg-amber-500/10'   };
    case 'error':   return { Icon: AlertCircle,  color: 'text-red-500',     bg: 'bg-red-500/10'     };
    default:        return { Icon: Info,          color: 'text-brand-500',   bg: 'bg-brand-500/10'   };
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationDropdown() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl
                   hover:bg-surface-tertiary transition-all duration-200 cursor-pointer group"
        aria-label="Notifications"
      >
        <Bell size={18} className={`transition-colors duration-200
          ${isOpen ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center justify-center
                          min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold
                          bg-danger-500 text-white ring-2 ring-surface-primary animate-scale-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <div className={`absolute top-full right-0 mt-2 w-[min(380px,calc(100vw-2rem))]
                       bg-surface-primary border border-border-secondary rounded-2xl
                       shadow-xl overflow-hidden z-[150]
                       transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top-right
                       ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                              text-[10px] font-bold bg-danger-500 text-white">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="text-[11px] font-medium text-brand-500 hover:text-brand-600
                         transition-colors cursor-pointer flex items-center gap-1">
              <Check size={12} /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-text-tertiary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
              <Bell size={28} className="mb-2 opacity-30" />
              <span className="text-sm">All caught up!</span>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const { Icon, color, bg } = typeStyle(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`relative flex gap-3 px-4 py-3.5 cursor-pointer group
                             transition-all duration-200 animate-fade-in
                             ${!notif.is_read ? 'bg-brand-500/3 hover:bg-brand-500/6' : 'hover:bg-surface-secondary/50'}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => markAsRead(notif.id)}
                >
                  {!notif.is_read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full
                                    bg-brand-500 animate-pulse-slow" />
                  )}
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                                  ${bg} transition-transform duration-200 group-hover:scale-105`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight line-clamp-2
                      ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-text-tertiary mt-1 block">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border-secondary px-4 py-2.5">
          <Link to="/notifications" onClick={() => setIsOpen(false)}
            className="w-full text-center text-xs font-medium text-brand-500 hover:text-brand-600
                       transition-colors cursor-pointer py-1 flex items-center justify-center gap-1">
            View all notifications <ExternalLink size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}
