/**
 * Loading skeleton components for shimmer-style placeholders.
 * Uses a pulsing gradient animation for a premium loading feel.
 */

function SkeletonBase({ className = '', style }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-surface-tertiary ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]
                      bg-gradient-to-r from-transparent via-surface-primary/40 to-transparent" />
    </div>
  );
}

export function SkeletonText({ width = '100%', height = 14, className = '' }) {
  return <SkeletonBase className={`rounded ${className}`} style={{ width, height }} />;
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return <SkeletonBase className={`!rounded-full ${className}`} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-primary rounded-2xl border border-border-secondary p-5 space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <SkeletonText width="40%" height={16} />
        <SkeletonCircle size={32} />
      </div>
      <SkeletonText width="60%" height={28} />
      <SkeletonText width="80%" height={12} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex gap-4 px-5 py-3.5 border-b border-border-secondary">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonText key={i} width={`${20 + Math.random() * 15}%`} height={12} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-5 py-3.5 border-b border-border-secondary last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonText key={c} width={`${25 + Math.random() * 20}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <SkeletonCircle size={36} />
            <SkeletonText width={200} height={28} />
          </div>
          <SkeletonText width={300} height={14} />
        </div>
        <SkeletonText width={140} height={40} className="!rounded-xl" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
