import dayjs from 'dayjs';

/** Format a date with a fallback for empty values. */
export const formatDate = (date, fmt = 'DD MMM YYYY') => (date ? dayjs(date).format(fmt) : '—');

/** Format date and time (e.g. for notifications). */
export const formatDateTime = (date) => (date ? dayjs(date).format('DD MMM YYYY, hh:mm A') : '—');

/** Format a value for an <input type="date" />. */
export const toInputDate = (date) => (date ? dayjs(date).format('YYYY-MM-DD') : '');

/** Format a number as Indian Rupees. */
export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

/** "Ananya Desai" -> "AD" */
export const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');

const AVATAR_COLORS = [
  '#4f46e5',
  '#0891b2',
  '#0d9488',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#2563eb',
  '#16a34a',
  '#b45309',
  '#9333ea',
];

/** Deterministic avatar colour for a name. */
export const avatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/** Calculate working hours between two "HH:mm" values. */
export const calcWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return { hours: 0, text: '—' };
  const [inH, inM] = checkIn.split(':').map(Number);
  const [outH, outM] = checkOut.split(':').map(Number);
  if ([inH, inM, outH, outM].some((n) => Number.isNaN(n))) return { hours: 0, text: '—' };
  let minutes = outH * 60 + outM - (inH * 60 + inM);
  if (minutes < 0) minutes += 24 * 60;
  const hours = Math.round((minutes / 60) * 100) / 100;
  return { hours, text: `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m` };
};

/** Inclusive number of calendar days between two dates. */
export const getDaysBetween = (start, end) => {
  if (!start || !end) return 0;
  const diff = dayjs(end).startOf('day').diff(dayjs(start).startOf('day'), 'day');
  return diff < 0 ? 0 : diff + 1;
};

/** Generate the next sequential code, e.g. EMP026 from EMP025. */
export const nextCode = (list, key, prefix, pad = 3) => {
  const max = list.reduce((acc, item) => {
    const match = String(item[key] || '').match(/(\d+)$/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
};

export const isEmailValid = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

export const isPhoneValid = (phone = '') => /^[6-9]\d{9}$/.test(String(phone).replace(/\s/g, ''));

/**
 * Next birthday occurrence and days until it.
 * Returns { date, daysAway, age }.
 */
export const upcomingBirthday = (dob) => {
  if (!dob) return null;
  const today = dayjs().startOf('day');
  const birth = dayjs(dob);
  let next = birth.year(today.year());
  if (next.isBefore(today, 'day')) next = birth.year(today.year() + 1);
  return {
    date: next.format('YYYY-MM-DD'),
    daysAway: next.diff(today, 'day'),
    age: next.year() - birth.year(),
  };
};

/** Escape a CSV cell. */
const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

/** Download an array of objects/rows as a CSV file. */
export const exportToCSV = (filename, headers, rows) => {
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const fullName = (employee) =>
  employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : '';

export const todayISO = () => dayjs().format('YYYY-MM-DD');

export const monthLabel = (value) => (value ? dayjs(value).format('MMM YYYY') : '—');
