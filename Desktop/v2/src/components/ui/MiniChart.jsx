/**
 * Mini bar chart (pure CSS). No external charting library.
 * Supports labels, values, and custom gradient colors.
 */
export default function MiniChart({
  data = [],
  label = '',
  height = 80,
  colorFrom = 'var(--color-brand-600)',
  colorTo = 'var(--color-brand-400)',
}) {
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      )}
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-500 ease-in-out
                         hover:opacity-80 cursor-default"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: `linear-gradient(to top, ${colorFrom}, ${colorTo})`,
                animationDelay: `${i * 80}ms`,
                minHeight: d.value > 0 ? '4px' : '0px',
              }}
              title={`${d.label}: ${d.value}`}
            />
            <span className="text-[10px] text-text-tertiary select-none">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
