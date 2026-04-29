import { Modal } from '@components/ui';

export default function PatientProfileModal({ patient, onOpenMedicalRecord, onClose }) {
  const isOpen = Boolean(patient);

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content>
          <Modal.Header>
            <h3>Профиль пациента</h3>
          </Modal.Header>

          <Modal.Body>
            <p><strong>Имя:</strong> {patient?.name}</p>
            <p><strong>Дата рождения:</strong> {patient?.birthDate ? String(patient.birthDate).slice(0, 4) : '—'}</p>
            <p><strong>Телефон:</strong> {patient?.phone || '—'}</p>
            <p><strong>Консультаций:</strong> {patient?.consultationCount ?? 0}</p>
          </Modal.Body>

          <Modal.Footer>
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
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
