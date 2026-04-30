/**
 * Компонент всех модальных окон панели врача
 * Объединяет: CommentModal, PatientProfileModal, PrescriptionModal, MedicalRecordModal
 */
import { CommentModal, PatientProfileModal, MedicalRecordModal } from '../modals';
import PrescriptionModal from '../modals/PrescriptionModal';

export default function DoctorPanelModals({
  // CommentModal
  commentModal,
  appointments,
  setAppointments,
  onCloseCommentModal,
  onSaveComment,
  
  // PatientProfileModal
  selectedPatient,
  onClosePatientProfile,
  onOpenMedicalRecord,
  
  // PrescriptionModal
  prescriptionPatient,
  onClosePrescription,
  onPrescriptionSaved,
  
  // MedicalRecordModal
  medicalRecordModal,
  user,
  onCloseMedicalRecord,
  onSetTab,
  onToggleSection,
  onFieldChange,
  onSaveSection,
  onAddSickLeaveDraft,
  onSickLeaveFieldChange,
  onSaveSickLeave,
  onToggleHistory,
  onToggleSickLeaveHistory,
  onOpenPrescription,
  getSickLeaveWithChanges,
  hasUnsavedChanges,
}) {
  return (
    <>
      <CommentModal
        open={commentModal.open}
        appointment={commentModal.appointment}
        text={commentModal.text}
        onChangeText={(text) => commentModal.setModal((prev) => ({ ...prev, text }))}
        onSave={() => onSaveComment(appointments, setAppointments)}
        onClose={onCloseCommentModal}
      />

      <PatientProfileModal
        patient={selectedPatient}
        onOpenMedicalRecord={onOpenMedicalRecord}
        onClose={onClosePatientProfile}
      />

      <PrescriptionModal
        patient={prescriptionPatient}
        onClose={onClosePrescription}
        onSaved={onPrescriptionSaved}
      />

      <MedicalRecordModal
        open={medicalRecordModal.modal.open}
        patient={medicalRecordModal.modal.patient}
        record={medicalRecordModal.modal.record}
        laboratoryResults={medicalRecordModal.modal.laboratoryResults}
        instrumentalResults={medicalRecordModal.modal.instrumentalResults}
        loading={medicalRecordModal.modal.loading}
        error={medicalRecordModal.modal.error}
        tab={medicalRecordModal.tab}
        expandedSection={medicalRecordModal.expandedSection}
        historyOpen={medicalRecordModal.historyOpen}
        showSickLeaveHistory={medicalRecordModal.showSickLeaveHistory}
        savingSectionKey={medicalRecordModal.modal.savingSectionKey}
        onSetTab={onSetTab}
        onToggleSection={(key) => onToggleSection(medicalRecordModal.expandedSection === key ? '' : key)}
        onFieldChange={onFieldChange}
        onSaveSection={onSaveSection}
        onAddSickLeaveDraft={() => onAddSickLeaveDraft(user)}
        onSickLeaveFieldChange={onSickLeaveFieldChange}
        onSaveSickLeave={onSaveSickLeave}
        onToggleHistory={onToggleHistory}
        onToggleSickLeaveHistory={onToggleSickLeaveHistory}
        onPrescription={onOpenPrescription}
        getSickLeaveWithChanges={getSickLeaveWithChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onClose={onCloseMedicalRecord}
      />
    </>
  );
}