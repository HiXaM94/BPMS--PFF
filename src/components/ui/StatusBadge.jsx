/**
 * Status badge component with predefined color variants.
 */

const variants = {
  success:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  warning:  'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  danger:   'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  info:     'bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  neutral:  'bg-gray-500/10 text-gray-600 dark:text-gray-400 ring-gray-500/20',
  brand:    'bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-500/20',
  violet:   'bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  pink:     'bg-pink-500/10 text-pink-600 dark:text-pink-400 ring-pink-500/20',
};

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function StatusBadge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1
                  ${variants[variant] || variants.neutral}
                  ${sizes[size] || sizes.md}
                  ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse-slow`} />
      )}
      {children}
    </span>
  );
}
