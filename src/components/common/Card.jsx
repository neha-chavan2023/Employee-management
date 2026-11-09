export default function Card({ title, subtitle, action, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {title || action ? (
        <div className="card-head">
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="card-action">{action}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
