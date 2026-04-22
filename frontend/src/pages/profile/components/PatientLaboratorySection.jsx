import { useState, useMemo, useEffect } from 'react';
import { medicalRecordApi } from '../../../services/medicalRecordApi';
import { formatDateTime } from '../utils/profileUtils';

const STATUS_LABELS = {
  normal: 'Норма',
  deviation: 'Отклонение от нормы',
  severe: 'Сильное отклонение'
};

function adjustHeaders(len, prev, prefix) {
  const out = [...prev];
  while (out.length < len) out.push(`${prefix} ${out.length + 1}`);
  return out.slice(0, len);
}

function adjustColUnits(len, prev) {
  const out = [...(prev || [])];
  while (out.length < len) out.push('');
  return out.slice(0, len).map((s) => String(s || '').trim());
}

function normalizeGridTemplate(gt) {
  if (!gt) return { rows: 0, cols: 0, rowHeaders: [], colHeaders: [], colUnits: [] };
  const rows = Math.max(0, Number(gt.rows) || 0);
  const cols = Math.max(0, Number(gt.cols) || 0);
  const rowHeaders = adjustHeaders(rows, Array.isArray(gt.rowHeaders) ? gt.rowHeaders : [], 'Строка');
  const colHeaders = adjustHeaders(cols, Array.isArray(gt.colHeaders) ? gt.colHeaders : [], 'Столбец');
  const colUnits = adjustColUnits(cols, Array.isArray(gt.colUnits) ? gt.colUnits : []);
  return { rows, cols, rowHeaders, colHeaders, colUnits };
}

function gridTemplateForResult(result) {
  const rt = result.researchTypeId;
  if (!rt?.gridTemplate) return null;
  const n = normalizeGridTemplate(rt.gridTemplate);
  if (n.rows < 1 || n.cols < 1) return null;
  return n;
}

function templateUnitForFieldName(researchType, fieldName) {
  if (!researchType || !fieldName) return '';
  const tpl = Array.isArray(researchType.template) ? researchType.template : [];
  const f = tpl.find((x) => x && String(x.name) === String(fieldName));
  return (f && f.unit && String(f.unit).trim()) || '';
}

function formatWithUnit(value, unit) {
  const u = unit && String(unit).trim();
  if (value === '' || value == null) return '—';
  const v = typeof value === 'number' && Number.isFinite(value) ? String(value) : String(value);
  if (!u) return v;
  return `${v}\u00A0${u}`;
}

