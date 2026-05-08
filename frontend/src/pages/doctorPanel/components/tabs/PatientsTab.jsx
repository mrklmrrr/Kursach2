import { useMemo, useState } from 'react';
import { EmptyState } from '../../../../components/ui';

export default function PatientsTab({ patients, onSelectPatient }) {
  const [search, setSearch] = useState('');

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      const name = String(patient.name || '').toLowerCase();
      const phone = String(patient.phone || '').toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [patients, search]);

  return (
    <div className="patients-tab">
      <div className="patients-search">
        <span className="material-icons">search</span>
        <input
          type="text"
          className="patients-search-input"
          placeholder="Поиск пациента по имени или телефону"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="patients-list">
        {patients.length === 0 ? (
          <EmptyState
            variant="plain"
            icon="group"
            title="Пока нет пациентов"
            description="После первых записей и консультаций список заполнится автоматически."
          />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            variant="plain"
            icon="search_off"
            title="Пациенты не найдены"
            description="Измените запрос и попробуйте снова."
          />
        ) : (
          filteredPatients.map((p, i) => (
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
    </div>
  );
}
