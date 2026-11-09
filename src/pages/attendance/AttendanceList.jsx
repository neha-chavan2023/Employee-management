import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEdit2,
  FiFilter,
  FiPlus,
  FiTrash2,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { attendanceService } from '../../services/attendanceService';
import { notificationService } from '../../services/notificationService';
import { exportToCSV, formatDate, fullName } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AttendanceForm from '../../components/forms/AttendanceForm';

export default function AttendanceList() {
  const { user, canManage } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const attendance = useCollection(COLLECTIONS.ATTENDANCE, []);
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const loading = useFakeLoading(240);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (canManage && searchParams.get('action') === 'new') {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [canManage, searchParams, setSearchParams]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const departmentMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const scoped = useMemo(
    () =>
      attendance
        .filter((record) => canManage || record.employeeId === user?.employeeId)
        .map((record) => {
          const employee = employeeMap.get(record.employeeId);
          return {
            ...record,
            employeeName: employee ? fullName(employee) : 'Unknown employee',
            employeeCode: employee?.employeeId || '—',
            departmentName: employee ? departmentMap.get(employee.departmentId) || '—' : '—',
            departmentId: employee?.departmentId || '',
            employeeAvatar: employee?.avatar || '',
          };
        })
        .sort((a, b) => {
          if (a.date === b.date) return a.employeeCode.localeCompare(b.employeeCode);
          return dayjs(b.date).valueOf() - dayjs(a.date).valueOf();
        }),
    [attendance, canManage, user, employeeMap, departmentMap],
  );

  const baseFiltered = useMemo(
    () =>
      scoped.filter((record) => {
        const dateMatch = dateFilter
          ? record.date === dateFilter
          : monthFilter
            ? record.date.startsWith(monthFilter)
            : true;
        return dateMatch && (!departmentFilter || record.departmentId === departmentFilter);
      }),
    [scoped, dateFilter, monthFilter, departmentFilter],
  );

  const summary = useMemo(() => attendanceService.summary(baseFiltered), [baseFiltered]);

  const finalRecords = useMemo(
    () => baseFiltered.filter((record) => !statusFilter || record.status === statusFilter),
    [baseFiltered, statusFilter],
  );

  const table = useTableControls(finalRecords, {
    searchFields: ['employeeName', 'employeeCode', 'departmentName', 'status'],
    pageSize: 10,
    initialSort: { key: 'date', dir: 'desc' },
  });

  const handleSave = async (payload) => {
    const employee = employeeMap.get(payload.employeeId);
    const employeeName = employee ? fullName(employee) : 'Employee';
    if (editing) {
      attendanceService.update(editing.id, payload);
      showToast(`Attendance for ${employeeName} was updated.`);
    } else {
      attendanceService.create(payload);
      notificationService.add({
        title: 'Attendance marked',
        message: `${employeeName} was marked ${payload.status} for ${formatDate(payload.date)}.`,
        type: 'info',
      });
      showToast(`Attendance for ${employeeName} was saved.`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    attendanceService.remove(deleting.id);
    showToast(`Attendance for ${deleting.employeeName} was deleted.`, 'info');
    setDeleting(null);
  };

  const handleExport = () => {
    exportToCSV(
      'attendance-report',
      ['Employee ID', 'Employee Name', 'Department', 'Date', 'Check-in', 'Check-out', 'Working Hours', 'Status', 'Remarks'],
      table.sorted.map((record) => [
        record.employeeCode,
        record.employeeName,
        record.departmentName,
        record.date,
        record.checkIn || '',
        record.checkOut || '',
        record.workingHours || '',
        record.status,
        record.remarks || '',
      ]),
    );
    showToast('Attendance records exported to CSV.');
  };

  const columns = [
    { key: 'employeeCode', label: 'Employee ID', sortable: true, className: 'col-id' },
    {
      key: 'employeeName',
      label: 'Employee',
      sortable: true,
      render: (record) => (
        <div className="table-user">
          <div className="table-user-copy">
            <strong>{record.employeeName}</strong>
            <span>{record.departmentName}</span>
          </div>
        </div>
      ),
    },
    { key: 'date', label: 'Date', sortable: true, render: (record) => formatDate(record.date) },
    { key: 'checkIn', label: 'Check-in', className: 'hide-sm', render: (record) => record.checkIn || '—' },
    { key: 'checkOut', label: 'Check-out', className: 'hide-sm', render: (record) => record.checkOut || '—' },
    {
      key: 'workingHours',
      label: 'Working Hours',
      className: 'hide-md',
      render: (record) => record.workingHours || '—',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (record) => <StatusBadge status={record.status} />,
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            label: 'Actions',
            className: 'col-actions',
            render: (record) => (
              <div className="row-actions">
                <button
                  type="button"
                  className="icon-btn icon-btn--sm"
                  title="Edit attendance"
                  onClick={() => {
                    setEditing(record);
                    setFormOpen(true);
                  }}
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--sm icon-btn--danger"
                  title="Delete attendance"
                  onClick={() => setDeleting(record)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const clearDateFilters = () => {
    setDateFilter('');
    setMonthFilter('');
  };

  return (
    <div>
      <PageHeader
        title={canManage ? 'Attendance' : 'My Attendance'}
        subtitle={
          canManage
            ? 'Track daily attendance, working hours and exceptions across the organisation.'
            : 'Review your attendance records, check-in times and working hours.'
        }
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Attendance' }]}
        actions={
          <>
            <Button variant="outline" icon={FiDownload} onClick={handleExport} disabled={!table.sorted.length}>
              Export CSV
            </Button>
            {canManage ? (
              <Button
                icon={FiPlus}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Mark Attendance
              </Button>
            ) : null}
          </>
        }
      />

      <div className="stat-grid stat-grid--5">
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--green"><FiCheckCircle /></span>
          <div className="stat-copy">
            <span className="stat-label">Total Present</span>
            <strong className="stat-value">{summary.present}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--red"><FiXCircle /></span>
          <div className="stat-copy">
            <span className="stat-label">Total Absent</span>
            <strong className="stat-value">{summary.absent}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--amber"><FiClock /></span>
          <div className="stat-copy">
            <span className="stat-label">Total Late</span>
            <strong className="stat-value">{summary.late}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--blue"><FiCalendar /></span>
          <div className="stat-copy">
            <span className="stat-label">Half Days</span>
            <strong className="stat-value">{summary.halfDay}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--indigo"><FiUsers /></span>
          <div className="stat-copy">
            <span className="stat-label">Employees Covered</span>
            <strong className="stat-value">{summary.employees}</strong>
          </div>
        </div>
      </div>

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <SearchBar
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search by employee name, ID or department..."
            />
            <div className="filters">
              <div className="filter-control">
                <FiCalendar />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(event) => {
                    setDateFilter(event.target.value);
                    if (event.target.value) setMonthFilter('');
                  }}
                  aria-label="Filter by date"
                />
              </div>
              <div className="filter-control">
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(event) => {
                    setMonthFilter(event.target.value);
                    if (event.target.value) setDateFilter('');
                  }}
                  aria-label="Filter by month"
                />
              </div>
              {canManage ? (
                <div className="filter-control">
                  <FiFilter />
                  <select
                    value={departmentFilter}
                    onChange={(event) => setDepartmentFilter(event.target.value)}
                    aria-label="Filter by department"
                  >
                    <option value="">All departments</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="filter-control">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by attendance status"
                >
                  <option value="">All statuses</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              {dateFilter || monthFilter ? (
                <button type="button" className="link-btn" onClick={clearDateFilters}>
                  Clear date filter
                </button>
              ) : null}
            </div>
          </div>
          <p className="table-count">
            {table.total} record{table.total === 1 ? '' : 's'}
            {monthFilter ? ` · ${dayjs(`${monthFilter}-01`).format('MMMM YYYY')}` : ''}
            {dateFilter ? ` · ${formatDate(dateFilter)}` : ''}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={table.pageItems}
          loading={loading}
          sort={table.sort}
          onSort={table.onSort}
          emptyTitle="No attendance records found"
          emptyMessage="Try a different date, month or status, or mark attendance for an employee."
        />
        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          pageSize={table.pageSize}
          onChange={table.setPage}
        />
      </section>

      {formOpen ? (
        <AttendanceForm
          record={editing}
          employees={employees}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete attendance record?"
        message={
          deleting
            ? `This will remove the attendance record for ${deleting.employeeName} on ${formatDate(deleting.date)}. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Record"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
