import { STATUS_OPTIONS } from '@constants';

/**
 * Компонент таблицы для заполнения сеточных результатов
 */
export default function GridDataEntry({
  gridTemplate,
  gridCells,
  updateGridCell,
}) {
  if (!gridTemplate) return null;

  return (
    <div className="lab-grid-fill">
      <h4>Заполнение таблицы</h4>
      <p className="lab-help">
        Как в журнале лабораторных данных: по каждому пересечению строки и столбца — три поля в одной строке таблицы (значение, комментарий, оценка).
      </p>
      <div className="lab-datagrid-shell">
        <div className="lab-grid-scroll lab-grid-scroll--datagrid">
          <table className="lab-grid-table lab-datagrid lab-datagrid--entry">
            <thead>
              <tr>
                <th rowSpan={2} className="lab-corner lab-corner-sticky">
                  Показатель
                </th>
                {gridTemplate.colHeaders.map((h, c) => (
                  <th key={`ct-${c}`} colSpan={3} className="lab-dg-col-title">
                    {h}
                  </th>
                ))}
              </tr>
              <tr>
                {gridTemplate.colHeaders.flatMap((_, c) => {
                  const colUnit = (gridTemplate.colUnits && gridTemplate.colUnits[c]) || '';
                  return ['Значение', 'Комментарий', 'Оценка'].map((sub, k) => (
                    <th key={`cs-${c}-${k}`} className="lab-dg-subhead">
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
              {Array.from({ length: gridTemplate.rows }, (_, r) => (
                <tr key={r} className={r % 2 === 1 ? 'lab-dg-row-alt' : ''}>
                  <th scope="row" className="lab-row-label lab-sticky-col">
                    {gridTemplate.rowHeaders[r]}
                  </th>
                  {Array.from({ length: gridTemplate.cols }, (_, c) => {
                    const cell = gridCells.find((x) => x.row === r && x.col === c) || {
                      row: r,
                      col: c,
                      value: '',
                      comment: '',
                      status: 'normal'
                    };
                    const st = cell.status || 'normal';
                    return (
                      [
                        <td key={`${r}-${c}-v`} className="lab-dg-td lab-dg-td--val" data-status={st}>
                          <input
                            type="text"
                            className="lab-dg-input"
                            placeholder="—"
                            value={cell.value}
                            autoComplete="off"
                            onChange={(e) => updateGridCell(r, c, { value: e.target.value })}
                          />
                        </td>,
                        <td key={`${r}-${c}-m`} className="lab-dg-td lab-dg-td--comment" data-status={st}>
                          <textarea
                            className="lab-dg-textarea"
                            rows={2}
                            placeholder="Комментарий"
                            value={cell.comment}
                            onChange={(e) => updateGridCell(r, c, { comment: e.target.value })}
                          />
                        </td>,
                        <td key={`${r}-${c}-s`} className="lab-dg-td lab-dg-td--status" data-status={st}>
                          <select
                            className="lab-dg-select"
                            value={cell.status}
                            onChange={(e) => updateGridCell(r, c, { status: e.target.value })}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      ]
                    );
                  }).flat()}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}