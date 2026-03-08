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
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{label}</span>
      )}
      <div className="overflow-x-auto no-scrollbar py-2">
        <div className="flex items-end gap-1.5 min-w-full" style={{ height }}>
          {data.map((d, i) => {
            // Logic to skip labels if there are too many bars
            const showLabel = data.length > 15 ? (i % 3 === 0 || i === data.length - 1) : true;

            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-[12px]">
                <div
                  className="w-full rounded-t-sm transition-all duration-500 ease-in-out
                             hover:opacity-80 cursor-default"
                  style={{
                    height: `${(d.value / max) * 100}%`,
                    background: `linear-gradient(to top, ${colorFrom}, ${colorTo})`,
                    animationDelay: `${i * 30}ms`,
                    minHeight: d.value > 0 ? '4px' : '0px',
                  }}
                  title={`${d.label}: ${d.value}`}
                />
                <span className={`text-[8px] text-text-tertiary select-none whitespace-nowrap ${!showLabel ? 'opacity-0' : ''}`}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
