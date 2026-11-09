import {
  FiAward,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiGrid,
  FiSettings,
  FiUser,
  FiUsers,
} from 'react-icons/fi';

export const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: FiGrid, roles: ['admin', 'hr', 'employee'] }],
  },
  {
    title: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: FiUsers, roles: ['admin', 'hr'] },
      { to: '/departments', label: 'Departments', icon: FiBriefcase, roles: ['admin', 'hr'] },
      { to: '/designations', label: 'Designations', icon: FiAward, roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/attendance', label: 'Attendance', icon: FiClock, roles: ['admin', 'hr', 'employee'] },
      { to: '/leaves', label: 'Leave Management', icon: FiCalendar, roles: ['admin', 'hr', 'employee'] },
      { to: '/reports', label: 'Reports', icon: FiBarChart2, roles: ['admin', 'hr'] },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/profile', label: 'My Profile', icon: FiUser, roles: ['admin', 'hr', 'employee'] },
      { to: '/settings', label: 'Settings', icon: FiSettings, roles: ['admin'] },
    ],
  },
];
