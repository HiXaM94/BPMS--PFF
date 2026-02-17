import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Reusable stat/KPI card with icon, value, change indicator, and hover effects.
 */
export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  iconColor = 'bg-gradient-to-br from-brand-500 to-brand-600',
  subtitle,
  delay = 0,
}) {
  const isPositive = changeType === 'positive';

  return (
    <div
      className="group relative bg-surface-primary rounded-2xl border border-border-secondary
                 p-5 hover:shadow-lg transition-all duration-300 ease-in-out
                 hover:border-brand-200 hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-500/5 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-secondary">{title}</span>
          <span className="text-2xl font-bold text-text-primary tracking-tight">{value}</span>
          {change && (
            <div className="flex items-center gap-1 mt-1">
              {isPositive
                ? <TrendingUp size={14} className="text-success-500" />
                : <TrendingDown size={14} className="text-danger-500" />
              }
              <span className={`text-xs font-semibold ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
                {change}
              </span>
              <span className="text-xs text-text-tertiary">{subtitle || 'vs last month'}</span>
            </div>
          )}
          {!change && subtitle && (
            <span className="text-xs text-text-tertiary mt-1">{subtitle}</span>
          )}
        </div>
        {Icon && (
          <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${iconColor}
                           transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={22} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
