import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { useSettings } from '../context/SettingsContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}
      <div className="main-area">
        <Header onMenu={() => setSidebarOpen((value) => !value)} />
        <main className="page-content">
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>© {new Date().getFullYear()} {settings.companyName}</span>
          <span>EMS POC · Data is stored locally in your browser.</span>
        </footer>
      </div>
    </div>
  );
}
