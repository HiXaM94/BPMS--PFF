import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable modal dialog — production SaaS quality.
 * Props:
 *   isOpen      — boolean
 *   onClose     — () => void
 *   title       — string
 *   children    — body content
 *   footer      — optional footer content (replaces default close button)
 *   maxWidth    — Tailwind max-w class (default 'max-w-lg')
 *   hideClose   — hide the X button in header
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
  hideClose = false,
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, handleClose]);

  // Lock body scroll — preserve scrollbar width to prevent layout shift
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Focus first focusable element when opened
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) setTimeout(() => focusable.focus(), 50);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4
                 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={dialogRef}
        className={`relative w-full ${maxWidth} flex flex-col
                    bg-surface-elevated rounded-2xl border border-border-secondary
                    shadow-2xl animate-scale-in origin-center
                    max-h-[calc(100vh-2rem)]`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary shrink-0">
          <h2 id="modal-title" className="text-base font-bold text-text-primary">{title}</h2>
          {!hideClose && (
            <button
              onClick={handleClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg
                         hover:bg-surface-tertiary transition-colors cursor-pointer ml-4 shrink-0"
              aria-label="Close dialog"
            >
              <X size={16} className="text-text-tertiary" />
            </button>
          )}
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>

        {/* Footer — optional */}
        {footer && (
          <div className="px-6 py-4 border-t border-border-secondary shrink-0 bg-surface-elevated rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
