import { Modal } from '@components/ui';

export default function PatientProfileModal({ patient, onOpenMedicalRecord, onClose }) {
  const isOpen = Boolean(patient);
  const birthDateValue = patient?.birthDate ? new Date(patient.birthDate) : null;
  const hasValidBirthDate = birthDateValue instanceof Date && !Number.isNaN(birthDateValue.getTime());
  const age = hasValidBirthDate ? Math.max(new Date().getFullYear() - birthDateValue.getFullYear(), 0) : null;
  const formattedBirthDate = hasValidBirthDate
    ? `${String(birthDateValue.getDate()).padStart(2, '0')}.${String(birthDateValue.getMonth() + 1).padStart(2, '0')}.${birthDateValue.getFullYear()}`
    : '—';
  const consultationCount = patient?.consultationCount ?? 0;

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content className="patient-profile-modal">
          <Modal.Header>
            <div className="patient-profile-modal__title-wrap">
              <h3>Профиль пациента</h3>
              <p className="patient-profile-modal__subtitle">Краткая информация перед открытием медкарты</p>
            </div>
          </Modal.Header>

          <Modal.Body className="patient-profile-modal__body">
            <div className="patient-profile-modal__hero">
              <p className="patient-profile-modal__name">{patient?.name || 'Без имени'}</p>
              <div className="patient-profile-modal__badges">
                <span className="patient-profile-modal__badge">{age ? `${age} лет` : 'Возраст неизвестен'}</span>
                <span className="patient-profile-modal__badge">{consultationCount} консультаций</span>
              </div>
            </div>

            <div className="patient-profile-modal__grid" role="list">
              <div className="patient-profile-modal__field" role="listitem">
                <span className="patient-profile-modal__label">Дата рождения</span>
                <span className="patient-profile-modal__value">{formattedBirthDate}</span>
              </div>
              <div className="patient-profile-modal__field" role="listitem">
                <span className="patient-profile-modal__label">Телефон</span>
                <span className="patient-profile-modal__value">{patient?.phone || '—'}</span>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="patient-profile-modal__footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onOpenMedicalRecord(patient);
                onClose();
              }}
            >
              Карточка пациента
            </button>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Закрыть
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
