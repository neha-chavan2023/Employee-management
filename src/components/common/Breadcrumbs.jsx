import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="breadcrumb-item">
            {item.to && !last ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
            {!last ? <FiChevronRight className="breadcrumb-sep" /> : null}
          </span>
        );
      })}
    </nav>
  );
}
