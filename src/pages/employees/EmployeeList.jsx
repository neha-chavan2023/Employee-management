import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiDownload, FiEdit2, FiEye, FiFilter, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { employeeService } from '../../services/employeeService';
import { notificationService } from '../../services/notificationService';
import { exportToCSV, formatDate, fullName } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmployeeForm from '../../components/forms/EmployeeForm';

export default function EmployeeList() {
  const { canManage } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const loading = useFakeLoading(260);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditing(null);
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const enriched = useMemo(
    () =>
      employees.map((employee) => ({
        ...employee,
        name: fullName(employee),
        departmentName:
          departments.find((department) => department.id === employee.departmentId)?.name || '—',
        designationName:
          designations.find((designation) => designation.id === employee.designationId)?.name || '—',
      })),
    [employees, departments, designations],
  );

  const filtered = useMemo(
    () =>
      enriched.filter(
        (employee) =>
          (!departmentFilter || employee.departmentId === departmentFilter) &&
          (!designationFilter || employee.designationId === designationFilter) &&
          (!statusFilter || employee.status === statusFilter),
      ),
    [enriched, departmentFilter, designationFilter, statusFilter],
  );

  const table = useTableControls(filtered, {
    searchFields: ['name', 'email', 'employeeId', 'phone', 'departmentName', 'designationName'],
    pageSize: 8,
    initialSort: { key: 'employeeId', dir: 'asc' },
  });

  const designationOptions = designations
    .filter((designation) => !departmentFilter || designation.departmentId === departmentFilter)
    .map((designation) => ({ value: designation.id, label: designation.name }));

  const hasFilters = Boolean(departmentFilter || designationFilter || statusFilter || table.search);

  const clearFilters = () => {
    setDepartmentFilter('');
    setDesignationFilter('');
    setStatusFilter('');
    table.setSearch('');
  };

  const handleSave = async (payload) => {
    if (editing) {
      employeeService.update(editing.id, payload);
      notificationService.add({
        title: 'Employee updated',
        message: `${payload.firstName} ${payload.lastName}'s profile was updated.`,
        type: 'info',
      });
      showToast(`${payload.firstName} ${payload.lastName}'s profile was updated.`);
    } else {
      const created = employeeService.create(payload);
      notificationService.add({
        title: 'New employee added',
        message: `${payload.firstName} ${payload.lastName} joined as ${created.employeeId}.`,
        type: 'success',
      });
      showToast(`${payload.firstName} ${payload.lastName} was added successfully.`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    employeeService.remove(deleting.id);
    notificationService.add({
      title: 'Employee removed',
      message: `${fullName(deleting)} (${deleting.employeeId}) was removed from the directory.`,
      type: 'warning',
    });
    showToast(`${fullName(deleting)} was removed.`, 'info');
    setDeleting(null);
  };

  const handleExport = () => {
    exportToCSV(
      'employee-directory',
      ['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Joining Date', 'Employment Type', 'Status', 'Monthly CTC (INR)', 'City', 'State'],
      table.sorted.map((employee) => [
        employee.employeeId,
        employee.name,
        employee.email,
        employee.phone,
        employee.departmentName,
        employee.designationName,
        employee.joiningDate,
        employee.employmentType,
        employee.status,
        employee.salary?.total || 0,
        employee.city,
        employee.state,
      ]),
    );
    showToast('Employee directory exported to CSV.');
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID', sortable: true, className: 'col-id' },
    {
      key: 'name',
      label: 'Employee',
      sortable: true,
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
    {
      key: 'phone',
      label: 'Phone',
      className: 'hide-lg',
      render: (employee) => (employee.phone ? `+91 ${employee.phone}` : '—'),
    },
    { key: 'departmentName', label: 'Department', sortable: true },
    { key: 'designationName', label: 'Designation', sortable: true, className: 'hide-md' },
    {
      key: 'joiningDate',
      label: 'Joining Date',
      sortable: true,
      className: 'hide-sm',
      render: (employee) => formatDate(employee.joiningDate),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (employee) => <StatusBadge status={employee.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'col-actions',
      render: (employee) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            title="View profile"
            onClick={() => navigate(`/employees/${employee.id}`)}
          >
            <FiEye />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            title="Edit employee"
            onClick={() => {
              setEditing(employee);
              setFormOpen(true);
            }}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm icon-btn--danger"
            title="Delete employee"
            onClick={() => setDeleting(employee)}
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employees"
        subtitle="Manage employee profiles, roles, salary structures and employment status."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Employees' }]}
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
                Add Employee
              </Button>
            ) : null}
          </>
        }
      />

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <SearchBar
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search by name, ID, email or phone..."
            />
            <div className="filters">
              <div className="filter-control">
                <FiFilter />
                <select
                  value={departmentFilter}
                  onChange={(event) => {
                    setDepartmentFilter(event.target.value);
                    setDesignationFilter('');
                  }}
                  aria-label="Filter by department"
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-control">
                <select
                  value={designationFilter}
                  onChange={(event) => setDesignationFilter(event.target.value)}
                  aria-label="Filter by designation"
                >
                  <option value="">All designations</option>
                  {designationOptions.map((designation) => (
                    <option key={designation.value} value={designation.value}>{designation.label}</option>
                  ))}
                </select>
              </div>
              <div className="filter-control">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
              {hasFilters ? (
                <button type="button" className="link-btn" onClick={clearFilters}>Clear filters</button>
              ) : null}
            </div>
          </div>
          <p className="table-count">
            {table.total} employee{table.total === 1 ? '' : 's'}
            {hasFilters ? ' matching your filters' : ''}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={table.pageItems}
          loading={loading}
          sort={table.sort}
          onSort={table.onSort}
          emptyTitle="No employees found"
          emptyMessage="Try a different search or clear the filters, or add a new employee."
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
        <EmployeeForm
          employee={editing}
          employees={employees}
          departments={departments}
          designations={designations}
          nextEmployeeId={employeeService.nextEmployeeId()}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete employee?"
        message={
          deleting
            ? `This will permanently remove ${fullName(deleting)} (${deleting.employeeId}) along with their attendance and leave records. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Employee"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
