import { useNavigate } from 'react-router-dom';
import { Modal, Tabs } from '@components/ui';
import MedicalSystemSection from './MedicalSystemSection';
import SickLeaveSection from './SickLeaveSection';
import { ResearchNavigation, MedicalHistory } from './MedicalRecordHelpers';
import PatientLaboratorySection from '../../../profile/components/PatientLaboratorySection';
import InstrumentalInvestigationsSection from '../../../profile/components/InstrumentalInvestigationsSection';

export default function MedicalRecordModal({
  open,
  patient,
  record,
  laboratoryResults,
  instrumentalResults,
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
  getSickLeaveWithChanges,
  hasUnsavedChanges
}) {
  const navigate = useNavigate();

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Overlay>
        <Modal.Content className="modal-content--wide">
          <Modal.Header>
            <h3>Карточка пациента</h3>
          </Modal.Header>

          <Modal.Body>
            <p><strong>Пациент:</strong> {patient?.name || '—'}</p>
            <p><strong>Дата рождения:</strong> {patient?.birthDate ? String(patient.birthDate).slice(0, 4) : '—'}</p>
            <p><strong>Телефон:</strong> {patient?.phone || '—'}</p>

            {loading && <p>Загрузка карты...</p>}
            {!loading && error && <p className="medical-record-error">{error}</p>}

            {!loading && (
              <Tabs value={tab} onValueChange={onSetTab}>
                <Tabs.List className="medical-record-tabs">
                  <Tabs.Trigger value="systems" className="profile-tab-btn">
                    Медицинская карта
                  </Tabs.Trigger>
                  <Tabs.Trigger value="sickLeave" className="profile-tab-btn">
                    Лист нетрудоспособности
                  </Tabs.Trigger>
                  <Tabs.Trigger value="laboratory" className="profile-tab-btn">
                    Лабораторные исследования
                  </Tabs.Trigger>
                  <Tabs.Trigger value="instrumental" className="profile-tab-btn">
                    Инструментальные исследования
                  </Tabs.Trigger>
                  {onPrescription && (
                    <button
                      type="button"
                      className="profile-tab-btn"
                      onClick={() => onPrescription(patient)}
                    >
                      E-назначение
                    </button>
                  )}
                </Tabs.List>

                <Tabs.Content value="systems">
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
                </Tabs.Content>

                <Tabs.Content value="sickLeave">
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
                </Tabs.Content>

                <Tabs.Content value="laboratory">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate(`/doctor/patient/${patient?.id}/laboratory`)}
                  >
                    Добавить лаб анализы
                  </button>
                  <PatientLaboratorySection results={laboratoryResults} loading={loading} />
                </Tabs.Content>

                <Tabs.Content value="instrumental">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => navigate(`/doctor/patient/${patient?.id}/instrumental`)}
                  >
                    Добавить инструментальные исследования
                  </button>
                  <InstrumentalInvestigationsSection results={instrumentalResults} loading={loading} />
                </Tabs.Content>
              </Tabs>
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
