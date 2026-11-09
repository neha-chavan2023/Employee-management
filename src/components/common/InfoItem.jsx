export default function InfoItem({ label, value, children, className = '' }) {
  return (
    <div className={`info-item ${className}`.trim()}>
      <span className="info-label">{label}</span>
      <span className="info-value">{children ?? (value || '—')}</span>
    </div>
  );
}
