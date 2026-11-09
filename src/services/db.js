import { storage } from '../utils/storage';

/**
 * Tiny reactive data layer on top of localStorage.
 * Components subscribe through useCollection() and re-render after any write.
 */
const listeners = new Set();

export const COLLECTIONS = {
  EMPLOYEES: 'employees',
  DEPARTMENTS: 'departments',
  DESIGNATIONS: 'designations',
  ATTENDANCE: 'attendance',
  LEAVES: 'leaves',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
};

export function read(name, fallback = []) {
  return storage.get(name, fallback);
}

export function write(name, value) {
  storage.set(name, value);
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let counter = 0;
export const uid = (prefix = 'id') => {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 7)}`;
};
