export default function PatientsTab({ patients, onSelectPatient }) {
  return (
    <div className="patients-list">
      {patients.length === 0 ? (
        <p className="empty-state">Нет пациентов</p>
      ) : (
        patients.map((p, i) => (
          <div key={i} className="patient-card">
            <div className="patient-info">
              <h3>
                <button
                  type="button"
                  className="patient-link"
                  onClick={() => onSelectPatient(p.id, p.name)}
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
                onClick={() => onSelectPatient(p.id, p.name)}
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
