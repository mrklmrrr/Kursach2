import { Modal } from '@components/ui';

export default function PatientProfileModal({ patient, onOpenMedicalRecord, onClose }) {
  const isOpen = Boolean(patient);
  const birthYear = patient?.birthDate ? Number(String(patient.birthDate).slice(0, 4)) : null;
  const currentYear = new Date().getFullYear();
  const age = birthYear ? Math.max(currentYear - birthYear, 0) : null;
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
                <span className="patient-profile-modal__value">{birthYear || '—'}</span>
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