export default function PatientLaboratorySection({ results, loading }) {
  const [insightById, setInsightById] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [errorById, setErrorById] = useState({});
  const [expandedById, setExpandedById] = useState({});
  const [showAll, setShowAll] = useState(false);




  const toggleExpanded = (resultId) => {
    const key = String(resultId);
    setExpandedById((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sorted = useMemo(() => {
    const list = Array.isArray(results) ? [...results] : [];
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [results]);

  const filtered = showAll ? sorted : sorted.slice(0, 4);

  const fetchInsight = async (resultId) => {
    setLoadingId(resultId);
    setErrorById((prev) => ({ ...prev, [resultId]: '' }));
    try {
      const { data } = await medicalRecordApi.postPatientLabInsight(resultId);
      setInsightById((prev) => ({
        ...prev,
        [resultId]: {
          text: data.insight,
          source: data.source,
          disclaimer: data.disclaimer,
          aiConfigured: data.aiConfigured,
          fallbackReason: data.fallbackReason
        }
      }));
    } catch (e) {
      setErrorById((prev) => ({
        ...prev,
        [resultId]: e.response?.data?.message || 'Не удалось получить пояснение'
      }));
    } finally {
      setLoadingId(null);
    }
  };

  if (loading) {
    return <p className="empty-info">Загрузка анализов…</p>;
  }

  if (!sorted.length) {
    return (
      <p className="empty-info">
        Пока нет сохранённых лабораторных исследований. Когда врач внесёт результаты в вашу карту, они появятся здесь.
      </p>
    );
  }

  return (
    <div className="patient-lab-section">
      <div className="patient-lab-section-header">
        <span className="patient-lab-section-title">Лабораторные анализы</span>
      </div>
      {filtered.map((result) => {
        const gt = gridTemplateForResult(result);
        const hasGrid = result.gridResults && result.gridResults.length > 0 && gt;
        const id = result._id;

        const expanded = Boolean(expandedById[String(id)]);

        return (
          <article key={id} className="patient-lab-card">
            <button
              type="button"
              className="patient-lab-card-toggle"
              aria-expanded={expanded}
              onClick={() => toggleExpanded(id)}
            >
              <span className="patient-lab-card-toggle-main">
                <h4 className="patient-lab-title">{result.researchTypeId?.name || 'Анализ'}</h4>
                <span className="patient-lab-meta">{formatDateTime(result.date)}</span>
              </span>
              <span className="patient-lab-chevron" aria-hidden>
                {expanded ? '▾' : '▸'}
              </span>
            </button>

            {expanded ? (
              <div className="patient-lab-card-body">
                <p className="patient-lab-doctor">Врач: {result.doctorName || '—'}</p>

                {(result.studyNote || result.overallStatus) && (
                  <div className="patient-lab-overall">
                    {result.studyNote ? <p className="patient-lab-note">{result.studyNote}</p> : null}
                    {result.overallStatus && result.overallStatus !== 'normal' ? (
                      <p className="patient-lab-overall-badge">
                        Общая отметка врача: <strong>{STATUS_LABELS[result.overallStatus] || result.overallStatus}</strong>
                      </p>
                    ) : null}
                  </div>
                )}

                {hasGrid && (
                  <div className="patient-lab-table-wrap">
                    <table className="patient-lab-table">
                      <thead>
                        <tr>
                          <th rowSpan={2} className="patient-lab-corner">
                            Показатель
                          </th>
                          {gt.colHeaders.map((h, c) => (
                            <th key={c} colSpan={3} className="patient-lab-colgroup">
                              {h}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {gt.colHeaders.flatMap((_, c) => {
                            const colUnit = (gt.colUnits && gt.colUnits[c]) || '';
                            return ['Значение', 'Комментарий', 'Оценка'].map((sub, k) => (
                              <th key={`${c}-${k}`} className="patient-lab-sub">
                                {k === 0 && colUnit ? (
                                  <>
                                    Значение
                                    <span className="patient-lab-th-unit">{colUnit}</span>
                                  </>
                                ) : (
                                  sub
                                )}
                              </th>
                            ));
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: gt.rows }, (_, r) => (
                          <tr key={r}>
                            <th className="patient-lab-rowname">{gt.rowHeaders[r]}</th>
                            {Array.from({ length: gt.cols }, (_, c) => {
                              const cell = (result.gridResults || []).find((x) => x.row === r && x.col === c);
                              const st = cell?.status || 'normal';
                              const colUnit = (gt.colUnits && gt.colUnits[c]) || '';
                              const val =
                                cell?.value !== '' && cell?.value != null
                                  ? formatWithUnit(cell.value, colUnit)
                                  : '—';
                              return [
                                <td key={`${r}-${c}-v`} data-st={st}>
                                  {val}
                                </td>,
                                <td key={`${r}-${c}-m`} data-st={st}>
                                  {cell?.comment || '—'}
                                </td>,
                                <td key={`${r}-${c}-s`} data-st={st}>
                                  {STATUS_LABELS[st] || st}
                                </td>
                              ];
                            }).flat()}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {!hasGrid && (
                  <ul className="patient-lab-list">
                    {(result.results || []).map((r, idx) => {
                      const u = (r.unit && String(r.unit).trim()) || templateUnitForFieldName(result.researchTypeId, r.fieldName);
                      return (
                        <li key={idx}>
                          <strong>{r.fieldName}:</strong>{' '}
                          <span className="patient-lab-measured">{formatWithUnit(r.value, u)}</span>
                        </li>
                      );
                    })}
                    {(result.customResults || []).map((cr, idx) => (
                      <li key={`c-${idx}`}>
                        <strong>{cr.name}:</strong>{' '}
                        <span className="patient-lab-measured">{formatWithUnit(cr.value, cr.unit)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="patient-lab-ai">
                  <button
                    type="button"
                    className="btn btn-outline patient-lab-ai-btn"
                    disabled={loadingId === id}
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchInsight(id);
                    }}
                  >
                    {loadingId === id
                      ? 'Формируем пояснение…'
                      : 'Краткая справка'}
                  </button>
                  {errorById[id] ? <p className="patient-lab-ai-err">{errorById[id]}</p> : null}
                  {insightById[id] ? (
                    <div className="patient-lab-insight">
                      {insightById[id].source === 'ai' ? (
                        <span className="patient-lab-insight-tag">Сгенерировано ИИ</span>
                      ) : insightById[id].fallbackReason === 'api_error' ? (
                        <span className="patient-lab-insight-tag patient-lab-insight-tag--warn">
                          Справка без ИИ (сервис недоступен)
                        </span>
                      ) : insightById[id].fallbackReason === 'empty_response' ? (
                        <span className="patient-lab-insight-tag patient-lab-insight-tag--warn">Справка без ИИ (пустой ответ)</span>
                      ) : (
                        <span className="patient-lab-insight-tag">Справка без ИИ</span>
                      )}
                      <div className="patient-lab-insight-text">{insightById[id].text}</div>
                      {insightById[id].disclaimer ? (
                        <p className="patient-lab-disclaimer">{insightById[id].disclaimer}</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </article>
          );
        })}
        {sorted.length > 4 && (
          <button
            type="button"
            className="patient-lab-show-more"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Показать меньше' : `Показать еще (${sorted.length - 4})`}
          </button>
        )}
    </div>
  );
}
