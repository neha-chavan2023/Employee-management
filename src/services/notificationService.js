import { read, write, uid, COLLECTIONS } from './db';

const C = COLLECTIONS.NOTIFICATIONS;

export const notificationService = {
  getAll() {
    return read(C, []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  add({ title, message, type = 'info' }) {
    const notifications = read(C, []);
    const notification = {
      id: uid('notif'),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    write(C, [notification, ...notifications].slice(0, 50));
    return notification;
  },

  markRead(id) {
    write(
      C,
      read(C, []).map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  },

  markAllRead() {
    write(
      C,
      read(C, []).map((notification) => ({ ...notification, read: true })),
    );
  },

  clear() {
    write(C, []);
  },

  unreadCount() {
    return read(C, []).filter((notification) => !notification.read).length;
  },
};
