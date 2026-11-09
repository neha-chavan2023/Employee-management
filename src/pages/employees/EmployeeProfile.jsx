import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiArrowLeft,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiMail,
  FiPhone,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { COLLECTIONS } from '../../services/db';
import { employeeService } from '../../services/employeeService';
import { notificationService } from '../../services/notificationService';
import { formatCurrency, formatDate, fullName } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import InfoItem from '../../components/common/InfoItem';
import EmployeeForm from '../../components/forms/EmployeeForm';

const TABS = [
  { id: 'personal', label: 'Personal Information', icon: FiUser },
  { id: 'professional', label: 'Professional Information', icon: FiBriefcase },
  { id: 'salary', label: 'Salary Information', icon: FiCreditCard },
  { id: 'attendance', label: 'Attendance History', icon: FiClock },
  { id: 'leave', label: 'Leave History', icon: FiCalendar },
  { id: 'emergency', label: 'Emergency Contact', icon: FiShield },
];

export default function EmployeeProfile() {
  const { id } = useParams();
  const { user, canManage } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const attendance = useCollection(COLLECTIONS.ATTENDANCE, []);
  const leaves = useCollection(COLLECTIONS.LEAVES, []);

  const [activeTab, setActiveTab] = useState('personal');
  const [editOpen, setEditOpen] = useState(false);

  const employee = employees.find((item) => item.id === (id || user?.employeeId)) || null;

  const data = useMemo(() => {
    if (!employee) return null;
    const department = departments.find((item) => item.id === employee.departmentId);
    const designation = designations.find((item) => item.id === employee.designationId);
    const manager = employees.find((item) => item.id === employee.reportingManagerId);
    const attendanceRecords = attendance
      .filter((record) => record.employeeId === employee.id)
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    const leaveRecords = leaves
      .filter((leave) => leave.employeeId === employee.id)
      .sort((a, b) => dayjs(b.appliedDate).valueOf() - dayjs(a.appliedDate).valueOf());
    const tenureYears = dayjs().diff(dayjs(employee.joiningDate), 'year');
    const tenureMonths = dayjs().diff(dayjs(employee.joiningDate), 'month') % 12;

    return {
      department,
      designation,
      manager,
      attendanceRecords,
      leaveRecords,
      tenure: tenureYears > 0 ? `${tenureYears}y ${tenureMonths}m` : `${tenureMonths} months`,
      attendanceSummary: {
        present: attendanceRecords.filter((record) => record.status === 'Present').length,
        absent: attendanceRecords.filter((record) => record.status === 'Absent').length,
        late: attendanceRecords.filter((record) => record.status === 'Late').length,
        halfDay: attendanceRecords.filter((record) => record.status === 'Half Day').length,
      },
      leaveSummary: {
        approved: leaveRecords.filter((leave) => leave.status === 'Approved').length,
        pending: leaveRecords.filter((leave) => leave.status === 'Pending').length,
        rejected: leaveRecords.filter((leave) => leave.status === 'Rejected').length,
        days: leaveRecords
          .filter((leave) => leave.status === 'Approved')
          .reduce((total, leave) => total + Number(leave.days || 0), 0),
      },
    };
  }, [employee, departments, designations, employees, attendance, leaves]);

  if (!employee || !data) {
    return (
      <EmptyState
        title="Employee not found"
        message="This employee may have been removed from the directory."
        action={<Link to={canManage ? '/employees' : '/dashboard'} className="ui-btn ui-btn--primary ui-btn--md">Go back</Link>}
      />
    );
  }

  const handleSave = async (payload) => {
    employeeService.update(employee.id, payload);
    notificationService.add({
      title: 'Employee updated',
      message: `${payload.firstName} ${payload.lastName}'s profile was updated.`,
      type: 'info',
    });
    showToast('Employee profile updated successfully.');
    setEditOpen(false);
  };

  return (
    <div>
      <div className="profile-topbar">
        <button
          type="button"
          className="text-action"
          onClick={() => navigate(id ? '/employees' : '/dashboard')}
        >
          <FiArrowLeft /> {id ? 'Back to employees' : 'Back to dashboard'}
        </button>
        {canManage ? (
          <Button icon={FiEdit2} variant="outline" onClick={() => setEditOpen(true)}>
            Edit Profile
          </Button>
        ) : null}
      </div>

      <section className="profile-hero">
        <Avatar name={fullName(employee)} src={employee.avatar} size="xl" />
        <div className="profile-hero-copy">
          <span className="welcome-kicker">{employee.employeeId}</span>
          <h1>{fullName(employee)}</h1>
          <p>
            {data.designation?.name || '—'} · {data.department?.name || '—'}
          </p>
          <div className="welcome-badges">
            <StatusBadge status={employee.status} />
            <StatusBadge status={employee.employmentType} />
            <span className="soft-chip"><FiCalendar /> Joined {formatDate(employee.joiningDate)}</span>
            <span className="soft-chip"><FiClock /> {data.tenure} tenure</span>
          </div>
        </div>
        <div className="profile-contact">
          <a href={`mailto:${employee.email}`} className="profile-contact-row">
            <FiMail /> {employee.email}
          </a>
          <a href={`tel:+91${employee.phone}`} className="profile-contact-row">
            <FiPhone /> +91 {employee.phone}
          </a>
          <span className="profile-contact-row">
            <FiBriefcase /> {employee.workLocation || '—'}
          </span>
        </div>
      </section>

      <div className="profile-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon /> <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <section className="ui-card profile-panel">
        {activeTab === 'personal' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Personal Information</h3>
                <p className="card-subtitle">Basic profile and contact details.</p>
              </div>
            </div>
            <div className="info-grid">
              <InfoItem label="Full Name" value={fullName(employee)} />
              <InfoItem label="Gender" value={employee.gender} />
              <InfoItem label="Date of Birth" value={formatDate(employee.dob)} />
              <InfoItem label="Age" value={employee.dob ? `${dayjs().diff(dayjs(employee.dob), 'year')} years` : '—'} />
              <InfoItem label="Email Address" value={employee.email} />
              <InfoItem label="Phone Number" value={`+91 ${employee.phone}`} />
              <InfoItem label="Alternate Phone" value={employee.altPhone ? `+91 ${employee.altPhone}` : '—'} />
              <InfoItem label="Employee ID" value={employee.employeeId} />
              <InfoItem
                label="Address"
                className="span-2"
                value={[employee.address, employee.city, employee.state, employee.pincode].filter(Boolean).join(', ') || '—'}
              />
            </div>
          </>
        ) : null}

        {activeTab === 'professional' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Professional Information</h3>
                <p className="card-subtitle">Role, reporting line and employment details.</p>
              </div>
            </div>
            <div className="info-grid">
              <InfoItem label="Employee ID" value={employee.employeeId} />
              <InfoItem label="Department" value={data.department?.name} />
              <InfoItem label="Designation" value={data.designation?.name} />
              <InfoItem label="Reporting Manager" value={data.manager ? fullName(data.manager) : '—'} />
              <InfoItem label="Joining Date" value={formatDate(employee.joiningDate)} />
              <InfoItem label="Tenure" value={data.tenure} />
              <InfoItem label="Employment Type" value={<StatusBadge status={employee.employmentType} />} />
              <InfoItem label="Employment Status" value={<StatusBadge status={employee.status} />} />
              <InfoItem label="Work Location" value={employee.workLocation || '—'} />
            </div>
          </>
        ) : null}

        {activeTab === 'salary' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Salary Information</h3>
                <p className="card-subtitle">Monthly salary structure in INR.</p>
              </div>
              <span className="soft-chip">Confidential</span>
            </div>
            <div className="salary-grid">
              <div className="salary-item"><span>Basic Salary</span><strong>{formatCurrency(employee.salary?.basic)}</strong></div>
              <div className="salary-item"><span>HRA</span><strong>{formatCurrency(employee.salary?.hra)}</strong></div>
              <div className="salary-item"><span>Allowances</span><strong>{formatCurrency(employee.salary?.allowances)}</strong></div>
              <div className="salary-item"><span>Deductions</span><strong className="text-danger">{formatCurrency(employee.salary?.deductions)}</strong></div>
            </div>
            <div className="salary-total salary-total--large">
              <span>Total Monthly Salary</span>
              <strong>{formatCurrency(employee.salary?.total)}</strong>
              <small>Basic + HRA + Allowances − Deductions</small>
            </div>
          </>
        ) : null}

        {activeTab === 'attendance' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Attendance History</h3>
                <p className="card-subtitle">{data.attendanceRecords.length} records on file.</p>
              </div>
            </div>
            <div className="summary-strip">
              <div className="summary-chip summary-chip--green"><span>Present</span><strong>{data.attendanceSummary.present}</strong></div>
              <div className="summary-chip summary-chip--red"><span>Absent</span><strong>{data.attendanceSummary.absent}</strong></div>
              <div className="summary-chip summary-chip--amber"><span>Late</span><strong>{data.attendanceSummary.late}</strong></div>
              <div className="summary-chip summary-chip--blue"><span>Half Day</span><strong>{data.attendanceSummary.halfDay}</strong></div>
            </div>
            {data.attendanceRecords.length ? (
              <div className="table-wrap">
                <table className="data-table data-table--compact">
                  <thead>
                    <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Working Hours</th><th>Status</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {data.attendanceRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{record.checkIn || '—'}</td>
                        <td>{record.checkOut || '—'}</td>
                        <td>{record.workingHours || '—'}</td>
                        <td><StatusBadge status={record.status} /></td>
                        <td>{record.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No attendance records" message="Attendance will appear here once marked." />
            )}
          </>
        ) : null}

        {activeTab === 'leave' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Leave History</h3>
                <p className="card-subtitle">{data.leaveRecords.length} leave requests on file.</p>
              </div>
            </div>
            <div className="summary-strip">
              <div className="summary-chip summary-chip--green"><span>Approved</span><strong>{data.leaveSummary.approved}</strong></div>
              <div className="summary-chip summary-chip--amber"><span>Pending</span><strong>{data.leaveSummary.pending}</strong></div>
              <div className="summary-chip summary-chip--red"><span>Rejected</span><strong>{data.leaveSummary.rejected}</strong></div>
              <div className="summary-chip summary-chip--blue"><span>Approved Days</span><strong>{data.leaveSummary.days}</strong></div>
            </div>
            {data.leaveRecords.length ? (
              <div className="table-wrap">
                <table className="data-table data-table--compact">
                  <thead>
                    <tr><th>Request ID</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Applied On</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.leaveRecords.map((leave) => (
                      <tr key={leave.id}>
                        <td>{leave.requestId}</td>
                        <td>{leave.leaveType}</td>
                        <td>{formatDate(leave.startDate)}</td>
                        <td>{formatDate(leave.endDate)}</td>
                        <td>{leave.days}</td>
                        <td>{formatDate(leave.appliedDate)}</td>
                        <td><StatusBadge status={leave.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No leave requests" message="Leave applications will appear here." />
            )}
          </>
        ) : null}

        {activeTab === 'emergency' ? (
          <>
            <div className="card-head">
              <div>
                <h3 className="card-title">Emergency Contact</h3>
                <p className="card-subtitle">Person to contact in case of an emergency.</p>
              </div>
            </div>
            {employee.emergency?.name ? (
              <div className="emergency-card">
                <span className="emergency-avatar"><FiShield /></span>
                <div>
                  <strong>{employee.emergency.name}</strong>
                  <span>{employee.emergency.relationship || 'Contact'}</span>
                  <a href={`tel:+91${employee.emergency.phone}`}><FiPhone /> +91 {employee.emergency.phone}</a>
                </div>
              </div>
            ) : (
              <EmptyState title="No emergency contact" message="Add an emergency contact from the employee form." />
            )}
          </>
        ) : null}
      </section>

      {editOpen ? (
        <EmployeeForm
          employee={employee}
          employees={employees}
          departments={departments}
          designations={designations}
          nextEmployeeId={employee.employeeId}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
