import { read, write, COLLECTIONS } from './db';

export const DEFAULT_SETTINGS = {
  companyName: 'Nexora Technologies Pvt. Ltd.',
  companyLogo: '',
  address: '7th Floor, Cyber Tower, Hinjewadi Phase 2, Pune, Maharashtra 411057',
  email: 'hr@nexoratech.in',
  phone: '+91 20 6712 8800',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  workStart: '09:00',
  workEnd: '18:00',
  leaveTypes: [
    'Casual Leave',
    'Sick Leave',
    'Earned Leave',
    'Unpaid Leave',
    'Maternity Leave',
    'Paternity Leave',
  ],
  theme: 'light',
};

export const settingsService = {
  get() {
    return { ...DEFAULT_SETTINGS, ...read(COLLECTIONS.SETTINGS, {}) };
  },

  update(patch) {
    const next = { ...this.get(), ...patch };
    write(COLLECTIONS.SETTINGS, next);
    return next;
  },

  reset() {
    write(COLLECTIONS.SETTINGS, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};
