import { read, write, uid, COLLECTIONS } from './db';
import { calcWorkingHours } from '../utils/helpers';

const C = COLLECTIONS.ATTENDANCE;

const duplicateExists = (records, employeeId, date, excludeId = null) =>
  records.some(
    (record) =>
      record.employeeId === employeeId && record.date === date && record.id !== excludeId,
  );

export const attendanceService = {
  getAll() {
    return read(C, []);
  },

  getById(id) {
    return this.getAll().find((record) => record.id === id) || null;
  },

  create(payload) {
    const records = this.getAll();
    if (duplicateExists(records, payload.employeeId, payload.date)) {
      throw new Error('Attendance for this employee on the selected date already exists.');
    }
    const { text } = calcWorkingHours(payload.checkIn, payload.checkOut);
    const record = {
      id: uid('att'),
      ...payload,
      workingHours: payload.checkIn && payload.checkOut ? text : '—',
    };
    write(C, [...records, record]);
    return record;
  },

  update(id, payload) {
    const records = this.getAll();
    if (duplicateExists(records, payload.employeeId, payload.date, id)) {
      throw new Error('Attendance for this employee on the selected date already exists.');
    }
    const { text } = calcWorkingHours(payload.checkIn, payload.checkOut);
    const updated = records.map((record) =>
      record.id === id
        ? {
            ...record,
            ...payload,
            id,
            workingHours: payload.checkIn && payload.checkOut ? text : '—',
          }
        : record,
    );
    write(C, updated);
    return updated.find((record) => record.id === id) || null;
  },

  remove(id) {
    write(
      C,
      this.getAll().filter((record) => record.id !== id),
    );
  },

  summary(records) {
    const count = (status) => records.filter((record) => record.status === status).length;
    return {
      total: records.length,
      present: count('Present'),
      absent: count('Absent'),
      late: count('Late'),
      halfDay: count('Half Day'),
      onLeave: count('On Leave'),
      employees: new Set(records.map((record) => record.employeeId)).size,
    };
  },
};
