import { useMemo, useState } from 'react';
import { FiAward, FiEdit2, FiFilter, FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { designationService } from '../../services/designationService';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DesignationForm from '../../components/forms/DesignationForm';

export default function DesignationList() {
  const { showToast } = useToast();
  const designations = useCollection(COLLECTIONS.DESIGNATIONS, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const loading = useFakeLoading(240);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const enriched = useMemo(
    () =>
      designations.map((designation) => ({
        ...designation,
        departmentName:
          departments.find((department) => department.id === designation.departmentId)?.name || '—',
        employeeCount: employees.filter((employee) => employee.designationId === designation.id).length,
      })),
    [designations, departments, employees],
  );

  const filtered = useMemo(
    () =>
      enriched.filter(
        (designation) =>
          (!departmentFilter || designation.departmentId === departmentFilter) &&
          (!statusFilter || designation.status === statusFilter),
      ),
    [enriched, departmentFilter, statusFilter],
  );

  const table = useTableControls(filtered, {
    searchFields: ['name', 'designationId', 'description', 'departmentName'],
    pageSize: 10,
    initialSort: { key: 'designationId', dir: 'asc' },
  });

  const handleSave = async (payload) => {
    if (editing) {
      designationService.update(editing.id, payload);
      showToast(`${payload.name} was updated.`);
    } else {
      designationService.create(payload);
      showToast(`${payload.name} was created.`);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    try {
      designationService.remove(deleting.id);
      showToast(`${deleting.name} was deleted.`, 'info');
      setDeleting(null);
    } catch (error) {
      showToast(error.message, 'error');
      setDeleting(null);
    }
  };

  const columns = [
    { key: 'designationId', label: 'Designation ID', sortable: true, className: 'col-id' },
    {
      key: 'name',
      label: 'Designation',
      sortable: true,
      render: (designation) => (
        <div className="table-user">
          <span className="table-icon"><FiAward /></span>
          <div className="table-user-copy">
            <strong>{designation.name}</strong>
            <span>{designation.description || 'No description'}</span>
          </div>
        </div>
      ),
    },
    { key: 'departmentName', label: 'Department', sortable: true },
    {
      key: 'employeeCount',
      label: 'Employees',
      sortable: true,
      render: (designation) => (
        <span className="count-pill"><FiUsers /> {designation.employeeCount}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (designation) => <StatusBadge status={designation.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'col-actions',
      render: (designation) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            title="Edit designation"
            onClick={() => {
              setEditing(designation);
              setFormOpen(true);
            }}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm icon-btn--danger"
            title="Delete designation"
            onClick={() => setDeleting(designation)}
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
        title="Designations"
        subtitle="Maintain the job titles used across departments and employee profiles."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Designations' }]}
        actions={
          <Button
            icon={FiPlus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Designation
          </Button>
        }
      />

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <SearchBar
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search designations by name, ID or department..."
            />
            <div className="filters">
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
              <div className="filter-control">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <p className="table-count">{table.total} designation{table.total === 1 ? '' : 's'}</p>
        </div>

        <DataTable
          columns={columns}
          data={table.pageItems}
          loading={loading}
          sort={table.sort}
          onSort={table.onSort}
          emptyTitle="No designations found"
          emptyMessage="Create a designation and map it to a department."
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
        <DesignationForm
          designation={editing}
          departments={departments}
          nextDesignationId={designationService.nextDesignationId()}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete designation?"
        message={
          deleting
            ? `You are about to delete ${deleting.name}. A designation can only be deleted when no employees are assigned to it.`
            : ''
        }
        confirmLabel="Delete Designation"
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
