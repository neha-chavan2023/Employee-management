import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  FiAward,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiDownload,
  FiPieChart,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { formatCurrency, formatDate, fullName, exportToCSV } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Avatar from '../../components/common/Avatar';
import { CHART_AXIS, CHART_COLORS, CHART_GRID, tooltipStyle } from '../../components/charts/colors';

const REPORTS = [
  { id: 'directory', label: 'Employee Directory', icon: FiUsers },
  { id: 'department', label: 'Department-wise', icon: FiBriefcase },
  { id: 'attendance', label: 'Attendance Report', icon: FiClock },
  { id: 'leave', label: 'Leave Report', icon: FiCalendar },
  { id: 'joining', label: 'Monthly Joining', icon: FiTrendingUp },
  { id: 'status', label: 'Employee Status', icon: FiPieChart },
];

const STATUS_OPTIONS = {
  directory: ['Active', 'Inactive', 'Resigned'],
  department: ['Active', 'Inactive'],
  attendance: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'],
  leave: ['Pending', 'Approved', 'Rejected'],
  joining: ['Active', 'Inactive', 'Resigned'],
  status: ['Active', 'Inactive', 'Resigned'],
};

function ReportChart({ chart }) {
  if (!chart || !chart.data.length) {
    return <div className="chart-empty">No data available for the selected filters.</div>;
  }

  if (chart.kind === 'pie') {
    return (
      <div className="chart-canvas chart-canvas--sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chart.data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
            >
              {chart.data.map((entry, index) => (
                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}`, chart.valueLabel || 'Count']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="chart-canvas chart-canvas--sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chart.data} margin={{ top: 8, right: 12, left: -18, bottom: chart.angle ? 34 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="name"
            interval={0}
            angle={chart.angle || 0}
            textAnchor={chart.angle ? 'end' : 'middle'}
            tick={{ fontSize: 11, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: CHART_AXIS }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}`, chart.valueLabel || 'Count']} />
          <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Reports() {
  const { showToast } = useToast();
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const attendance = useCollection(COLLECTIONS.ATTENDANCE, []);
  const leaves = useCollection(COLLECTIONS.LEAVES, []);

  const [type, setType] = useState('directory');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');

  const report = useMemo(() => {
    const deptMap = new Map(departments.map((department) => [department.id, department]));
    const desigMap = new Map(designations.map((designation) => [designation.id, designation.name]));
    const empMap = new Map(employees.map((employee) => [employee.id, employee]));
    const inDept = (employee) => !departmentId || employee.departmentId === departmentId;
    const inRange = (date) => (!from || date >= from) && (!to || date <= to);
    const enrichedEmployees = employees.map((employee) => ({
      ...employee,
      name: fullName(employee),
      departmentName: deptMap.get(employee.departmentId)?.name || '—',
      designationName: desigMap.get(employee.designationId) || '—',
    }));

    if (type === 'directory') {
      let rows = enrichedEmployees.filter((employee) => inDept(employee) && inRange(employee.joiningDate));
      if (status) rows = rows.filter((employee) => employee.status === status);
      const deptData = departments
        .map((department) => ({
          name: department.name,
          value: rows.filter((employee) => employee.departmentId === department.id).length,
        }))
        .filter((item) => item.value > 0);
      const active = rows.filter((employee) => employee.status === 'Active').length;
      const avgSalary = rows.length
        ? Math.round(rows.reduce((sum, employee) => sum + (employee.salary?.total || 0), 0) / rows.length)
        : 0;
      return {
        rows,
        searchFields: ['name', 'employeeId', 'departmentName', 'designationName', 'email'],
        summary: [
          { label: 'Employees', value: rows.length, tone: 'indigo' },
          { label: 'Active', value: active, tone: 'green' },
          { label: 'Inactive / Resigned', value: rows.length - active, tone: 'red' },
          { label: 'Avg. Monthly CTC', value: formatCurrency(avgSalary), tone: 'blue' },
        ],
        chart: { kind: 'bar', data: deptData, valueLabel: 'Employees' },
        columns: [
          { key: 'employeeId', label: 'Employee ID', className: 'col-id' },
          {
            key: 'name',
            label: 'Employee',
            render: (employee) => (
              <div className="table-user">
                <Avatar name={employee.name} src={employee.avatar} size="sm" />
                <div className="table-user-copy">
                  <strong>{employee.name}</strong>
                  <span>{employee.email}</span>
                </div>
              </div>
            ),
          },
          { key: 'departmentName', label: 'Department' },
          { key: 'designationName', label: 'Designation', className: 'hide-md' },
          { key: 'joiningDate', label: 'Joined', render: (employee) => formatDate(employee.joiningDate) },
          { key: 'status', label: 'Status', render: (employee) => <StatusBadge status={employee.status} /> },
          { key: 'salaryTotal', label: 'Monthly CTC', render: (employee) => formatCurrency(employee.salary?.total) },
        ],
        exportData: {
          headers: ['Employee ID', 'Name', 'Email', 'Department', 'Designation', 'Joined', 'Status', 'Monthly CTC'],
          rows: rows.map((employee) => [
            employee.employeeId,
            employee.name,
            employee.email,
            employee.departmentName,
            employee.designationName,
            employee.joiningDate,
            employee.status,
            employee.salary?.total || 0,
          ]),
        },
      };
    }

    if (type === 'department') {
      const rows = departments
        .filter((department) => !departmentId || department.id === departmentId)
        .filter((department) => !status || department.status === status)
        .map((department) => {
          const members = enrichedEmployees.filter((employee) => employee.departmentId === department.id);
          const activeMembers = members.filter((employee) => employee.status === 'Active').length;
          return {
            ...department,
            headName: empMap.get(department.headEmployeeId)
              ? fullName(empMap.get(department.headEmployeeId))
              : 'Not assigned',
            employees: members.length,
            activeMembers,
            designations: designations.filter((designation) => designation.departmentId === department.id).length,
          };
        });
      const totalEmployees = rows.reduce((sum, row) => sum + row.employees, 0);
      const largest = [...rows].sort((a, b) => b.employees - a.employees)[0];
      return {
        rows,
        searchFields: ['name', 'departmentId', 'headName'],
        summary: [
          { label: 'Departments', value: rows.length, tone: 'indigo' },
          { label: 'Total Employees', value: totalEmployees, tone: 'blue' },
          { label: 'Largest Team', value: largest ? largest.name : '—', tone: 'green' },
          {
            label: 'Avg. Team Size',
            value: rows.length ? Math.round(totalEmployees / rows.length) : 0,
            tone: 'amber',
          },
        ],
        chart: {
          kind: 'bar',
          angle: rows.length > 5 ? -20 : 0,
          valueLabel: 'Employees',
          data: rows.map((row) => ({ name: row.name, value: row.employees })),
        },
        columns: [
          { key: 'departmentId', label: 'Department ID', className: 'col-id' },
          { key: 'name', label: 'Department' },
          { key: 'headName', label: 'Head', className: 'hide-md' },
          { key: 'employees', label: 'Employees' },
          { key: 'activeMembers', label: 'Active' },
          { key: 'designations', label: 'Designations', className: 'hide-sm' },
          { key: 'status', label: 'Status', render: (department) => <StatusBadge status={department.status} /> },
        ],
        exportData: {
          headers: ['Department ID', 'Department', 'Head', 'Employees', 'Active', 'Designations', 'Status'],
          rows: rows.map((row) => [
            row.departmentId,
            row.name,
            row.headName,
            row.employees,
            row.activeMembers,
            row.designations,
            row.status,
          ]),
        },
      };
    }

    if (type === 'attendance') {
      const rows = attendance
        .map((record) => {
          const employee = empMap.get(record.employeeId);
          return {
            ...record,
            employeeName: employee ? fullName(employee) : 'Unknown employee',
            employeeCode: employee?.employeeId || '—',
            departmentName: employee ? deptMap.get(employee.departmentId)?.name || '—' : '—',
            departmentId: employee?.departmentId || '',
          };
        })
        .filter((record) => inRange(record.date) && (!departmentId || record.departmentId === departmentId))
        .filter((record) => !status || record.status === status)
        .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
      const count = (value) => rows.filter((record) => record.status === value).length;
      return {
        rows,
        searchFields: ['employeeName', 'employeeCode', 'departmentName', 'status'],
        summary: [
          { label: 'Records', value: rows.length, tone: 'indigo' },
          { label: 'Present', value: count('Present'), tone: 'green' },
          { label: 'Absent', value: count('Absent'), tone: 'red' },
          { label: 'Late', value: count('Late'), tone: 'amber' },
          { label: 'Half Day', value: count('Half Day'), tone: 'blue' },
        ],
        chart: {
          kind: 'bar',
          valueLabel: 'Records',
          data: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave'].map((value) => ({
            name: value,
            value: count(value),
          })),
        },
        columns: [
          { key: 'employeeCode', label: 'Employee ID', className: 'col-id' },
          { key: 'employeeName', label: 'Employee' },
          { key: 'departmentName', label: 'Department', className: 'hide-md' },
          { key: 'date', label: 'Date', render: (record) => formatDate(record.date) },
          { key: 'checkIn', label: 'Check-in', className: 'hide-sm', render: (record) => record.checkIn || '—' },
          { key: 'checkOut', label: 'Check-out', className: 'hide-sm', render: (record) => record.checkOut || '—' },
          { key: 'workingHours', label: 'Hours', render: (record) => record.workingHours || '—' },
          { key: 'status', label: 'Status', render: (record) => <StatusBadge status={record.status} /> },
        ],
        exportData: {
          headers: ['Employee ID', 'Employee', 'Department', 'Date', 'Check-in', 'Check-out', 'Hours', 'Status'],
          rows: rows.map((record) => [
            record.employeeCode,
            record.employeeName,
            record.departmentName,
            record.date,
            record.checkIn,
            record.checkOut,
            record.workingHours,
            record.status,
          ]),
        },
      };
    }

    if (type === 'leave') {
      const rows = leaves
        .map((leave) => {
          const employee = empMap.get(leave.employeeId);
          return {
            ...leave,
            employeeName: employee ? fullName(employee) : 'Unknown employee',
            employeeCode: employee?.employeeId || '—',
            departmentName: employee ? deptMap.get(employee.departmentId)?.name || '—' : '—',
            departmentId: employee?.departmentId || '',
          };
        })
        .filter(
          (leave) =>
            (!from || leave.endDate >= from) &&
            (!to || leave.startDate <= to) &&
            (!departmentId || leave.departmentId === departmentId),
        )
        .filter((leave) => !status || leave.status === status)
        .sort((a, b) => dayjs(b.appliedDate).valueOf() - dayjs(a.appliedDate).valueOf());
      const count = (value) => rows.filter((leave) => leave.status === value).length;
      return {
        rows,
        searchFields: ['employeeName', 'employeeCode', 'leaveType', 'requestId', 'departmentName'],
        summary: [
          { label: 'Requests', value: rows.length, tone: 'indigo' },
          { label: 'Approved', value: count('Approved'), tone: 'green' },
          { label: 'Pending', value: count('Pending'), tone: 'amber' },
          { label: 'Rejected', value: count('Rejected'), tone: 'red' },
          { label: 'Leave Days', value: rows.reduce((sum, leave) => sum + Number(leave.days || 0), 0), tone: 'blue' },
        ],
        chart: {
          kind: 'pie',
          valueLabel: 'Requests',
          data: ['Approved', 'Pending', 'Rejected']
            .map((value) => ({ name: value, value: count(value) }))
            .filter((item) => item.value > 0),
        },
        columns: [
          { key: 'requestId', label: 'Request ID', className: 'col-id' },
          { key: 'employeeName', label: 'Employee' },
          { key: 'departmentName', label: 'Department', className: 'hide-md' },
          { key: 'leaveType', label: 'Leave Type' },
          { key: 'startDate', label: 'From', render: (leave) => formatDate(leave.startDate) },
          { key: 'endDate', label: 'To', render: (leave) => formatDate(leave.endDate) },
          { key: 'days', label: 'Days', className: 'hide-sm' },
          { key: 'status', label: 'Status', render: (leave) => <StatusBadge status={leave.status} /> },
        ],
        exportData: {
          headers: ['Request ID', 'Employee', 'Department', 'Leave Type', 'From', 'To', 'Days', 'Applied On', 'Status'],
          rows: rows.map((leave) => [
            leave.requestId,
            leave.employeeName,
            leave.departmentName,
            leave.leaveType,
            leave.startDate,
            leave.endDate,
            leave.days,
            leave.appliedDate,
            leave.status,
          ]),
        },
      };
    }

    if (type === 'joining') {
      const base = enrichedEmployees
        .filter((employee) => inDept(employee))
        .filter((employee) => !status || employee.status === status);
      const start = from ? dayjs(from).startOf('month') : dayjs().subtract(11, 'month').startOf('month');
      const end = to ? dayjs(to).endOf('month') : dayjs().endOf('month');
      const months = [];
      let cursor = start;
      let guard = 0;
      while ((cursor.isBefore(end, 'month') || cursor.isSame(end, 'month')) && guard < 36) {
        months.push(cursor);
        cursor = cursor.add(1, 'month');
        guard += 1;
      }
      const rows = months.map((month) => {
        const joiners = base.filter((employee) => dayjs(employee.joiningDate).isSame(month, 'month'));
        return {
          month: month.format('MMM YYYY'),
          count: joiners.length,
          employees: joiners.map((employee) => employee.name).join(', ') || '—',
        };
      });
      const total = rows.reduce((sum, row) => sum + row.count, 0);
      const best = [...rows].sort((a, b) => b.count - a.count)[0];
      return {
        rows,
        searchFields: ['month', 'employees'],
        summary: [
          { label: 'Total Joiners', value: total, tone: 'indigo' },
          { label: 'Months Covered', value: rows.length, tone: 'blue' },
          { label: 'Avg. per Month', value: rows.length ? (total / rows.length).toFixed(1) : 0, tone: 'green' },
          { label: 'Best Month', value: best && best.count ? best.month : '—', tone: 'amber' },
        ],
        chart: {
          kind: 'bar',
          angle: -25,
          valueLabel: 'New joiners',
          data: rows.map((row) => ({ name: row.month, value: row.count })),
        },
        columns: [
          { key: 'month', label: 'Month' },
          { key: 'count', label: 'New Joiners' },
          { key: 'employees', label: 'Employees' },
        ],
        exportData: {
          headers: ['Month', 'New Joiners', 'Employees'],
          rows: rows.map((row) => [row.month, row.count, row.employees]),
        },
      };
    }

    // Employee status report
    const base = enrichedEmployees
      .filter((employee) => inDept(employee) && inRange(employee.joiningDate))
      .filter((employee) => !status || employee.status === status);
    const statuses = ['Active', 'Inactive', 'Resigned'];
    const rows = statuses.map((value) => ({
      status: value,
      count: base.filter((employee) => employee.status === value).length,
      percentage: base.length
        ? `${Math.round((base.filter((employee) => employee.status === value).length / base.length) * 100)}%`
        : '0%',
    }));
    return {
      rows,
      searchFields: ['status'],
      summary: [
        { label: 'Employees', value: base.length, tone: 'indigo' },
        ...statuses.map((value, index) => ({
          label: value,
          value: base.filter((employee) => employee.status === value).length,
          tone: ['green', 'amber', 'red'][index],
        })),
      ],
      chart: {
        kind: 'pie',
        valueLabel: 'Employees',
        data: rows.filter((row) => row.count > 0).map((row) => ({ name: row.status, value: row.count })),
      },
      columns: [
        { key: 'status', label: 'Employment Status', render: (row) => <StatusBadge status={row.status} /> },
        { key: 'count', label: 'Employees' },
        { key: 'percentage', label: 'Share' },
      ],
      exportData: {
        headers: ['Employment Status', 'Employees', 'Share'],
        rows: rows.map((row) => [row.status, row.count, row.percentage]),
      },
    };
  }, [type, employees, departments, designations, attendance, leaves, from, to, departmentId, status]);

  const table = useTableControls(report.rows, {
    searchFields: report.searchFields,
    pageSize: 8,
  });

  const resetFilters = () => {
    setFrom('');
    setTo('');
    setDepartmentId('');
    setStatus('');
    table.setSearch('');
  };

  const handleExport = () => {
    if (!report.exportData.rows.length) return;
    exportToCSV(`${type}-report`, report.exportData.headers, report.exportData.rows);
    showToast('Report exported to CSV.');
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate organisation reports with date, department and status filters."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button icon={FiDownload} onClick={handleExport} disabled={!report.exportData.rows.length}>
            Export CSV
          </Button>
        }
      />

      <div className="report-tabs">
        {REPORTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`report-tab ${type === item.id ? 'is-active' : ''}`}
              onClick={() => {
                setType(item.id);
                setStatus('');
                table.setSearch('');
              }}
            >
              <Icon /> <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <section className="ui-card report-filter-card">
        <div className="report-filter-grid">
          <div className="field">
            <label className="field-label" htmlFor="report-from">From date</label>
            <input
              id="report-from"
              type="date"
              className="field-input"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="report-to">To date</label>
            <input
              id="report-to"
              type="date"
              className="field-input"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="report-department">Department</label>
            <select
              id="report-department"
              className="field-input field-select"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="report-status">
              {type === 'department' ? 'Department status' : type === 'attendance' ? 'Attendance status' : type === 'leave' ? 'Leave status' : 'Employee status'}
            </label>
            <select
              id="report-status"
              className="field-input field-select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">All</option>
              {(STATUS_OPTIONS[type] || []).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="report-filter-actions">
            <Button variant="outline" icon={FiBarChart2} onClick={resetFilters}>Reset filters</Button>
          </div>
        </div>
        <p className="report-filter-hint">
          {type === 'joining' && !from && !to
            ? 'Showing the last 12 months of joinings by default.'
            : 'Leave dates empty to include all records. Filters combine with the selected report.'}
        </p>
      </section>

      <div className="summary-strip summary-strip--report">
        {report.summary.map((item) => (
          <div key={item.label} className={`summary-chip summary-chip--${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <section className="ui-card report-chart-card">
        <div className="card-head">
          <div>
            <h3 className="card-title">
              {REPORTS.find((item) => item.id === type)?.label} Overview
            </h3>
            <p className="card-subtitle">Visual summary of the filtered report data.</p>
          </div>
        </div>
        <ReportChart chart={report.chart} />
      </section>

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <div className="table-title-inline">
              <FiAward />
              <span>{REPORTS.find((item) => item.id === type)?.label} data</span>
            </div>
          </div>
          <p className="table-count">{table.total} row{table.total === 1 ? '' : 's'}</p>
        </div>
        <DataTable
          columns={report.columns}
          data={table.pageItems}
          emptyTitle="No report data"
          emptyMessage="Adjust the date range, department or status filters and try again."
        />
        <Pagination
          page={table.page}
          totalPages={table.totalPages}
          total={table.total}
          pageSize={table.pageSize}
          onChange={table.setPage}
        />
      </section>
    </div>
  );
}
