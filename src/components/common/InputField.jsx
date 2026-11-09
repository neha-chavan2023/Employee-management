const fieldId = (label, id) =>
  id || `field-${String(label || 'input').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export default function InputField({ label, error, hint, required, id, className = '', ...props }) {
  const inputId = fieldId(label, id);
  return (
    <div className={`field ${className}`.trim()}>
      {label ? (
        <label className="field-label" htmlFor={inputId}>
          {label}
          {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`field-input ${error ? 'is-invalid' : ''}`.trim()}
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
