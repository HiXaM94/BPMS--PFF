import { useState, useMemo } from 'react';
import {
  Bell, CheckCircle2, AlertCircle, Info, Trash2, Check,
  CheckCheck, Filter, Loader2, BellOff, X, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';

/* ── Type styling (matches NotificationDropdown) ── */
function typeStyle(type) {
  switch (type) {
    case 'success': return { Icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Success' };
    case 'warning': return { Icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Warning' };
    case 'error': return { Icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Error' };
    default: return { Icon: Info, color: 'text-brand-500', bg: 'bg-brand-500/10', label: 'Info' };
  }
}

/* ── Relative time ── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── Filter tabs ── */
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'info', label: 'Info' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
];

export default function Notifications() {
  const {
    notifications, loading, unreadCount,
    markAsRead, markAllAsRead, deleteNotification, clearAll,
    selectedNotification, setSelectedNotification
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showClearAll, setShowClearAll] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.is_read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const filterCounts = useMemo(() => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    info: notifications.filter(n => (n.type || 'info') === 'info').length,
    success: notifications.filter(n => n.type === 'success').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    error: notifications.filter(n => n.type === 'error').length,
  }), [notifications]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="animate-spin text-text-tertiary" />
      </div>
    );
  }

  const { Icon: SelectedIcon, color: selectedColor, bg: selectedBg } = selectedNotification
    ? typeStyle(selectedNotification.type)
    : { Icon: Info, color: '', bg: '', label: '' };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/10">
              < Bell size={20} className="text-brand-500" />
            </div>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full
                              text-xs font-bold bg-danger-500 text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Stay updated with your latest activity and alerts</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                         bg-brand-500/10 text-brand-600 dark:text-brand-200 dark:bg-brand-500/20 hover:bg-brand-500/20
                         transition-all duration-200 cursor-pointer">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearAll(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                         bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/20 hover:bg-red-500/20
                         transition-all duration-200 cursor-pointer">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Filter size={14} className="text-text-tertiary shrink-0 mr-1" />
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        whitespace-nowrap transition-all duration-200 cursor-pointer
                        ${filter === f.key
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'}`}>
            {f.label}
            {filterCounts[f.key] > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold
                ${filter === f.key ? 'bg-white/20 text-white' : 'bg-surface-tertiary text-text-tertiary'}`}>
                {filterCounts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Notification List ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-tertiary mb-4">
            <BellOff size={28} className="text-text-tertiary" />
          </div>
          <h3 className="text-lg font-bold text-text-primary mb-1">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </h3>
          <p className="text-sm text-text-secondary text-center max-w-sm">
            {filter === 'all'
              ? "You're all caught up! New notifications will appear here when there's activity on your account."
              : `There are no notifications matching the "${filter}" filter right now.`}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-600
                         hover:bg-brand-500/20 transition-all cursor-pointer">
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden shadow-sm">
          {filtered.map((notif, i) => {
            const { Icon, color, bg, label } = typeStyle(notif.type);
            return (
              <div
                key={notif.id}
                className={`relative flex items-start gap-4 px-5 py-4 group cursor-pointer
                           transition-all duration-200 animate-fade-in
                           ${i !== 0 ? 'border-t border-border-secondary' : ''}
                           ${!notif.is_read ? 'bg-brand-500/[0.03]' : 'hover:bg-surface-secondary/50'}`}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => {
                  markAsRead(notif.id);
                  setSelectedNotification(notif);
                }}
              >
                {/* Unread dot */}
                {!notif.is_read && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />
                )}

                {/* Icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5
                                ${bg} transition-transform duration-200 group-hover:scale-105`}>
                  <Icon size={18} className={color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-sm leading-relaxed
                      ${!notif.is_read ? 'font-semibold text-text-primary' : 'font-medium text-text-secondary'}`}>
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${bg} ${color}`}>
                      <Icon size={10} /> {label}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      {timeAgo(notif.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  onClick={(e) => e.stopPropagation()}>
                  {/* Protection check: No delete for profile alerts */}
                  {notif?.metadata?.event !== 'complete_profile' && !notif?._synthetic && (
                    <>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 rounded-lg hover:bg-brand-500/10 transition-colors cursor-pointer"
                          title="Mark as read">
                          <Check size={14} className="text-brand-500" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget(notif)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Summary bar ── */}
      {notifications.length > 0 && (
        <div className="text-center text-xs text-text-tertiary pb-2">
          Showing {filtered.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          {unreadCount > 0 && <span> &middot; {unreadCount} unread</span>}
        </div>
      )}

      {/* ── Detail Modal ── */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Notification Details"
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
                View Details <ExternalLink size={14} />
              </Link>
            )}

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full py-3 px-4 border border-border-secondary hover:bg-surface-tertiary 
                         text-text-secondary rounded-xl font-semibold text-sm transition-all duration-200 mt-2"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* ── Delete single confirm ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) await deleteNotification(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Clear all confirm ── */}
      <ConfirmDialog
        isOpen={showClearAll}
        onClose={() => setShowClearAll(false)}
        title="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This action cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={async () => {
          await clearAll();
          setShowClearAll(false);
        }}
        onCancel={() => setShowClearAll(false)}
      />
    </div>
  );
}
