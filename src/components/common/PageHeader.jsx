import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, subtitle, breadcrumbs, actions, children }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        <Breadcrumbs items={breadcrumbs} />
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
