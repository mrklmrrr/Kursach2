import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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

export default function InstrumentalInvestigationsSection({ results, loading }) {
  const [expandedById, setExpandedById] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [previewPhotoSrc, setPreviewPhotoSrc] = useState('');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewViewportMode, setPreviewViewportMode] = useState('desktop');

  const openPreview = (src) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    setPreviewViewportMode(isMobile ? 'mobile' : 'desktop');
    setPreviewPhotoSrc(src);
    setPreviewZoom(1);
  };

  const closePreview = () => {
    setPreviewPhotoSrc('');
    setPreviewZoom(1);
  };

  const zoomIn = () => {
    setPreviewZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))));
  };

  const zoomOut = () => {
    setPreviewZoom((prev) => Math.max(0.4, Number((prev - 0.2).toFixed(2))));
  };

  const resetZoom = () => {
    setPreviewZoom(1);
  };

  const toggleExpanded = (resultId) => {
    const key = String(resultId);
    setExpandedById((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sorted = useMemo(() => {
    const list = Array.isArray(results) ? [...results] : [];
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [results]);

  const filtered = showAll ? sorted : sorted.slice(0, 4);

  if (loading) {
    return <p className="empty-info">Загрузка инструментальных исследований…</p>;
  }

  if (!sorted.length) {
    return (
      <p className="empty-info">
        Пока нет сохранённых инструментальных исследований. Когда врач внесёт результаты в вашу карту, они появятся здесь.
      </p>
    );
  }

  const previewModal =
    previewPhotoSrc && typeof document !== 'undefined'
      ? createPortal(
          <div
            className={`patient-lab-photo-preview-modal${previewViewportMode === 'mobile' ? ' mobile' : ''}`}
            role="dialog"
            aria-modal="true"
            onClick={closePreview}
          >
            <div className="patient-lab-photo-preview-content" onClick={(e) => e.stopPropagation()}>
              <div className="patient-lab-photo-preview-toolbar">
                <div className="patient-lab-photo-preview-zoom-controls">
                  <button type="button" className="btn btn-outline btn-small" onClick={zoomOut}>
                    -
                  </button>
                  <span className="patient-lab-photo-preview-zoom-label">{Math.round(previewZoom * 100)}%</span>
                  <button type="button" className="btn btn-outline btn-small" onClick={zoomIn}>
                    +
                  </button>
                  <button type="button" className="btn btn-outline btn-small" onClick={resetZoom}>
                    100%
                  </button>
                </div>
                <button
                  type="button"
                  className="patient-lab-photo-preview-close"
                  aria-label="Закрыть предпросмотр"
                  onClick={closePreview}
                >
                  ×
                </button>
              </div>
              <div className="patient-lab-photo-preview-canvas">
                <img
                  src={previewPhotoSrc}
                  alt="Предпросмотр фото исследования"
                  style={{ transform: `scale(${previewZoom})` }}
                />
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="patient-lab-section">
      <div className="patient-lab-section-header">
        <span className="patient-lab-section-title">Инструментальные исследования</span>
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
                <h4 className="patient-lab-title">{result.researchTypeId?.name || 'Исследование'}</h4>
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
                        Заключение: <strong>{STATUS_LABELS[result.overallStatus] || result.overallStatus}</strong>
                      </p>
                    ) : null}
                  </div>
                )}
                {Array.isArray(result.studyPhotos) && result.studyPhotos.length > 0 && (
                  <div className="patient-lab-photo-block">
                    <p className="patient-lab-photo-title">Фото к заключению</p>
                    <div className="patient-lab-photo-grid">
                      {result.studyPhotos.map((photo, idx) => {
                        const src = photo?.src || photo;
                        if (!src) return null;
                        return (
                          <button
                            key={`${id}-photo-${idx}`}
                            type="button"
                            className="patient-lab-photo-thumb"
                            onClick={() => openPreview(src)}
                          >
                            <img src={src} alt={`Фото исследования ${idx + 1}`} />
                          </button>
                        );
                      })}
                    </div>
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
      {previewModal}
    </div>
  );
}
