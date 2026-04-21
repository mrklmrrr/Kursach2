import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import '../marketing.css';
import './Triage.css';

const SYMPTOMS = [
  { id: 'fever', label: 'Температура / озноб', tags: ['терапевт'] },
  { id: 'throat', label: 'Боль в горле, насморк', tags: ['терапевт', 'ЛОР'] },
  { id: 'cough', label: 'Кашель, одышка', tags: ['терапевт', 'пульмонолог'] },
  { id: 'stomach', label: 'Боль в животе, тошнота', tags: ['гастроэнтеролог'] },
  { id: 'heart', label: 'Давление, боль в груди', tags: ['кардиолог'] },
  { id: 'skin', label: 'Сыпь, зуд кожи', tags: ['дерматолог'] },
  { id: 'joints', label: 'Суставы, отёки', tags: ['терапевт', 'ревматолог'] },
  { id: 'head', label: 'Головная боль, головокружение', tags: ['невролог', 'терапевт'] }
];

function pickSpecialty(selectedIds) {
  if (selectedIds.length === 0) return { label: 'Терапевт', query: 'терапевт', note: 'Стартовая линия для большинства случаев.' };
  const scores = {};
  selectedIds.forEach((id) => {
    const s = SYMPTOMS.find((x) => x.id === id);
    if (!s) return;
    s.tags.forEach((t) => {
      scores[t] = (scores[t] || 0) + 1;
    });
  });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const best = sorted[0]?.[0] || 'терапевт';
  return {
    label: best.charAt(0).toUpperCase() + best.slice(1),
    query: best,
    note: 'Подбор ориентировочный; окончательное решение — на приёме.'
  };
}

export default function Triage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const result = useMemo(() => pickSpecialty(selected), [selected]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const goDoctors = () => {
    const q = encodeURIComponent(result.query);
    navigate(`${ROUTES.DOCTORS}?q=${q}`);
  };

  return (
    <div className="marketing-page triage-page">
      <header className="marketing-nav">
        <Link to="/" className="marketing-brand">
          <span className="material-icons">health_and_safety</span>
          Triage
        </Link>
        <nav className="marketing-nav-links">
          <Link to="/">На главную</Link>
          <Link to={ROUTES.DOCTORS}>Врачи</Link>
        </nav>
      </header>

      <section className="marketing-hero">
        <h1>Подбор специальности за 30 секунд</h1>
        <p className="marketing-lead">
          Отметьте симптомы — мы подскажем направление и откроем каталог врачей с фильтром по специальности.
          Это не диагноз, а маршрутизация к правильному специалисту.
        </p>
      </section>

      <section className="marketing-section">
        <h2>Симптомы</h2>
        <div className="triage-chips">
          {SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`triage-chip ${selected.includes(s.id) ? 'active' : ''}`}
              onClick={() => toggle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="marketing-section triage-result-block">
        <div className="marketing-card triage-result-card">
          <h3>Рекомендуем начать с: {result.label}</h3>
          <p>{result.note}</p>
          <div className="marketing-cta-row" style={{ marginBottom: 0 }}>
            <button type="button" className="marketing-btn marketing-btn-primary" onClick={goDoctors}>
              Открыть врачей с фильтром
            </button>
            <Link to="/plans" className="marketing-btn marketing-btn-ghost">
              Тарифы клинике
            </Link>
          </div>
        </div>
      </section>

      <footer className="marketing-footer">
        <Link to="/">← На лендинг</Link>
      </footer>
    </div>
  );
}
