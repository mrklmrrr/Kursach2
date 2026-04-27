import { EmptyState } from '../../../../components/ui';

export default function PatientsTab({ patients, onSelectPatient }) {
  return (
    <div className="patients-list">
      {patients.length === 0 ? (
        <EmptyState
          variant="plain"
          icon="group"
          title="Пока нет пациентов"
          description="После первых записей и консультаций список заполнится автоматически."
        />
      ) : (
        patients.map((p, i) => (
          <div key={i} className="patient-card">
            <div className="patient-info">
              <h3>
                <button
                  type="button"
                  className="patient-link"
                  onClick={() => onSelectPatient(p)}
                >
                  {p.name}
                </button>
              </h3>
              <p>{p.phone || '—'}</p>
            </div>
            <div className="patient-card-actions">
              <span className="consult-count">{p.consultationCount} консульт.</span>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onSelectPatient(p)}
              >
                Карточка пациента
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
