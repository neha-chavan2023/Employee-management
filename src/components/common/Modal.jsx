import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

export default function Modal({
  title,
  subtitle,
  children,
  footer,
  onClose,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-root">
      <div className="modal-overlay" onMouseDown={onClose}>
        <div
          className={`modal-card modal-card--${size} ${className}`.trim()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-head">
            <div>
              <h2 className="modal-title">{title}</h2>
              {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
              <FiX />
            </button>
          </div>
          <div className="modal-body">{children}</div>
          {footer ? <div className="modal-foot">{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
