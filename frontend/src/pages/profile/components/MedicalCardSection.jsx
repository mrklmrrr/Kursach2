import { useState } from 'react';
import { formatDateTime, formatHistoryDate } from '../utils/profileUtils';

export const MedicalCardSection = ({ medicalRecord, loading, error, allLeaves, currentLeaf }) => {
  const [medicalRecordOpen, setMedicalRecordOpen] = useState(false);
  const [expandedMedicalSection, setExpandedMedicalSection] = useState('');
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [medicalRecordTab, setMedicalRecordTab] = useState('systems');
  const [showSickLeaveHistory, setShowSickLeaveHistory] = useState(false);

  return (
    <section className="section-card">
      <h3>Медицинская карта</h3>
      {loading && <p className="empty-info">Загрузка медицинской карты...</p>}
      {!loading && error && <p className="error-info">{error}</p>}
      {!loading && !error && !medicalRecordOpen && (
        <p className="empty-info">Откройте карту, чтобы посмотреть записи врача по системам организма.</p>
      )}
      <button
        className="btn btn-primary"
        onClick={() => setMedicalRecordOpen((prev) => !prev)}
        disabled={loading}
      >
        {medicalRecordOpen ? 'Скрыть карту' : 'Открыть карту'}
      </button>

      {!loading && !error && medicalRecordOpen && (
        <>
          <div className="medical-record-tabs">
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'systems' ? 'active' : ''}`}
              onClick={() => setMedicalRecordTab('systems')}
            >
              Медицинская карта
            </button>
            <button
              type="button"
              className={`profile-tab-btn ${medicalRecordTab === 'sickLeave' ? 'active' : ''}`}
              onClick={() => setMedicalRecordTab('sickLeave')}
            >
              Лист нетрудоспособности
            </button>
          </div>

          <div className="medical-record-patient-info">
            <p><strong>Пациент:</strong> {medicalRecord?.patient?.name || '—'}</p>
            <p><strong>Дата рождения:</strong> {medicalRecord?.patient?.birthDate ? String(medicalRecord.patient.birthDate).slice(0, 4) : '—'}</p>
            <p><strong>Телефон:</strong> {medicalRecord?.patient?.phone || '—'}</p>
          </div>

          {/* Вкладка: Медицинская карта (системы организма) */}
          {medicalRecordTab === 'systems' && (
            <>
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