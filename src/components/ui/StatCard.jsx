import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Reusable stat/KPI card — clean, minimal design matching template.
 */
export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  iconColor = 'bg-gradient-to-br from-[#2a85ff] to-[#6cb4ff]',
  subtitle,
  delay = 0,
}) {
  const isPositive = changeType === 'positive';

  return (
    <div
      className="group bg-surface-primary rounded-2xl border border-border-secondary
                 p-5 hover:shadow-md transition-all duration-300 ease-in-out
                 hover:-translate-y-0.5 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{title}</span>
          <span className="text-2xl font-bold text-text-primary tracking-tight">{value}</span>
          {change && (
            <div className="flex items-center gap-1 mt-1">
              {isPositive
                ? <ArrowUpRight size={14} className="text-[#83bf6e]" />
                : <ArrowDownRight size={14} className="text-[#ff6a55]" />
              }
              <span className={`text-xs font-semibold ${isPositive ? 'text-[#83bf6e]' : 'text-[#ff6a55]'}`}>
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
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${iconColor}
                           transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
            <Icon size={20} className="text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
