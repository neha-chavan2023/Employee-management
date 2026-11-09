const VARIANTS = {
  active: 'success',
  present: 'success',
  approved: 'success',
  completed: 'success',
  inactive: 'muted',
  pending: 'warning',
  late: 'warning',
  'half day': 'info',
  'on leave': 'purple',
  resigned: 'danger',
  absent: 'danger',
  rejected: 'danger',
  'full-time': 'primary',
  'part-time': 'info',
  contract: 'purple',
};

export default function StatusBadge({ status, children }) {
  if (!status && !children) return <span className="text-muted">—</span>;
  const label = children || status;
  const variant = VARIANTS[String(status).toLowerCase()] || 'muted';
  return (
    <span className={`badge badge--${variant}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
}
