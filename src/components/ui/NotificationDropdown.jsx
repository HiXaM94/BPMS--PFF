import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, CheckCircle2, AlertCircle, Info, X, Check, ExternalLink, Loader2, Trash2
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from './Modal';

function typeStyle(type) {
  switch (type) {
    case 'success': return { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'warning': return { Icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'error': return { Icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
    default: return { Icon: Info, color: 'text-brand-500', bg: 'bg-brand-500/10' };
  }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationDropdown() {
  const {
    notifications, loading, unreadCount, markAsRead,
    markAllAsRead, deleteNotification, selectedNotification, setSelectedNotification
  } = useNotifications();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const { Icon: SelectedIcon, color: selectedColor, bg: selectedBg } = selectedNotification
    ? typeStyle(selectedNotification.type)
    : { Icon: Info, color: '', bg: '' };

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
            <h3 className="text-sm font-bold text-text-primary">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full
                              text-[10px] font-bold bg-danger-500 text-white">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="text-[11px] font-medium text-brand-500 hover:text-brand-600
                         transition-colors cursor-pointer flex items-center gap-1">
              <Check size={12} /> {t('notifications.markAllRead')}
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
              <span className="text-sm">{t('notifications.noNotifications')}</span>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const { Icon, color, bg } = typeStyle(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`relative flex gap-3 px-4 py-3.5 cursor-pointer group
                             transition-all duration-200 animate-fade-in
                             ${!notif.is_read ? 'bg-surface-secondary hover:bg-surface-tertiary' : 'hover:bg-surface-secondary/50'}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => {
                    markAsRead(notif.id);
                    setSelectedNotification(notif);
                    setIsOpen(false);
                  }}
                >
                  {!notif.is_read && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full
                                    bg-brand-500 animate-pulse-slow" />
                  )}
                  <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0
                                  ${bg} transition-transform duration-200 group-hover:scale-105`}>
                    <Icon size={16} className={color} />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className={`text-sm leading-tight
                      ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {notif.message.includes('Reason: ') ? (
                        <>
                          <span className="block mb-1.5">{notif.message.split('. Reason: ')[0].trim()}</span>
                          <span className="block text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-100 font-medium line-clamp-3">
                            <span className="font-bold">Reason:</span> {notif.message.split('. Reason: ')[1]?.trim() || 'No reason provided'}
                          </span>
                        </>
                      ) : (
                        <span className="line-clamp-2">{notif.message}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-text-tertiary mt-1 block">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>

                  {/* Delete button (excluding profile alerts) */}
                  {notif?.metadata?.event !== 'complete_profile' && !notif?._synthetic && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('[NotificationDropdown] Deleting notification:', notif.id);
                        deleteNotification(notif.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 
                                 text-text-tertiary hover:text-red-500 hover:bg-red-500/10 
                                 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
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
            {t('common.viewAll')} <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={t('notifications.details')}
        maxWidth="max-w-md"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary border border-border-secondary">
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${selectedBg}`}>
                <SelectedIcon size={24} className={selectedColor} />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1 block">
                  {selectedNotification.type}
                </span>
                <span className="text-[11px] text-text-tertiary">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-surface-secondary rounded-2xl p-5 border border-border-secondary">
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            {selectedNotification.metadata?.redirectTo && (
              <Link
                to={selectedNotification.metadata.redirectTo}
                onClick={() => setSelectedNotification(null)}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 
                           bg-brand-500 hover:bg-brand-600 text-white rounded-xl 
                           font-semibold text-sm transition-all duration-200 shadow-lg shadow-brand-500/20"
              >
                {t('common.viewDetails')} <ExternalLink size={14} />
              </Link>
            )}

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full py-3 px-4 border border-border-secondary hover:bg-surface-tertiary 
                         text-text-secondary rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
