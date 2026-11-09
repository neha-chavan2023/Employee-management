import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheckCircle,
  FiChevronDown,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiSearch,
  FiSettings,
  FiSun,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useClickOutside } from '../../hooks/useClickOutside';
import { COLLECTIONS } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import { formatDateTime, fullName } from '../../utils/helpers';
import Avatar from '../common/Avatar';

const ROLE_LABELS = { admin: 'Administrator', hr: 'HR Manager', employee: 'Employee' };

export default function Header({ onMenu }) {
  const { user, canManage, logout } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const notifications = useCollection(COLLECTIONS.NOTIFICATIONS, []);

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useClickOutside(() => setSearchOpen(false));
  const notifRef = useClickOutside(() => setNotifOpen(false));
  const profileRef = useClickOutside(() => setProfileOpen(false));

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return employees
      .filter((employee) =>
        [fullName(employee), employee.employeeId, employee.email]
          .join(' ')
          .toLowerCase()
          .includes(term),
      )
      .slice(0, 6);
  }, [employees, query]);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [notifications],
  );
  const unread = sortedNotifications.filter((notification) => !notification.read).length;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    showToast('You have been signed out.', 'info');
    navigate('/login', { replace: true });
  };

  const openSearchResult = (employee) => {
    setSearchOpen(false);
    setQuery('');
    if (canManage) navigate(`/employees/${employee.id}`);
    else navigate('/profile');
  };

  return (
    <header className="topbar">
      <button type="button" className="icon-btn topbar-menu" onClick={onMenu} aria-label="Toggle menu">
        <FiMenu />
      </button>

      <div className="topbar-search" ref={searchRef}>
        <FiSearch className="topbar-search-icon" />
        <input
          type="search"
          value={query}
          placeholder={canManage ? 'Search employees by name, ID or email...' : 'Search is available to HR and Admin'}
          onFocus={() => setSearchOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          disabled={!canManage}
          aria-label="Global employee search"
        />
        {searchOpen && query && canManage ? (
          <div className="popover search-popover">
            <p className="popover-label">Employees</p>
            {results.length ? (
              results.map((employee) => (
                <button
                  key={employee.id}
                  type="button"
                  className="search-result"
                  onClick={() => openSearchResult(employee)}
                >
                  <Avatar name={fullName(employee)} src={employee.avatar} size="sm" />
                  <span className="search-result-copy">
                    <strong>{fullName(employee)}</strong>
                    <span>
                      {employee.employeeId} · {employee.email}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <p className="popover-empty">No employees match “{query}”.</p>
            )}
          </div>
        ) : null}
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {settings.theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>

        <div className="dropdown-wrap" ref={notifRef}>
          <button
            type="button"
            className="icon-btn notification-trigger"
            onClick={() => {
              setNotifOpen((value) => !value);
              setProfileOpen(false);
            }}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
          >
            <FiBell />
            {unread > 0 ? <span className="notification-badge">{unread > 9 ? '9+' : unread}</span> : null}
          </button>

          {notifOpen ? (
            <div className="popover notification-popover">
              <div className="popover-head">
                <div>
                  <strong>Notifications</strong>
                  <span>{unread} unread</span>
                </div>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => {
                    notificationService.markAllRead();
                    showToast('All notifications marked as read.');
                  }}
                  disabled={!unread}
                >
                  <FiCheckCircle /> Mark all read
                </button>
              </div>
              <div className="notification-list">
                {sortedNotifications.length ? (
                  sortedNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      className={`notification-item ${notification.read ? '' : 'is-unread'}`}
                      onClick={() => notificationService.markRead(notification.id)}
                    >
                      <span className={`notification-dot notification-dot--${notification.type}`} />
                      <span className="notification-copy">
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <small>{formatDateTime(notification.createdAt)}</small>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="popover-empty">You have no notifications.</p>
                )}
              </div>
              <div className="popover-foot">
                <button
                  type="button"
                  className="text-action text-action--danger"
                  onClick={() => {
                    notificationService.clear();
                    showToast('All notifications cleared.', 'info');
                  }}
                  disabled={!sortedNotifications.length}
                >
                  <FiTrash2 /> Clear all
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="dropdown-wrap" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger"
            onClick={() => {
              setProfileOpen((value) => !value);
              setNotifOpen(false);
            }}
          >
            <Avatar name={user?.name} size="sm" />
            <span className="profile-trigger-copy">
              <strong>{user?.name}</strong>
              <span>{ROLE_LABELS[user?.role]}</span>
            </span>
            <FiChevronDown className="chevron" />
          </button>

          {profileOpen ? (
            <div className="popover profile-popover">
              <div className="profile-popover-head">
                <Avatar name={user?.name} size="md" />
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                  <small>{ROLE_LABELS[user?.role]}</small>
                </div>
              </div>
              <Link to="/profile" className="menu-item" onClick={() => setProfileOpen(false)}>
                <FiUser /> My Profile
              </Link>
              {user?.role === 'admin' ? (
                <Link to="/settings" className="menu-item" onClick={() => setProfileOpen(false)}>
                  <FiSettings /> Settings
                </Link>
              ) : null}
              <button type="button" className="menu-item menu-item--danger" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
