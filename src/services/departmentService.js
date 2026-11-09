import { read, write, uid, COLLECTIONS } from './db';
import { nextCode } from '../utils/helpers';

const C = COLLECTIONS.DEPARTMENTS;
const normalize = (value) => String(value || '').trim().toLowerCase();

export const departmentService = {
  getAll() {
    return read(C, []);
  },

  getById(id) {
    return this.getAll().find((department) => department.id === id) || null;
  },

  nextDepartmentId() {
    return nextCode(this.getAll(), 'departmentId', 'DEP', 3);
  },

  nameExists(name, excludeId = null) {
    return this.getAll().some(
      (department) =>
        normalize(department.name) === normalize(name) && department.id !== excludeId,
    );
  },

  create(payload) {
    const departments = this.getAll();
    const department = {
      id: uid('dep'),
      departmentId: this.nextDepartmentId(),
      ...payload,
      name: payload.name.trim(),
    };
    write(C, [...departments, department]);
    return department;
  },

  update(id, payload) {
    const departments = this.getAll().map((department) =>
      department.id === id ? { ...department, ...payload, id } : department,
    );
    write(C, departments);
    return departments.find((department) => department.id === id) || null;
  },

  remove(id) {
    const employees = read(COLLECTIONS.EMPLOYEES, []);
    const assigned = employees.filter((employee) => employee.departmentId === id);
    if (assigned.length > 0) {
      throw new Error(
        `Cannot delete this department. ${assigned.length} employee${assigned.length > 1 ? 's are' : ' is'} still assigned to it.`,
      );
    }
    const designations = read(COLLECTIONS.DESIGNATIONS, []).filter(
      (designation) => designation.departmentId === id,
    );
    if (designations.length > 0) {
      throw new Error(
        `Cannot delete this department. Remove its ${designations.length} designation${designations.length > 1 ? 's' : ''} first.`,
      );
    }
    write(
      C,
      this.getAll().filter((department) => department.id !== id),
    );
  },

  employeeCount(departmentId) {
    return read(COLLECTIONS.EMPLOYEES, []).filter(
      (employee) => employee.departmentId === departmentId,
    ).length;
  },
};
