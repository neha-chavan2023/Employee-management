import { read, write, uid, COLLECTIONS } from './db';
import { nextCode } from '../utils/helpers';

const C = COLLECTIONS.EMPLOYEES;
const normalize = (value) => String(value || '').trim().toLowerCase();

export const employeeService = {
  getAll() {
    return read(C, []);
  },

  getById(id) {
    return this.getAll().find((employee) => employee.id === id) || null;
  },

  getByCode(employeeId) {
    return this.getAll().find((employee) => employee.employeeId === employeeId) || null;
  },

  nextEmployeeId() {
    return nextCode(this.getAll(), 'employeeId', 'EMP', 3);
  },

  emailExists(email, excludeId = null) {
    return this.getAll().some(
      (employee) => normalize(employee.email) === normalize(email) && employee.id !== excludeId,
    );
  },

  create(payload) {
    const employees = this.getAll();
    if (this.emailExists(payload.email)) {
      throw new Error('An employee with this email address already exists.');
    }
    const employee = {
      id: uid('emp'),
      employeeId: this.nextEmployeeId(),
      ...payload,
      email: normalize(payload.email),
      createdAt: new Date().toISOString(),
    };
    write(C, [...employees, employee]);
    return employee;
  },

  update(id, payload) {
    if (payload.email && this.emailExists(payload.email, id)) {
      throw new Error('An employee with this email address already exists.');
    }
    const employees = this.getAll().map((employee) =>
      employee.id === id
        ? { ...employee, ...payload, email: normalize(payload.email ?? employee.email), id }
        : employee,
    );
    write(C, employees);
    return employees.find((employee) => employee.id === id) || null;
  },

  /** Remove an employee and clean up all references to them. */
  remove(id) {
    const remaining = this.getAll().filter((employee) => employee.id !== id);
    write(
      C,
      remaining.map((employee) =>
        employee.reportingManagerId === id ? { ...employee, reportingManagerId: '' } : employee,
      ),
    );

    write(
      COLLECTIONS.ATTENDANCE,
      read(COLLECTIONS.ATTENDANCE, []).filter((record) => record.employeeId !== id),
    );
    write(
      COLLECTIONS.LEAVES,
      read(COLLECTIONS.LEAVES, []).filter((leave) => leave.employeeId !== id),
    );
    write(
      COLLECTIONS.DEPARTMENTS,
      read(COLLECTIONS.DEPARTMENTS, []).map((department) =>
        department.headEmployeeId === id ? { ...department, headEmployeeId: '' } : department,
      ),
    );
  },

  counts() {
    const employees = this.getAll();
    return {
      total: employees.length,
      active: employees.filter((employee) => employee.status === 'Active').length,
      inactive: employees.filter((employee) => employee.status === 'Inactive').length,
      resigned: employees.filter((employee) => employee.status === 'Resigned').length,
    };
  },
};
