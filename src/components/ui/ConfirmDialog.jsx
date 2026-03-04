import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Reusable confirmation dialog for destructive actions (delete, cancel, etc.).
 *
 * Props:
 *   isOpen       — boolean
 *   onClose      — () => void
 *   onConfirm    — () => void  (called when user clicks the confirm button)
 *   title        — string (default "Confirm Delete")
 *   message      — string | ReactNode  (body text)
 *   confirmLabel — string (default "Delete")
 *   cancelLabel  — string (default "Cancel")
 *   variant      — 'danger' | 'warning' (default 'danger')
 *   loading      — boolean (shows spinner on confirm button)
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure? This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const overlayRef = useRef(null);
  const confirmRef = useRef(null);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [onClose, loading]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  // Lock scroll
  useEffect(() => {
    if (!isOpen) return;
    const sw = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${sw}px`;
    return () => { document.body.style.overflow = ''; document.body.style.paddingRight = ''; };
  }, [isOpen]);

  // Auto-focus cancel button (safer default)
  useEffect(() => {
    if (!isOpen || !confirmRef.current) return;
    setTimeout(() => confirmRef.current?.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const iconBg = isDanger ? 'bg-red-500/10' : 'bg-amber-500/10';
  const iconColor = isDanger ? 'text-red-500' : 'text-amber-500';
  const btnBg = isDanger
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500/30'
    : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500/30';

  return createPortal(
    <div
      ref={overlayRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-msg"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
      className="flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-sm bg-surface-elevated rounded-2xl border border-border-secondary shadow-2xl animate-scale-in origin-center">
        {/* Close X */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={14} className="text-text-tertiary" />
        </button>

        {/* Body */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${iconBg} mb-4`}>
            {isDanger ? <Trash2 size={22} className={iconColor} /> : <AlertTriangle size={22} className={iconColor} />}
          </div>
          <h3 id="confirm-title" className="text-base font-bold text-text-primary mb-2">{title}</h3>
          <p id="confirm-msg" className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-5">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-text-secondary
                       bg-surface-secondary hover:bg-surface-tertiary border border-border-secondary
                       transition-all cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white
                        ${btnBg} shadow-sm transition-all cursor-pointer
                        focus:outline-none focus:ring-2 disabled:opacity-60
                        flex items-center justify-center gap-2`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
