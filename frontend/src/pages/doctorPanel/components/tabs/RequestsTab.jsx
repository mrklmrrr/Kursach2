import { EmptyState } from '../../../../components/ui';

const formatDateTime = (date, time) => {
  if (!date || !time) return '—';
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

const formatCreated = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function RequestsTab({
  imminentOnlineConsultation,
  emergencyRequests = [],
  isGeneralPracticeDoctor = false,
  onAcceptEmergencyRequest,
  onOpenPatientProfile,
  onOpenPatientMedicalRecord,
  onStartVideoRoom
}) {
  const hasEmergency = isGeneralPracticeDoctor && emergencyRequests.length > 0;
  const hasImminent = Boolean(imminentOnlineConsultation);
  const showEmpty = !hasImminent && !hasEmergency;

  return (
    <div className="consultations-list">
      {hasEmergency && (
        <div className="emergency-requests-block">
          <h3 className="emergency-requests-heading">Скорая помощь</h3>
          <p className="emergency-requests-hint">
            Заявки с экстренной кнопки пациента. Первая реакция — приём заявки, затем чат или видео.
          </p>
          {emergencyRequests.map((req) => (
            <div key={String(req.id)} className="consultation-card consultation-card--emergency">
              <div className="consultation-info">
                <h3>{req.patientName || 'Пациент'}</h3>
                <p className="consult-type">🚨 Срочный вызов</p>
                <p className="consult-date">Поступила: {formatCreated(req.createdAt)}</p>
                <span className="status-badge active">Ожидает врача ОП</span>
              </div>
              <div className="consultation-actions consultation-actions--stacked">
                <button
                  type="button"
                  className="accept-btn"
                  onClick={() => onAcceptEmergencyRequest?.(req.id)}
                >
                  Принять вызов
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasImminent && (
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

      {showEmpty && (
        <EmptyState
          variant="plain"
          icon="event_available"
          title="Нет активных заявок"
          description={
            isGeneralPracticeDoctor
              ? 'Экстренные вызовы с кнопки «Скорая помощь» у пациента появятся здесь. Ближайшая онлайн-запись — тоже в этом разделе за 10 минут до начала.'
              : 'Когда у вас запланирована онлайн-консультация, за 10 минут до начала здесь появится блок для создания видеокомнаты. Список записей — во вкладке «Расписание».'
          }
        />
      )}
    </div>
  );
}
