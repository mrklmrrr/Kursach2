import { CONSULTATION_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../../constants/labels";
import { EmptyState } from '../../../../components/ui';

export default function UpcomingTab({ schedule, onSelectPatient }) {
  return (
    <div className="consultations-list">
      {schedule.length === 0 ? (
        <EmptyState
          variant="plain"
          icon="event_available"
          title="Нет ближайших консультаций"
          description="Запланированные приёмы отобразятся здесь, когда появятся подтверждённые записи."
        />
      ) : (
        schedule.map((item, index) => (
          <div key={item._id} className="consultation-card upcoming">
            <div className="consultation-info">
              <h3>
                <button
                  type="button"
                  className="patient-link"
                  onClick={() => onSelectPatient(item.patientId, item.patientName)}
                >
                  {item.patientName}
                </button>
              </h3>
              <p className="consult-type">
                {CONSULTATION_TYPE_LABELS[item.consultationType] || '🌐 Онлайн'}
              </p>
              <p className="consult-date">{item.date} в {item.time}</p>
              {index === 0 && <span className="status-badge active">Ближайшая консультация</span>}
              <span className={`status-badge payment-${item.paymentStatus || 'unpaid'}`}>
                {PAYMENT_STATUS_LABELS[item.paymentStatus || 'unpaid']}
              </span>
            </div>
            <div className="consultation-actions">
              <span className={`status-badge ${item.status}`}>
                {APPOINTMENT_STATUS_LABELS[item.status]}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
