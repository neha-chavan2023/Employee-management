import dayjs from 'dayjs';
import { storage } from '../utils/storage';
import { write, COLLECTIONS } from '../services/db';
import { calcWorkingHours, getDaysBetween } from '../utils/helpers';
import { DEFAULT_SETTINGS } from '../services/settingsService';

const pad = (value) => String(value).padStart(3, '0');
const dateAt = (offset) => dayjs().add(offset, 'day').format('YYYY-MM-DD');

const DEPARTMENTS = [
  {
    id: 'dep-1',
    departmentId: 'DEP001',
    name: 'Human Resources',
    description: 'Talent acquisition, employee engagement, payroll and HR operations.',
    headEmployeeId: 'emp-002',
    status: 'Active',
  },
  {
    id: 'dep-2',
    departmentId: 'DEP002',
    name: 'Engineering',
    description: 'Product engineering, platform reliability and quality assurance.',
    headEmployeeId: 'emp-003',
    status: 'Active',
  },
  {
    id: 'dep-3',
    departmentId: 'DEP003',
    name: 'Sales',
    description: 'Enterprise sales, partnerships and revenue operations.',
    headEmployeeId: 'emp-007',
    status: 'Active',
  },
  {
    id: 'dep-4',
    departmentId: 'DEP004',
    name: 'Marketing',
    description: 'Brand, demand generation and product marketing.',
    headEmployeeId: 'emp-010',
    status: 'Active',
  },
  {
    id: 'dep-5',
    departmentId: 'DEP005',
    name: 'Finance',
    description: 'Financial planning, accounting, compliance and audit.',
    headEmployeeId: 'emp-009',
    status: 'Active',
  },
  {
    id: 'dep-6',
    departmentId: 'DEP006',
    name: 'Administration',
    description: 'Executive office, workplace and facilities management.',
    headEmployeeId: 'emp-001',
    status: 'Active',
  },
];

const DESIGNATIONS = [
  { id: 'dsg-1', designationId: 'DSG001', name: 'Chief Executive Officer', departmentId: 'dep-6', description: 'Leads company strategy and operations.', status: 'Active' },
  { id: 'dsg-2', designationId: 'DSG002', name: 'HR Manager', departmentId: 'dep-1', description: 'Owns people strategy and HR operations.', status: 'Active' },
  { id: 'dsg-3', designationId: 'DSG003', name: 'HR Executive', departmentId: 'dep-1', description: 'Supports recruitment and employee lifecycle.', status: 'Active' },
  { id: 'dsg-4', designationId: 'DSG004', name: 'Engineering Manager', departmentId: 'dep-2', description: 'Leads engineering teams and delivery.', status: 'Active' },
  { id: 'dsg-5', designationId: 'DSG005', name: 'Senior Software Engineer', departmentId: 'dep-2', description: 'Designs and builds core product systems.', status: 'Active' },
  { id: 'dsg-6', designationId: 'DSG006', name: 'Software Engineer', departmentId: 'dep-2', description: 'Builds and maintains product features.', status: 'Active' },
  { id: 'dsg-7', designationId: 'DSG007', name: 'QA Engineer', departmentId: 'dep-2', description: 'Owns test strategy and release quality.', status: 'Active' },
  { id: 'dsg-8', designationId: 'DSG008', name: 'Sales Manager', departmentId: 'dep-3', description: 'Leads regional sales and key accounts.', status: 'Active' },
  { id: 'dsg-9', designationId: 'DSG009', name: 'Sales Executive', departmentId: 'dep-3', description: 'Drives new business and customer relationships.', status: 'Active' },
  { id: 'dsg-10', designationId: 'DSG010', name: 'Marketing Specialist', departmentId: 'dep-4', description: 'Runs campaigns and brand programmes.', status: 'Active' },
  { id: 'dsg-11', designationId: 'DSG011', name: 'Finance Manager', departmentId: 'dep-5', description: 'Leads financial planning and reporting.', status: 'Active' },
  { id: 'dsg-12', designationId: 'DSG012', name: 'Accountant', departmentId: 'dep-5', description: 'Handles bookkeeping, payroll and compliance.', status: 'Active' },
];

