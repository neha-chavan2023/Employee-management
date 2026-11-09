import { useMemo, useState } from 'react';
import { FiSave } from 'react-icons/fi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import InputField from '../common/InputField';
import SelectField from '../common/SelectField';
import TextareaField from '../common/TextareaField';
import Avatar from '../common/Avatar';
import { useToast } from '../../context/ToastContext';
import { employeeService } from '../../services/employeeService';
import {
  formatCurrency,
  isEmailValid,
  isPhoneValid,
  todayISO,
} from '../../utils/helpers';

const flatten = (employee) => ({
  firstName: employee?.firstName || '',
  lastName: employee?.lastName || '',
  gender: employee?.gender || 'Male',
  dob: employee?.dob || '',
  email: employee?.email || '',
  phone: employee?.phone || '',
  altPhone: employee?.altPhone || '',
  avatar: employee?.avatar || '',
  address: employee?.address || '',
  city: employee?.city || '',
  state: employee?.state || '',
  pincode: employee?.pincode || '',
  departmentId: employee?.departmentId || '',
  designationId: employee?.designationId || '',
  reportingManagerId: employee?.reportingManagerId || '',
  joiningDate: employee?.joiningDate || todayISO(),
  employmentType: employee?.employmentType || 'Full-time',
  status: employee?.status || 'Active',
  workLocation: employee?.workLocation || 'Office',
  basicSalary: employee?.salary?.basic ?? '',
  hra: employee?.salary?.hra ?? '',
  allowances: employee?.salary?.allowances ?? '',
  deductions: employee?.salary?.deductions ?? '',
  emergencyName: employee?.emergency?.name || '',
  emergencyRelationship: employee?.emergency?.relationship || '',
  emergencyPhone: employee?.emergency?.phone || '',
});

