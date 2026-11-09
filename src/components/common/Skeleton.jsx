export default function Skeleton({ className = '' }) {
  return <span className={`skeleton ${className}`.trim()} />;
}

export function StatSkeleton() {
  return (
    <div className="ui-card stat-card">
      <Skeleton className="skeleton-icon" />
      <div className="stat-copy">
        <Skeleton className="skeleton-text skeleton-text--sm" />
        <Skeleton className="skeleton-text skeleton-text--lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="ui-card chart-card">
      <Skeleton className="skeleton-text skeleton-text--sm" />
      <Skeleton className="skeleton-block" />
    </div>
  );
}
