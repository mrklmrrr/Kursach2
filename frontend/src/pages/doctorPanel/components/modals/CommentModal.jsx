import { Modal } from '@components/ui';
import { CONSULTATION_TYPE_LABELS } from "../../constants/labels";

const formatDateTime = (date, time) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

export default function CommentModal({ open, appointment, text, onChangeText, onSave, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content>
          <Modal.Header>
            <h3>Комментарий к записи</h3>
          </Modal.Header>

          <Modal.Body>
            <p>
              {appointment?.date && appointment?.time ? formatDateTime(appointment.date, appointment.time) : ''} {' '}
              • {CONSULTATION_TYPE_LABELS[appointment?.consultationType] || 'Консультация'}
            </p>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Введите комментарий врача..."
              style={{ width: '100%', marginTop: 12 }}
            />
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Отмена
            </button>
            <button type="button" className="btn btn-primary" onClick={onSave}>
              Сохранить
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
