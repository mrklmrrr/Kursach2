import { useState, useEffect, useCallback, useMemo, useRef} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { medicalRecordApi } from '../../services/medicalRecordApi';
import { researchApi } from '../../services/researchApi';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import './ResearchManagement.css';

const STATUS_OPTIONS = [
  { value: 'normal', label: 'Норма' },
  { value: 'deviation', label: 'Отклонение от нормы' },
  { value: 'severe', label: 'Сильное нарушение' }
];

function adjustHeaders(len, prev, prefix) {
  const out = [...prev];
  while (out.length < len) out.push(`${prefix} ${out.length + 1}`);
  return out.slice(0, len);
}

function initGridCells(rows, cols) {
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ row: r, col: c, value: '', comment: '', status: 'normal' });
    }
  }
  return cells;
}

function adjustColUnits(len, prev) {
  const out = [...(prev || [])];
  while (out.length < len) out.push('');
  return out.slice(0, len).map((s) => String(s || '').trim());
}

/** Согласовать размер сетки с массивами подписей (в БД могли быть укорочены заголовки) */
function normalizeGridTemplate(gt) {
  if (!gt) return { rows: 0, cols: 0, rowHeaders: [], colHeaders: [], colUnits: [] };
  const rows = Math.max(0, Number(gt.rows) || 0);
  const cols = Math.max(0, Number(gt.cols) || 0);
  const rowHeaders = adjustHeaders(rows, Array.isArray(gt.rowHeaders) ? gt.rowHeaders : [], 'Строка');
  const colHeaders = adjustHeaders(cols, Array.isArray(gt.colHeaders) ? gt.colHeaders : [], 'Столбец');
  const colUnits = adjustColUnits(cols, Array.isArray(gt.colUnits) ? gt.colUnits : []);
  return { rows, cols, rowHeaders, colHeaders, colUnits };
}

function formatWithUnit(value, unit) {
  const u = unit && String(unit).trim();
  if (value === '' || value == null) return '—';
  const v = typeof value === 'number' && Number.isFinite(value) ? String(value) : String(value);
  if (!u) return v;
  return `${v}\u00A0${u}`;
}

function templateUnitForFieldName(researchType, fieldName) {
  if (!researchType || !fieldName) return '';
  const tpl = Array.isArray(researchType.template) ? researchType.template : [];
  const f = tpl.find((x) => x && String(x.name) === String(fieldName));
  return (f && f.unit && String(f.unit).trim()) || '';
}

function isTemplateGrid(t) {
  if (!t) return false;
  return (
    t.templateMode === 'grid' ||
    (Number(t.gridTemplate?.rows) > 0 && Number(t.gridTemplate?.cols) > 0)
  );
}

function resizeTemplateCells(prev, rows, cols) {
  const next = initGridCells(rows, cols);
  for (const cell of prev) {
    if (cell.row < rows && cell.col < cols) {
      const idx = next.findIndex((x) => x.row === cell.row && x.col === cell.col);
      if (idx >= 0) next[idx] = { ...next[idx], ...cell };
    }
  }
  return next;
}

