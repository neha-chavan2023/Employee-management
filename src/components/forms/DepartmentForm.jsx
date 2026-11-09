import { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import TextareaField from '../common/TextareaField';
import { departmentService } from '../../services/departmentService';

export default function DepartmentForm({
  department = null,
  employees = [],
  nextDepartmentId,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: department?.name || '',
    description: department?.description || '',
    headEmployeeId: department?.headEmployeeId || '',
    status: department?.status || 'Active',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = 'Department name is required.';
    else if (departmentService.nameExists(form.name, department?.id)) {
      next.name = 'A department with this name already exists.';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError('');
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim(),
        headEmployeeId: form.headEmployeeId,
        status: form.status,
      });
    } catch (error) {
      setFormError(error.message || 'Unable to save the department.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={department ? 'Edit Department' : 'Add Department'}
      subtitle={
        department
          ? 'Update department details and its department head.'
          : 'Create a department to organise employees and designations.'
      }
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="department-form" icon={FiSave} loading={saving}>
            {department ? 'Save Changes' : 'Create Department'}
          </Button>
        </>
      }
    >
      <form id="department-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="form-alert span-2">{formError}</div> : null}
        <InputField
          label="Department ID"
          value={department?.departmentId || nextDepartmentId}
          disabled
          hint="Generated automatically."
        />
        <InputField
          label="Department Name"
          required
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          placeholder="e.g. Customer Success"
        />
        <SelectField
          label="Department Head"
          value={form.headEmployeeId}
          onChange={(event) => update('headEmployeeId', event.target.value)}
          options={employees.map((employee) => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName} (${employee.employeeId})`,
          }))}
          placeholder="Select department head"
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(event) => update('status', event.target.value)}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
          placeholder=""
        />
        <TextareaField
          label="Description"
          className="span-2"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="What does this department do?"
          rows={3}
        />
      </form>
    </Modal>
  );
}
