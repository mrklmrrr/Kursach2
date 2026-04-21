import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { medicalRecordApi } from '../../services/medicalRecordApi';
import { researchApi } from '../../services/researchApi';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import './ResearchManagement.css';

const InstrumentalResearch = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [results, setResults] = useState([]);
  const [researchTypes, setResearchTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newResult, setNewResult] = useState({
    researchTypeName: '',
    date: new Date().toISOString().slice(0, 10),
    results: {},
    customResults: []
  });

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
        setResults(instRes.value.data);
      }

      if (typesRes.status === 'fulfilled') {
        setResearchTypes(typesRes.value.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) {
      navigate('/doctor');
      return;
    }
    loadData();
  }, [patientId, navigate, loadData]);

  const handleSaveResult = async () => {
    if (!newResult.researchTypeName.trim() || !newResult.date) {
      alert('Заполните все обязательные поля');
      return;
    }

    try {
      // Найти существующий тип исследования или создать новый
      let researchType = researchTypes.find(t => t.name === newResult.researchTypeName.trim() && t.category === 'instrumental');

      if (!researchType) {
        // Создаем новый тип исследования
        const newTypeData = {
          name: newResult.researchTypeName.trim(),
          category: 'instrumental',
          template: [] // Пустой шаблон для новых типов
        };

        const { data: newType } = await researchApi.createResearchType(newTypeData);
        researchType = newType;

        // Добавляем в локальный state
        setResearchTypes(prev => [...prev, newType]);
      }

      const payload = {
        researchTypeId: researchType._id,
        date: newResult.date,
        results: newResult.results,
        customResults: newResult.customResults.filter(cr => cr.name && cr.value)
      };

      await medicalRecordApi.createResearchResult(patientId, payload);

      // Сбрасываем форму и обновляем данные
      setNewResult({
        researchTypeName: '',
        date: new Date().toISOString().slice(0, 10),
        results: {},
        customResults: []
      });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Не удалось сохранить результат исследования');
    }
  };

  const formatDateTime = (value) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('ru-RU');
  };

  const handleResultChange = (fieldName, value) => {
    setNewResult(prev => ({
      ...prev,
      results: { ...prev.results, [fieldName]: value }
    }));
  };

  const handleCustomResultChange = (index, field, value) => {
    setNewResult(prev => {
      const customResults = [...prev.customResults];
      customResults[index] = { ...customResults[index], [field]: value };
      return { ...prev, customResults };
    });
  };

  const handleAddCustomResult = () => {
    setNewResult(prev => ({
      ...prev,
      customResults: [...prev.customResults, { name: '', value: '', unit: '' }]
    }));
  };

  const handleRemoveCustomResult = (index) => {
    setNewResult(prev => ({
      ...prev,
      customResults: prev.customResults.filter((_, i) => i !== index)
    }));
  };

  const selectedType = researchTypes.find(t => t.name === newResult.researchTypeName && t.category === 'instrumental');

  if (loading) return <PageLayout><div className="loading-spinner">Загрузка...</div></PageLayout>;

  return (
    <PageLayout title={`Инструментальные исследования - ${patient?.name || 'Пациент'}`} hideBack={false}>
      <div className="research-management">
        <div className="research-header">
          <h2>Инструментальные исследования</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Отмена' : 'Добавить исследование'}
          </button>
        </div>

        {showAddForm && (
          <div className="research-form">
            <h3>Новое инструментальное исследование</h3>

            <div className="form-group">
              <label>Тип исследования</label>
              <input
                type="text"
                value={newResult.researchTypeName}
                onChange={(e) => setNewResult(prev => ({ ...prev, researchTypeName: e.target.value, results: {} }))}
                placeholder="Выберите или введите новый тип исследования"
                list="inst-research-types"
                required
              />
              <datalist id="inst-research-types">
                {researchTypes
                  .filter(type => type.category === 'instrumental')
                  .map(type => (
                    <option key={type._id} value={type.name} />
                  ))
                }
              </datalist>
            </div>

            <div className="form-group">
              <label>Дата исследования</label>
              <input
                type="date"
                value={newResult.date}
                onChange={(e) => setNewResult(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            {selectedType && selectedType.template.length > 0 && (
              <div className="research-template-fields">
                <h4>Показатели по шаблону</h4>
                {selectedType.template.map((field, idx) => (
                  <div key={idx} className="form-group">
                    <label>{field.name} {field.required && <span className="required">*</span>}</label>
                    {field.type === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={newResult.results[field.name] || ''}
                        onChange={(e) => handleResultChange(field.name, e.target.value)}
                        placeholder={`Введите значение${field.unit ? ` (${field.unit})` : ''}`}
                        required={field.required}
                      />
                    ) : field.type === 'date' ? (
                      <input
                        type="date"
                        value={newResult.results[field.name] || ''}
                        onChange={(e) => handleResultChange(field.name, e.target.value)}
                        required={field.required}
                      />
                    ) : (
                      <input
                        type="text"
                        value={newResult.results[field.name] || ''}
                        onChange={(e) => handleResultChange(field.name, e.target.value)}
                        placeholder={`Введите значение${field.unit ? ` (${field.unit})` : ''}`}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="custom-results-section">
              <h4>Дополнительные показатели</h4>
              {newResult.customResults.map((cr, idx) => (
                <div key={idx} className="custom-result-row">
                  <input
                    type="text"
                    placeholder="Название показателя"
                    value={cr.name}
                    onChange={(e) => handleCustomResultChange(idx, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Значение"
                    value={cr.value}
                    onChange={(e) => handleCustomResultChange(idx, 'value', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Ед. измерения"
                    value={cr.unit}
                    onChange={(e) => handleCustomResultChange(idx, 'unit', e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-small"
                    onClick={() => handleRemoveCustomResult(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddCustomResult}
              >
                + Добавить показатель
              </button>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={handleSaveResult}>
                Сохранить
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowAddForm(false)}>
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="research-results">
          <h3>История исследований</h3>
          {results.length === 0 ? (
            <p>Инструментальные исследования пока не проводились.</p>
          ) : (
            results.map((result) => (
              <div key={result._id} className="research-result-card">
                <div className="result-header">
                  <h4>{result.researchTypeId?.name || 'Неизвестный тип'}</h4>
                  <span className="result-date">{formatDateTime(result.date)}</span>
                </div>
                <div className="result-doctor">Врач: {result.doctorName}</div>
                <div className="research-results-grid">
                  {result.results.map((r, idx) => (
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
              </div>
            ))
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default InstrumentalResearch;