import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { medicalRecordApi } from '@services/medicalRecordApi';
import { researchApi } from '@services/researchApi';
import { isTemplateGrid, normalizeGridTemplate, mergeCellDefaults } from '@utils/gridUtils';

/**
 * Хук для управления данными исследований (laboratory или instrumental)
 */
export function useResearchData(patientId, researchCategory) {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [researchTypes, setResearchTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!patientId) return;
    try {
      setLoading(true);
      const [recordRes, resultsRes, typesRes] = await Promise.allSettled([
        medicalRecordApi.getPatientRecord(patientId),
        researchCategory === 'laboratory' 
          ? medicalRecordApi.getLaboratoryResults(patientId)
          : medicalRecordApi.getInstrumentalResults(patientId),
        researchApi.getResearchTypes()
      ]);

      if (recordRes.status === 'fulfilled') {
        setPatient(recordRes.value.data.patient);
      }
      if (resultsRes.status === 'fulfilled') {
        const raw = resultsRes.value.data;
        setResults(Array.isArray(raw) ? raw : []);
      }
      if (typesRes.status === 'fulfilled') {
        const raw = typesRes.value.data;
        const list = Array.isArray(raw) ? raw : [];
        setResearchTypes(list.filter((t) => t.category === researchCategory));
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId, researchCategory]);

  useEffect(() => {
    if (!patientId) {
      navigate(`/doctor`);
      return;
    }
    loadData();
  }, [patientId, navigate, loadData]);

  const templates = useMemo(() => researchTypes.filter((t) => isTemplateGrid(t)), [researchTypes]);

  return {
    patient,
    results,
    researchTypes,
    templates,
    loading,
    loadData
  };
}

/**
 * Хук для управления формой добавления исследования
 */
export function useResearchForm(selectedType, loadData) {
  const [studyDate, setStudyDate] = useState('');
  const [fieldResults, setFieldResults] = useState({});
  const [gridCells, setGridCells] = useState([]);
  const [customResults, setCustomResults] = useState([]);
  const [studyNote, setStudyNote] = useState('');
  const [overallStatus, setOverallStatus] = useState('normal');

  const isGridType = useMemo(() => selectedType && isTemplateGrid(selectedType), [selectedType]);

  const gridTemplate = useMemo(() => {
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

  const updateGridCell = useCallback((row, col, patch) => {
    setGridCells((prev) => {
      const idx = prev.findIndex((cell) => cell.row === row && cell.col === col);
      if (idx === -1) {
        return [...prev, { row, col, value: '', comment: '', status: 'normal', ...patch }];
      }
      return prev.map((cell) => (cell.row === row && cell.col === col ? { ...cell, ...patch } : cell));
    });
  }, []);

  const handleFieldChange = useCallback((name, value) => {
    setFieldResults((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setStudyDate('');
    setFieldResults({});
    setCustomResults([]);
    setGridCells([]);
    setStudyNote('');
    setOverallStatus('normal');
  }, []);

  const saveStudy = async (patientId) => {
    if (!selectedType) {
      alert('Выберите тип исследования');
      return false;
    }

    try {
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
          alert('Заполните хотя бы одну ячейку');
          return false;
        }

        await medicalRecordApi.createResearchResult(patientId, {
          researchTypeId: selectedType._id,
          date: studyDate || undefined,
          gridResults,
          studyNote,
          overallStatus
        });
      } else {
        const payload = {
          researchTypeId: selectedType._id,
          date: studyDate || undefined,
          results: fieldResults,
          customResults: customResults.filter((cr) => cr.name && cr.value !== undefined && cr.value !== ''),
          studyNote,
          overallStatus
        };
        await medicalRecordApi.createResearchResult(patientId, payload);
      }

      resetForm();
      loadData();
      return true;
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось сохранить');
      return false;
    }
  };

  return {
    studyDate,
    setStudyDate,
    fieldResults,
    handleFieldChange,
    gridCells,
    updateGridCell,
    customResults,
    setCustomResults,
    studyNote,
    setStudyNote,
    overallStatus,
    setOverallStatus,
    isGridType,
    gridTemplate,
    saveStudy,
    resetForm
  };
}

/**
 * Хук для управления шаблонами (бланками)
 */
export function useTemplateBuilder(category, loadData) {
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [rowHeaders, setRowHeaders] = useState(['Строка 1', 'Строка 2', 'Строка 3']);
  const [colHeaders, setColHeaders] = useState(['Столбец 1', 'Столбец 2', 'Столбец 3', 'Столбец 4']);
  const [colUnits, setColUnits] = useState(['', '', '', '']);
  const [cells, setCells] = useState(() => {
    const cells = [];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 4; c += 1) {
        cells.push({ row: r, col: c, value: '', comment: '', status: 'normal' });
      }
    }
    return cells;
  });

  const updateCell = useCallback((row, col, patch) => {
    setCells((prev) => {
      const idx = prev.findIndex((cell) => cell.row === row && cell.col === col);
      if (idx === -1) {
        return [...prev, { row, col, value: '', comment: '', status: 'normal', ...patch }];
      }
      return prev.map((cell) => (cell.row === row && cell.col === col ? { ...cell, ...patch } : cell));
    });
  }, []);

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Введите название шаблона');
      return;
    }

    const cellDefaults = cells
      .filter((cell) =>
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
      name: templateName.trim(),
      category,
      templateMode: 'grid',
      template: [],
      gridTemplate: {
        rows,
        cols,
        rowHeaders: rowHeaders.map((s) => s.trim() || '—'),
        colHeaders: colHeaders.map((s) => s.trim() || '—'),
        colUnits: colUnits.map((s) => String(s || '').trim().slice(0, 32)),
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
    if (!window.confirm('Удалить этот шаблон?')) return;
    try {
      await researchApi.deleteResearchType(id);
      loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Не удалось удалить');
    }
  };

  const openNewTemplate = () => {
    setEditingTemplateId(null);
    setTemplateName('');
    setRows(3);
    setCols(4);
    setRowHeaders(['Строка 1', 'Строка 2', 'Строка 3']);
    setColHeaders(['Столбец 1', 'Столбец 2', 'Столбец 3', 'Столбец 4']);
    setColUnits(['', '', '', '']);
    setCells([]);
    setShowTemplateBuilder(true);
  };

  const openEditTemplate = (t) => {
    const gt = t.gridTemplate || {};
    const r = Number(gt.rows) || 3;
    const c = Number(gt.cols) || 3;
    setEditingTemplateId(t._id);
    setTemplateName(t.name);
    setRows(r);
    setCols(c);
    setRowHeaders(gt.rowHeaders || []);
    setColHeaders(gt.colHeaders || []);
    setColUnits(gt.colUnits || []);
    setCells(mergeCellDefaults(r, c, gt.cellDefaults));
    setShowTemplateBuilder(true);
  };

  return {
    showTemplateBuilder,
    setShowTemplateBuilder,
    editingTemplateId,
    templateName,
    setTemplateName,
    rows,
    setRows,
    cols,
    setCols,
    rowHeaders,
    setRowHeaders,
    colHeaders,
    setColHeaders,
    colUnits,
    setColUnits,
    cells,
    updateCell,
    saveTemplate,
    deleteTemplate,
    openNewTemplate,
    openEditTemplate
  };
}