import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiBriefcase, FiEdit2, FiEye, FiFilter, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { departmentService } from '../../services/departmentService';
import { notificationService } from '../../services/notificationService';
import { fullName } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DepartmentForm from '../../components/forms/DepartmentForm';
import Avatar from '../../components/common/Avatar';

export default function DepartmentList() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const loading = useFakeLoading(240);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
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
      departments.map((department) => {
        const head = employees.find((employee) => employee.id === department.headEmployeeId);
        return {
          ...department,
          headName: head ? fullName(head) : 'Not assigned',
          headAvatar: head?.avatar || '',
          employeeCount: employees.filter((employee) => employee.departmentId === department.id).length,
          designationCount: designations.filter((designation) => designation.departmentId === department.id).length,
          activeCount: employees.filter(
            (employee) => employee.departmentId === department.id && employee.status === 'Active',
          ).length,
        };
      }),
    [departments, employees, designations],
  );

  const filtered = useMemo(
    () => enriched.filter((department) => !statusFilter || department.status === statusFilter),
    [enriched, statusFilter],
  );

  const table = useTableControls(filtered, {
    searchFields: ['name', 'departmentId', 'description', 'headName'],
    pageSize: 8,
    initialSort: { key: 'departmentId', dir: 'asc' },
  });

  const handleSave = async (payload) => {
    if (editing) {
      departmentService.update(editing.id, payload);
      showToast(`${payload.name} was updated.`);
    } else {
      departmentService.create(payload);
      notificationService.add({
        title: 'Department created',
        message: `${payload.name} was added to the organisation structure.`,
        type: 'success',
      });
      showToast(`${payload.name} was created.`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    try {
      departmentService.remove(deleting.id);
      showToast(`${deleting.name} was deleted.`, 'info');
      setDeleting(null);
    } catch (error) {
      showToast(error.message, 'error');
      setDeleting(null);
    }
  };

  const columns = [
    { key: 'departmentId', label: 'Department ID', sortable: true, className: 'col-id' },
    {
      key: 'name',
      label: 'Department',
      sortable: true,
      render: (department) => (
        <div className="table-user">
          <span className="table-icon"><FiBriefcase /></span>
          <div className="table-user-copy">
            <strong>{department.name}</strong>
            <span>{department.description || 'No description'}</span>
          </div>
        </div>
      ),
    },
    { key: 'headName', label: 'Department Head', sortable: true, className: 'hide-md' },
    {
      key: 'employeeCount',
      label: 'Employees',
      sortable: true,
      render: (department) => (
        <span className="count-pill"><FiUsers /> {department.employeeCount}</span>
      ),
    },
    {
      key: 'designationCount',
      label: 'Designations',
      sortable: true,
      className: 'hide-sm',
      render: (department) => department.designationCount,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (department) => <StatusBadge status={department.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'col-actions',
      render: (department) => (
        <div className="row-actions">
          <button type="button" className="icon-btn icon-btn--sm" title="View department" onClick={() => setViewing(department)}>
            <FiEye />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            title="Edit department"
            onClick={() => {
              setEditing(department);
              setFormOpen(true);
            }}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm icon-btn--danger"
            title="Delete department"
            onClick={() => setDeleting(department)}
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  const departmentEmployees = viewing
    ? employees.filter((employee) => employee.departmentId === viewing.id)
    : [];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Define your organisation structure and track headcount across teams."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Departments' }]}
        actions={
          <Button
            icon={FiPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Department
          </Button>
        }
      />

      <div className="stat-grid stat-grid--3">
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--indigo"><FiBriefcase /></span>
          <div className="stat-copy">
            <span className="stat-label">Total Departments</span>
            <strong className="stat-value">{departments.length}</strong>
            <span className="stat-foot">across the organisation</span>
          </div>
        </div>
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--green"><FiUsers /></span>
          <div className="stat-copy">
            <span className="stat-label">Assigned Employees</span>
            <strong className="stat-value">{employees.filter((employee) => employee.departmentId).length}</strong>
            <span className="stat-foot">of {employees.length} total employees</span>
          </div>
        </div>
        <div className="ui-card stat-card">
          <span className="stat-icon stat-icon--blue"><FiFilter /></span>
          <div className="stat-copy">
            <span className="stat-label">Active Departments</span>
            <strong className="stat-value">{departments.filter((department) => department.status === 'Active').length}</strong>
            <span className="stat-foot">available for assignment</span>
          </div>
        </div>
      </div>

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <SearchBar
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search departments by name, ID or head..."
            />
            <div className="filters">
              <div className="filter-control">
                <FiFilter />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter departments by status"
                >
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <p className="table-count">{table.total} department{table.total === 1 ? '' : 's'}</p>
        </div>

        <DataTable
          columns={columns}
          data={table.pageItems}
          loading={loading}
          sort={table.sort}
          onSort={table.onSort}
          emptyTitle="No departments found"
          emptyMessage="Create a department to start organising employees."
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
        <DepartmentForm
          department={editing}
          employees={employees}
          nextDepartmentId={departmentService.nextDepartmentId()}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete department?"
        message={
          deleting
            ? `You are about to delete ${deleting.name}. A department can only be deleted when no employees or designations are assigned to it.`
            : ''
        }
        confirmLabel="Delete Department"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      {viewing ? (
        <Modal
          title={viewing.name}
          subtitle={`${viewing.departmentId} · ${viewing.employeeCount} employees · ${viewing.designationCount} designations`}
          onClose={() => setViewing(null)}
          size="md"
          footer={<Button variant="outline" onClick={() => setViewing(null)}>Close</Button>}
        >
          <div className="detail-block">
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Department Head</span><span className="info-value">{viewing.headName}</span></div>
              <div className="info-item"><span className="info-label">Status</span><span className="info-value"><StatusBadge status={viewing.status} /></span></div>
              <div className="info-item"><span className="info-label">Active Employees</span><span className="info-value">{viewing.activeCount}</span></div>
              <div className="info-item"><span className="info-label">Total Employees</span><span className="info-value">{viewing.employeeCount}</span></div>
            </div>
            <p className="detail-description">{viewing.description || 'No description provided for this department.'}</p>
          </div>

          <h4 className="detail-subtitle">Employees in this department</h4>
          {departmentEmployees.length ? (
            <div className="list-stack list-stack--dense">
              {departmentEmployees.map((employee) => (
                <div key={employee.id} className="list-row">
                  <Avatar name={fullName(employee)} src={employee.avatar} size="sm" />
                  <div className="list-copy">
                    <strong>{fullName(employee)}</strong>
                    <span>{employee.employeeId} · {employee.email}</span>
                  </div>
                  <StatusBadge status={employee.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-note">No employees are assigned to this department yet.</p>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
