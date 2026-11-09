import { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import TextareaField from '../common/TextareaField';

export default function DesignationForm({
  designation = null,
  departments = [],
  nextDesignationId,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: designation?.name || '',
    departmentId: designation?.departmentId || '',
    description: designation?.description || '',
    status: designation?.status || 'Active',
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
    if (!form.name.trim()) next.name = 'Designation name is required.';
    if (!form.departmentId) next.departmentId = 'Department is required.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError('');
    try {
      await onSave({
        name: form.name.trim(),
        departmentId: form.departmentId,
        description: form.description.trim(),
        status: form.status,
      });
    } catch (error) {
      setFormError(error.message || 'Unable to save the designation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={designation ? 'Edit Designation' : 'Add Designation'}
      subtitle="Designations are mapped to a department and assigned to employees."
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="designation-form" icon={FiSave} loading={saving}>
            {designation ? 'Save Changes' : 'Create Designation'}
          </Button>
        </>
      }
    >
      <form id="designation-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="form-alert span-2">{formError}</div> : null}
        <InputField
          label="Designation ID"
          value={designation?.designationId || nextDesignationId}
          disabled
          hint="Generated automatically."
        />
        <InputField
          label="Designation Name"
          required
          value={form.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          placeholder="e.g. Product Manager"
        />
        <SelectField
          label="Department"
          required
          value={form.departmentId}
          onChange={(event) => update('departmentId', event.target.value)}
          options={departments.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
          placeholder="Select department"
          error={errors.departmentId}
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
          placeholder="Brief description of the role"
          rows={3}
        />
      </form>
    </Modal>
  );
}