// 25 realistic Indian employee profiles distributed across 6 departments.
const PEOPLE = [
  { first: 'Arjun', last: 'Mehta', gender: 'Male', dep: 'dep-6', des: 'dsg-1', city: 'Mumbai', state: 'Maharashtra', pin: '400051', status: 'Active', type: 'Full-time', basic: 250000, location: 'Mumbai HQ', daysAgo: 2600 },
  { first: 'Priya', last: 'Sharma', gender: 'Female', dep: 'dep-1', des: 'dsg-2', city: 'Pune', state: 'Maharashtra', pin: '411057', status: 'Active', type: 'Full-time', basic: 85000, location: 'Pune Office', daysAgo: 2100 },
  { first: 'Rahul', last: 'Verma', gender: 'Male', dep: 'dep-2', des: 'dsg-4', city: 'Bengaluru', state: 'Karnataka', pin: '560103', status: 'Active', type: 'Full-time', basic: 140000, location: 'Bengaluru Office', daysAgo: 1980 },
  { first: 'Sneha', last: 'Iyer', gender: 'Female', dep: 'dep-2', des: 'dsg-5', city: 'Chennai', state: 'Tamil Nadu', pin: '600096', status: 'Active', type: 'Full-time', basic: 95000, location: 'Remote', daysAgo: 1720 },
  { first: 'Vikram', last: 'Singh', gender: 'Male', dep: 'dep-2', des: 'dsg-6', city: 'Jaipur', state: 'Rajasthan', pin: '302022', status: 'Active', type: 'Full-time', basic: 62000, location: 'Remote', daysAgo: 1540 },
  { first: 'Ananya', last: 'Desai', gender: 'Female', dep: 'dep-2', des: 'dsg-7', city: 'Ahmedabad', state: 'Gujarat', pin: '380054', status: 'Active', type: 'Full-time', basic: 48000, location: 'Ahmedabad Office', daysAgo: 1380 },
  { first: 'Karan', last: 'Malhotra', gender: 'Male', dep: 'dep-3', des: 'dsg-8', city: 'New Delhi', state: 'Delhi', pin: '110016', status: 'Active', type: 'Full-time', basic: 110000, location: 'Delhi Office', daysAgo: 1860 },
  { first: 'Neha', last: 'Gupta', gender: 'Female', dep: 'dep-3', des: 'dsg-9', city: 'Noida', state: 'Uttar Pradesh', pin: '201301', status: 'Active', type: 'Full-time', basic: 46000, location: 'Delhi Office', daysAgo: 1210 },
  { first: 'Rohit', last: 'Kulkarni', gender: 'Male', dep: 'dep-5', des: 'dsg-11', city: 'Pune', state: 'Maharashtra', pin: '411014', status: 'Active', type: 'Full-time', basic: 95000, location: 'Pune Office', daysAgo: 2200 },
  { first: 'Meera', last: 'Nair', gender: 'Female', dep: 'dep-4', des: 'dsg-10', city: 'Kochi', state: 'Kerala', pin: '682024', status: 'Active', type: 'Full-time', basic: 70000, location: 'Remote', daysAgo: 1600 },
  { first: 'Aditya', last: 'Rao', gender: 'Male', dep: 'dep-2', des: 'dsg-6', city: 'Hyderabad', state: 'Telangana', pin: '500081', status: 'Active', type: 'Full-time', basic: 58000, location: 'Hyderabad Office', daysAgo: 980 },
  { first: 'Ishita', last: 'Banerjee', gender: 'Female', dep: 'dep-1', des: 'dsg-3', city: 'Kolkata', state: 'West Bengal', pin: '700091', status: 'Active', type: 'Full-time', basic: 42000, location: 'Kolkata Office', daysAgo: 1120 },
  { first: 'Sameer', last: 'Khan', gender: 'Male', dep: 'dep-3', des: 'dsg-9', city: 'Lucknow', state: 'Uttar Pradesh', pin: '226010', status: 'Active', type: 'Contract', basic: 40000, location: 'Delhi Office', daysAgo: 860 },
  { first: 'Divya', last: 'Reddy', gender: 'Female', dep: 'dep-2', des: 'dsg-5', city: 'Hyderabad', state: 'Telangana', pin: '500032', status: 'Active', type: 'Full-time', basic: 98000, location: 'Hyderabad Office', daysAgo: 1940 },
  { first: 'Manish', last: 'Patel', gender: 'Male', dep: 'dep-5', des: 'dsg-12', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', status: 'Resigned', type: 'Full-time', basic: 45000, location: 'Ahmedabad Office', daysAgo: 1320 },
  { first: 'Pooja', last: 'Joshi', gender: 'Female', dep: 'dep-1', des: 'dsg-3', city: 'Indore', state: 'Madhya Pradesh', pin: '452010', status: 'Active', type: 'Full-time', basic: 38000, location: 'Pune Office', daysAgo: 740 },
  { first: 'Nikhil', last: 'Chavan', gender: 'Male', dep: 'dep-2', des: 'dsg-7', city: 'Pune', state: 'Maharashtra', pin: '411045', status: 'Active', type: 'Full-time', basic: 46000, location: 'Pune Office', daysAgo: 520 },
  { first: 'Shreya', last: 'Kapoor', gender: 'Female', dep: 'dep-4', des: 'dsg-10', city: 'Chandigarh', state: 'Punjab', pin: '160101', status: 'Active', type: 'Full-time', basic: 52000, location: 'Remote', daysAgo: 48 },
  { first: 'Amit', last: 'Yadav', gender: 'Male', dep: 'dep-3', des: 'dsg-9', city: 'New Delhi', state: 'Delhi', pin: '110024', status: 'Active', type: 'Full-time', basic: 42000, location: 'Delhi Office', daysAgo: 75 },
  { first: 'Tanvi', last: 'Shah', gender: 'Female', dep: 'dep-5', des: 'dsg-12', city: 'Surat', state: 'Gujarat', pin: '395007', status: 'Inactive', type: 'Full-time', basic: 41000, location: 'Ahmedabad Office', daysAgo: 100 },
  { first: 'Harish', last: 'Menon', gender: 'Male', dep: 'dep-2', des: 'dsg-6', city: 'Bengaluru', state: 'Karnataka', pin: '560037', status: 'Active', type: 'Full-time', basic: 55000, location: 'Bengaluru Office', newJoiner: true },
  { first: 'Kavya', last: 'Pillai', gender: 'Female', dep: 'dep-4', des: 'dsg-10', city: 'Thiruvananthapuram', state: 'Kerala', pin: '695581', status: 'Active', type: 'Full-time', basic: 47000, location: 'Remote', daysAgo: 130 },
  { first: 'Ritu', last: 'Agarwal', gender: 'Female', dep: 'dep-3', des: 'dsg-9', city: 'Jaipur', state: 'Rajasthan', pin: '302017', status: 'Active', type: 'Contract', basic: 36000, location: 'Delhi Office', daysAgo: 160 },
  { first: 'Deepak', last: 'Bhatt', gender: 'Male', dep: 'dep-2', des: 'dsg-7', city: 'Dehradun', state: 'Uttarakhand', pin: '248001', status: 'Active', type: 'Full-time', basic: 40000, location: 'Remote', newJoiner: true },
  { first: 'Ritika', last: 'Saxena', gender: 'Female', dep: 'dep-1', des: 'dsg-3', city: 'Bhopal', state: 'Madhya Pradesh', pin: '462016', status: 'Active', type: 'Full-time', basic: 34000, location: 'Pune Office', newJoiner: true },
];

const HEADS = {
  'dep-1': 'emp-002',
  'dep-2': 'emp-003',
  'dep-3': 'emp-007',
  'dep-4': 'emp-010',
  'dep-5': 'emp-009',
  'dep-6': 'emp-001',
};

const buildEmployees = () =>
  PEOPLE.map((person, index) => {
    const id = `emp-${pad(index + 1)}`;
    const dob =
      index < 4
        ? dayjs()
            .subtract(30 + index, 'year')
            .add(2 + index * 7, 'day')
            .format('YYYY-MM-DD')
        : `${1988 + ((index * 3) % 12)}-${String(((index * 5) % 12) + 1).padStart(2, '0')}-${String(((index * 7) % 27) + 1).padStart(2, '0')}`;

    const maxDay = Math.max(1, dayjs().date());
    const joiningDate = person.newJoiner
      ? dayjs()
          .startOf('month')
          .add(Math.min(2 + index, maxDay), 'day')
          .format('YYYY-MM-DD')
      : dayjs()
          .subtract(person.daysAgo || 900, 'day')
          .format('YYYY-MM-DD');

    const phone = `98${String(10000000 + index * 7654321).slice(-8)}`;
    const hra = Math.round(person.basic * 0.4);
    const allowances = Math.round(person.basic * 0.15);
    const deductions = Math.round(person.basic * 0.12);
    const managerId =
      id === 'emp-001'
        ? ''
        : HEADS[person.dep] === id
          ? 'emp-001'
          : HEADS[person.dep];

    return {
      id,
      employeeId: `EMP${pad(index + 1)}`,
      firstName: person.first,
      lastName: person.last,
      gender: person.gender,
      dob,
      email: `${person.first}.${person.last}@ems.com`.toLowerCase(),
      phone,
      altPhone: index % 3 === 0 ? `97${String(20000000 + index * 3456789).slice(-8)}` : '',
      avatar: '',
      address: `${10 + index}, ${['Green Park Residency', 'Lake View Apartments', 'Rose Villa', 'Sunrise Enclave', 'Palm Grove Society'][index % 5]}`,
      city: person.city,
      state: person.state,
      pincode: person.pin,
      departmentId: person.dep,
      designationId: person.des,
      reportingManagerId: managerId,
      joiningDate,
      employmentType: person.type,
      status: person.status,
      workLocation: person.location,
      salary: {
        basic: person.basic,
        hra,
        allowances,
        deductions,
        total: person.basic + hra + allowances - deductions,
      },
      emergency: {
        name: `${['Sunita', 'Ramesh', 'Lakshmi', 'Suresh', 'Kavita', 'Anil'][index % 6]} ${person.last}`,
        relationship: ['Spouse', 'Father', 'Mother', 'Sibling'][index % 4],
        phone: `96${String(30000000 + index * 4567891).slice(-8)}`,
      },
      createdAt: new Date().toISOString(),
    };
  });

const buildAttendance = (employees) => {
  const team = employees.filter((employee) =>
    ['emp-004', 'emp-005', 'emp-006', 'emp-007', 'emp-008', 'emp-009'].includes(employee.id),
  );
  const records = [];
  let counter = 0;

  for (let dayOffset = 0; dayOffset < 5; dayOffset += 1) {
    team.forEach((employee, index) => {
      counter += 1;
      const date = dateAt(-dayOffset);
      const pattern = (index + dayOffset) % 5;
      let status = 'Present';
      if (pattern === 2) status = 'Late';
      if (pattern === 3) status = 'Absent';
      if (pattern === 4) status = 'Half Day';
      if (employee.id === 'emp-008' && dayOffset === 0) status = 'On Leave';

      const checkIn =
        status === 'Absent' || status === 'On Leave'
          ? ''
          : status === 'Late'
            ? '09:52'
            : status === 'Half Day'
              ? '09:18'
              : '09:05';
      const checkOut =
        status === 'Absent' || status === 'On Leave' ? '' : status === 'Half Day' ? '13:30' : '18:15';
      const { text } = calcWorkingHours(checkIn, checkOut);

      records.push({
        id: `att-${pad(counter)}`,
        employeeId: employee.id,
        date,
        checkIn,
        checkOut,
        workingHours: checkIn && checkOut ? text : '—',
        status,
        remarks: status === 'Late' ? 'Traffic delay' : '',
      });
    });
  }

  return records;
};

const LEAVE_SEED = [
  { employeeId: 'emp-008', leaveType: 'Casual Leave', start: -1, end: 2, status: 'Approved', reason: 'Family function at home town.' },
  { employeeId: 'emp-013', leaveType: 'Sick Leave', start: 0, end: 1, status: 'Approved', reason: 'Viral fever, doctor advised rest.' },
  { employeeId: 'emp-019', leaveType: 'Earned Leave', start: 1, end: 3, status: 'Pending', reason: 'Short trip with family.' },
  { employeeId: 'emp-004', leaveType: 'Casual Leave', start: -20, end: -19, status: 'Approved', reason: 'Personal errand.' },
  { employeeId: 'emp-011', leaveType: 'Sick Leave', start: -8, end: -7, status: 'Rejected', reason: 'Migraine and rest.' },
  { employeeId: 'emp-012', leaveType: 'Earned Leave', start: 5, end: 7, status: 'Pending', reason: 'Attending a family wedding.' },
  { employeeId: 'emp-016', leaveType: 'Casual Leave', start: -3, end: -3, status: 'Approved', reason: 'Bank work.' },
  { employeeId: 'emp-018', leaveType: 'Sick Leave', start: 0, end: 0, status: 'Pending', reason: 'Not feeling well.' },
  { employeeId: 'emp-021', leaveType: 'Unpaid Leave', start: 10, end: 12, status: 'Pending', reason: 'Personal commitment.' },
  { employeeId: 'emp-010', leaveType: 'Earned Leave', start: -30, end: -28, status: 'Approved', reason: 'Vacation with family.' },
  { employeeId: 'emp-006', leaveType: 'Casual Leave', start: 2, end: 2, status: 'Pending', reason: 'Apartment registration appointment.' },
  { employeeId: 'emp-014', leaveType: 'Sick Leave', start: -5, end: -4, status: 'Approved', reason: 'Dental procedure.' },
  { employeeId: 'emp-009', leaveType: 'Casual Leave', start: 4, end: 4, status: 'Rejected', reason: 'Personal work.' },
  { employeeId: 'emp-017', leaveType: 'Earned Leave', start: -15, end: -11, status: 'Approved', reason: 'Annual family holiday.' },
  { employeeId: 'emp-024', leaveType: 'Casual Leave', start: 3, end: 5, status: 'Pending', reason: 'Moving to a new apartment.' },
];

const buildLeaves = () =>
  LEAVE_SEED.map((entry, index) => ({
    id: `leave-${pad(index + 1)}`,
    requestId: `LV${pad(index + 1)}`,
    employeeId: entry.employeeId,
    leaveType: entry.leaveType,
    startDate: dateAt(entry.start),
    endDate: dateAt(entry.end),
    days: getDaysBetween(dateAt(entry.start), dateAt(entry.end)),
    reason: entry.reason,
    document: '',
    appliedDate: dateAt(entry.start - 2),
    status: entry.status,
    approvedBy:
      entry.status === 'Approved' ? 'Priya Sharma' : entry.status === 'Rejected' ? 'Priya Sharma' : '',
    approvedAt: entry.status !== 'Pending' ? dayjs().subtract(1, 'day').toISOString() : '',
    comment:
      entry.status === 'Rejected'
        ? 'Team availability is low for these dates. Please re-apply after the sprint.'
        : '',
  }));

const buildNotifications = () => {
  const now = dayjs();
  return [
    { title: 'New employee added', message: 'Ritika Saxena joined as an HR Executive.', type: 'success', read: false, createdAt: now.subtract(10, 'minute').toISOString() },
    { title: 'Leave application submitted', message: 'Ananya Desai applied for Casual Leave.', type: 'info', read: false, createdAt: now.subtract(45, 'minute').toISOString() },
    { title: 'Attendance marked', message: 'Attendance was marked for the Engineering team.', type: 'info', read: false, createdAt: now.subtract(2, 'hour').toISOString() },
    { title: 'Leave approved', message: "Neha Gupta's Casual Leave request was approved.", type: 'success', read: false, createdAt: now.subtract(3, 'hour').toISOString() },
    { title: 'Leave rejected', message: "Aditya Rao's Sick Leave request was rejected.", type: 'warning', read: true, createdAt: now.subtract(5, 'hour').toISOString() },
    { title: 'New employee added', message: 'Deepak Bhatt joined as a QA Engineer.', type: 'success', read: true, createdAt: now.subtract(1, 'day').toISOString() },
    { title: 'Leave application submitted', message: 'Ritika Saxena applied for Earned Leave.', type: 'info', read: true, createdAt: now.subtract(1, 'day').add(2, 'hour').toISOString() },
    { title: 'Attendance marked', message: 'Attendance was marked for 6 employees.', type: 'info', read: true, createdAt: now.subtract(2, 'day').toISOString() },
    { title: 'Leave approved', message: "Divya Reddy's Sick Leave request was approved.", type: 'success', read: true, createdAt: now.subtract(2, 'day').add(4, 'hour').toISOString() },
    { title: 'Monthly report ready', message: 'The October HR summary is available in Reports.', type: 'info', read: true, createdAt: now.subtract(3, 'day').toISOString() },
  ].map((notification, index) => ({ id: `notif-${pad(index + 1)}`, ...notification }));
};

/**
 * Seed localStorage once. Sample data is only written when it is empty,
 * so user-created records survive a refresh.
 */
export function seedDatabase() {
  const existing = storage.get(COLLECTIONS.EMPLOYEES, null);
  if (Array.isArray(existing) && existing.length > 0) {
    if (!storage.get(COLLECTIONS.SETTINGS, null)) {
      write(COLLECTIONS.SETTINGS, DEFAULT_SETTINGS);
    }
    return;
  }

  const employees = buildEmployees();
  write(COLLECTIONS.EMPLOYEES, employees);
  write(COLLECTIONS.DEPARTMENTS, DEPARTMENTS);
  write(COLLECTIONS.DESIGNATIONS, DESIGNATIONS);
  write(COLLECTIONS.ATTENDANCE, buildAttendance(employees));
  write(COLLECTIONS.LEAVES, buildLeaves());
  write(COLLECTIONS.NOTIFICATIONS, buildNotifications());
  write(COLLECTIONS.SETTINGS, DEFAULT_SETTINGS);
}
