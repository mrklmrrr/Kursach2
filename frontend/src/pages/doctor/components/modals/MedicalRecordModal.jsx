import { useNavigate } from 'react-router-dom';
import MedicalSystemSection from './MedicalSystemSection';
import SickLeaveSection from './SickLeaveSection';
import { ResearchNavigation, MedicalHistory } from './MedicalRecordHelpers';

export default function MedicalRecordModal({
  open,
  patient,
  record,
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
  onToggleSickLeaveHistory
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="patient-modal-overlay" role="presentation" onClick={onClose}>
      <div className="patient-modal medical-record-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>Карточка пациента</h3>
        <p><strong>Пациент:</strong> {patient?.name || '—'}</p>
        <p><strong>Дата рождения:</strong> {patient?.birthDate ? String(patient.birthDate).slice(0, 4) : '—'}</p>
        <p><strong>Телефон:</strong> {patient?.phone || '—'}</p>

        {loading && <p>Загрузка карты...</p>}
        {!loading && error && <p className="medical-record-error">{error}</p>}

        {!loading && (
          <div>
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
              />
            )}

            {tab === 'laboratory' && (
              <ResearchNavigation
                patientId={patient?.id}
                label="лабораторные исследования"
                pathSegment="laboratory"
                navigate={navigate}
              />
            )}

            {tab === 'instrumental' && (
              <ResearchNavigation
                patientId={patient?.id}
                label="инструментальные исследования"
                pathSegment="instrumental"
                navigate={navigate}
              />
            )}
          </div>
        )}

        <button type="button" className="btn btn-outline" onClick={onClose}>
          Закрыть карту
        </button>
      </div>
    </div>
  );
}
