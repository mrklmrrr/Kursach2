import { useEffect, useState } from 'react';
import { prescriptionApi } from '../../../services/prescriptionApi';
import { useAuth } from '../../../hooks/useAuth';

export default function PrescriptionsSection() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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

  if (user?.role !== 'patient') return null;

  return (
    <section className="section-card">
      <h3>E-назначения после консультаций</h3>
      {loading && <p className="empty-info">Загрузка...</p>}
      {err && <p className="empty-info">{err}</p>}
      {!loading && !err && list.length === 0 && (
        <p className="empty-info">Назначения появятся после приёма, когда врач оформит рекомендации.</p>
      )}
      <ul className="prescription-list">
        {list.map((doc) => (
          <li key={doc._id} className="prescription-item">
            <div className="prescription-head">
              <strong>{doc.doctorName}</strong>
              <span className="prescription-date">
                {doc.createdAt ? new Date(doc.createdAt).toLocaleString('ru-RU') : ''}
              </span>
            </div>
            <ul>
              {(doc.items || []).map((it, i) => (
                <li key={i}>
                  {it.name}
                  {it.dosage ? ` — ${it.dosage}` : ''}
                  {it.notes ? ` (${it.notes})` : ''}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
