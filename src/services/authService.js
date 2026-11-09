import { storage, sessionStore } from '../utils/storage';

const SESSION_KEY = 'session';

/** Demo accounts — no backend, credentials are validated locally. */
export const DEMO_ACCOUNTS = [
  {
    email: 'admin@ems.com',
    password: 'Admin@123',
    role: 'admin',
    name: 'Arjun Mehta',
    employeeCode: 'EMP001',
  },
  {
    email: 'hr@ems.com',
    password: 'Hr@123',
    role: 'hr',
    name: 'Priya Sharma',
    employeeCode: 'EMP002',
  },
  {
    email: 'employee@ems.com',
    password: 'Emp@123',
    role: 'employee',
    name: 'Ananya Desai',
    employeeCode: 'EMP006',
  },
];

export const authService = {
  login(email, password, remember = false) {
    const account = DEMO_ACCOUNTS.find(
      (user) =>
        user.email.toLowerCase() === String(email).trim().toLowerCase() &&
        user.password === password,
    );
    if (!account) {
      throw new Error('Invalid email or password. Please use one of the demo accounts.');
    }
    const session = {
      email: account.email,
      role: account.role,
      name: account.name,
      employeeCode: account.employeeCode,
      loginAt: new Date().toISOString(),
    };
    storage.remove(SESSION_KEY);
    sessionStore.remove(SESSION_KEY);
    if (remember) storage.set(SESSION_KEY, session);
    else sessionStore.set(SESSION_KEY, session);
    return session;
  },

  getSession() {
    return storage.get(SESSION_KEY, null) || sessionStore.get(SESSION_KEY, null);
  },

  logout() {
    storage.remove(SESSION_KEY);
    sessionStore.remove(SESSION_KEY);
  },
};
