import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFileText,
  FiFilter,
  FiPlus,
  FiTrash2,
  FiX,
  FiXCircle,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { useCollection } from '../../hooks/useCollection';
import { useFakeLoading } from '../../hooks/useFakeLoading';
import { useTableControls } from '../../hooks/useTableControls';
import { COLLECTIONS } from '../../services/db';
import { leaveService } from '../../services/leaveService';
import { notificationService } from '../../services/notificationService';
import { formatDate, formatDateTime, fullName } from '../../utils/helpers';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LeaveForm from '../../components/forms/LeaveForm';
import Avatar from '../../components/common/Avatar';

export default function LeaveList() {
  const { user, canManage } = useAuth();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const leaves = useCollection(COLLECTIONS.LEAVES, []);
  const employees = useCollection(COLLECTIONS.EMPLOYEES, []);
  const departments = useCollection(COLLECTIONS.DEPARTMENTS, []);
  const loading = useFakeLoading(240);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [action, setAction] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'apply') {
      setFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('action');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const departmentMap = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  );

  const enriched = useMemo(
    () =>
      leaves
        .filter((leave) => canManage || leave.employeeId === user?.employeeId)
        .map((leave) => {
          const employee = employeeMap.get(leave.employeeId);
          return {
            ...leave,
            employeeName: employee ? fullName(employee) : 'Unknown employee',
            employeeCode: employee?.employeeId || '—',
            employeeAvatar: employee?.avatar || '',
            departmentName: employee ? departmentMap.get(employee.departmentId) || '—' : '—',
          };
        })
        .sort((a, b) => dayjs(b.appliedDate).valueOf() - dayjs(a.appliedDate).valueOf()),
    [leaves, canManage, user, employeeMap, departmentMap],
  );

  const stats = useMemo(() => leaveService.stats(enriched), [enriched]);

  const filtered = useMemo(
    () =>
      enriched.filter(
        (leave) =>
          (!statusFilter || leave.status === statusFilter) &&
          (!employeeFilter || leave.employeeId === employeeFilter) &&
          (!typeFilter || leave.leaveType === typeFilter),
      ),
    [enriched, statusFilter, employeeFilter, typeFilter],
  );

  const table = useTableControls(filtered, {
    searchFields: ['employeeName', 'employeeCode', 'leaveType', 'reason', 'requestId', 'departmentName'],
    pageSize: 8,
    initialSort: { key: 'appliedDate', dir: 'desc' },
  });

  const handleApply = async (payload) => {
    const employee = employeeMap.get(payload.employeeId);
    const created = leaveService.create(payload);
    notificationService.add({
      title: 'Leave application submitted',
      message: `${employee ? fullName(employee) : 'An employee'} applied for ${created.leaveType} (${created.days} day${created.days === 1 ? '' : 's'}).`,
      type: 'info',
    });
    showToast(`Leave request ${created.requestId} submitted successfully.`);
    setFormOpen(false);
  };

  const handleAction = () => {
    if (!action) return;
    const { type, leave } = action;
    if (type === 'cancel') {
      leaveService.remove(leave.id);
      showToast(`Leave request ${leave.requestId} was cancelled.`, 'info');
      setAction(null);
      return;
    }
    const approve = type === 'approve';
    leaveService.setStatus(
      leave.id,
      approve ? 'Approved' : 'Rejected',
      user?.name || 'HR',
      approve ? 'Approved from the leave register.' : 'Rejected from the leave register.',
    );
    notificationService.add({
      title: approve ? 'Leave approved' : 'Leave rejected',
      message: `${leave.employeeName}'s ${leave.leaveType} request (${leave.requestId}) was ${approve ? 'approved' : 'rejected'}.`,
      type: approve ? 'success' : 'warning',
    });
    showToast(
      `${leave.employeeName}'s leave request was ${approve ? 'approved' : 'rejected'}.`,
      approve ? 'success' : 'warning',
    );
    setAction(null);
    if (viewing?.id === leave.id) setViewing(null);
  };

  const columns = [
    { key: 'requestId', label: 'Request ID', sortable: true, className: 'col-id' },
    {
      key: 'employeeName',
      label: 'Employee',
      sortable: true,
      render: (leave) => (
        <div className="table-user">
          <Avatar name={leave.employeeName} src={leave.employeeAvatar} size="sm" />
          <div className="table-user-copy">
            <strong>{leave.employeeName}</strong>
            <span>{leave.departmentName}</span>
          </div>
        </div>
      ),
    },
    { key: 'leaveType', label: 'Leave Type', sortable: true },
    {
      key: 'startDate',
      label: 'Duration',
      render: (leave) => (
        <div className="stacked-cell">
          <strong>{formatDate(leave.startDate, 'DD MMM')} – {formatDate(leave.endDate, 'DD MMM YYYY')}</strong>
          <span>{leave.days} day{leave.days === 1 ? '' : 's'}</span>
        </div>
      ),
    },
    {
      key: 'appliedDate',
      label: 'Applied On',
      sortable: true,
      className: 'hide-md',
      render: (leave) => formatDate(leave.appliedDate),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (leave) => <StatusBadge status={leave.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'col-actions',
      render: (leave) => {
        const own = leave.employeeId === user?.employeeId;
        return (
          <div className="row-actions">
            <button type="button" className="icon-btn icon-btn--sm" title="View details" onClick={() => setViewing(leave)}>
              <FiEye />
            </button>
            {canManage && leave.status === 'Pending' ? (
              <>
                <button
                  type="button"
                  className="icon-btn icon-btn--sm icon-btn--success"
                  title="Approve leave"
                  onClick={() => setAction({ type: 'approve', leave })}
                >
                  <FiCheck />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--sm icon-btn--danger"
                  title="Reject leave"
                  onClick={() => setAction({ type: 'reject', leave })}
                >
                  <FiX />
                </button>
              </>
            ) : null}
            {leave.status === 'Pending' && (own || canManage) ? (
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                title="Cancel request"
                onClick={() => setAction({ type: 'cancel', leave })}
              >
                <FiTrash2 />
              </button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const canChooseEmployee = canManage;
  const formEmployees = canManage
    ? employees
    : employees.filter((employee) => employee.id === user?.employeeId);

  const actionCopy = action
    ? {
        approve: {
          title: 'Approve leave request?',
          message: `Approve ${action.leave.employeeName}'s ${action.leave.leaveType} request for ${formatDate(action.leave.startDate)} to ${formatDate(action.leave.endDate)}?`,
          label: 'Approve',
          variant: 'success',
        },
        reject: {
          title: 'Reject leave request?',
          message: `Reject ${action.leave.employeeName}'s ${action.leave.leaveType} request? The employee will see the updated status immediately.`,
          label: 'Reject',
          variant: 'danger',
        },
        cancel: {
          title: 'Cancel leave request?',
          message: `This will withdraw ${action.leave.employeeName}'s pending ${action.leave.leaveType} request (${action.leave.requestId}).`,
          label: 'Withdraw Request',
          variant: 'danger',
        },
      }[action.type]
    : null;

  return (
    <div>
      <PageHeader
        title="Leave Management"
        subtitle={
          canManage
            ? 'Review leave applications, approve requests and monitor leave balances.'
            : 'Apply for leave and track the status of your requests.'
        }
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Leave Management' }]}
        actions={
          <Button icon={FiPlus} onClick={() => setFormOpen(true)}>
            Apply for Leave
          </Button>
        }
      />

      <div className="stat-grid stat-grid--5">
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--indigo"><FiFileText /></span>
          <div className="stat-copy">
            <span className="stat-label">Total Requests</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--amber"><FiClock /></span>
          <div className="stat-copy">
            <span className="stat-label">Pending Approval</span>
            <strong className="stat-value">{stats.pending}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--green"><FiCheckCircle /></span>
          <div className="stat-copy">
            <span className="stat-label">Approved</span>
            <strong className="stat-value">{stats.approved}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--red"><FiXCircle /></span>
          <div className="stat-copy">
            <span className="stat-label">Rejected</span>
            <strong className="stat-value">{stats.rejected}</strong>
          </div>
        </div>
        <div className="ui-card stat-card stat-card--sm">
          <span className="stat-icon stat-icon--blue"><FiCalendar /></span>
          <div className="stat-copy">
            <span className="stat-label">Leave Days</span>
            <strong className="stat-value">{stats.days}</strong>
          </div>
        </div>
      </div>

      {canManage && stats.pending > 0 ? (
        <div className="info-banner info-banner--wide">
          <span><FiClock /> {stats.pending} leave request{stats.pending === 1 ? '' : 's'} awaiting your review.</span>
          <button type="button" className="link-btn" onClick={() => setStatusFilter('Pending')}>Show pending</button>
        </div>
      ) : null}

      <section className="ui-card">
        <div className="table-toolbar">
          <div className="table-toolbar-main">
            <SearchBar
              value={table.search}
              onChange={table.setSearch}
              placeholder="Search by employee, request ID or leave type..."
            />
            <div className="filters">
              <div className="filter-control">
                <FiFilter />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by leave status"
                >
                  <option value="">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              {canManage ? (
                <div className="filter-control">
                  <select
                    value={employeeFilter}
                    onChange={(event) => setEmployeeFilter(event.target.value)}
                    aria-label="Filter by employee"
                  >
                    <option value="">All employees</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="filter-control">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter by leave type"
                >
                  <option value="">All leave types</option>
                  {(settings.leaveTypes || []).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <p className="table-count">{table.total} request{table.total === 1 ? '' : 's'}</p>
        </div>

        <DataTable
          columns={columns}
          data={table.pageItems}
          loading={loading}
          sort={table.sort}
          onSort={table.onSort}
          emptyTitle="No leave requests found"
          emptyMessage="Try adjusting the filters, or submit a new leave application."
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
        <LeaveForm
          employees={formEmployees}
          currentEmployeeId={user?.employeeId}
          canChooseEmployee={canChooseEmployee}
          leaveTypes={settings.leaveTypes || []}
          onClose={() => setFormOpen(false)}
          onSave={handleApply}
        />
      ) : null}

      {viewing ? (
        <Modal
          title={`Leave Request ${viewing.requestId}`}
          subtitle={`${viewing.employeeName} · ${viewing.departmentName}`}
          onClose={() => setViewing(null)}
          size="md"
          footer={
            <>
              <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              {canManage && viewing.status === 'Pending' ? (
                <>
                  <Button variant="danger" icon={FiX} onClick={() => setAction({ type: 'reject', leave: viewing })}>
                    Reject
                  </Button>
                  <Button variant="success" icon={FiCheck} onClick={() => setAction({ type: 'approve', leave: viewing })}>
                    Approve
                  </Button>
                </>
              ) : null}
            </>
          }
        >
          <div className="detail-block">
            <div className="leave-status-head">
              <div>
                <span className="info-label">Current Status</span>
                <StatusBadge status={viewing.status} />
              </div>
              <div>
                <span className="info-label">Applied On</span>
                <strong>{formatDate(viewing.appliedDate)}</strong>
              </div>
              <div>
                <span className="info-label">Number of Days</span>
                <strong>{viewing.days} day{viewing.days === 1 ? '' : 's'}</strong>
              </div>
            </div>
            <div className="info-grid">
              <div className="info-item"><span className="info-label">Leave Type</span><span className="info-value">{viewing.leaveType}</span></div>
              <div className="info-item"><span className="info-label">Employee ID</span><span className="info-value">{viewing.employeeCode}</span></div>
              <div className="info-item"><span className="info-label">Start Date</span><span className="info-value">{formatDate(viewing.startDate)}</span></div>
              <div className="info-item"><span className="info-label">End Date</span><span className="info-value">{formatDate(viewing.endDate)}</span></div>
              <div className="info-item"><span className="info-label">Approved By</span><span className="info-value">{viewing.approvedBy || '—'}</span></div>
              <div className="info-item"><span className="info-label">Action Date</span><span className="info-value">{viewing.approvedAt ? formatDateTime(viewing.approvedAt) : '—'}</span></div>
            </div>
            <div className="detail-section">
              <span className="info-label">Reason</span>
              <p className="detail-description">{viewing.reason}</p>
            </div>
            {viewing.comment ? (
              <div className="detail-section">
                <span className="info-label">HR Comment</span>
                <p className="detail-description">{viewing.comment}</p>
              </div>
            ) : null}
            {viewing.document ? (
              <div className="detail-section">
                <span className="info-label">Supporting Document</span>
                <a href={viewing.document} target="_blank" rel="noreferrer" className="text-action">
                  <FiFileText /> View document
                </a>
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}

      <ConfirmDialog
        open={Boolean(action)}
        title={actionCopy?.title || ''}
        message={actionCopy?.message || ''}
        confirmLabel={actionCopy?.label || 'Confirm'}
        variant={actionCopy?.variant || 'danger'}
        onCancel={() => setAction(null)}
        onConfirm={handleAction}
      />
    </div>
  );
}
