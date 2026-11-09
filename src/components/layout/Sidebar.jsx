import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import Avatar from '../common/Avatar';
import { NAV_SECTIONS } from './navItems';

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    onClose?.();
    // Close the mobile drawer whenever the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="brand-mark">E</span>
        <div className="brand-copy">
          <strong>EMS</strong>
          <span>Employee Management</span>
        </div>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
          <FiX />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => item.roles.includes(user?.role));
          if (!items.length) return null;
          return (
            <div key={section.title} className="nav-section">
              <p className="nav-section-title">{section.title}</p>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `side-nav-link ${isActive ? 'is-active' : ''}`}
                    end={item.to === '/dashboard'}
                  >
                    <Icon className="side-nav-icon" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar name={user?.name} size="sm" />
          <div className="sidebar-user-copy">
            <strong>{user?.name}</strong>
            <span>{user?.role === 'hr' ? 'HR Manager' : user?.role === 'admin' ? 'Administrator' : 'Employee'}</span>
          </div>
        </div>
        <p className="sidebar-company">{settings.companyName}</p>
      </div>
    </aside>
  );
}
