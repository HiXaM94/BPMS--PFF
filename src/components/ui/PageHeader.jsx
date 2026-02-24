/**
 * Reusable page header — clean minimal design matching template.
 */
export default function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'from-[#2a85ff] to-[#6cb4ff]',
  action,
  actionLabel,
  actionIcon: ActionIcon,
  actionColor,
  onAction,
  badge,
  children,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          {Icon && (
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl
                            bg-gradient-to-br ${iconColor} shadow-sm`}>
              <Icon size={18} className="text-white" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-text-tertiary mt-1">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-[#1a1d1f] text-white dark:bg-white dark:text-[#1a1d1f]
                       text-sm font-semibold shadow-sm
                       hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-200 cursor-pointer"
          >
            {ActionIcon && <ActionIcon size={16} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
