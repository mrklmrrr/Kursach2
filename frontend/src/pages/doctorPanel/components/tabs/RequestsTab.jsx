import { EmptyState } from '../../../../components/ui';

const formatDateTime = (date, time) => {
  if (!date || !time) return '—';
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

export default function RequestsTab({
  imminentOnlineConsultation,
  onOpenPatientProfile,
  onOpenPatientMedicalRecord,
  onStartVideoRoom
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
            <span className="status-badge active">Видеокомната: за 10 мин до начала и во время приёма</span>
            <p className="consult-video-room-hint">
              Создайте комнату — пациент подключится с главной страницы из блока «Ближайшие записи» или из деталей записи.
            </p>
          </div>
          <div className="consultation-actions consultation-actions--stacked">
            <button
              type="button"
              className="start-btn"
              onClick={() => onStartVideoRoom?.(imminentOnlineConsultation.consultationId)}
            >
              Создать видеокомнату
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

      {!imminentOnlineConsultation && (
        <EmptyState
          variant="plain"
          icon="event_available"
          title="Нет ближайших онлайн-приёмов"
          description="Когда у вас запланирована онлайн-консультация, за 10 минут до начала здесь появится блок для создания видеокомнаты. Список записей — во вкладке «Расписание»."
        />
      )}
    </div>
  );
}
