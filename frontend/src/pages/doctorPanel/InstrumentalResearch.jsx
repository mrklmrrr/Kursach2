import React, { useState, useEffect, useCallback, useMemo, useRef} from 'react';
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

function InstrumentalResearch() {
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

  const [showAddForm, setShowAddForm] = useState(true);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studyDate, setStudyDate] = useState('');
  const [fieldResults, setFieldResults] = useState({});
  const [gridCells, setGridCells] = useState([]);


  /** Общий текст и оценка ко всей записи анализа (сохраняются в карте) */
  const [studyNote, setStudyNote] = useState('');
  const [overallStatus, setOverallStatus] = useState('normal');
  /** Отслеживание какие результаты раскрыты/скрыты */
  const [expandedResults, setExpandedResults] = useState({});
  /** Раскрыт ли раздел с бланками и шаблонами */
  const [showTemplatesList, setShowTemplatesList] = useState(false);

  /** Текущий режим: 'research' - новое исследование, 'template' - создание шаблона */
  const [currentMode, setCurrentMode] = useState('research');

  /** Текст в поле типа исследования для свободного ввода */
  const [researchTypeText, setResearchTypeText] = useState('');

  /** Включить ли таблицу в шаблоне */
  const [tbIncludeTable, setTbIncludeTable] = useState(true);

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
      const [recordRes, instRes, typesRes] = await Promise.allSettled([
        medicalRecordApi.getPatientRecord(patientId),
        medicalRecordApi.getInstrumentalResults(patientId),
        researchApi.getResearchTypes()
      ]);

      if (recordRes.status === 'fulfilled') {
        setPatient(recordRes.value.data.patient);
      }
      if (instRes.status === 'fulfilled') {
        const raw = instRes.value.data;
        setResults(Array.isArray(raw) ? raw : []);
      }
      if (typesRes.status === 'fulfilled') {
        const raw = typesRes.value.data;
        const list = Array.isArray(raw) ? raw : [];
        setResearchTypes(list.filter((t) => t.category === 'instrumental'));
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
  const instTypes = useMemo(() => researchTypes, [researchTypes]);
  const gridTemplates = useMemo(() => instTypes.filter((t) => isTemplateGrid(t)), [instTypes]);

  const nameMatchesSearch = useCallback((name) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return String(name || '')
      .toLowerCase()
      .includes(q);
  }, [searchQuery]);

  const visibleInstTypes = useMemo(
    () => instTypes.filter((t) => nameMatchesSearch(t.name)),
    [instTypes, nameMatchesSearch]
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
    () => instTypes.find((t) => String(t._id) === String(selectedTypeId)),
    [instTypes, selectedTypeId]
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
    if (showAddForm) {
      setStudyNote('');
      setOverallStatus('normal');
    }
  }, [showAddForm]);

  /** Выбор бланка из таблицы — сразу открыть ввод результата с этим шаблоном */
  const openInstTemplateForEntry = (t) => {
    setSelectedTypeId(String(t._id));
    setResearchTypeText(t.name);
    setFieldResults({});
    setStudyNote('');
    setOverallStatus('normal');
    setCurrentMode('research');
  };

  const openNewTemplateBuilder = () => {
    setEditingTemplateId(null);
    setTbName('');
    setTbIncludeTable(true);
    setTbRows(3);
    setTbCols(4);
    setTbRowHeaders(['Строка 1', 'Строка 2', 'Строка 3']);
    setTbColHeaders(['Столбец 1', 'Столбец 2', 'Столбец 3', 'Столбец 4']);
    setTbColUnits(adjustColUnits(4, []));
    setTbCells(initGridCells(3, 4));
  };

  const openEditTemplate = (t) => {
    const gt = t.gridTemplate || {};
    const r = Number(gt.rows) || 3;
    const c = Number(gt.cols) || 3;
    const hasTable = isTemplateGrid(t);
    setEditingTemplateId(t._id);
    setTbName(t.name);
    setTbIncludeTable(hasTable);
    if (hasTable) {
      setTbRows(r);
      setTbCols(c);
      setTbRowHeaders(adjustHeaders(r, gt.rowHeaders || [], 'Строка'));
      setTbColHeaders(adjustHeaders(c, gt.colHeaders || [], 'Столбец'));
      setTbColUnits(adjustColUnits(c, gt.colUnits || []));
      setTbCells(mergeCellDefaults(r, c, gt.cellDefaults));
    }
    setCurrentMode('template');
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

    let payload;
    if (tbIncludeTable) {
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

      payload = {
        name: tbName.trim(),
        category: 'instrumental',
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
    } else {
      payload = {
        name: tbName.trim(),
        category: 'instrumental',
        templateMode: 'fields',
        template: []
      };
    }

    try {
      if (editingTemplateId) {
        await researchApi.updateResearchType(editingTemplateId, payload);
      } else {
        await researchApi.createResearchType(payload);
      }
      setCurrentMode(null);
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
    if (!researchTypeText.trim()) {
      alert('Введите тип исследования');
      return;
    }

    try {
      // Найти существующий тип исследования или создать новый
      let researchType = researchTypes.find(t => t.name === researchTypeText.trim() && t.category === 'instrumental');

      if (!researchType) {
        // Создаем новый тип исследования
        const newTypeData = {
          name: researchTypeText.trim(),
          category: 'instrumental',
          template: [] // Пустой шаблон для новых типов
        };

        const { data: newType } = await researchApi.createResearchType(newTypeData);
        researchType = newType;

        // Добавляем в локальный state
        setResearchTypes(prev => [...prev, newType]);
      }

      const selectedTypeId = researchType._id;
      if (isGridType) {
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
          date: studyDate || undefined,
          gridResults,
          studyNote,
          overallStatus
        });
      } else {
        const payload = {
          researchTypeId: selectedTypeId,
          date: studyDate || undefined,
          results: fieldResults,
          studyNote,
          overallStatus
        };
        await medicalRecordApi.createResearchResult(patientId, payload);
      }

      setCurrentMode(null);
      setSelectedTypeId('');
      setResearchTypeText('');
      setFieldResults({});
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

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const getGridTemplateForResult = (result) => {
    const rt = result.researchTypeId;
    if (!rt || !rt.gridTemplate) return null;
    const n = normalizeGridTemplate(rt.gridTemplate);
    if (n.rows < 1 || n.cols < 1) return null;
    return n;
  };

  if (loading) return <PageLayout><div className="loading-spinner">Загрузка...</div></PageLayout>;

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
            <h2>Инструментальные исследования — {patient?.name || 'Пациент'}</h2>
          </div>
          <div className="research-header-actions">
            <button
              type="button"
              className={`btn ${currentMode === 'template' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (currentMode === 'template') {
                  setCurrentMode(null);
                  setShowTemplateBuilder(false);
                } else {
                  setCurrentMode('template');
                  setShowAddForm(false);
                  openNewTemplateBuilder();
                }
              }}
            >
              {currentMode === 'template' ? 'Отмена' : 'Создать шаблон'}
            </button>
            <button
              type="button"
              className={`btn ${currentMode === 'research' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => {
                if (currentMode === 'research') {
                  setCurrentMode(null);
                  setShowAddForm(false);
                } else {
                  setCurrentMode('research');
                  setShowTemplateBuilder(false);
                  setShowAddForm(true);
                }
              }}
            >
              {currentMode === 'research' ? 'Отмена' : 'Добавить исследование'}
            </button>
          </div>
        </div>



        {currentMode === 'research' && (
          <div className="research-form">
            <h3>Новое инструментальное исследование</h3>

            <div className="form-group">
              <label>Тип исследования</label>
              <div className="lab-autocomplete-container" ref={autocompleteRef}>
                <input
                  className="lab-autocomplete-input"
                  type="text"
                  value={researchTypeText}
                  onChange={(e) => {
                    const v = e.target.value;
                    setResearchTypeText(v);
                    setSelectedTypeId('');
                    setSearchQuery(v);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Выберите или введите новый тип исследования"
                />
                {isDropdownOpen && visibleInstTypes.length > 0 && (
                  <div className="lab-autocomplete-dropdown">
                    {visibleInstTypes.map((t) => (
                      <div
                        key={t._id}
                        className={`lab-autocomplete-item ${selectedTypeId === String(t._id) ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedTypeId(String(t._id));
                          setResearchTypeText(t.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <span>{t.name}</span>
                        <span className="lab-grid-badge">
                          {isTemplateGrid(t) ? 'таблица' : 'форма'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Дата исследования</label>
              <input
                type="date"
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
              />
            </div>

            {selectedType && !isGridType && selectedType.template && selectedType.template.length > 0 && (
              <div className="research-template-fields">
                <h4>Показатели по шаблону</h4>
                {selectedType.template.map((field, idx) => (
                  <div key={idx} className="form-group">
                    <label>{field.name} {field.required && <span className="required">*</span>}</label>
                    {field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={fieldResults[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Введите значение${field.unit ? ` (${field.unit})` : ''}`}
                        required={field.required}
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={fieldResults[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type="text"
                        value={fieldResults[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Введите значение${field.unit ? ` (${field.unit})` : ''}`}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedType && isGridType && selectedGridNorm && (
              <div className="lab-grid-scroll">
                <div className="lab-datagrid-shell">
                  <div className="lab-dg-toolbar">
                    <span className="lab-dg-toolbar-title">Ввод результатов</span>
                  </div>
                  <div className="lab-grid-scroll--datagrid">
                    <table className="lab-grid-table lab-datagrid">
                      <thead>
                        <tr>
                          <th className="lab-corner-sticky lab-corner" rowSpan="2">
                            <div>Показатель</div>
                          </th>
                          {selectedGridNorm.colHeaders.map((ch, ci) => (
                            <th key={ci} className="lab-datagrid lab-dg-col-title" colSpan="3">
                              <div>{ch}</div>
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {selectedGridNorm.colHeaders.map((_, ci) => (
                            <React.Fragment key={`sub-${ci}`}>
                              <th className="lab-dg-subhead">Значение{selectedGridNorm.colUnits[ci] ? ` (${selectedGridNorm.colUnits[ci]})` : ''}</th>
                              <th className="lab-dg-subhead">Комментарий</th>
                              <th className="lab-dg-subhead">Статус</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedGridNorm.rowHeaders.map((rh, ri) => (
                          <tr key={ri}>
                            <td className="lab-sticky-col lab-row-label">{rh}</td>
                            {selectedGridNorm.colHeaders.map((_, ci) => {
                              const cell = gridCells.find((c) => c.row === ri && c.col === ci) || {
                                value: '',
                                comment: '',
                                status: 'normal'
                              };
                              return (
                                <React.Fragment key={`cell-${ri}-${ci}`}>
                                  <td className="lab-dg-td lab-dg-td--val">
                                    <input
                                      className="lab-dg-input lab-dg-input--val"
                                      type="text"
                                      value={cell.value}
                                      onChange={(e) => updateGridCell(ri, ci, { value: e.target.value })}
                                      placeholder="Значение"
                                    />
                                  </td>
                                  <td className="lab-dg-td lab-dg-td--comment">
                                    <textarea
                                      className="lab-dg-textarea"
                                      value={cell.comment}
                                      onChange={(e) => updateGridCell(ri, ci, { comment: e.target.value })}
                                      placeholder="Комментарий"
                                      rows="1"
                                    />
                                  </td>
                                  <td className="lab-dg-td lab-dg-td--status">
                                    <select
                                      className="lab-dg-select"
                                      value={cell.status}
                                      onChange={(e) => updateGridCell(ri, ci, { status: e.target.value })}
                                    >
                                      {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}



            <div className="lab-study-overall">
              <h4>Общая оценка исследования</h4>
              <textarea
                className="lab-study-note"
                value={studyNote}
                onChange={(e) => setStudyNote(e.target.value)}
                placeholder="Общие замечания, заключение врача..."
                rows="3"
              />
              <div className="lab-result-overall">
                <select
                  value={overallStatus}
                  onChange={(e) => setOverallStatus(e.target.value)}
                  className="lab-dg-select"
                  style={{ marginTop: '8px' }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={saveStudy}>
                Сохранить исследование
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {currentMode === 'template' && (
          <div className="research-form">
            <h3>{editingTemplateId ? 'Редактирование шаблона' : 'Создание нового шаблона'}</h3>

            <div className="form-group">
              <label>Название шаблона</label>
              <input
                type="text"
                value={tbName}
                onChange={(e) => setTbName(e.target.value)}
                placeholder="Введите название шаблона"
                required
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tbIncludeTable}
                  onChange={(e) => setTbIncludeTable(e.target.checked)}
                />
                Включить таблицу в шаблон
              </label>
            </div>

            {tbIncludeTable && (
              <>
                <div className="lab-template-builder-top">
                  <div>
                    <div className="lab-template-builder-title">Размер таблицы</div>
                    <div className="lab-template-builder-sub">
                      Определите количество строк и столбцов для шаблона исследования
                    </div>
                  </div>
                </div>

                <div className="lab-template-builder">
                  <div className="lab-dims-row">
                    <div className="form-group">
                      <label>Строк</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={tbRows}
                        onChange={(e) => handleTbRowsChange(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Столбцов</label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={tbCols}
                        onChange={(e) => handleTbColsChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={saveTemplate}
              >
                {editingTemplateId ? 'Сохранить изменения' : 'Создать шаблон'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowTemplateBuilder(false);
                  setShowAddForm(true);
                }}
              >
                Закрыть без сохранения
              </button>
            </div>

            {tbIncludeTable && (
              <div className="lab-grid-scroll">
                <div className="lab-datagrid-shell">
                  <div className="lab-dg-toolbar">
                    <span className="lab-dg-toolbar-title">Настройка шаблона</span>
                  </div>
                  <div className="lab-grid-scroll--datagrid">
                    <table className="lab-grid-table lab-datagrid lab-datagrid--entry">
                      <thead>
                        <tr>
                          <th className="lab-corner-sticky lab-corner" rowSpan="2">
                            <div>Показатель</div>
                          </th>
                          {tbColHeaders.map((ch, ci) => (
                            <th key={ci} className="lab-datagrid lab-dg-col-title" colSpan="3">
                              <div>
                                <input
                                  className="lab-header-input"
                                  type="text"
                                  value={ch}
                                  onChange={(e) => setTbColHeaders(prev => prev.map((h, i) => i === ci ? e.target.value : h))}
                                  placeholder={`Столбец ${ci + 1}`}
                                />
                              </div>
                            </th>
                          ))}
                        </tr>
                        <tr>
                          {tbColHeaders.map((_, ci) => (
                            <React.Fragment key={`sub-${ci}`}>
                              <th className="lab-dg-subhead">
                                <input
                                  className="lab-col-unit-input"
                                  type="text"
                                  value={tbColUnits[ci] || ''}
                                  onChange={(e) => setTbColUnits(prev => prev.map((u, i) => i === ci ? e.target.value : u))}
                                  placeholder="ед. изм."
                                />
                              </th>
                              <th className="lab-dg-subhead">Комментарий</th>
                              <th className="lab-dg-subhead">Статус</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tbRowHeaders.map((rh, ri) => (
                          <tr key={ri}>
                            <td className="lab-sticky-col">
                              <input
                                className="lab-row-header"
                                type="text"
                                value={rh}
                                onChange={(e) => setTbRowHeaders(prev => prev.map((h, i) => i === ri ? e.target.value : h))}
                                placeholder={`Строка ${ri + 1}`}
                              />
                            </td>
                            {tbColHeaders.map((_, ci) => {
                              const cell = tbCells.find((c) => c.row === ri && c.col === ci) || {
                                value: '',
                                comment: '',
                                status: 'normal'
                              };
                              return (
                                <React.Fragment key={`cell-${ri}-${ci}`}>
                                  <td className="lab-dg-td lab-dg-td--val">
                                    <input
                                      className="lab-template-cell-input"
                                      type="text"
                                      placeholder="Значение"
                                      value={cell.value}
                                      onChange={(e) => updateTbCell(ri, ci, { value: e.target.value })}
                                    />
                                  </td>
                                  <td className="lab-dg-td lab-dg-td--comment">
                                    <textarea
                                      className="lab-dg-textarea"
                                      rows={2}
                                      placeholder="Комментарий"
                                      value={cell.comment}
                                      onChange={(e) => updateTbCell(ri, ci, { comment: e.target.value })}
                                    />
                                  </td>
                                  <td className="lab-dg-td lab-dg-td--status">
                                    <select
                                      className="lab-dg-select"
                                      value={cell.status}
                                      onChange={(e) => updateTbCell(ri, ci, { status: e.target.value })}
                                    >
                                      {STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                          {o.label}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {visibleInstTypes.length > 0 && (
          <div className="lab-templates-panel">
            <button
              type="button"
              className={`lab-templates-toggle ${showTemplatesList ? 'expanded' : ''}`}
              onClick={() => setShowTemplatesList(!showTemplatesList)}
            >
              <span className="material-icons lab-expand-icon">expand_more</span>
              <span>Шаблоны исследований ({visibleInstTypes.length})</span>
            </button>
            {showTemplatesList && (
              <div className="lab-templates-list">
                {visibleGridTemplates.length > 0 && (
                  <div className="lab-templates-section">
                    <h4>Табличные шаблоны</h4>
                    <div className="lab-templates-grid">
                      {visibleGridTemplates.map((t) => (
                        <div key={t._id} className="lab-template-card">
                          <div className="lab-template-header">
                            <h5>{t.name}</h5>
                            <div className="lab-template-actions">
                              <button
                                type="button"
                                className="btn btn-outline btn-small"
                                onClick={() => openEditTemplate(t)}
                                title="Редактировать шаблон"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-small"
                                onClick={() => openInstTemplateForEntry(t)}
                                title="Внести результат"
                              >
                                ➕
                              </button>
                              <button
                                type="button"
                                className="btn-danger-text btn-small"
                                onClick={() => deleteTemplate(t._id)}
                                title="Удалить шаблон"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div className="lab-template-info">
                            <span>{t.gridTemplate?.rows || 0} × {t.gridTemplate?.cols || 0}</span>
                            <span className="lab-templates-sys">таблица</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="research-results">
          <h3>История исследований</h3>
          {visibleResults.length === 0 ? (
            <p className="lab-empty-filter">
              {searchQuery ? 'Нет исследований, соответствующих поиску.' : 'Инструментальные исследования пока не проводились.'}
            </p>
          ) : (
            visibleResults.map((result) => {
              const gt = getGridTemplateForResult(result);
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
                        <h4>{result.researchTypeId?.name || 'Неизвестный тип'}</h4>
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
                      {gt ? (
                        <div className="lab-grid-scroll">
                          <table className="lab-grid-table lab-datagrid lab-datagrid--history">
                            <thead>
                              <tr>
                                <th className="lab-corner-sticky lab-corner" rowSpan="2">
                                  <div>Показатель</div>
                                </th>
                                {gt.colHeaders.map((ch, ci) => (
                                  <th key={ci} className="lab-datagrid lab-dg-col-title" colSpan="3">
                                    <div>{ch}</div>
                                  </th>
                                ))}
                              </tr>
                              <tr>
                                {gt.colHeaders.map((_, ci) => (
                                  <React.Fragment key={`sub-${ci}`}>
                                    <th className="lab-dg-subhead">Значение{gt.colUnits[ci] ? ` (${gt.colUnits[ci]})` : ''}</th>
                                    <th className="lab-dg-subhead">Комментарий</th>
                                    <th className="lab-dg-subhead">Статус</th>
                                  </React.Fragment>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {gt.rowHeaders.map((rh, ri) => (
                                <tr key={ri}>
                                  <td className="lab-sticky-col lab-row-label">{rh}</td>
                                  {gt.colHeaders.map((_, ci) => {
                                    const cell = result.gridResults?.find((c) => c.row === ri && c.col === ci);
                                    return (
                                      <React.Fragment key={`cell-${ri}-${ci}`}>
                                        <td className={`lab-history-dg-val ${cell?.status === 'severe' ? 'lab-history-cell' : ''}`} data-status={cell?.status}>
                                          {formatWithUnit(cell?.value, gt.colUnits[ci])}
                                        </td>
                                        <td className="lab-history-dg-comment">
                                          {cell?.comment || '—'}
                                        </td>
                                        <td className="lab-history-dg-status">
                                          {cell?.status && cell.status !== 'normal' && (
                                            <span className={`lab-status-badge st-${cell.status}`}>
                                              {STATUS_OPTIONS.find(s => s.value === cell.status)?.label}
                                            </span>
                                          )}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="research-results-grid">
                          {result.results?.map((r, idx) => (
                            <div key={idx} className="result-item">
                              <span className="result-name">{r.fieldName}:</span>
                              <span className="result-value">{r.value} {r.unit}</span>
                            </div>
                          ))}
                          {result.customResults?.map((cr, idx) => (
                            <div key={`custom-${idx}`} className="result-item custom">
                              <span className="result-name">{cr.name}:</span>
                              <span className="result-value">{cr.value} {cr.unit}</span>
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
      </div>
    </PageLayout>
  );
};

export default InstrumentalResearch;