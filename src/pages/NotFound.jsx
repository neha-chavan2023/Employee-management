import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist or may have been moved.</p>
        <Link to="/dashboard" className="ui-btn ui-btn--primary ui-btn--md">
          <FiArrowLeft />
          <span>Back to dashboard</span>
        </Link>
      </div>
    </div>
  );
}
