import { isTemplateGrid } from '@utils/gridUtils';

/**
 * Компонент списка/таблицы шаблонов (бланков)
 */
export default function GridTemplatesList({
  templates,
  onTemplateSelect,
  onEditTemplate,
  onDeleteTemplate,
  searchQuery,
  onSearchChange,
}) {
  const visibleTemplates = templates.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return String(t.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="lab-templates-section">
      <button 
        type="button" 
        className="btn btn-outline lab-templates-toggle" 
        onClick={() => {}}
      >
        Бланки и шаблоны таблиц
      </button>

      <div className="lab-templates-panel">
        <h3>Бланки и шаблоны таблиц</h3>
        <p className="lab-help">
          Сохраните таблицу под понятным названием (как принято для анализа крови) — затем находите её через поиск и выбирайте при вводе. В ячейках можно задать типовые показатели; при вводе результата добавляются комментарий и оценка по каждой ячейке и общие поля ниже.
        </p>
        {visibleTemplates.length === 0 ? (
          <p className="lab-empty-filter">Нет шаблонов по запросу.</p>
        ) : (
          <div className="lab-templates-table-wrap">
            <table className="lab-templates-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">Название анализа</th>
                  <th scope="col" className="lab-templates-col-size">Размер</th>
                  <th scope="col">Показатели (строки бланка)</th>
                  <th scope="col" className="lab-templates-col-actions">Действия</th>
                </tr>
              </thead>
              <tbody>
                {visibleTemplates.map((t) => {
                  const gt = t.gridTemplate || {};
                  const rowHeaders = Array.isArray(gt.rowHeaders) ? gt.rowHeaders : [];
                  const previewList = rowHeaders.slice(0, 8);
                  const preview = previewList.join(' · ');
                  const rest = rowHeaders.length > 8 ? ` … ещё ${rowHeaders.length - 8}` : '';
                  const fullTitle = rowHeaders.join('\n');
                  return (
                    <tr
                      key={t._id}
                      className="lab-templates-table-row"
                      title="Нажмите на строку, чтобы открыть ввод результата по этому бланку"
                      onClick={() => onTemplateSelect(t)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onTemplateSelect(t);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                    >
                      <td className="lab-templates-td-name">
                        <strong className="lab-templates-link-name">{t.name}</strong>
                      </td>
                      <td>{gt.rows}×{gt.cols}</td>
                      <td className="lab-templates-td-preview" title={fullTitle || '—'}>
                        {rowHeaders.length > 0 ? (
                          <>
                            {preview}
                            {rest}
                          </>
                        ) : (
                          <span className="lab-templates-muted">—</span>
                        )}
                      </td>
                      <td
                        className="lab-templates-td-actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {t.createdBy ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline btn-small"
                              onClick={() => onEditTemplate(t)}
                            >
                              Изменить бланк
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-small btn-danger-text"
                              onClick={() => onDeleteTemplate(t._id)}
                            >
                              Удалить
                            </button>
                          </>
                        ) : (
                          <span className="lab-templates-sys">Системный бланк</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="lab-help lab-templates-table-foot">
              Клик по <strong>строке</strong> открывает ввод результата: в большой таблице ниже сразу появятся все <strong>названия показателей</strong> из бланка.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}