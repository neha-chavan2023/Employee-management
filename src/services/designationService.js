import { read, write, uid, COLLECTIONS } from './db';
import { nextCode } from '../utils/helpers';

const C = COLLECTIONS.DESIGNATIONS;

export const designationService = {
  getAll() {
    return read(C, []);
  },

  getById(id) {
    return this.getAll().find((designation) => designation.id === id) || null;
  },

  nextDesignationId() {
    return nextCode(this.getAll(), 'designationId', 'DSG', 3);
  },

  create(payload) {
    const designations = this.getAll();
    const designation = {
      id: uid('dsg'),
      designationId: this.nextDesignationId(),
      ...payload,
      name: payload.name.trim(),
    };
    write(C, [...designations, designation]);
    return designation;
  },

  update(id, payload) {
    const designations = this.getAll().map((designation) =>
      designation.id === id ? { ...designation, ...payload, id } : designation,
    );
    write(C, designations);
    return designations.find((designation) => designation.id === id) || null;
  },

  remove(id) {
    const employees = read(COLLECTIONS.EMPLOYEES, []).filter(
      (employee) => employee.designationId === id,
    );
    if (employees.length > 0) {
      throw new Error(
        `Cannot delete this designation. ${employees.length} employee${employees.length > 1 ? 's are' : ' is'} still assigned to it.`,
      );
    }
    write(
      C,
      this.getAll().filter((designation) => designation.id !== id),
    );
  },

  employeeCount(designationId) {
    return read(COLLECTIONS.EMPLOYEES, []).filter(
      (employee) => employee.designationId === designationId,
    ).length;
  },
};
