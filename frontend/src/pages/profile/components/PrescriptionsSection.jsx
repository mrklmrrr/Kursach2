import { useEffect, useMemo, useState } from 'react';
import { prescriptionApi } from '../../../services/prescriptionApi';
import { useAuth } from '../../../hooks/useAuth';

export default function PrescriptionsSection() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [expandedById, setExpandedById] = useState({});

  useEffect(() => {
    if (user?.role !== 'patient') return;
    let cancelled = false;
    prescriptionApi
      .list()
      .then((res) => {
        if (!cancelled) setList(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setErr('Не удалось загрузить назначения');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.role, user?.id]);

  const sorted = useMemo(() => {
    if (user?.role !== 'patient') return [];
    const items = Array.isArray(list) ? [...list] : [];
    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [list, user?.role]);

  if (user?.role !== 'patient') return null;

  const toggleExpanded = (id) => {
    const key = String(id);
    setExpandedById((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="section-card section-card--lux">
      <h3>Назначение</h3>
      {loading && <p className="empty-info">Загрузка...</p>}
      {err && <p className="empty-info">{err}</p>}
      {!loading && !err && sorted.length === 0 && (
        <p className="empty-info">Назначения появятся после приёма, когда врач оформит рекомендации.</p>
      )}
      <ul className="prescription-list">
        {sorted.map((doc, index) => {
          const key = String(doc._id || `${doc.createdAt || 'date'}-${index}`);
          const expanded = Boolean(expandedById[key]);
          return (
          <li key={key} className="prescription-item">
            <button
              type="button"
              className="prescription-toggle"
              aria-expanded={expanded}
              onClick={() => toggleExpanded(key)}
            >
              <span className="prescription-head">
                <strong>{doc.doctorName || 'Врач'}</strong>
                <span className="prescription-date">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleString('ru-RU') : ''}
                </span>
              </span>
              <span className="prescription-chevron" aria-hidden>
                {expanded ? '▾' : '▸'}
              </span>
            </button>
            {expanded && (
              <div className="prescription-body">
                <ul>
                  {(doc.items || []).map((it, i) => (
                    <li key={i}>
                      {it.name}
                      {it.dosage ? ` — ${it.dosage}` : ''}
                      {it.notes ? ` (${it.notes})` : ''}
                    </li>
                  ))}
                </ul>
                {doc.recommendations ? (
                  <p className="prescription-recommendations">
                    <strong>Рекомендации:</strong> {doc.recommendations}
                  </p>
                ) : null}
              </div>
            )}
          </li>
          );
        })}
      </ul>
    </section>
  );
}
