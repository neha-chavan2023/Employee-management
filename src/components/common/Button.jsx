export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim()}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="btn-spinner" aria-hidden="true" /> : Icon ? <Icon /> : null}
      {children ? <span>{children}</span> : null}
      {IconRight ? <IconRight /> : null}
    </button>
  );
}
