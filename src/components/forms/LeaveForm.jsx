import { useState } from 'react';
import { FiSend } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import TextareaField from '../common/TextareaField';
import { getDaysBetween, todayISO } from '../../utils/helpers';

export default function LeaveForm({
  employees = [],
  currentEmployeeId,
  canChooseEmployee = false,
  leaveTypes = [],
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    employeeId: canChooseEmployee ? '' : currentEmployeeId || '',
    leaveType: '',
    startDate: todayISO(),
    endDate: todayISO(),
    reason: '',
    document: '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const days = getDaysBetween(form.startDate, form.endDate);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.employeeId) next.employeeId = 'Employee is required.';
    if (!form.leaveType) next.leaveType = 'Leave type is required.';
    if (!form.startDate) next.startDate = 'Start date is required.';
    if (!form.endDate) next.endDate = 'End date is required.';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      next.endDate = 'End date cannot be before the start date.';
    }
    if (!form.reason.trim() || form.reason.trim().length < 10) {
      next.reason = 'Please provide a reason of at least 10 characters.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSave({
        employeeId: form.employeeId,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
        document: form.document.trim(),
      });
    } catch (error) {
      setFormError(error.message || 'Unable to submit the leave request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Apply for Leave"
      subtitle="Submit a leave request. HR and Admin can approve or reject it from the leave register."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="leave-form" icon={FiSend} loading={saving}>
            Submit Request
          </Button>
        </>
      }
    >
      <form id="leave-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="form-alert span-2">{formError}</div> : null}
        <SelectField
          label="Employee"
          required
          className="span-2"
          value={form.employeeId}
          onChange={(event) => update('employeeId', event.target.value)}
          options={employees.map((employee) => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
          }))}
          placeholder={canChooseEmployee ? 'Select employee' : undefined}
          error={errors.employeeId}
          disabled={!canChooseEmployee}
        />
        <SelectField
          label="Leave Type"
          required
          value={form.leaveType}
          onChange={(event) => update('leaveType', event.target.value)}
          options={leaveTypes.map((type) => ({ value: type, label: type }))}
          placeholder="Select leave type"
          error={errors.leaveType}
        />
        <div className="info-banner">
          <span>Number of days</span>
          <strong>{days || 0} day{days === 1 ? '' : 's'}</strong>
        </div>
        <InputField
          label="Start Date"
          type="date"
          required
          value={form.startDate}
          onChange={(event) => update('startDate', event.target.value)}
          error={errors.startDate}
        />
        <InputField
          label="End Date"
          type="date"
          required
          min={form.startDate}
          value={form.endDate}
          onChange={(event) => update('endDate', event.target.value)}
          error={errors.endDate}
        />
        <TextareaField
          label="Reason"
          className="span-2"
          required
          value={form.reason}
          onChange={(event) => update('reason', event.target.value)}
          placeholder="Briefly explain the reason for your leave"
          error={errors.reason}
          rows={3}
        />
        <InputField
          label="Supporting Document URL"
          className="span-2"
          value={form.document}
          onChange={(event) => update('document', event.target.value)}
          placeholder="Optional link to a medical certificate or document"
          hint="Optional. A document link can help HR review the request faster."
        />
      </form>
    </Modal>
  );
}
