/**
 * Утилиты для работы с сетками (табличными шаблонами) исследований
 */

/** Согласовать размер сетки с массивами подписей (в БД могли быть укорочены заголовки) */
export function adjustHeaders(len, prev, prefix) {
  const out = [...prev];
  while (out.length < len) out.push(`${prefix} ${out.length + 1}`);
  return out.slice(0, len);
}

export function initGridCells(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ row: r, col: c, value: '', comment: '', status: 'normal' });
    }
  }
  return cells;
}

export function adjustColUnits(len, prev) {
  const out = [...(prev || [])];
  while (out.length < len) out.push('');
  return out.slice(0, len).map((s) => String(s || '').trim());
}

/** Согласовать размер сетки с массивами подписей (в БД могли быть укорочены заголовки) */
export function normalizeGridTemplate(gt) {
  if (!gt) return { rows: 0, cols: 0, rowHeaders: [], colHeaders: [], colUnits: [] };
  const rows = Math.max(0, Number(gt.rows) || 0);
  const cols = Math.max(0, Number(gt.cols) || 0);
  const rowHeaders = adjustHeaders(rows, Array.isArray(gt.rowHeaders) ? gt.rowHeaders : [], 'Строка');
  const colHeaders = adjustHeaders(cols, Array.isArray(gt.colHeaders) ? gt.colHeaders : [], 'Столбец');
  const colUnits = adjustColUnits(cols, Array.isArray(gt.colUnits) ? gt.colUnits : []);
  return { rows, cols, rowHeaders, colHeaders, colUnits };
}

export function formatWithUnit(value, unit) {
  const u = unit && String(unit).trim();
  if (value === '' || value == null) return '—';
  const v = typeof value === 'number' && Number.isFinite(value) ? String(value) : String(value);
  if (!u) return v;
  return `${v}\u00A0${u}`;
}

export function isTemplateGrid(t) {
  if (!t) return false;
  return (
    t.templateMode === 'grid' ||
    (Number(t.gridTemplate?.rows) > 0 && Number(t.gridTemplate?.cols) > 0)
  );
}

export function resizeTemplateCells(prev, rows, cols) {
  const next = initGridCells(rows, cols);
  for (const cell of prev) {
    if (cell.row < rows && cell.col < cols) {
      const idx = next.findIndex((x) => x.row === cell.row && x.col === cell.col);
      if (idx >= 0) next[idx] = { ...next[idx], ...cell };
    }
  }
  return next;
}

export function mergeCellDefaults(rows, cols, defaults) {
  const cells = initGridCells(rows, cols);
  if (!Array.isArray(defaults)) return cells;
  for (const d of defaults) {
    const r = Number(d.row);
    const c = Number(d.col);
    if (!Number.isFinite(r) || !Number.isFinite(c) || r < 0 || c < 0 || r >= rows || c >= cols) continue;
    const idx = cells.findIndex((x) => x.row === r && x.col === c);
    if (idx >= 0) {
      cells[idx] = {
        ...cells[idx],
        value: d.value != null && d.value !== '' ? d.value : '',
        comment: d.comment != null ? String(d.comment) : '',
        status: ['normal', 'deviation', 'severe'].includes(d.status) ? d.status : 'normal'
      };
    }
  }
  return cells;
}