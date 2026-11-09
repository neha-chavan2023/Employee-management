import { useState } from 'react';
import {
  FiBriefcase,
  FiClock,
  FiImage,
  FiMoon,
  FiPlus,
  FiRotateCcw,
  FiSave,
  FiSun,
  FiTag,
  FiX,
} from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { settingsService } from '../../services/settingsService';
import PageHeader from '../../components/common/PageHeader';
import InputField from '../../components/common/InputField';
import TextareaField from '../../components/common/TextareaField';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { isEmailValid } from '../../utils/helpers';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Settings() {
  const { settings, updateSettings } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState({ ...settings });
  const [leaveTypeDraft, setLeaveTypeDraft] = useState('');
  const [errors, setErrors] = useState({});
  const [resetOpen, setResetOpen] = useState(false);

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  };

  const addLeaveType = () => {
    const value = leaveTypeDraft.trim();
    if (!value) return;
    if (form.leaveTypes.some((type) => type.toLowerCase() === value.toLowerCase())) {
      showToast('That leave type already exists.', 'warning');
      return;
    }
    update('leaveTypes', [...form.leaveTypes, value]);
    setLeaveTypeDraft('');
  };

  const removeLeaveType = (type) => {
    update('leaveTypes', form.leaveTypes.filter((item) => item !== type));
  };

  const handleSave = (event) => {
    event.preventDefault();
    const next = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required.';
    if (!form.email.trim() || !isEmailValid(form.email)) next.email = 'A valid company email is required.';
    if (!form.phone.trim()) next.phone = 'Contact number is required.';
    if (!form.workingDays.length) next.workingDays = 'Select at least one working day.';
    if (!form.workStart || !form.workEnd) next.workHours = 'Working hours are required.';
    else if (form.workStart >= form.workEnd) next.workHours = 'Start time must be before end time.';
    setErrors(next);
    if (Object.keys(next).length) {
      showToast('Please fix the highlighted settings.', 'error');
      return;
    }

    updateSettings({
      companyName: form.companyName.trim(),
      companyLogo: form.companyLogo.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      workingDays: form.workingDays,
      workStart: form.workStart,
      workEnd: form.workEnd,
      leaveTypes: form.leaveTypes,
      theme: form.theme,
    });
    showToast('Settings saved successfully.');
  };

  const handleReset = () => {
    settingsService.reset();
    setForm({ ...settingsService.get() });
    setResetOpen(false);
    showToast('Settings restored to defaults.', 'info');
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure company information, working hours, leave policies and appearance."
        breadcrumbs={[{ label: 'Home', to: '/dashboard' }, { label: 'Settings' }]}
        actions={
          <>
            <Button variant="outline" icon={FiRotateCcw} onClick={() => setResetOpen(true)}>
              Reset Defaults
            </Button>
            <Button type="submit" form="settings-form" icon={FiSave}>Save Settings</Button>
          </>
        }
      />

      <form id="settings-form" onSubmit={handleSave} noValidate>
        <div className="settings-grid">
          <section className="ui-card">
            <div className="card-head">
              <div>
                <h3 className="card-title"><FiBriefcase /> Company Information</h3>
                <p className="card-subtitle">Shown across the application and exported reports.</p>
              </div>
            </div>
            <div className="form-grid">
              <InputField
                label="Company Name"
                required
                value={form.companyName}
                onChange={(event) => update('companyName', event.target.value)}
                error={errors.companyName}
              />
              <InputField
                label="Company Email"
                type="email"
                required
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                error={errors.email}
              />
              <InputField
                label="Contact Number"
                required
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                error={errors.phone}
              />
              <InputField
                label="Company Logo URL"
                value={form.companyLogo}
                onChange={(event) => update('companyLogo', event.target.value)}
                placeholder="https://example.com/logo.png"
                error={errors.companyLogo}
              />
              <div className="settings-logo-preview span-2">
                {form.companyLogo ? (
                  <img
                    src={form.companyLogo}
                    alt="Company logo preview"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="brand-mark">E</span>
                )}
                <div>
                  <strong>{form.companyName || 'Company name'}</strong>
                  <span><FiImage /> Logo preview</span>
                </div>
              </div>
              <TextareaField
                label="Company Address"
                className="span-2"
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                rows={3}
              />
            </div>
          </section>

          <section className="ui-card">
            <div className="card-head">
              <div>
                <h3 className="card-title"><FiClock /> Working Schedule</h3>
                <p className="card-subtitle">Working days and standard office hours.</p>
              </div>
            </div>
            <div className="form-grid">
              <div className="field span-2">
                <span className="field-label">Working Days</span>
                <div className="day-toggle-grid">
                  {DAYS.map((day) => (
                    <label key={day} className={`day-toggle ${form.workingDays.includes(day) ? 'is-checked' : ''}`}>
                      <input
                        type="checkbox"
                        checked={form.workingDays.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      <span>{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
                {errors.workingDays ? <p className="field-error">{errors.workingDays}</p> : null}
              </div>
              <InputField
                label="Working Hours Start"
                type="time"
                required
                value={form.workStart}
                onChange={(event) => update('workStart', event.target.value)}
                error={errors.workHours}
              />
              <InputField
                label="Working Hours End"
                type="time"
                required
                value={form.workEnd}
                onChange={(event) => update('workEnd', event.target.value)}
                error={errors.workHours}
              />
            </div>
          </section>

          <section className="ui-card">
            <div className="card-head">
              <div>
                <h3 className="card-title"><FiTag /> Leave Types</h3>
                <p className="card-subtitle">Available options when applying for leave.</p>
              </div>
            </div>
            <div className="leave-type-list">
              {form.leaveTypes.map((type) => (
                <span key={type} className="leave-type-chip">
                  {type}
                  <button type="button" onClick={() => removeLeaveType(type)} aria-label={`Remove ${type}`}>
                    <FiX />
                  </button>
                </span>
              ))}
              {!form.leaveTypes.length ? <p className="muted-note">No leave types configured.</p> : null}
            </div>
            <div className="inline-add">
              <input
                type="text"
                className="field-input"
                value={leaveTypeDraft}
                onChange={(event) => setLeaveTypeDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addLeaveType();
                  }
                }}
                placeholder="e.g. Compensatory Off"
              />
              <Button variant="outline" icon={FiPlus} onClick={addLeaveType}>Add</Button>
            </div>
          </section>

          <section className="ui-card">
            <div className="card-head">
              <div>
                <h3 className="card-title"><FiSun /> Application Theme</h3>
                <p className="card-subtitle">Choose the workspace appearance.</p>
              </div>
            </div>
            <div className="theme-options">
              <button
                type="button"
                className={`theme-option ${form.theme === 'light' ? 'is-active' : ''}`}
                onClick={() => update('theme', 'light')}
              >
                <span className="theme-swatch theme-swatch--light"><FiSun /></span>
                <div>
                  <strong>Light</strong>
                  <span>Bright, classic enterprise workspace.</span>
                </div>
              </button>
              <button
                type="button"
                className={`theme-option ${form.theme === 'dark' ? 'is-active' : ''}`}
                onClick={() => update('theme', 'dark')}
              >
                <span className="theme-swatch theme-swatch--dark"><FiMoon /></span>
                <div>
                  <strong>Dark</strong>
                  <span>Low-light theme for long sessions.</span>
                </div>
              </button>
            </div>
            <p className="muted-note">
              Theme changes are applied after saving. The header toggle switches instantly.
            </p>
          </section>
        </div>
      </form>

      <ConfirmDialog
        open={resetOpen}
        title="Reset settings?"
        message="This will restore all company settings, working hours, leave types and theme to their default values."
        confirmLabel="Reset Defaults"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
