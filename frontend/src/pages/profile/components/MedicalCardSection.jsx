import { useEffect, useMemo, useState } from 'react';
import { formatDateTime, formatHistoryDate } from '../utils/profileUtils';
import PatientLaboratorySection from './PatientLaboratorySection';
import InstrumentalInvestigationsSection from './InstrumentalInvestigationsSection';
import { prescriptionApi } from '../../../services/prescriptionApi';

const TAB_IDS = ['systems', 'sickLeave', 'laboratory', 'instrumental', 'prescriptions'];

export const MedicalCardSection = ({
  variant = 'inline',
  initialTab = 'systems',
  onTabChange,
  medicalRecord,
  laboratoryResults = [],
  instrumentalResults = [],
  loading,
  error,
  allLeaves,
  currentLeaf
}) => {
  const isPage = variant === 'page';
  const [medicalRecordOpen, setMedicalRecordOpen] = useState(isPage);
  const [expandedMedicalSection, setExpandedMedicalSection] = useState('');
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [medicalRecordTab, setMedicalRecordTab] = useState(
    TAB_IDS.includes(initialTab) ? initialTab : 'systems'
  );

  /* Синхронизация только при смене вкладки из URL (страница медкарты), не при локальном клике */
  useEffect(() => {
    if (TAB_IDS.includes(initialTab)) {
      setMedicalRecordTab(initialTab);
    }
  }, [initialTab]);

  const selectTab = (tab) => {
    setMedicalRecordTab(tab);
    onTabChange?.(tab);
  };
  const [showSickLeaveHistory, setShowSickLeaveHistory] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [prescriptionsError, setPrescriptionsError] = useState('');
  const [expandedPrescriptionById, setExpandedPrescriptionById] = useState({});

  /* eslint-disable react-hooks/set-state-in-effect -- загрузка назначений при открытии вкладки */
  useEffect(() => {
    if (!medicalRecordOpen || medicalRecordTab !== 'prescriptions') return;
    let cancelled = false;
    setPrescriptionsLoading(true);
    setPrescriptionsError('');
    prescriptionApi
      .list()
      .then((res) => {
        if (!cancelled) {
          setPrescriptions(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrescriptions([]);
          setPrescriptionsError('Не удалось загрузить назначения');
        }
      })
      .finally(() => {
        if (!cancelled) setPrescriptionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [medicalRecordOpen, medicalRecordTab]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const sortedPrescriptions = useMemo(() => {
    const items = Array.isArray(prescriptions) ? [...prescriptions] : [];
    return items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [prescriptions]);

  const togglePrescription = (id) => {
    const key = String(id);
    setExpandedPrescriptionById((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className={`section-card section-card--lux ${isPage ? 'medical-card-section--page' : ''}`}>
      {!isPage && <h3>Медицинская карта</h3>}
      {loading && <p className="empty-info">Загрузка медицинской карты...</p>}
      {!loading && error && <p className="error-info">{error}</p>}
      {!isPage && !loading && !medicalRecordOpen && (
        <p className="empty-info">
          Откройте карту, чтобы посмотреть записи врача по системам организма и лабораторные анализы.
        </p>
      )}
      {!isPage && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setMedicalRecordOpen((prev) => !prev)}
          disabled={loading}
        >
          {medicalRecordOpen ? 'Скрыть карту' : 'Открыть карту'}
        </button>
      )}

      {!loading && (isPage || medicalRecordOpen) && (
        <>
          <div className="medical-record-tabs">
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'systems' ? 'active' : ''}`}
              onClick={() => selectTab('systems')}
            >
              Медицинская карта
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'sickLeave' ? 'active' : ''}`}
              onClick={() => selectTab('sickLeave')}
            >
              Лист нетрудоспособности
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'laboratory' ? 'active' : ''}`}
              onClick={() => selectTab('laboratory')}
            >
              Лабораторные анализы
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'instrumental' ? 'active' : ''}`}
              onClick={() => selectTab('instrumental')}
            >
              Инструментальные исследования
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'prescriptions' ? 'active' : ''}`}
              onClick={() => selectTab('prescriptions')}
            >
              Назначение
            </button>
          </div>

          {!isPage && (
            <div className="medical-record-patient-info">
              <p><strong>Пациент:</strong> {medicalRecord?.patient?.name || '—'}</p>
              <p><strong>Дата рождения:</strong> {medicalRecord?.patient?.birthDate ? String(medicalRecord.patient.birthDate).slice(0, 4) : '—'}</p>
              <p><strong>Телефон:</strong> {medicalRecord?.patient?.phone || '—'}</p>
            </div>
          )}

          {/* Вкладка: Медицинская карта (системы организма) */}
          {medicalRecordTab === 'systems' && (
            <>
              {error && !medicalRecord ? (
                <p className="empty-info">
                  Раздел систем недоступен: карта не загрузилась. Перейдите на вкладку «Лабораторные анализы», если нужны только результаты исследований.
                </p>
              ) : null}
              {(medicalRecord?.systems || []).map((section) => (
                <div key={section.key} className="medical-record-system">
                  <button
                    type="button"
                    className="medical-system-toggle"
                    onClick={() => setExpandedMedicalSection((prev) => (prev === section.key ? '' : section.key))}
                  >
                    <span>{section.name}</span>
                    <span>{expandedMedicalSection === section.key ? '−' : '+'}</span>
                  </button>
                  {expandedMedicalSection === section.key && (
                    <div className="medical-system-content">
                      <p><strong>Осмотр и жалобы:</strong> {section.notes || '—'}</p>
                      <p><strong>Диагноз:</strong> {section.diagnosis || '—'}</p>
                      <p><strong>Лечение:</strong> {section.treatment || '—'}</p>
                      <p><strong>Рекомендации:</strong> {section.recommendations || '—'}</p>
                      <p className="medical-system-meta">
                        Обновлено: {formatDateTime(section.updatedAt)} • Врач: {section.updatedBy?.doctorName || '—'}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Блок истории обследования (changeLogs) */}
              <div className="medical-record-logs">
                <button
                  type="button"
                  className="medical-history-toggle"
                  onClick={() => setMedicalHistoryOpen((prev) => !prev)}
                >
                  <span>История обследования</span>
                  <span>{medicalHistoryOpen ? '−' : '+'}</span>
                </button>
                {medicalHistoryOpen && (
                  <>
                    {(medicalRecord?.changeLogs || []).length === 0 ? (
                      <p className="empty-info">Изменений пока нет.</p>
                    ) : (
                      medicalRecord.changeLogs.slice(0, 20).map((log, idx) => (
                        <div key={`${log.createdAt}-${log.field}-${idx}`} className="medical-log-item">
                          <div><strong>{log.doctorName}</strong> • {formatDateTime(log.createdAt)}</div>
                          <div>{log.sectionName} • {log.field}</div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {medicalRecordTab === 'laboratory' && (
            <PatientLaboratorySection results={laboratoryResults} loading={loading} />
          )}

          {medicalRecordTab === 'instrumental' && (
            <InstrumentalInvestigationsSection results={instrumentalResults} loading={loading} />
          )}

          {medicalRecordTab === 'prescriptions' && (
            <div className="medical-sick-leaves">
              {prescriptionsLoading && <p className="empty-info">Загрузка назначений...</p>}
              {!prescriptionsLoading && prescriptionsError && <p className="error-info">{prescriptionsError}</p>}
              {!prescriptionsLoading && !prescriptionsError && sortedPrescriptions.length === 0 && (
                <p className="empty-info">Назначения появятся после приёма, когда врач оформит рекомендации.</p>
              )}
              {!prescriptionsLoading && !prescriptionsError && sortedPrescriptions.map((doc, index) => {
                const key = String(doc._id || `${doc.createdAt || 'date'}-${index}`);
                const expanded = Boolean(expandedPrescriptionById[key]);
                return (
                  <div key={key} className="prescription-item">
                    <button
                      type="button"
                      className="prescription-toggle"
                      aria-expanded={expanded}
                      onClick={() => togglePrescription(key)}
                    >
                      <span className="prescription-head">
                        <strong>
                          {doc.doctorName || 'Врач'}
                          {doc.doctorSpecialty ? ` — ${doc.doctorSpecialty}` : ''}
                        </strong>
                        <span className="prescription-date">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : ''}
                        </span>
                      </span>
                      <span className="prescription-chevron" aria-hidden>
                        {expanded ? '▾' : '▸'}
                      </span>
                    </button>
                    {expanded && (
                      <div className="prescription-body">
                        {(Array.isArray(doc.blocks) && doc.blocks.length > 0 ? doc.blocks : [{ title: 'Назначения', items: doc.items || [] }]).map((block, bIndex) => (
                          <div key={`${key}-b-${bIndex}`} className="prescription-block">
                            <p className="prescription-block-title">{block.title || `Блок ${bIndex + 1}`}</p>
                            <ul>
                              {(block.items || []).map((it, i) => (
                                <li key={i}>
                                  {it.name}
                                  {it.dosage ? ` — ${it.dosage}` : ''}
                                  {it.notes ? ` (${it.notes})` : ''}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        {doc.recommendations ? (
                          <p className="prescription-recommendations">
                            <strong>Рекомендации:</strong> {doc.recommendations}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Вкладка: Лист нетрудоспособности */}
          {medicalRecordTab === 'sickLeave' && (
            <div className="medical-sick-leaves">
              {currentLeaf ? (
                <div className="medical-record-system">
                  <p><strong>Текущий больничный</strong></p>
                  <p><strong>Дата выдачи:</strong> {formatHistoryDate(currentLeaf.issueDate)}</p>
                  <p><strong>Период:</strong> {formatHistoryDate(currentLeaf.startDate)} — {formatHistoryDate(currentLeaf.endDate)}</p>
                  <p><strong>Заболевание:</strong> {currentLeaf.disease || '—'}</p>
                  <p><strong>Диагноз:</strong> {currentLeaf.diagnosis || '—'}</p>
                  <p><strong>Рекомендации:</strong> {currentLeaf.recommendations || '—'}</p>
                  <p className="medical-system-meta">
                    Врач: {currentLeaf.doctorName || '—'} Обновлено: {formatDateTime(currentLeaf.updatedAt)} Статус: {currentLeaf.status === 'open' ? 'Открыт' : 'Закрыт'}
                  </p>
                </div>
              ) : (
                <p>Нет текущего больничного листа.</p>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowSickLeaveHistory(!showSickLeaveHistory)}
              >
                {showSickLeaveHistory ? 'Скрыть историю больничных' : 'Показать историю больничных'}
              </button>
              {showSickLeaveHistory && (
                <div>
                  {allLeaves.filter(leaf => leaf.status !== 'open').length === 0 && (
                    <p className="empty-info">История больничных пуста.</p>
                  )}
                  {allLeaves.filter(leaf => leaf.status !== 'open').length > 0 && allLeaves.filter(leaf => leaf.status !== 'open').map((leaf) => (
                    <div key={leaf._id} className="medical-record-system">
                      <p><strong>Дата выдачи:</strong> {formatHistoryDate(leaf.issueDate)}</p>
                      <p><strong>Период:</strong> {formatHistoryDate(leaf.startDate)} — {formatHistoryDate(leaf.endDate)}</p>
                      <p><strong>Заболевание:</strong> {leaf.disease || '—'}</p>
                      <p><strong>Диагноз:</strong> {leaf.diagnosis || '—'}</p>
                      <p><strong>Рекомендации:</strong> {leaf.recommendations || '—'}</p>
                      <p className="medical-system-meta">
                        Врач: {leaf.doctorName || '—'} Обновлено: {formatDateTime(leaf.updatedAt)} Статус: {leaf.status === 'open' ? 'Открыт' : 'Закрыт'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};