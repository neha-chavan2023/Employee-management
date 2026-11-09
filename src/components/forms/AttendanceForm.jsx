import { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import TextareaField from '../common/TextareaField';
import { calcWorkingHours, todayISO } from '../../utils/helpers';

const STATUS_OPTIONS = ['Present', 'Absent', 'Half Day', 'Late', 'On Leave'].map((status) => ({
  value: status,
  label: status,
}));

export default function AttendanceForm({ record = null, employees = [], onClose, onSave }) {
  const [form, setForm] = useState({
    employeeId: record?.employeeId || '',
    date: record?.date || todayISO(),
    checkIn: record?.checkIn || '09:00',
    checkOut: record?.checkOut || '18:00',
    status: record?.status || 'Present',
    remarks: record?.remarks || '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const working = calcWorkingHours(form.checkIn, form.checkOut);
  const noTimes = form.status === 'Absent' || form.status === 'On Leave';

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.employeeId) next.employeeId = 'Employee is required.';
    if (!form.date) next.date = 'Attendance date is required.';
    if (!noTimes) {
      if (!form.checkIn) next.checkIn = 'Check-in time is required.';
      if (!form.checkOut) next.checkOut = 'Check-out time is required.';
      if (form.checkIn && form.checkOut && working.hours === 0) {
        next.checkOut = 'Check-out must be different from check-in.';
      }
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSave({
        employeeId: form.employeeId,
        date: form.date,
        checkIn: noTimes ? '' : form.checkIn,
        checkOut: noTimes ? '' : form.checkOut,
        status: form.status,
        remarks: form.remarks.trim(),
      });
    } catch (error) {
      setFormError(error.message || 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={record ? 'Edit Attendance' : 'Mark Attendance'}
      subtitle={
        record
          ? 'Update the attendance record for this employee and date.'
          : 'Record check-in, check-out and attendance status for an employee.'
      }
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="attendance-form" icon={FiSave} loading={saving}>
            {record ? 'Save Changes' : 'Save Attendance'}
          </Button>
        </>
      }
    >
      <form id="attendance-form" className="form-grid" onSubmit={handleSubmit} noValidate>
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
          placeholder="Select employee"
          error={errors.employeeId}
        />
        <InputField
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={(event) => update('date', event.target.value)}
          error={errors.date}
        />
        <SelectField
          label="Attendance Status"
          required
          value={form.status}
          onChange={(event) => update('status', event.target.value)}
          options={STATUS_OPTIONS}
          placeholder=""
        />
        <InputField
          label="Check-in Time"
          type="time"
          value={form.checkIn}
          onChange={(event) => update('checkIn', event.target.value)}
          error={errors.checkIn}
          disabled={noTimes}
        />
        <InputField
          label="Check-out Time"
          type="time"
          value={form.checkOut}
          onChange={(event) => update('checkOut', event.target.value)}
          error={errors.checkOut}
          disabled={noTimes}
        />
        <div className="info-banner span-2">
          <span>Calculated working hours</span>
          <strong>{noTimes ? '—' : working.text}</strong>
        </div>
        <TextareaField
          label="Remarks"
          className="span-2"
          value={form.remarks}
          onChange={(event) => update('remarks', event.target.value)}
          placeholder="Optional notes, e.g. late due to client call"
          rows={2}
        />
      </form>
    </Modal>
  );
}
