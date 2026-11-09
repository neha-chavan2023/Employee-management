import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <Modal
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="confirm-body">
        <span className={`confirm-icon confirm-icon--${variant}`}>
          <FiAlertTriangle />
        </span>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
}