export default function EmployeeForm({
  employee = null,
  employees = [],
  departments = [],
  designations = [],
  nextEmployeeId,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => flatten(employee));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const isEdit = Boolean(employee);
  const fullName = `${form.firstName} ${form.lastName}`.trim();
  const totalSalary = useMemo(() => {
    const basic = Number(form.basicSalary) || 0;
    const hra = Number(form.hra) || 0;
    const allowances = Number(form.allowances) || 0;
    const deductions = Number(form.deductions) || 0;
    return basic + hra + allowances - deductions;
  }, [form.basicSalary, form.hra, form.allowances, form.deductions]);

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.name,
  }));
  const designationOptions = designations
    .filter((designation) => !form.departmentId || designation.departmentId === form.departmentId)
    .map((designation) => ({ value: designation.id, label: designation.name }));
  const managerOptions = employees
    .filter((item) => item.id !== employee?.id)
    .map((item) => ({
      value: item.id,
      label: `${item.firstName} ${item.lastName} (${item.employeeId})`,
    }));

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  };

  const autoCalculate = () => {
    const basic = Number(form.basicSalary) || 0;
    if (!basic) {
      showToast('Enter a basic salary first.', 'warning');
      return;
    }
    setForm((current) => ({
      ...current,
      hra: Math.round(basic * 0.4),
      allowances: Math.round(basic * 0.15),
      deductions: Math.round(basic * 0.12),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required.';
    if (!form.lastName.trim()) next.lastName = 'Last name is required.';
    if (!form.dob) next.dob = 'Date of birth is required.';
    else if (form.dob > todayISO()) next.dob = 'Date of birth cannot be in the future.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!isEmailValid(form.email)) next.email = 'Enter a valid email address.';
    else if (employeeService.emailExists(form.email, employee?.id)) {
      next.email = 'This email is already used by another employee.';
    }
    if (!form.phone.trim()) next.phone = 'Phone number is required.';
    else if (!isPhoneValid(form.phone)) next.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (form.altPhone && !isPhoneValid(form.altPhone)) {
      next.altPhone = 'Enter a valid 10-digit mobile number.';
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) next.pincode = 'Pincode must be 6 digits.';
    if (!form.departmentId) next.departmentId = 'Department is required.';
    if (!form.designationId) next.designationId = 'Designation is required.';
    if (!form.joiningDate) next.joiningDate = 'Joining date is required.';
    if (!form.basicSalary || Number(form.basicSalary) <= 0) {
      next.basicSalary = 'Basic salary must be greater than zero.';
    }
    if (form.emergencyPhone && !isPhoneValid(form.emergencyPhone)) {
      next.emergencyPhone = 'Enter a valid 10-digit mobile number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) {
      showToast('Please fix the highlighted fields.', 'error');
      return;
    }
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender,
      dob: form.dob,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      altPhone: form.altPhone.trim(),
      avatar: form.avatar.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      departmentId: form.departmentId,
      designationId: form.designationId,
      reportingManagerId: form.reportingManagerId,
      joiningDate: form.joiningDate,
      employmentType: form.employmentType,
      status: form.status,
      workLocation: form.workLocation.trim(),
      salary: {
        basic: Number(form.basicSalary) || 0,
        hra: Number(form.hra) || 0,
        allowances: Number(form.allowances) || 0,
        deductions: Number(form.deductions) || 0,
        total: totalSalary,
      },
      emergency: {
        name: form.emergencyName.trim(),
        relationship: form.emergencyRelationship,
        phone: form.emergencyPhone.trim(),
      },
    };

    setSaving(true);
    try {
      await onSave(payload);
    } catch (error) {
      setFormError(error.message || 'Unable to save the employee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Employee' : 'Add New Employee'}
      subtitle={
        isEdit
          ? `Update the profile and employment details for ${fullName}.`
          : 'Create a new employee profile with personal, professional and salary details.'
      }
      onClose={onClose}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" icon={FiSave} loading={saving}>
            {isEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="form-alert">{formError}</div> : null}

        <section className="form-section">
          <h3 className="form-section-title">Personal Information</h3>
          <div className="form-grid">
            <InputField
              label="First Name"
              required
              value={form.firstName}
              onChange={(event) => update('firstName', event.target.value)}
              error={errors.firstName}
              placeholder="e.g. Ananya"
            />
            <InputField
              label="Last Name"
              required
              value={form.lastName}
              onChange={(event) => update('lastName', event.target.value)}
              error={errors.lastName}
              placeholder="e.g. Desai"
            />
            <SelectField
              label="Gender"
              required
              value={form.gender}
              onChange={(event) => update('gender', event.target.value)}
              options={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              placeholder=""
            />
            <InputField
              label="Date of Birth"
              type="date"
              required
              max={todayISO()}
              value={form.dob}
              onChange={(event) => update('dob', event.target.value)}
              error={errors.dob}
            />
            <InputField
              label="Email Address"
              type="email"
              required
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              error={errors.email}
              placeholder="name@company.com"
            />
            <InputField
              label="Phone Number"
              required
              value={form.phone}
              onChange={(event) => update('phone', event.target.value.replace(/[^\d]/g, '').slice(0, 10))}
              error={errors.phone}
              placeholder="10-digit mobile number"
              hint="Indian mobile number, e.g. 9876543210"
            />
            <InputField
              label="Alternate Phone Number"
              value={form.altPhone}
              onChange={(event) => update('altPhone', event.target.value.replace(/[^\d]/g, '').slice(0, 10))}
              error={errors.altPhone}
              placeholder="Optional"
            />
            <InputField
              label="Profile Image URL"
              value={form.avatar}
              onChange={(event) => update('avatar', event.target.value)}
              placeholder="https://example.com/photo.jpg"
              hint="Optional. Initials are shown when no image is provided."
            />
            <div className="form-avatar-preview">
              <Avatar name={fullName || 'New Employee'} src={form.avatar} size="lg" />
              <span>Profile preview</span>
            </div>
            <TextareaField
              label="Address"
              className="span-2"
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="House / flat, street, area"
              rows={2}
            />
            <InputField
              label="City"
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
              placeholder="e.g. Pune"
            />
            <InputField
              label="State"
              value={form.state}
              onChange={(event) => update('state', event.target.value)}
              placeholder="e.g. Maharashtra"
            />
            <InputField
              label="Pincode"
              value={form.pincode}
              onChange={(event) => update('pincode', event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
              error={errors.pincode}
              placeholder="6-digit pincode"
            />
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section-title">Professional Information</h3>
          <div className="form-grid">
            <InputField
              label="Employee ID"
              value={employee?.employeeId || nextEmployeeId}
              disabled
              hint="Generated automatically and cannot be changed."
            />
            <SelectField
              label="Department"
              required
              value={form.departmentId}
              onChange={(event) => {
                update('departmentId', event.target.value);
                update('designationId', '');
              }}
              options={departmentOptions}
              placeholder="Select department"
              error={errors.departmentId}
            />
            <SelectField
              label="Designation"
              required
              value={form.designationId}
              onChange={(event) => update('designationId', event.target.value)}
              options={designationOptions}
              placeholder={form.departmentId ? 'Select designation' : 'Select a department first'}
              error={errors.designationId}
              disabled={!form.departmentId}
            />
            <SelectField
              label="Reporting Manager"
              value={form.reportingManagerId}
              onChange={(event) => update('reportingManagerId', event.target.value)}
              options={managerOptions}
              placeholder="No reporting manager"
            />
            <InputField
              label="Joining Date"
              type="date"
              required
              value={form.joiningDate}
              onChange={(event) => update('joiningDate', event.target.value)}
              error={errors.joiningDate}
            />
            <SelectField
              label="Employment Type"
              required
              value={form.employmentType}
              onChange={(event) => update('employmentType', event.target.value)}
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
              ]}
              placeholder=""
            />
            <SelectField
              label="Employment Status"
              required
              value={form.status}
              onChange={(event) => update('status', event.target.value)}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Resigned', label: 'Resigned' },
              ]}
              placeholder=""
            />
            <InputField
              label="Work Location"
              value={form.workLocation}
              onChange={(event) => update('workLocation', event.target.value)}
              placeholder="e.g. Pune Office or Remote"
            />
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-head">
            <h3 className="form-section-title">Salary Information (INR)</h3>
            <button type="button" className="text-action" onClick={autoCalculate}>
              Auto-calculate from basic
            </button>
          </div>
          <div className="form-grid">
            <InputField
              label="Basic Salary"
              type="number"
              min="0"
              required
              value={form.basicSalary}
              onChange={(event) => update('basicSalary', event.target.value)}
              error={errors.basicSalary}
              placeholder="e.g. 55000"
            />
            <InputField
              label="HRA"
              type="number"
              min="0"
              value={form.hra}
              onChange={(event) => update('hra', event.target.value)}
              placeholder="House rent allowance"
            />
            <InputField
              label="Allowances"
              type="number"
              min="0"
              value={form.allowances}
              onChange={(event) => update('allowances', event.target.value)}
              placeholder="Special / travel allowances"
            />
            <InputField
              label="Deductions"
              type="number"
              min="0"
              value={form.deductions}
              onChange={(event) => update('deductions', event.target.value)}
              placeholder="PF / tax / other"
            />
            <div className="salary-total">
              <span>Total Monthly Salary</span>
              <strong>{formatCurrency(totalSalary)}</strong>
              <small>Basic + HRA + Allowances − Deductions</small>
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3 className="form-section-title">Emergency Contact</h3>
          <div className="form-grid">
            <InputField
              label="Contact Person Name"
              value={form.emergencyName}
              onChange={(event) => update('emergencyName', event.target.value)}
              placeholder="Full name"
            />
            <SelectField
              label="Relationship"
              value={form.emergencyRelationship}
              onChange={(event) => update('emergencyRelationship', event.target.value)}
              options={[
                { value: 'Spouse', label: 'Spouse' },
                { value: 'Father', label: 'Father' },
                { value: 'Mother', label: 'Mother' },
                { value: 'Sibling', label: 'Sibling' },
                { value: 'Friend', label: 'Friend' },
                { value: 'Other', label: 'Other' },
              ]}
              placeholder="Select relationship"
            />
            <InputField
              label="Contact Number"
              value={form.emergencyPhone}
              onChange={(event) =>
                update('emergencyPhone', event.target.value.replace(/[^\d]/g, '').slice(0, 10))
              }
              error={errors.emergencyPhone}
              placeholder="10-digit mobile number"
            />
          </div>
        </section>
      </form>
    </Modal>
  );
}
