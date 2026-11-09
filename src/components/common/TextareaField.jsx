export default function TextareaField({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  rows = 3,
  ...props
}) {
  const inputId = id || `field-${String(label || 'textarea').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className={`field ${className}`.trim()}>
      {label ? (
        <label className="field-label" htmlFor={inputId}>
          {label}
          {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={`field-input field-textarea ${error ? 'is-invalid' : ''}`.trim()}
        {...props}
      />
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
