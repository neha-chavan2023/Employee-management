import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { COLLECTIONS } from '../../services/db';
import { formatCurrency, formatDate, fullName } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import { CHART_COLORS, tooltipStyle } from '../../components/charts/colors';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const attendance = useCollection(COLLECTIONS.ATTENDANCE, []);
  const leaves = useCollection(COLLECTIONS.LEAVES, []);

  const employee = employees.find((item) => item.id === user?.employeeId) || null;

  const data = useMemo(() => {
    if (!employee) return null;
    const department = departments.find((item) => item.id === employee.departmentId);
    const designation = designations.find((item) => item.id === employee.designationId);
    const manager = employees.find((item) => item.id === employee.reportingManagerId);
    const myAttendance = attendance
      .filter((record) => record.employeeId === employee.id)
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    const monthAttendance = myAttendance.filter((record) =>
      dayjs(record.date).isSame(dayjs(), 'month'),
    );
    const myLeaves = leaves
      .filter((leave) => leave.employeeId === employee.id)
      .sort((a, b) => dayjs(b.appliedDate).valueOf() - dayjs(a.appliedDate).valueOf());
    const approvedLeaveDays = myLeaves
      .filter((leave) => leave.status === 'Approved')
      .reduce((total, leave) => total + Number(leave.days || 0), 0);
    const colleagues = employees.filter(
      (item) => item.departmentId === employee.departmentId && item.status === 'Active',
    );

    const statusCounts = ['Present', 'Late', 'Half Day', 'Absent', 'On Leave'].map((status) => ({
      name: status,
      value: monthAttendance.filter((record) => record.status === status).length,
    }));

    return {
      department,
      designation,
      manager,
      myAttendance,
      monthAttendance,
      myLeaves,
      approvedLeaveDays,
      colleagues,
      statusCounts: statusCounts.filter((item) => item.value > 0),
      presentDays: monthAttendance.filter((record) => ['Present', 'Late'].includes(record.status)).length,
      pendingLeaves: myLeaves.filter((leave) => leave.status === 'Pending').length,
    };
  }, [employee, departments, designations, employees, attendance, leaves]);

  if (!employee || !data) {
    return (
      <EmptyState
        title="Employee profile not found"
        message="Your login is not linked to an employee record. Please contact your HR administrator."
      />
    );
  }

  return (
    <div className="dashboard">
      <div className="welcome-card">
        <div className="welcome-main">
          <Avatar name={fullName(employee)} src={employee.avatar} size="xl" />
          <div>
            <span className="welcome-kicker">Employee self-service</span>
            <h1>Hello, {employee.firstName}!</h1>
            <p>
              {data.designation?.name} · {data.department?.name} · {employee.employeeId}
            </p>
            <div className="welcome-badges">
              <StatusBadge status={employee.status} />
              <StatusBadge status={employee.employmentType} />
              <span className="soft-chip">Joined {formatDate(employee.joiningDate)}</span>
            </div>
          </div>
        </div>
        <div className="welcome-actions">
          <Link to="/leaves?action=apply" className="ui-btn ui-btn--primary ui-btn--sm">
            <FiPlus /> Apply for Leave
          </Link>
          <Link to="/attendance" className="ui-btn ui-btn--outline ui-btn--sm">
            <FiClock /> My Attendance
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--green"><FiCheckCircle /></span>
          <div className="stat-copy">
            <span className="stat-label">Present This Month</span>
            <strong className="stat-value">{data.presentDays}</strong>
            <span className="stat-foot">days marked present or late</span>
          </div>
        </div>
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--amber"><FiCalendar /></span>
          <div className="stat-copy">
            <span className="stat-label">Approved Leave Days</span>
            <strong className="stat-value">{data.approvedLeaveDays}</strong>
            <span className="stat-foot">across all leave requests</span>
          </div>
        </div>
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--indigo"><FiClock /></span>
          <div className="stat-copy">
            <span className="stat-label">Pending Requests</span>
            <strong className="stat-value">{data.pendingLeaves}</strong>
            <span className="stat-foot">awaiting HR approval</span>
          </div>
        </div>
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--blue"><FiUsers /></span>
          <div className="stat-copy">
            <span className="stat-label">Department Colleagues</span>
            <strong className="stat-value">{data.colleagues.length}</strong>
            <span className="stat-foot">{data.department?.name}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-columns dashboard-columns--profile">
        <section className="ui-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">My Profile</h3>
              <p className="card-subtitle">Employment details at a glance.</p>
            </div>
            <Link to="/profile" className="text-action"><FiUser /> View profile</Link>
          </div>
          <div className="info-grid info-grid--compact">
            <div className="info-item"><span className="info-label">Employee ID</span><span className="info-value">{employee.employeeId}</span></div>
            <div className="info-item"><span className="info-label">Designation</span><span className="info-value">{data.designation?.name || '—'}</span></div>
            <div className="info-item"><span className="info-label">Reporting Manager</span><span className="info-value">{data.manager ? fullName(data.manager) : '—'}</span></div>
            <div className="info-item"><span className="info-label">Work Location</span><span className="info-value">{employee.workLocation || '—'}</span></div>
            <div className="info-item"><span className="info-label">Email</span><span className="info-value">{employee.email}</span></div>
            <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{employee.phone}</span></div>
            <div className="info-item"><span className="info-label">Monthly CTC</span><span className="info-value">{formatCurrency(employee.salary?.total)}</span></div>
            <div className="info-item"><span className="info-label">Date of Joining</span><span className="info-value">{formatDate(employee.joiningDate)}</span></div>
          </div>
        </section>

        <section className="ui-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Attendance This Month</h3>
              <p className="card-subtitle">Your attendance mix for {dayjs().format('MMMM YYYY')}.</p>
            </div>
          </div>
          {data.statusCounts.length ? (
            <div className="chart-canvas chart-canvas--sm">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusCounts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.statusCounts.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} days`, 'Count']} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title="No attendance this month"
              message="Attendance records will appear here once marked by HR."
            />
          )}
        </section>
      </div>

      <div className="dashboard-columns">
        <section className="ui-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Recent Attendance</h3>
              <p className="card-subtitle">Your last recorded attendance entries.</p>
            </div>
            <Link to="/attendance" className="text-action">View all <FiClock /></Link>
          </div>
          {data.myAttendance.length ? (
            <div className="table-wrap">
              <table className="data-table data-table--compact">
                <thead>
                  <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.myAttendance.slice(0, 6).map((record) => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.checkIn || '—'}</td>
                      <td>{record.checkOut || '—'}</td>
                      <td>{record.workingHours || '—'}</td>
                      <td><StatusBadge status={record.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No attendance records" message="Your attendance history will show up here." />
          )}
        </section>

        <section className="ui-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">My Leave Requests</h3>
              <p className="card-subtitle">Latest applications and their status.</p>
            </div>
            <Link to="/leaves" className="text-action">View all <FiCalendar /></Link>
          </div>
          {data.myLeaves.length ? (
            <div className="list-stack">
              {data.myLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="list-row">
                  <span className="list-icon"><FiCalendar /></span>
                  <div className="list-copy">
                    <strong>{leave.leaveType}</strong>
                    <span>{formatDate(leave.startDate)} – {formatDate(leave.endDate)} · {leave.days} day{leave.days === 1 ? '' : 's'}</span>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No leave requests yet"
              message="Apply for leave and track approval status here."
            />
          )}
        </section>
      </div>
    </div>
  );
}
