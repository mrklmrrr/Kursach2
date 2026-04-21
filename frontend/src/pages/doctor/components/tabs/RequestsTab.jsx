import { EmptyState } from '../../../../components/ui';

export default function RequestsTab({ consultations, onAccept, onReject }) {
  return (
    <div className="consultations-list">
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
