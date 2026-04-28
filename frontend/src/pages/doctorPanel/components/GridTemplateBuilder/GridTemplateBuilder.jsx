import { useCallback } from 'react';
import { adjustHeaders, adjustColUnits, initGridCells, resizeTemplateCells, mergeCellDefaults } from '@utils/gridUtils';

/**
 * Компонент конструктора табличных шаблонов (бланков)
 */
export default function GridTemplateBuilder({
  editingTemplateId,
  templateName,
  onTemplateNameChange,
  rows,
  onRowsChange,
  cols,
  onColsChange,
  rowHeaders,
  setRowHeaders,
  colHeaders,
  setColHeaders,
  colUnits,
  setColUnits,
  cells,
  updateCell,
  onSave,
  onCancel,
}) {
  const handleRowsChange = useCallback((n) => {
    const v = Math.min(20, Math.max(1, Number(n) || 1));
    onRowsChange(v);
    setRowHeaders((prev) => adjustHeaders(v, prev, 'Строка'));
    setCells((prev) => resizeTemplateCells(prev, v, cols));
  }, [cols, onRowsChange, setRowHeaders, setCells]);

  const handleColsChange = useCallback((n) => {
    const v = Math.min(12, Math.max(1, Number(n) || 1));
    onColsChange(v);
    setColHeaders((prev) => adjustHeaders(v, prev, 'Столбец'));
    setColUnits((prev) => adjustColUnits(v, prev));
    setCells((prev) => resizeTemplateCells(prev, rows, v));
  }, [rows, onColsChange, setColHeaders, setColUnits, setCells]);

  const updateTbCell = useCallback((row, col, patch) => {
    updateCell(row, col, patch);
  }, [updateCell]);

  return (
    <div className="research-form lab-template-builder">
      <div className="lab-template-builder-top">
        <div>
          <h3 className="lab-template-builder-title">
            {editingTemplateId ? 'Редактирование бланка' : 'Новый бланк (шаблон таблицы)'}
          </h3>
          <p className="lab-help lab-template-builder-sub">
            Укажите <strong>название анализа</strong> — по нему вы и пациент будете находить записи. Нажмите «Сохранить бланк», чтобы использовать таблицу как общепринятый перечень показателей.
          </p>
        </div>
        <button type="button" className="btn btn-primary lab-save-blank-btn" onClick={onSave}>
          Сохранить бланк (шаблон)
        </button>
      </div>
      <div className="form-group">
        <label>Название анализа (шаблона)</label>
        <input 
          type="text" 
          value={templateName} 
          onChange={(e) => onTemplateNameChange(e.target.value)} 
          placeholder="Например: Общий анализ крови, Биохимия расширенная" 
        />
      </div>
      <div className="lab-dims-row">
        <div className="form-group">
          <label>Строк</label>
          <input type="number" min={1} max={20} value={rows} onChange={(e) => handleRowsChange(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Столбцов</label>
          <input type="number" min={1} max={12} value={cols} onChange={(e) => handleColsChange(e.target.value)} />
        </div>
      </div>
      <p className="lab-help">
        Подпишите строки слева и столбцы сверху. В пустых ячейках справа можно сразу ввести типовые значения — они сохранятся в шаблоне и подставятся при «Добавить исследование» (их
        можно изменить перед сохранением в карту). Полная таблица с комментарием и оценкой — на шаге ввода анализа.
      </p>

      <div className="lab-datagrid-shell">
        <div className="lab-dg-toolbar" role="toolbar" aria-label="Размер таблицы">
          <span className="lab-dg-toolbar-title">Структура</span>
          <button
            type="button"
            className="lab-dg-tool lab-dg-tool--add"
            title="Добавить строку"
            disabled={rows >= 20}
            onClick={() => handleRowsChange(rows + 1)}
          >
            <span className="material-icons" aria-hidden>add</span>
            <span className="lab-dg-tool-text">Строка</span>
          </button>
          <button
            type="button"
            className="lab-dg-tool lab-dg-tool--remove"
            title="Удалить последнюю строку"
            disabled={rows <= 1}
            onClick={() => handleRowsChange(rows - 1)}
          >
            <span className="material-icons" aria-hidden>remove</span>
          </button>
          <span className="lab-dg-toolbar-divider" />
          <button
            type="button"
            className="lab-dg-tool lab-dg-tool--add"
            title="Добавить столбец"
            disabled={cols >= 12}
            onClick={() => handleColsChange(cols + 1)}
          >
            <span className="material-icons" aria-hidden>add</span>
            <span className="lab-dg-tool-text">Столбец</span>
          </button>
          <button
            type="button"
            className="lab-dg-tool lab-dg-tool--remove"
            title="Удалить последний столбец"
            disabled={cols <= 1}
            onClick={() => handleColsChange(cols - 1)}
          >
            <span className="material-icons" aria-hidden>remove</span>
          </button>
        </div>
        <div className="lab-grid-scroll lab-grid-scroll--datagrid">
          <table className="lab-grid-table lab-grid-template-table lab-datagrid">
            <thead>
              <tr>
                <th className="lab-corner lab-corner-sticky">Показатель</th>
                {colHeaders.map((h, c) => (
                  <th key={c} className="lab-header-th lab-dg-col-title">
                    <div className="lab-header-input-wrap">
                      <input
                        type="text"
                        className="lab-header-input"
                        value={h}
                        autoComplete="off"
                        placeholder={`Столбец ${c + 1}`}
                        onChange={(e) => {
                          const next = [...colHeaders];
                          next[c] = e.target.value;
                          setColHeaders(next);
                        }}
                      />
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                <th scope="row" className="lab-header-th lab-row-label lab-sticky-col lab-template-units-label">
                  Ед. изм.
                </th>
                {Array.from({ length: cols }).map((_, c) => (
                  <th key={`cu-${c}`} className="lab-header-th lab-template-unit-th">
                    <input
                      type="text"
                      className="lab-header-input lab-col-unit-input"
                      value={colUnits[c] || ''}
                      autoComplete="off"
                      placeholder="г/л, ммоль/л…"
                      onChange={(e) => {
                        const next = adjustColUnits(cols, colUnits);
                        next[c] = e.target.value;
                        setColUnits(next);
                      }}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowHeaders.map((rh, r) => (
                <tr key={r} className={r % 2 === 1 ? 'lab-dg-row-alt' : ''}>
                  <th className="lab-header-th lab-row-label lab-sticky-col" scope="row">
                    <div className="lab-header-input-wrap">
                      <input
                        type="text"
                        className="lab-header-input lab-row-header"
                        value={rh}
                        autoComplete="off"
                        placeholder={`Строка ${r + 1}`}
                        onChange={(e) => {
                          const next = [...rowHeaders];
                          next[r] = e.target.value;
                          setRowHeaders(next);
                        }}
                      />
                    </div>
                  </th>
                  {Array.from({ length: cols }).map((_, c) => {
                    const cell =
                      cells.find((x) => x.row === r && x.col === c) || {
                        row: r,
                        col: c,
                        value: '',
                        comment: '',
                        status: 'normal'
                      };
                    return (
                      <td key={c} className="lab-template-cell">
                        <input
                          type="text"
                          className="lab-template-cell-input"
                          placeholder="Значение"
                          autoComplete="off"
                          value={cell.value}
                          onChange={(e) => updateTbCell(r, c, { value: e.target.value })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-primary" onClick={onSave}>
          Сохранить бланк (шаблон)
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Закрыть без сохранения
        </button>
      </div>
    </div>
  );
}