import { normalizeGridTemplate } from '@utils/gridUtils';

/**
 * Компонент отображения истории результатов исследований
 */
export default function ResearchResultsList({
  results,
  expandedResults,
  onToggleExpanded,
  formatDateTime,
  getGridTemplateForResult,
  onOpenTemplate,
}) {
  if (results.length === 0) {
    return (
      <div className="research-results">
        <h3>История по пациенту</h3>
        <p>Исследования пока не проводились.</p>
      </div>
    );
  }

  return (
    <div className="research-results">
      <h3>История по пациенту</h3>
      {results.map((result) => {
        const gt = getGridTemplateForResult(result);
        const hasGrid = result.gridResults && result.gridResults.length > 0 && gt;
        const isExpanded = expandedResults[result._id];
        return (
          <div key={result._id} className="research-result-card">
            <div 
              className="result-header result-header--clickable" 
              onClick={() => onToggleExpanded(result._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleExpanded(result._id);
                }
              }}
            >
              <div className="result-header-left">
                <span className={`result-expand-icon${isExpanded ? ' expanded' : ''}`}>
                  <span className="material-icons">expand_more</span>
                </span>
                <div className="result-header-info">
                  <h4>{result.researchTypeId?.name || 'Тип'}</h4>
                  <span className="result-date">{formatDateTime(result.date)}</span>
                </div>
              </div>
              <div className="result-header-right">
                {hasGrid ? (
                  <span className="status-badge scheduled">Таблица</span>
                ) : (
                  <span className="status-badge paid">Форма</span>
                )}
              </div>
            </div>
            
            {isExpanded && (
              <div className="result-body">
                {hasGrid && gt ? (
                  <div className="lab-grid-display">
                    <div className="lab-grid-scroll">
                      <table className="lab-grid-table lab-datagrid">
                        <thead>
                          <tr>
                            <th rowSpan={2} className="lab-corner">Показатель</th>
                            {gt.colHeaders.map((h, c) => (
                              <th key={c} colSpan={3} className="lab-dg-col-title">{h}</th>
                            ))}
                          </tr>
                          <tr>
                            {gt.colHeaders.flatMap((_, c) => {
                              const colUnit = (gt.colUnits && gt.colUnits[c]) || '';
                              return ['Значение', 'Комментарий', 'Оценка'].map((sub, k) => (
                                <th key={k} className="lab-dg-subhead">
                                  {k === 0 && colUnit ? (
                                    <>
                                      Значение
                                      <span className="lab-dg-th-unit">{colUnit}</span>
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
                            <tr key={r} className={r % 2 === 1 ? 'lab-dg-row-alt' : ''}>
                              <th scope="row" className="lab-row-label">{gt.rowHeaders[r]}</th>
                              {Array.from({ length: gt.cols }, (_, c) => {
                                const cell = result.gridResults?.find((x) => x.row === r && x.col === c) || {};
                                return (
                                  [
                                    <td key={`${r}-${c}-v`} className="lab-dg-td">{cell.value || '—'}</td>,
                                    <td key={`${r}-${c}-m`} className="lab-dg-td">{cell.comment || '—'}</td>,
                                    <td key={`${r}-${c}-s`} className="lab-dg-td">{cell.status || 'Норма'}</td>
                                  ]
                                );
                              }).flat()}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="result-fields">
                    {Object.entries(result.results || {}).map(([key, value]) => (
                      <div key={key} className="result-field-row">
                        <span className="result-field-label">{key}:</span>
                        <span className="result-field-value">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {result.studyNote && (
                  <div className="result-study-note">
                    <strong>Заключение врача:</strong>
                    <p>{result.studyNote}</p>
                  </div>
                )}
                
                <div className="result-actions">
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => onOpenTemplate(result)}
                  >
                    Открыть бланк
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}