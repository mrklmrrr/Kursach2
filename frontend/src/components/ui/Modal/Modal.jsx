import React, { createContext, useContext } from 'react';
import './Modal.css';

const ModalContext = createContext(null);

function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal subcomponents must be used within <Modal>');
  return ctx;
}

/**
 * Compound Component: Modal
 *
 * Usage:
 * <Modal open={isOpen} onClose={handleClose}>
 *   <Modal.Overlay>
 *     <Modal.Content className="my-modal">
 *       <Modal.Header>Заголовок</Modal.Header>
 *       <Modal.Body>Содержимое</Modal.Body>
 *       <Modal.Footer>
 *         <button onClick={handleClose}>Закрыть</button>
 *       </Modal.Footer>
 *     </Modal.Content>
 *   </Modal.Overlay>
 * </Modal>
 */
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <ModalContext.Provider value={{ onClose }}>
      {children}
    </ModalContext.Provider>
  );
}

function Overlay({ children, className }) {
  const { onClose } = useModal();
  return (
    <div
      className={`modal-overlay ${className || ''}`}
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {children}
    </div>
  );
}

function Content({ children, className, ...props }) {
  return (
    <div
      className={`modal-content ${className || ''}`}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
}

function Header({ children, className, showClose = true }) {
  const { onClose } = useModal();
  return (
    <div className={`modal-header ${className || ''}`}>
      <div className="modal-header-content">{children}</div>
      {showClose && (
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
      )}
    </div>
  );
}

function Body({ children, className }) {
  return <div className={`modal-body ${className || ''}`}>{children}</div>;
}

function Footer({ children, className }) {
  return <div className={`modal-footer ${className || ''}`}>{children}</div>;
}

Modal.Overlay = Overlay;
Modal.Content = Content;
Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;

export default Modal;