function mergeCellDefaults(rows, cols, defaults) {
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

function LaboratoryResearch() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const autocompleteRef = useRef(null);
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [researchTypes, setResearchTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [tbName, setTbName] = useState('');
  const [tbRows, setTbRows] = useState(3);
  const [tbCols, setTbCols] = useState(4);
  const [tbRowHeaders, setTbRowHeaders] = useState(['Строка 1', 'Строка 2', 'Строка 3']);
  const [tbColHeaders, setTbColHeaders] = useState(['Столбец 1', 'Столбец 2', 'Столбец 3', 'Столбец 4']);
  /** Единицы измерения по столбцам (подпись к «Значение» в таблице и у пациента) */
  const [tbColUnits, setTbColUnits] = useState(['', '', '', '']);
  /** Черновик значений в ячейках шаблона (по желанию; сохраняется в gridTemplate.cellDefaults) */
  const [tbCells, setTbCells] = useState(() => initGridCells(3, 4));

  const [showAddStudy, setShowAddStudy] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [fieldResults, setFieldResults] = useState({});
  const [gridCells, setGridCells] = useState([]);
  const [customResults, setCustomResults] = useState([]);
  /** Поиск шаблонов и истории по названию анализа */
  const [analysisNameSearch, setAnalysisNameSearch] = useState('');
  /** Общий текст и оценка ко всей записи анализа (сохраняются в карте) */
  const [studyNote, setStudyNote] = useState('');
  const [overallStatus, setOverallStatus] = useState('normal');
  /** Отслеживание какие результаты раскрыты/скрыты */
  const [expandedResults, setExpandedResults] = useState({});
  /** Раскрыт ли раздел с бланками и шаблонами */
  const [showTemplatesList, setShowTemplatesList] = useState(false);

  const toggleResultExpanded = useCallback((resultId) => {
    setExpandedResults((prev) => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  }, []);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const [recordRes, labRes, typesRes] = await Promise.allSettled([
        medicalRecordApi.getPatientRecord(patientId),
        medicalRecordApi.getLaboratoryResults(patientId),
        researchApi.getResearchTypes()
      ]);

      if (recordRes.status === 'fulfilled') {
        setPatient(recordRes.value.data.patient);
      }
      if (labRes.status === 'fulfilled') {
        const raw = labRes.value.data;
        setResults(Array.isArray(raw) ? raw : []);
      }
      if (typesRes.status === 'fulfilled') {
        const raw = typesRes.value.data;
        const list = Array.isArray(raw) ? raw : [];
        setResearchTypes(list.filter((t) => t.category === 'laboratory'));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!patientId) {
      navigate('/doctor');
      return;
    }
    loadData();
  }, [patientId, navigate, loadData]);
  const labTypes = useMemo(() => researchTypes, [researchTypes]);
  const gridTemplates = useMemo(() => labTypes.filter((t) => isTemplateGrid(t)), [labTypes]);

  const nameMatchesSearch = useCallback((name) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return String(name || '')
      .toLowerCase()
      .includes(q);
  }, [searchQuery]);

  const visibleLabTypes = useMemo(
    () => labTypes.filter((t) => nameMatchesSearch(t.name)),
    [labTypes, nameMatchesSearch]
  );
  const visibleGridTemplates = useMemo(
    () => gridTemplates.filter((t) => nameMatchesSearch(t.name)),
    [gridTemplates, nameMatchesSearch]
  );
  const visibleResults = useMemo(
    () => results.filter((r) => nameMatchesSearch(r.researchTypeId?.name)),
    [results, nameMatchesSearch]
  );

  const selectedType = useMemo(
    () => labTypes.find((t) => String(t._id) === String(selectedTypeId)),
    [labTypes, selectedTypeId]
  );

  const isGridType = Boolean(selectedType && isTemplateGrid(selectedType));

  const selectedGridNorm = useMemo(() => {
    if (!selectedType || !isGridType) return null;
    return normalizeGridTemplate(selectedType.gridTemplate);
  }, [selectedType, isGridType]);

  useEffect(() => {
    if (!selectedType || !isGridType) {
      setGridCells([]);
      return;
    }
    const gt = selectedType.gridTemplate || {};
    const rows = Number(gt.rows) || 0;
    const cols = Number(gt.cols) || 0;
    setGridCells(mergeCellDefaults(rows, cols, gt.cellDefaults));
  }, [selectedType, isGridType]);

  useEffect(() => {
    if (showAddStudy) {
      setStudyNote('');
      setOverallStatus('normal');
    }
  }, [showAddStudy]);

  /** Выбор бланка из таблицы — сразу открыть ввод результата с этим шаблоном */
  const openLabTemplateForEntry = (t) => {
    setSelectedTypeId(String(t._id));
    setFieldResults({});
    setStudyNote('');
    setOverallStatus('normal');
    setShowAddStudy(true);
  };

  const openNewTemplateBuilder = () => {
    setEditingTemplateId(null);
    setTbName('');
    setTbRows(3);
    setTbCols(4);
    setTbRowHeaders(['Строка 1', 'Строка 2', 'Строка 3']);
    setTbColHeaders(['Столбец 1', 'Столбец 2', 'Столбец 3', 'Столбец 4']);
    setTbColUnits(adjustColUnits(4, []));
    setTbCells(initGridCells(3, 4));
    setShowAddStudy(false);
    setShowTemplateBuilder(true);
  };

  const openEditTemplate = (t) => {
    const gt = t.gridTemplate || {};
    const r = Number(gt.rows) || 3;
    const c = Number(gt.cols) || 3;
    setEditingTemplateId(t._id);
    setTbName(t.name);
    setTbRows(r);
    setTbCols(c);
    setTbRowHeaders(adjustHeaders(r, gt.rowHeaders || [], 'Строка'));
    setTbColHeaders(adjustHeaders(c, gt.colHeaders || [], 'Столбец'));
    setTbColUnits(adjustColUnits(c, gt.colUnits || []));
    setTbCells(mergeCellDefaults(r, c, gt.cellDefaults));
    setShowTemplateBuilder(true);
  };

  const handleTbRowsChange = (n) => {
    const v = Math.min(20, Math.max(1, Number(n) || 1));
    setTbRows(v);
    setTbRowHeaders((prev) => adjustHeaders(v, prev, 'Строка'));
    setTbCells((prev) => resizeTemplateCells(prev, v, tbCols));
  };

  const handleTbColsChange = (n) => {
    const v = Math.min(12, Math.max(1, Number(n) || 1));
    setTbCols(v);
    setTbColHeaders((prev) => adjustHeaders(v, prev, 'Столбец'));
    setTbColUnits((prev) => adjustColUnits(v, prev));
    setTbCells((prev) => resizeTemplateCells(prev, tbRows, v));
  };

  const updateTbCell = (row, col, patch) => {
    setTbCells((prev) => {
      const idx = prev.findIndex((cell) => cell.row === row && cell.col === col);
      if (idx === -1) {
        return [...prev, { row, col, value: '', comment: '', status: 'normal', ...patch }];
      }
      return prev.map((cell) => (cell.row === row && cell.col === col ? { ...cell, ...patch } : cell));
    });
  };

  const saveTemplate = async () => {
    if (!tbName.trim()) {
      alert('Введите название шаблона');
      return;
    }
    if (tbRowHeaders.length !== tbRows || tbColHeaders.length !== tbCols) {
      alert('Несовпадение размеров и подписей');
      return;
    }
    const cellDefaults = tbCells
      .filter(
        (cell) =>
          (cell.value !== '' && cell.value != null) ||
          (cell.comment && String(cell.comment).trim()) ||
          cell.status !== 'normal'
      )
      .map((cell) => ({
        row: cell.row,
        col: cell.col,
        value: cell.value,
        comment: cell.comment || '',
        status: cell.status || 'normal'
      }));

    const payload = {
      name: tbName.trim(),
      category: 'laboratory',
      templateMode: 'grid',
      template: [],
      gridTemplate: {
        rows: tbRows,
        cols: tbCols,
        rowHeaders: tbRowHeaders.map((s) => s.trim() || '—'),
        colHeaders: tbColHeaders.map((s) => s.trim() || '—'),
        colUnits: adjustColUnits(tbCols, tbColUnits).map((s) => String(s || '').trim().slice(0, 32)),
        cellDefaults
      }
    };
    try {
      if (editingTemplateId) {
        await researchApi.updateResearchType(editingTemplateId, payload);
      } else {
        await researchApi.createResearchType(payload);
      }
      setShowTemplateBuilder(false);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось сохранить шаблон');
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Удалить этот шаблон? Результаты в картах сохранятся.')) return;
    try {
      await researchApi.deleteResearchType(id);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось удалить');
    }
  };

  const updateGridCell = (row, col, patch) => {
    setGridCells((prev) => {
      const idx = prev.findIndex((cell) => cell.row === row && cell.col === col);
      if (idx === -1) {
        return [...prev, { row, col, value: '', comment: '', status: 'normal', ...patch }];
      }
      return prev.map((cell) => (cell.row === row && cell.col === col ? { ...cell, ...patch } : cell));
    });
  };

  const handleFieldChange = (name, value) => {
    setFieldResults((prev) => ({ ...prev, [name]: value }));
  };

  const saveStudy = async () => {
    if (!selectedTypeId || !studyDate) {
      alert('Выберите тип и дату');
      return;
    }

    try {
      if (isGridType) {
        const gt = selectedType.gridTemplate || {};
        const rows = Number(gt.rows) || 0;
        const cols = Number(gt.cols) || 0;
        const gridResults = gridCells
          .filter((cell) => {
            const has =
              (cell.value !== '' && cell.value != null) ||
              (cell.comment && String(cell.comment).trim()) ||
              cell.status !== 'normal';
            return has;
          })
          .map((cell) => ({
            row: cell.row,
            col: cell.col,
            value: cell.value,
            comment: cell.comment || '',
            status: cell.status || 'normal'
          }));

        if (gridResults.length === 0) {
          alert('Заполните хотя бы одну ячейку (значение, комментарий или отметку отклонения)');
          return;
        }

        await medicalRecordApi.createResearchResult(patientId, {
          researchTypeId: selectedTypeId,
          date: studyDate,
          gridResults,
          studyNote,
          overallStatus
        });
      } else {
        const payload = {
          researchTypeId: selectedTypeId,
          date: studyDate,
          results: fieldResults,
          customResults: customResults.filter((cr) => cr.name && cr.value !== undefined && cr.value !== ''),
          studyNote,
          overallStatus
        };
        await medicalRecordApi.createResearchResult(patientId, payload);
      }

      setShowAddStudy(false);
      setSelectedTypeId('');
      setFieldResults({});
      setCustomResults([]);
      setGridCells([]);
      setStudyNote('');
      setOverallStatus('normal');
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось сохранить');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('ru-RU');
  };

  const getGridTemplateForResult = (result) => {
    const rt = result.researchTypeId;
    if (!rt || !rt.gridTemplate) return null;
    const n = normalizeGridTemplate(rt.gridTemplate);
    if (n.rows < 1 || n.cols < 1) return null;
    return n;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="loading-spinner">Загрузка...</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="research-management lab-research-premium">
        <div className="research-header">
          <div className="research-header-top">
            <button
              className="btn btn-outline btn-back"
              onClick={() => navigate(-1)}
            >
              ← Назад
            </button>
            <h2>Лабораторные исследования — {patient?.name || 'Пациент'}</h2>
          </div>
          <div className="research-header-actions">
            <button type="button" className="btn btn-outline" onClick={openNewTemplateBuilder}>
              Новый шаблон (таблица)
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setShowAddStudy(!showAddStudy)}>
              {showAddStudy ? 'Отмена' : 'Добавить исследование'}
            </button>
          </div>
        </div>

        </div>

        {showAddStudy && (
          <div className="research-form lab-add-study">
            <h3>Новое лабораторное исследование</h3>
            <div className="form-group">
              <label>Анализ по названию шаблона</label>
              <div className="lab-autocomplete-container">
                <input
                  type="text"
                  className="lab-autocomplete-input"
                  placeholder="Введите название анализа..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isDropdownOpen) setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => {
                      setIsDropdownOpen(false);
                    }, 200);
                  }}
                  autoComplete="off"
                />
                {isDropdownOpen && visibleLabTypes.length > 0 && (
                  <div className="lab-autocomplete-dropdown">
                    {visibleLabTypes.map((t) => (
                      <div
                        key={t._id}
                        className={`lab-autocomplete-item ${selectedTypeId === t._id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedTypeId(t._id);
                          setSearchQuery(t.name);
                          setIsDropdownOpen(false);
                          setFieldResults({});
                        }}
                      >
                        {t.name}
                        {isTemplateGrid(t) && <span className="lab-grid-badge">таблица</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {labTypes.length > 0 && visibleLabTypes.length === 0 && (
              <p className="lab-empty-filter">По поиску нет совпадений — очистите поле «Поиск по названию анализа» выше или измените запрос.</p>
            )}
            <div className="form-group">
              <label>Дата</label>
              <input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} required />
            </div>

            {selectedType && isGridType && selectedGridNorm && (
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
                          {selectedGridNorm.colHeaders.map((h, c) => (
                            <th key={`ct-${c}`} colSpan={3} className="lab-dg-col-title">
                              {h}
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {selectedGridNorm.colHeaders.flatMap((_, c) => {
                            const colUnit = (selectedGridNorm.colUnits && selectedGridNorm.colUnits[c]) || '';
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
                        {Array.from({ length: selectedGridNorm.rows }, (_, r) => (
                          <tr key={r} className={r % 2 === 1 ? 'lab-dg-row-alt' : ''}>
                            <th scope="row" className="lab-row-label lab-sticky-col">
                              {selectedGridNorm.rowHeaders[r]}
                            </th>
                            {Array.from({ length: selectedGridNorm.cols }, (_, c) => {
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
            )}

            <div className="lab-study-overall">
              <h4>Общее заключение по этому анализу</h4>
              <div className="form-group">
                <label>Текст врача (свободное поле)</label>
                <textarea
                  className="lab-study-note"
                  rows={3}
                  value={studyNote}
                  onChange={(e) => setStudyNote(e.target.value)}
                  placeholder="Краткое заключение, рекомендации, примечание к бланку…"
                />
              </div>
              <div className="form-group">
                <label>Общая оценка результата</label>
                <select value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedType && !isGridType && (selectedType.template || []).length > 0 && (
              <div className="research-template-fields">
                <h4>Показатели</h4>
                {(selectedType.template || []).map((field, idx) => (
                  <div key={idx} className="form-group">
                    <label>
                      {field.name} {field.required && <span className="required">*</span>}
                    </label>
                    {field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={fieldResults[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={field.unit ? `(${field.unit})` : ''}
                      />
                    ) : field.type === 'date' ? (
                      <input type="date" value={fieldResults[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} />
                    ) : (
                      <input
                        type="text"
                        value={fieldResults[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedType && !isGridType && (
              <div className="custom-results-section">
                <h4>Дополнительные показатели</h4>
                {customResults.map((cr, idx) => (
                  <div key={idx} className="custom-result-row">
                    <input
                      type="text"
                      placeholder="Название"
                      value={cr.name}
                      onChange={(e) => {
                        const next = [...customResults];
                        next[idx] = { ...next[idx], name: e.target.value };
                        setCustomResults(next);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Значение"
                      value={cr.value}
                      onChange={(e) => {
                        const next = [...customResults];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setCustomResults(next);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Ед."
                      value={cr.unit}
                      onChange={(e) => {
                        const next = [...customResults];
                        next[idx] = { ...next[idx], unit: e.target.value };
                        setCustomResults(next);
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => setCustomResults((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={() => setCustomResults((prev) => [...prev, { name: '', value: '', unit: '' }])}>
                  + Показатель
                </button>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={saveStudy}>
                Сохранить в карту
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddStudy(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {gridTemplates.length > 0 && (
          <div className="lab-templates-section">
            <button 
              type="button" 
              className="btn btn-outline lab-templates-toggle" 
              onClick={() => setShowTemplatesList(!showTemplatesList)}
            >
              <span className={`material-icons lab-expand-icon${showTemplatesList ? ' expanded' : ''}`}>expand_more</span>
              Бланки и шаблоны таблиц
            </button>

            {showTemplatesList && (
              <div className="lab-templates-panel">
                <h3>Бланки и шаблоны таблиц</h3>
                <p className="lab-help">
                  Сохраните таблицу под понятным названием (как принято для анализа крови) — затем находите её через поиск и выбирайте при вводе. В ячейках можно задать типовые показатели; при вводе результата добавляются комментарий и оценка по каждой ячейке и общие поля ниже.
                </p>
                {visibleGridTemplates.length === 0 ? (
                  <p className="lab-empty-filter">Нет шаблонов по запросу «{analysisNameSearch.trim()}».</p>
                ) : (
                  <div className="lab-templates-table-wrap">
                    <table className="lab-templates-table" role="grid">
                      <thead>
                        <tr>
                          <th scope="col">Название анализа</th>
                          <th scope="col" className="lab-templates-col-size">
                            Размер
                          </th>
                          <th scope="col">Показатели (строки бланка)</th>
                          <th scope="col" className="lab-templates-col-actions">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleGridTemplates.map((t) => {
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
                          onClick={() => openLabTemplateForEntry(t)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openLabTemplateForEntry(t);
                            }
                          }}
                          tabIndex={0}
                          role="button"
                        >
                          <td className="lab-templates-td-name">
                            <strong className="lab-templates-link-name">{t.name}</strong>
                          </td>
                          <td>
                            {gt.rows}×{gt.cols}
                          </td>
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
                                  onClick={() => openEditTemplate(t)}
                                >
                                  Изменить бланк
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline btn-small btn-danger-text"
                                  onClick={() => deleteTemplate(t._id)}
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
                  Клик по <strong>строке</strong> открывает ввод результата: в большой таблице ниже сразу появятся все <strong>названия показателей</strong> из бланка (колонка «Показатели» — для просмотра состава до открытия).
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showTemplateBuilder && !showAddStudy && (
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
              <button type="button" className="btn btn-primary lab-save-blank-btn" onClick={saveTemplate}>
                Сохранить бланк (шаблон)
              </button>
            </div>
            <div className="form-group">
              <label>Название анализа (шаблона)</label>
              <input type="text" value={tbName} onChange={(e) => setTbName(e.target.value)} placeholder="Например: Общий анализ крови, Биохимия расширенная" />
            </div>
            <div className="lab-dims-row">
              <div className="form-group">
                <label>Строк</label>
                <input type="number" min={1} max={20} value={tbRows} onChange={(e) => handleTbRowsChange(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Столбцов</label>
                <input type="number" min={1} max={12} value={tbCols} onChange={(e) => handleTbColsChange(e.target.value)} />
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
                  disabled={tbRows >= 20}
                  onClick={() => handleTbRowsChange(tbRows + 1)}
                >
                  <span className="material-icons" aria-hidden>add</span>
                  <span className="lab-dg-tool-text">Строка</span>
                </button>
                <button
                  type="button"
                  className="lab-dg-tool lab-dg-tool--remove"
                  title="Удалить последнюю строку"
                  disabled={tbRows <= 1}
                  onClick={() => handleTbRowsChange(tbRows - 1)}
                >
                  <span className="material-icons" aria-hidden>remove</span>
                </button>
                <span className="lab-dg-toolbar-divider" />
                <button
                  type="button"
                  className="lab-dg-tool lab-dg-tool--add"
                  title="Добавить столбец"
                  disabled={tbCols >= 12}
                  onClick={() => handleTbColsChange(tbCols + 1)}
                >
                  <span className="material-icons" aria-hidden>add</span>
                  <span className="lab-dg-tool-text">Столбец</span>
                </button>
                <button
                  type="button"
                  className="lab-dg-tool lab-dg-tool--remove"
                  title="Удалить последний столбец"
                  disabled={tbCols <= 1}
                  onClick={() => handleTbColsChange(tbCols - 1)}
                >
                  <span className="material-icons" aria-hidden>remove</span>
                </button>
              </div>
              <div className="lab-grid-scroll lab-grid-scroll--datagrid">
                <table className="lab-grid-table lab-grid-template-table lab-datagrid">
                  <thead>
                    <tr>
                      <th className="lab-corner lab-corner-sticky">Показатель</th>
                      {tbColHeaders.map((h, c) => (
                        <th key={c} className="lab-header-th lab-dg-col-title">
                          <div className="lab-header-input-wrap">
                            <input
                              type="text"
                              className="lab-header-input"
                              value={h}
                              autoComplete="off"
                              placeholder={`Столбец ${c + 1}`}
                              onChange={(e) => {
                                const next = [...tbColHeaders];
                                next[c] = e.target.value;
                                setTbColHeaders(next);
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
                      {Array.from({ length: tbCols }).map((_, c) => (
                        <th key={`cu-${c}`} className="lab-header-th lab-template-unit-th">
                          <input
                            type="text"
                            className="lab-header-input lab-col-unit-input"
                            value={tbColUnits[c] || ''}
                            autoComplete="off"
                            placeholder="г/л, ммоль/л…"
                            onChange={(e) => {
                              const next = adjustColUnits(tbCols, tbColUnits);
                              next[c] = e.target.value;
                              setTbColUnits(next);
                            }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tbRowHeaders.map((rh, r) => (
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
                                const next = [...tbRowHeaders];
                                next[r] = e.target.value;
                                setTbRowHeaders(next);
                              }}
                            />
                          </div>
                        </th>
                        {Array.from({ length: tbCols }).map((_, c) => {
                          const cell =
                            tbCells.find((x) => x.row === r && x.col === c) || {
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
              <button type="button" className="btn btn-primary" onClick={saveTemplate}>
                Сохранить бланк (шаблон)
              </button>
              <button type="button" className="btn btn-outline" onClick={() => {
                setShowTemplateBuilder(false);
                setShowAddStudy(true);
              }}>
                Закрыть без сохранения
              </button>
            </div>
          </div>
        )}

        <div className="research-results">
          <h3>История по пациенту</h3>
          {results.length === 0 ? (
            <p>Лабораторные исследования пока не проводились.</p>
          ) : visibleResults.length === 0 ? (
            <p className="lab-empty-filter">Нет записей по запросу «{analysisNameSearch.trim()}».</p>
          ) : (
            visibleResults.map((result) => {
              const gt = getGridTemplateForResult(result);
              const hasGrid = result.gridResults && result.gridResults.length > 0 && gt;
              const isExpanded = expandedResults[result._id];
              return (
                <div key={result._id} className="research-result-card">
                  <div 
                    className="result-header result-header--clickable" 
                    onClick={() => toggleResultExpanded(result._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleResultExpanded(result._id);
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
                  </div>
                  <div className="result-doctor">Врач: {result.doctorName}</div>

                  {isExpanded && (
                    <>
                      {(result.studyNote || (result.overallStatus && result.overallStatus !== 'normal')) && (
                        <div className="lab-result-overall">
                          {result.studyNote ? <p className="lab-result-note">{result.studyNote}</p> : null}
                          {result.overallStatus && result.overallStatus !== 'normal' ? (
                            <div className={`lab-status-badge st-${result.overallStatus}`}>
                              Общая оценка:{' '}
                              {STATUS_OPTIONS.find((o) => o.value === result.overallStatus)?.label || result.overallStatus}
                            </div>
                          ) : null}
                        </div>
                      )}

                      {hasGrid && (
                        <div className="lab-datagrid-shell lab-datagrid-shell--history">
                          <div className="lab-grid-scroll lab-grid-scroll--datagrid">
                            <table className="lab-grid-table lab-datagrid lab-datagrid--history">
                              <thead>
                                <tr>
                                  <th rowSpan={2} className="lab-corner lab-corner-sticky">
                                    Показатель
                                  </th>
                                  {gt.colHeaders.map((h, c) => (
                                    <th key={`h-${c}`} colSpan={3} className="lab-dg-col-title">
                                      {h}
                                    </th>
                                  ))}
                            </tr>
                            <tr>
                              {gt.colHeaders.flatMap((_, c) => {
                                const colUnit = (gt.colUnits && gt.colUnits[c]) || '';
                                return ['Значение', 'Комментарий', 'Оценка'].map((sub, k) => (
                                  <th key={`hs-${c}-${k}`} className="lab-dg-subhead">
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
                                <th className="lab-row-label lab-sticky-col">{gt.rowHeaders[r]}</th>
                                {Array.from({ length: gt.cols }, (_, c) => {
                                  const cell = (result.gridResults || []).find((x) => x.row === r && x.col === c);
                                  const st = cell?.status || 'normal';
                                  const colUnit = (gt.colUnits && gt.colUnits[c]) || '';
                                  const displayVal =
                                    cell?.value !== '' && cell?.value != null
                                      ? formatWithUnit(cell.value, colUnit)
                                      : '—';
                                  return [
                                    <td key={`${r}-${c}-v`} data-status={st} className="lab-dg-td lab-history-dg-val">
                                      {displayVal}
                                    </td>,
                                    <td key={`${r}-${c}-m`} data-status={st} className="lab-dg-td lab-history-dg-comment">
                                      {cell?.comment || '—'}
                                    </td>,
                                    <td key={`${r}-${c}-s`} data-status={st} className="lab-dg-td lab-history-dg-status">
                                      {cell?.status && cell.status !== 'normal' ? (
                                        <span className={`lab-status-badge st-${cell.status}`}>
                                          {STATUS_OPTIONS.find((o) => o.value === cell.status)?.label || cell.status}
                                        </span>
                                      ) : (
                                        '—'
                                      )}
                                    </td>
                                  ];
                                }).flat()}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!hasGrid && (
                    <div className="research-results-grid">
                      {(result.results || []).map((r, idx) => {
                        const u =
                          (r.unit && String(r.unit).trim()) ||
                          templateUnitForFieldName(result.researchTypeId, r.fieldName);
                        return (
                          <div key={idx} className="result-item">
                            <span className="result-name">{r.fieldName}:</span>
                            <span className="result-value">{formatWithUnit(r.value, u)}</span>
                          </div>
                        );
                      })}
                      {(result.customResults || []).map((cr, idx) => (
                        <div key={`c-${idx}`} className="result-item custom">
                          <span className="result-name">{cr.name}:</span>
                          <span className="result-value">{formatWithUnit(cr.value, cr.unit)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
    </PageLayout>
  );
}

export default LaboratoryResearch;
