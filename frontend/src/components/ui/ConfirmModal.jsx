import { useMemo } from 'react';
import './ConfirmModal.css';

/**
 * Reusable confirmation dialog component
 */
export default function ConfirmModal({
  open,
  title = 'Подтверждение',
  message = 'Вы уверены?',
  confirmText = 'Да',
  cancelText = 'Нет',
  onConfirm,
  onCancel,
  type = 'danger' // 'danger' | 'primary' | 'warning'
}) {
  const modalClass = useMemo(() => {
    const base = 'confirm-modal-overlay';
    return open ? `${base} open` : base;
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel?.();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div
      className={modalClass}
      role="presentation"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <span className="confirm-modal-icon">
            {type === 'danger' && '⚠️'}
            {type === 'warning' && '⚡'}
            {type === 'primary' && 'ℹ️'}
          </span>
          <h3 id="confirm-modal-title">{title}</h3>
        </div>

        <p className="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleCancel}
            autoFocus
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
