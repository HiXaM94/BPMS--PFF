/**
 * Reusable page header with title, description, icon, and optional action button.
 */
export default function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'from-brand-500 to-brand-600',
  action,
  actionLabel,
  actionIcon: ActionIcon,
  actionColor = 'from-brand-500 to-brand-600',
  onAction,
  badge,
  children,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
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
          <p className="text-sm text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {children}
        {actionLabel && (
          <button
            onClick={onAction}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                       bg-gradient-to-r ${actionColor} text-white
                       text-sm font-semibold shadow-md
                       hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                       transition-all duration-200 cursor-pointer`}
          >
            {ActionIcon && <ActionIcon size={16} />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
