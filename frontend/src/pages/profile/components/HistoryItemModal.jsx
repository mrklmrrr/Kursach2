import { getDoctorInfo } from '../utils/profileUtils';

const formatDateTime = (date, time) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

export const HistoryItemModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="patient-modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Информация о записи</h3>
        <p><strong>Дата и время:</strong> {formatDateTime(item.date, item.rawAppointment?.time || '')}</p>
        <p>
          <strong>Врач:</strong> {getDoctorInfo(item).doctorName} ({getDoctorInfo(item).doctorProfession})
        </p>
        {item.source === 'appointment' && item.rawAppointment && (
          <>
            <p><strong>Тип консультации:</strong> {item.specialty}</p>
            <p><strong>Длительность:</strong> {item.duration || 0} мин</p>
            {item.rawAppointment.doctorComment && (
              <p><strong>Комментарий врача:</strong> {item.rawAppointment.doctorComment}</p>
            )}
          </>
        )}
        {item.source === 'consultation' && (
          <>
            <p><strong>Тип:</strong> {item.specialty || 'Консультация'}</p>
            <p><strong>Длительность:</strong> {item.duration || 0} мин</p>
          </>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};