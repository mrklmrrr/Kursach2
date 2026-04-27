import { CONSULTATION_TYPE_LABELS } from "../../constants/labels";

const formatDateTime = (date, time) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

export default function CommentModal({ open, appointment, text, onChangeText, onSave, onClose }) {
  if (!open) return null;

  return (
    <div className="patient-modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Комментарий к записи</h3>
        <p>
          {appointment?.date && appointment?.time ? formatDateTime(appointment.date, appointment.time) : ''} {' '}
          • {CONSULTATION_TYPE_LABELS[appointment?.consultationType] || 'Консультация'}
        </p>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Введите комментарий врача..."
        />
        <div className="patient-modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Отмена
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
