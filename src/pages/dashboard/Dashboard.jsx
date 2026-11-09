import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiActivity,
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCoffee,
  FiPlus,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
  FiUserX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { COLLECTIONS } from '../../services/db';
import { formatDate, fullName, upcomingBirthday } from '../../utils/helpers';
import Avatar from '../../components/common/Avatar';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import { StatSkeleton, ChartSkeleton } from '../../components/common/Skeleton';
import DepartmentPie from '../../components/charts/DepartmentPie';
import JoiningBar from '../../components/charts/JoiningBar';
import GenderDonut from '../../components/charts/GenderDonut';
import AttendanceLine from '../../components/charts/AttendanceLine';
import EmployeeDashboard from './EmployeeDashboard';

const greeting = () => {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const attendance = useCollection(COLLECTIONS.ATTENDANCE, []);
  const leaves = useCollection(COLLECTIONS.LEAVES, []);
  const notifications = useCollection(COLLECTIONS.NOTIFICATIONS, []);
  const loading = useFakeLoading(320);

  const data = useMemo(() => {
    const today = dayjs().startOf('day');
    const active = employees.filter((employee) => employee.status === 'Active').length;
    const inactive = employees.filter((employee) => employee.status === 'Inactive').length;
    const resigned = employees.filter((employee) => employee.status === 'Resigned').length;
    const newJoiners = employees.filter((employee) =>
      dayjs(employee.joiningDate).isSame(today, 'month'),
    );

    const onLeaveToday = leaves.filter(
      (leave) =>
        leave.status === 'Approved' &&
        !today.isBefore(dayjs(leave.startDate), 'day') &&
        !today.isAfter(dayjs(leave.endDate), 'day'),
    );
    const onLeaveEmployeeIds = [...new Set(onLeaveToday.map((leave) => leave.employeeId))];

    const departmentData = departments
      .map((department) => ({
        name: department.name,
        value: employees.filter((employee) => employee.departmentId === department.id).length,
      }))
      .filter((item) => item.value > 0);

    const monthlyJoinings = Array.from({ length: 6 }).map((_, index) => {
      const month = dayjs().subtract(5 - index, 'month');
      return {
        label: month.format('MMM'),
        value: employees.filter((employee) =>
          dayjs(employee.joiningDate).isSame(month, 'month'),
        ).length,
      };
    });

    const genderData = ['Male', 'Female', 'Other']
      .map((gender) => ({
        name: gender,
        value: employees.filter((employee) => employee.gender === gender).length,
      }))
      .filter((item) => item.value > 0);

    const attendanceTrend = Array.from({ length: 7 }).map((_, index) => {
      const date = dayjs().subtract(6 - index, 'day');
      const records = attendance.filter((record) => record.date === date.format('YYYY-MM-DD'));
      return {
        label: date.format('ddd'),
        Present: records.filter((record) => record.status === 'Present').length,
        Late: records.filter((record) => record.status === 'Late').length,
        Absent: records.filter((record) => record.status === 'Absent').length,
      };
    });

    const birthdays = employees
      .map((employee) => ({ employee, birthday: upcomingBirthday(employee.dob) }))
      .filter((item) => item.birthday && item.birthday.daysAway <= 30)
      .sort((a, b) => a.birthday.daysAway - b.birthday.daysAway)
      .slice(0, 5);

    const recentJoinings = [...employees]
      .sort((a, b) => dayjs(b.joiningDate).valueOf() - dayjs(a.joiningDate).valueOf())
      .slice(0, 5);

    const activities = [...notifications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const leaveMembers = onLeaveEmployeeIds
      .map((id) => {
        const employee = employees.find((item) => item.id === id);
        const leave = onLeaveToday.find((item) => item.employeeId === id);
        return employee ? { employee, leave } : null;
      })
      .filter(Boolean);

    return {
      active,
      inactive,
      resigned,
      newJoiners,
      departmentData,
      monthlyJoinings,
      genderData,
      attendanceTrend,
      birthdays,
      recentJoinings,
      activities,
      leaveMembers,
      onLeaveCount: onLeaveEmployeeIds.length,
      designationMap: designations,
    };
  }, [employees, departments, designations, attendance, leaves, notifications]);

  if (user?.role === 'employee') return <EmployeeDashboard />;

  const designationName = (employee) =>
    designations.find((designation) => designation.id === employee.designationId)?.name || '—';
  const departmentName = (employee) =>
    departments.find((department) => department.id === employee.departmentId)?.name || '—';

  return (
    <div className="dashboard">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle={`Here's what's happening across your workforce on ${dayjs().format('dddd, DD MMMM YYYY')}.`}
        actions={
          <>
            <Link to="/reports" className="ui-btn ui-btn--outline ui-btn--md">
              <FiBarChart2 /> <span>View Reports</span>
            </Link>
            <Link to="/employees?action=new" className="ui-btn ui-btn--primary ui-btn--md">
              <FiPlus /> <span>Add Employee</span>
            </Link>
          </>
        }
      />

      {loading ? (
        <>
          <div className="stat-grid">
            {Array.from({ length: 6 }).map((_, index) => <StatSkeleton key={index} />)}
          </div>
          <div className="chart-grid">
            {Array.from({ length: 4 }).map((_, index) => <ChartSkeleton key={index} />)}
          </div>
        </>
      ) : (
        <>
          <div className="stat-grid">
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--indigo"><FiUsers /></span>
              <div className="stat-copy">
                <span className="stat-label">Total Employees</span>
                <strong className="stat-value">{employees.length}</strong>
                <span className="stat-foot">{departments.length} departments</span>
              </div>
            </div>
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--green"><FiUserCheck /></span>
              <div className="stat-copy">
                <span className="stat-label">Active Employees</span>
                <strong className="stat-value">{data.active}</strong>
                <span className="stat-foot">{employees.length ? Math.round((data.active / employees.length) * 100) : 0}% of workforce</span>
              </div>
            </div>
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--red"><FiUserX /></span>
              <div className="stat-copy">
                <span className="stat-label">Inactive Employees</span>
                <strong className="stat-value">{data.inactive}</strong>
                <span className="stat-foot">{data.resigned} resigned</span>
              </div>
            </div>
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--blue"><FiBriefcase /></span>
              <div className="stat-copy">
                <span className="stat-label">Departments</span>
                <strong className="stat-value">{departments.filter((department) => department.status === 'Active').length}</strong>
                <span className="stat-foot">active departments</span>
              </div>
            </div>
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--amber"><FiCoffee /></span>
              <div className="stat-copy">
                <span className="stat-label">Employees on Leave</span>
                <strong className="stat-value">{data.onLeaveCount}</strong>
                <span className="stat-foot">approved leave today</span>
              </div>
            </div>
            <div className="ui-card stat-card">
              <span className="stat-icon stat-icon--purple"><FiUserPlus /></span>
              <div className="stat-copy">
                <span className="stat-label">New Joiners</span>
                <strong className="stat-value">{data.newJoiners.length}</strong>
                <span className="stat-foot">joined this month</span>
              </div>
            </div>
          </div>

          <div className="quick-actions">
            <div className="quick-actions-label">
              <FiActivity />
              <span>Quick actions</span>
            </div>
            <div className="quick-actions-list">
              <Link to="/employees?action=new" className="quick-action"><FiUserPlus /> Add Employee</Link>
              <Link to="/attendance?action=new" className="quick-action"><FiClock /> Mark Attendance</Link>
              <Link to="/leaves?action=apply" className="quick-action"><FiCalendar /> Apply Leave</Link>
              <Link to="/departments?action=new" className="quick-action"><FiBriefcase /> Add Department</Link>
              <Link to="/reports" className="quick-action"><FiBarChart2 /> Reports</Link>
            </div>
          </div>

          <div className="chart-grid">
            <section className="ui-card chart-card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Employee Distribution</h3>
                  <p className="card-subtitle">Headcount by department.</p>
                </div>
              </div>
              <DepartmentPie data={data.departmentData} />
            </section>
            <section className="ui-card chart-card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Monthly Joinings</h3>
                  <p className="card-subtitle">New employees over the last 6 months.</p>
                </div>
              </div>
              <JoiningBar data={data.monthlyJoinings} />
            </section>
            <section className="ui-card chart-card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Gender Distribution</h3>
                  <p className="card-subtitle">Workforce split by gender.</p>
                </div>
              </div>
              <GenderDonut data={data.genderData} total={employees.length} />
            </section>
            <section className="ui-card chart-card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Attendance Overview</h3>
                  <p className="card-subtitle">Present, late and absent trends (7 days).</p>
                </div>
              </div>
              <AttendanceLine data={data.attendanceTrend} />
            </section>
          </div>

          <div className="dashboard-columns">
            <section className="ui-card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">Recent Employee Joinings</h3>
                  <p className="card-subtitle">Newest members of the team.</p>
                </div>
                <Link to="/employees" className="text-action">View all <FiArrowRight /></Link>
              </div>
              <div className="list-stack">
                {data.recentJoinings.map((employee) => (
                  <Link key={employee.id} to={`/employees/${employee.id}`} className="list-row list-row--link">
                    <Avatar name={fullName(employee)} src={employee.avatar} size="md" />
                    <div className="list-copy">
                      <strong>{fullName(employee)}</strong>
                      <span>{designationName(employee)} · {departmentName(employee)}</span>
                    </div>
                    <span className="list-meta">{formatDate(employee.joiningDate, 'DD MMM')}</span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="stack">
              <section className="ui-card">
                <div className="card-head">
                  <div>
                    <h3 className="card-title">Upcoming Birthdays</h3>
                    <p className="card-subtitle">Next 30 days.</p>
                  </div>
                </div>
                {data.birthdays.length ? (
                  <div className="list-stack list-stack--dense">
                    {data.birthdays.map(({ employee, birthday }) => (
                      <div key={employee.id} className="list-row">
                        <Avatar name={fullName(employee)} src={employee.avatar} size="sm" />
                        <div className="list-copy">
                          <strong>{fullName(employee)}</strong>
                          <span>{departmentName(employee)}</span>
                        </div>
                        <span className="list-meta">
                          {birthday.daysAway === 0 ? 'Today' : birthday.daysAway === 1 ? 'Tomorrow' : `${birthday.daysAway} days`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-note">No birthdays in the next 30 days.</p>
                )}
              </section>

              <section className="ui-card">
                <div className="card-head">
                  <div>
                    <h3 className="card-title">Employees on Leave Today</h3>
                    <p className="card-subtitle">Approved absences for today.</p>
                  </div>
                </div>
                {data.leaveMembers.length ? (
                  <div className="list-stack list-stack--dense">
                    {data.leaveMembers.map(({ employee, leave }) => (
                      <div key={employee.id} className="list-row">
                        <Avatar name={fullName(employee)} src={employee.avatar} size="sm" />
                        <div className="list-copy">
                          <strong>{fullName(employee)}</strong>
                          <span>{leave.leaveType} · until {formatDate(leave.endDate, 'DD MMM')}</span>
                        </div>
                        <StatusBadge status="On Leave" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted-note">Everyone is available today.</p>
                )}
              </section>
            </div>
          </div>

          <section className="ui-card">
            <div className="card-head">
              <div>
                <h3 className="card-title">Recent Activities</h3>
                <p className="card-subtitle">Latest events across the organisation.</p>
              </div>
            </div>
            <div className="activity-feed">
              {data.activities.map((activity) => (
                <div key={activity.id} className="activity-row">
                  <span className={`notification-dot notification-dot--${activity.type}`} />
                  <div className="activity-copy">
                    <strong>{activity.title}</strong>
                    <span>{activity.message}</span>
                  </div>
                  <small>{dayjs(activity.createdAt).format('DD MMM, hh:mm A')}</small>
                </div>
              ))}
              {!data.activities.length ? <p className="muted-note">No recent activity.</p> : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
