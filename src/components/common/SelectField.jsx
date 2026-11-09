export default function SelectField({
  label,
  error,
  hint,
  required,
  id,
  options = [],
  placeholder = 'Select an option',
  className = '',
  children,
  ...props
}) {
  const inputId = id || `field-${String(label || 'select').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className={`field ${className}`.trim()}>
      {label ? (
        <label className="field-label" htmlFor={inputId}>
          {label}
          {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      <select
        id={inputId}
        className={`field-input field-select ${error ? 'is-invalid' : ''}`.trim()}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
