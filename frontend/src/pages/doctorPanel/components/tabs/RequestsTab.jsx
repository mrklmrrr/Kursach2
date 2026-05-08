import { EmptyState } from '../../../../components/ui';

const formatDateTime = (date, time) => {
  if (!date || !time) return '—';
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

export default function RequestsTab({
  consultations,
  imminentOnlineConsultation,
  onOpenPatientProfile,
  onOpenPatientMedicalRecord,
  onStartCall,
  onAccept,
  onReject
}) {
  return (
    <div className="consultations-list">
      {imminentOnlineConsultation && (
        <div className="consultation-card consultation-card--imminent">
          <div className="consultation-info">
            <h3>Скоро онлайн-консультация</h3>
            <p className="consult-type">🌐 {imminentOnlineConsultation.patientName}</p>
            <p className="consult-date">
              Начало: {formatDateTime(imminentOnlineConsultation.date, imminentOnlineConsultation.time)}
            </p>
            <span className="status-badge active">До начала менее 10 минут</span>
          </div>
          <div className="consultation-actions consultation-actions--stacked">
            <button
              type="button"
              className="start-btn"
              onClick={() => onStartCall?.(imminentOnlineConsultation.consultationId)}
            >
              Начать звонок
            </button>
            <button
              type="button"
              className="chat-btn"
              onClick={() => onOpenPatientProfile?.(imminentOnlineConsultation.patientId, imminentOnlineConsultation.patientName)}
            >
              Профиль пациента
            </button>
            <button
              type="button"
              className="accept-btn"
              onClick={() => onOpenPatientMedicalRecord?.(imminentOnlineConsultation.patientId, imminentOnlineConsultation.patientName)}
            >
              Карточка пациента
            </button>
          </div>
        </div>
      )}

      {consultations.length === 0 ? (
        <EmptyState
          variant="plain"
          icon="inbox"
          title="Нет ожидающих заявок"
          description="Новые запросы на консультацию появятся здесь, когда пациенты запишутся к вам."
        />
      ) : (
        consultations.map(c => (
          <div key={c._id} className="consultation-card pending">
            <div className="consultation-info">
              <h3>{c.patientName}</h3>
              <p className="consult-type">
                {c.type === 'offline' || c.type === 'chat' ? '🏥 Офлайн' : '🌐 Онлайн'}
              </p>
              <p className="consult-date">
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString('ru-RU') : '—'}
              </p>
            </div>
            <div className="consultation-actions">
              <button className="accept-btn" onClick={() => onAccept(c._id)}>
                ✓ Принять
              </button>
              <button className="reject-btn" onClick={() => onReject(c._id)}>
                ✕ Отклонить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
