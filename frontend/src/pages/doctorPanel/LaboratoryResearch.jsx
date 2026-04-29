import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageLayout from '@components/layout/PageLayout/PageLayout';
import { useResearchData, useResearchForm, useTemplateBuilder } from '@hooks/doctorPanel/useResearch';
import { isTemplateGrid, normalizeGridTemplate } from '@utils/gridUtils';
import GridDataEntry from './components/GridDataEntry/GridDataEntry';
import GridTemplateBuilder from './components/GridTemplateBuilder/GridTemplateBuilder';
import GridTemplatesList from './components/GridTemplatesList/GridTemplatesList';
import ResearchResultsList from './components/ResearchResultsList/ResearchResultsList';
import './ResearchManagement.css';

const STATUS_OPTIONS = [
  { value: 'normal', label: 'Норма' },
  { value: 'deviation', label: 'Отклонение от нормы' },
  { value: 'severe', label: 'Сильное нарушение' }
];

function LaboratoryResearch() {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const autocompleteRef = useRef(null);

  const { patient, results, researchTypes, templates, loading, loadData } = useResearchData(patientId, 'laboratory');

  const [panelMode, setPanelMode] = useState('study');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedType = useMemo(
    () => researchTypes.find((t) => String(t._id) === String(selectedTypeId)),
    [researchTypes, selectedTypeId]
  );

  const {
    studyDate, setStudyDate, fieldResults, handleFieldChange,
    gridCells, updateGridCell, customResults, setCustomResults,
    studyNote, setStudyNote, overallStatus, setOverallStatus,
    isGridType, gridTemplate, saveStudy, resetForm
  } = useResearchForm(selectedType, loadData);

  const {
    showTemplateBuilder, setShowTemplateBuilder, editingTemplateId, templateName, setTemplateName,
    rows, setRows, cols, setCols, rowHeaders, setRowHeaders, colHeaders, setColHeaders,
    colUnits, setColUnits, cells, setCells, updateCell, saveTemplate, deleteTemplate, openNewTemplate, openEditTemplate
  } = useTemplateBuilder('laboratory', loadData);

  const [expandedResults, setExpandedResults] = useState({});

  useEffect(() => {
    if (!showTemplateBuilder && panelMode === 'template') {
      setPanelMode('study');
    }
  }, [showTemplateBuilder, panelMode]);

  const toggleResultExpanded = (resultId) => {
    setExpandedResults((prev) => ({ ...prev, [resultId]: !prev[resultId] }));
  };

  const nameMatchesSearch = (name) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return String(name || '').toLowerCase().includes(q);
  };

  const visibleLabTypes = useMemo(() => researchTypes.filter((t) => nameMatchesSearch(t.name)), [researchTypes, nameMatchesSearch]);
  const visibleGridTemplates = useMemo(() => templates.filter((t) => nameMatchesSearch(t.name)), [templates, nameMatchesSearch]);
  const visibleResults = useMemo(() => results.filter((r) => nameMatchesSearch(r.researchTypeId?.name)), [results, nameMatchesSearch]);

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear());
    return `${day}.${month}.${year}`;
  };

  const getGridTemplateForResult = (result) => {
    const rt = result.researchTypeId;
    if (!rt || !rt.gridTemplate) return null;
    const n = normalizeGridTemplate(rt.gridTemplate);
    return (n.rows > 0 && n.cols > 0) ? n : null;
  };

  const openLabTemplateForEntry = (t) => {
    setSelectedTypeId(String(t._id));
    resetForm();
    setPanelMode('study');
  };

  const handleSaveStudy = async (e) => {
    e.preventDefault();
    const success = await saveStudy(patientId);
    if (success) { setSelectedTypeId(''); setSearchQuery(''); }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return (
    <PageLayout>
      <PageLayout.Content>
        <div className="loading-spinner">Загрузка...</div>
      </PageLayout.Content>
    </PageLayout>
  );

  return (
    <PageLayout>
      <PageLayout.Content>
        <div className="research-management lab-research-premium">
        <div className="research-header">
          <div className="research-header-top">
            <button className="btn-back-compact" onClick={() => navigate('/doctor', { state: { openMedicalRecordForPatientId: patientId } })}>
              <span className="material-icons">arrow_back</span>
              <span>К пациенту</span>
            </button>
            <h2>Лабораторные исследования — {patient?.name || 'Пациент'}</h2>
          </div>
          <div className="research-header-actions">
            <button
              type="button"
              className={`btn ${panelMode === 'template' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setPanelMode('template'); openNewTemplate(); }}
            >
              Новый шаблон
            </button>
            <button
              type="button"
              className={`btn ${panelMode === 'study' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setPanelMode('study'); resetForm(); }}
            >
              Добавить исследование
            </button>
          </div>
        </div>

        {panelMode === 'study' && (
          <form className="research-form lab-add-study" onSubmit={handleSaveStudy}>
            <h3>Новое лабораторное исследование</h3>
            <div className="form-group">
              <label>Анализ по названию</label>
              <div className="lab-autocomplete-container" ref={autocompleteRef}>
                <input type="text" className="lab-autocomplete-input" placeholder="Введите название..." value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} autoComplete="off" />
                {isDropdownOpen && visibleLabTypes.length > 0 && (
                  <div className="lab-autocomplete-dropdown">
                    {visibleLabTypes.map((t) => (
                      <div key={t._id} className={`lab-autocomplete-item ${selectedTypeId === t._id ? 'selected' : ''}`}
                        onClick={() => { setSelectedTypeId(t._id); setSearchQuery(t.name); setIsDropdownOpen(false); }}>
                        {t.name}
                        {isTemplateGrid(t) && <span className="lab-grid-badge">таблица</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {visibleLabTypes.length === 0 && <p className="lab-empty-filter">Нет совпадений.</p>}
            <div className="form-group"><label>Дата</label><input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} /></div>
            {selectedType && isGridType && gridTemplate && <GridDataEntry gridTemplate={gridTemplate} gridCells={gridCells} updateGridCell={updateGridCell} />}
            <div className="lab-study-overall">
              <h4>Заключение</h4>
              <div className="form-group"><label>Текст врача</label><textarea className="lab-study-note" rows={3} value={studyNote} onChange={(e) => setStudyNote(e.target.value)} /></div>
              <div className="form-group"><label>Оценка</label><select value={overallStatus} onChange={(e) => setOverallStatus(e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
            </div>
            {selectedType && !isGridType && (selectedType.template || []).length > 0 && (
              <div className="research-template-fields">
                <h4>Показатели</h4>
                {(selectedType.template || []).map((field, idx) => (
                  <div key={idx} className="form-group">
                    <label>{field.name} {field.required && <span className="required">*</span>}</label>
                    {field.type === 'number' ? <input type="number" step="any" value={fieldResults[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} /> :
                      field.type === 'date' ? <input type="date" value={fieldResults[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} /> :
                      <input type="text" value={fieldResults[field.name] || ''} onChange={(e) => handleFieldChange(field.name, e.target.value)} />}
                  </div>
                ))}
              </div>
            )}
            {selectedType && !isGridType && (
              <div className="custom-results-section">
                <h4>Дополнительно</h4>
                {customResults.map((cr, idx) => (
                  <div key={idx} className="custom-result-row">
                    <input placeholder="Название" value={cr.name} onChange={(e) => { const n = [...customResults]; n[idx] = { ...n[idx], name: e.target.value }; setCustomResults(n); }} />
                    <input placeholder="Значение" value={cr.value} onChange={(e) => { const n = [...customResults]; n[idx] = { ...n[idx], value: e.target.value }; setCustomResults(n); }} />
                    <input placeholder="Ед." value={cr.unit} onChange={(e) => { const n = [...customResults]; n[idx] = { ...n[idx], unit: e.target.value }; setCustomResults(n); }} />
                    <button type="button" className="btn btn-outline btn-small" onClick={() => setCustomResults((p) => p.filter((_, i) => i !== idx))}>✕</button>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" onClick={() => setCustomResults((p) => [...p, { name: '', value: '', unit: '' }])}>+ Показатель</button>
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn btn-outline" onClick={() => { resetForm(); setSelectedTypeId(''); setSearchQuery(''); }}>Очистить</button>
            </div>
          </form>
        )}

        {panelMode === 'template' && (
          <GridTemplateBuilder
            editingTemplateId={editingTemplateId}
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            rows={rows}
            onRowsChange={setRows}
            cols={cols}
            onColsChange={setCols}
            rowHeaders={rowHeaders}
            setRowHeaders={setRowHeaders}
            colHeaders={colHeaders}
            setColHeaders={setColHeaders}
            colUnits={colUnits}
            setColUnits={setColUnits}
            cells={cells}
            setCells={setCells}
            updateCell={updateCell}
            onSave={saveTemplate}
            onCancel={() => { setShowTemplateBuilder(false); setPanelMode('study'); }}
          />
        )}

        {templates.length > 0 && (
          <GridTemplatesList
            templates={visibleGridTemplates}
            onTemplateSelect={openLabTemplateForEntry}
            onEditTemplate={openEditTemplate}
            onDeleteTemplate={deleteTemplate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        <ResearchResultsList
          results={visibleResults}
          expandedResults={expandedResults}
          onToggleExpanded={toggleResultExpanded}
          formatDateTime={formatDateTime}
          getGridTemplateForResult={getGridTemplateForResult}
          onOpenTemplate={() => {}}
        />
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default LaboratoryResearch;