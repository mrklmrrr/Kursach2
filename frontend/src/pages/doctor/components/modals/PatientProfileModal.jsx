export default function PatientProfileModal({ patient, onOpenMedicalRecord, onClose }) {
  if (!patient) return null;

  return (
    <div className="patient-modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Профиль пациента</h3>
        <p><strong>Имя:</strong> {patient.name}</p>
        <p><strong>Дата рождения:</strong> {patient.birthDate ? String(patient.birthDate).slice(0, 4) : '—'}</p>
        <p><strong>Телефон:</strong> {patient.phone || '—'}</p>
        <p><strong>Консультаций:</strong> {patient.consultationCount ?? 0}</p>
        <div className="patient-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              onOpenMedicalRecord(patient);
              onClose();
            }}
          >
            Карточка пациента
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
