import dayjs from 'dayjs';
import { read, write, uid, COLLECTIONS } from './db';
import { getDaysBetween, nextCode } from '../utils/helpers';

const C = COLLECTIONS.LEAVES;

export const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Unpaid Leave',
  'Maternity Leave',
  'Paternity Leave',
];

export const leaveService = {
  getAll() {
    return read(C, []);
  },

  getById(id) {
    return this.getAll().find((leave) => leave.id === id) || null;
  },

  nextRequestId() {
    return nextCode(this.getAll(), 'requestId', 'LV', 3);
  },

  create(payload) {
    const leaves = this.getAll();
    const overlaps = leaves.some((leave) => {
      if (leave.employeeId !== payload.employeeId) return false;
      if (!['Pending', 'Approved'].includes(leave.status)) return false;
      return !(
        dayjs(payload.endDate).isBefore(leave.startDate, 'day') ||
        dayjs(payload.startDate).isAfter(leave.endDate, 'day')
      );
    });
    if (overlaps) {
      throw new Error('This employee already has a pending or approved leave overlapping these dates.');
    }
    const leave = {
      id: uid('leave'),
      requestId: this.nextRequestId(),
      ...payload,
      days: getDaysBetween(payload.startDate, payload.endDate),
      appliedDate: dayjs().format('YYYY-MM-DD'),
      status: 'Pending',
      approvedBy: '',
      approvedAt: '',
      comment: '',
    };
    write(C, [...leaves, leave]);
    return leave;
  },

  setStatus(id, status, approverName = '', comment = '') {
    const leaves = this.getAll().map((leave) =>
      leave.id === id
        ? {
            ...leave,
            status,
            approvedBy: approverName,
            approvedAt: new Date().toISOString(),
            comment,
          }
        : leave,
    );
    write(C, leaves);
    return leaves.find((leave) => leave.id === id) || null;
  },

  remove(id) {
    write(
      C,
      this.getAll().filter((leave) => leave.id !== id),
    );
  },

  forEmployee(employeeId) {
    return this.getAll()
      .filter((leave) => leave.employeeId === employeeId)
      .sort((a, b) => dayjs(b.appliedDate).valueOf() - dayjs(a.appliedDate).valueOf());
  },

  stats(leaves = this.getAll()) {
    const count = (status) => leaves.filter((leave) => leave.status === status).length;
    return {
      total: leaves.length,
      pending: count('Pending'),
      approved: count('Approved'),
      rejected: count('Rejected'),
      days: leaves.reduce((total, leave) => total + Number(leave.days || 0), 0),
    };
  },
};
