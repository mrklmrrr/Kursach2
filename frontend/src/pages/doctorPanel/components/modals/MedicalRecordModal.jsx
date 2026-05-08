import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@components/ui';
import { RELATION_TYPES } from '@constants';
import MedicalSystemSection from './MedicalSystemSection';
import SickLeaveSection from './SickLeaveSection';
import { ResearchNavigation, MedicalHistory } from './MedicalRecordHelpers';
import PatientLaboratorySection from '../../../profile/components/PatientLaboratorySection';
import InstrumentalInvestigationsSection from '../../../profile/components/InstrumentalInvestigationsSection';

const relationLabelByValue = RELATION_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const formatBirthDate = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

export default function MedicalRecordModal({
  open,
  patient,
  record,
  laboratoryResults,
  instrumentalResults,
  dependents,
  dependentsLoading,
  dependentsError,
  loading,
  error,
  tab,
  expandedSection,
  historyOpen,
  showSickLeaveHistory,
  savingSectionKey,
  onSetTab,
  onToggleSection,
  onFieldChange,
  onSaveSection,
  onAddSickLeaveDraft,
  onSickLeaveFieldChange,
  onSaveSickLeave,
  onToggleHistory,
  onClose,
  onToggleSickLeaveHistory,
  onPrescription,
  onLoadDependents,
  getSickLeaveWithChanges,
  hasUnsavedChanges
}) {
  const navigate = useNavigate();
  const birthDateLabel = formatBirthDate(patient?.birthDate);

  useEffect(() => {
    if (open && tab === 'dependents') {
      onLoadDependents?.();
    }
  }, [open, tab, onLoadDependents]);

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content className="modal-content--wide">
          <Modal.Header>
            <h3>Карточка пациента</h3>
          </Modal.Header>

          <Modal.Body>
            <p><strong>Пациент:</strong> {patient?.name || '—'}</p>
            <p><strong>Дата рождения:</strong> {birthDateLabel}</p>
            <p><strong>Телефон:</strong> {patient?.phone || '—'}</p>

            {loading && <p>Загрузка карты...</p>}
            {!loading && error && <p className="medical-record-error">{error}</p>}

            {!loading && (
              <>
                <div className="medical-record-tabs">
                  <button
                    type="button"
                    className={`profile-tab-btn ${tab === 'systems' ? 'active' : ''}`}
                    onClick={() => onSetTab('systems')}
                  >
                    Медицинская карта
                  </button>
                  <button
                    type="button"
                    className={`profile-tab-btn ${tab === 'sickLeave' ? 'active' : ''}`}
                    onClick={() => onSetTab('sickLeave')}
                  >
                    Лист нетрудоспособности
                  </button>
                  <button
                    type="button"
                    className={`profile-tab-btn ${tab === 'laboratory' ? 'active' : ''}`}
                    onClick={() => onSetTab('laboratory')}
                  >
                    Лабораторные исследования
                  </button>
                  <button
                    type="button"
                    className={`profile-tab-btn ${tab === 'instrumental' ? 'active' : ''}`}
                    onClick={() => onSetTab('instrumental')}
                  >
                    Инструментальные исследования
                  </button>
                  {onPrescription && (
                    <button
                      type="button"
                      className="profile-tab-btn"
                      onClick={() => onPrescription(patient)}
                    >
                      Назначение
                    </button>
                  )}
                  <button
                    type="button"
                    className={`profile-tab-btn ${tab === 'dependents' ? 'active' : ''}`}
                    onClick={() => onSetTab('dependents')}
                  >
                    Родственники
                  </button>
                </div>

                {tab === 'systems' && (
                  <>
                    <MedicalSystemSection
                      systems={record?.systems || []}
                      expandedSection={expandedSection}
                      onToggleSection={onToggleSection}
                      onFieldChange={onFieldChange}
                      onSaveSection={onSaveSection}
                      savingSectionKey={savingSectionKey}
                    />
                    <MedicalHistory
                      logs={record?.changeLogs || []}
                      historyOpen={historyOpen}
                      onToggle={onToggleHistory}
                    />
                  </>
                )}

                {tab === 'sickLeave' && (
                  <SickLeaveSection
                    sickLeaves={record?.sickLeaves || []}
                    showHistory={showSickLeaveHistory}
                    onToggleHistory={onToggleSickLeaveHistory}
                    onAddDraft={onAddSickLeaveDraft}
                    onFieldChange={onSickLeaveFieldChange}
                    onSave={onSaveSickLeave}
                    savingSectionKey={savingSectionKey}
                    getSickLeaveWithChanges={getSickLeaveWithChanges}
                    hasUnsavedChanges={hasUnsavedChanges}
                  />
                )}

                {tab === 'laboratory' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/doctor/patient/${patient?.id}/laboratory`)}
                    >
                      Добавить лаб анализы
                    </button>
                    <PatientLaboratorySection results={laboratoryResults} loading={loading} />
                  </>
                )}

                {tab === 'instrumental' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => navigate(`/doctor/patient/${patient?.id}/instrumental`)}
                    >
                      Добавить инструментальные исследования
                    </button>
                    <InstrumentalInvestigationsSection results={instrumentalResults} loading={loading} />
                  </>
                )}

                {tab === 'dependents' && (
                  <section className="doctor-dependents-section">
                    {dependentsLoading && (
                      <p className="doctor-dependents-state">Загрузка списка родственников...</p>
                    )}
                    {!dependentsLoading && dependentsError && (
                      <div className="doctor-dependents-state doctor-dependents-state--error">
                        <p>{dependentsError}</p>
                        <button type="button" className="btn btn-outline btn-small" onClick={() => onLoadDependents?.()}>
                          Повторить
                        </button>
                      </div>
                    )}
                    {!dependentsLoading && !dependentsError && (!dependents || dependents.length === 0) && (
                      <p className="doctor-dependents-state">Родственники у пациента не добавлены.</p>
                    )}
                    {!dependentsLoading && !dependentsError && Array.isArray(dependents) && dependents.length > 0 && (
                      <div className="doctor-dependents-list">
                        {dependents.map((item) => (
                          <article key={item._id || item.id || `${item.name}-${item.relation || 'relative'}`} className="doctor-dependent-card">
                            <div className="doctor-dependent-card__head">
                              <strong>{item.name || item.fullName || 'Без имени'}</strong>
                              <span>{relationLabelByValue[item.relation] || item.relation || 'Родственник'}</span>
                            </div>
                            <div className="doctor-dependent-card__grid">
                              <p><strong>Дата рождения:</strong> {formatBirthDate(item.birthDate)}</p>
                              <p><strong>Телефон:</strong> {item.phone || '—'}</p>
                              <p><strong>Пол:</strong> {item.gender === 'male' ? 'Мужской' : item.gender === 'female' ? 'Женский' : '—'}</p>
                              <p><strong>Возраст:</strong> {item.age ?? '—'}</p>
                            </div>
                            {(item.allergies || item.chronicConditions || item.notes) && (
                              <div className="doctor-dependent-card__notes">
                                {item.allergies ? <p><strong>Аллергии:</strong> {item.allergies}</p> : null}
                                {item.chronicConditions ? <p><strong>Хронические заболевания:</strong> {item.chronicConditions}</p> : null}
                                {item.notes ? <p><strong>Заметки:</strong> {item.notes}</p> : null}
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </Modal.Body>

          <Modal.Footer>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Закрыть карту
            </button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Overlay>
    </Modal>
  );
}
