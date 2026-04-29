import Modal from './Modal/Modal';

/**
 * Reusable confirmation dialog component (built on top of compound Modal)
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
  const icon =
    type === 'danger' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️';

  return (
    <Modal open={open} onClose={onCancel}>
      <Modal.Overlay>
        <Modal.Content className="modal-content--confirm">
          <Modal.Header className="modal-header--center" showClose={false}>
            <span className="modal-icon">{icon}</span>
            <h3>{title}</h3>
          </Modal.Header>

          <Modal.Body>
            <p className="modal-message">{message}</p>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCancel}
              autoFocus
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
