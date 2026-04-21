import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { doctorPanelApi } from '../../services/doctorPanelApi';
import { useAuth } from '../../hooks/useAuth';
import PageLayout from '../../components/layout/PageLayout/PageLayout';

import { useDoctorPanelData, useMedicalRecordModal, useConsultations, useCommentModal, useAppointments, useWorkingHours } from './hooks';
import { useToast } from '../../contexts/ToastProvider/useToast';
import ProfileHeader from './components/ProfileHeader';
import { RequestsTab, UpcomingTab, AppointmentsTab, PatientsTab } from './components/tabs';
import { CommentModal, PatientProfileModal, MedicalRecordModal } from './components/modals';
import PrescriptionModal from './components/modals/PrescriptionModal';

import './DoctorPanel.css';

export default function DoctorPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Data management hooks
  const panelData = useDoctorPanelData();
  const medicalRecord = useMedicalRecordModal();
  const consultations = useConsultations();
  const commentModal = useCommentModal();
  const appointments = useAppointments();
  const workingHours = useWorkingHours();

  // Local state
  const [tab, setTab] = React.useState('requests');
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = React.useState(null);

  /* eslint-disable react-hooks/exhaustive-deps -- кабинет врача: узкие deps, полный список даёт лишние циклы с panelData / хуками */
  // Initialize data on mount
  useEffect(() => {
    if (user?.role !== 'doctor') {
      navigate('/home');
      return;
    }
    panelData.loadData();
    consultations.setPendingConsultations(panelData.pendingConsultations);
    appointments.setAppointments(panelData.appointments);
    workingHours.setWorkingHours(panelData.workingHours);
    workingHours.setWorkingDays(panelData.workingDays);
  }, [user]);

  // Sync data from panelData to other hooks
  useEffect(() => {
    consultations.setPendingConsultations(panelData.pendingConsultations);
  }, [panelData.pendingConsultations]);

  useEffect(() => {
    appointments.setAppointments(panelData.appointments);
  }, [panelData.appointments]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Memoized values
  const patientById = useMemo(() => {
    const map = new Map();
    panelData.patients.forEach((patient) => {
      map.set(String(patient.id), patient);
    });
    return map;
  }, [panelData.patients]);

  const activeAppointmentsCount = useMemo(
    () =>
      appointments.appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length,
    [appointments.appointments]
  );

  const upcomingSchedule = useMemo(() => {
    const now = new Date();
    return panelData.appointments
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [panelData.appointments]);

  // Handlers
  const handleToggleOnline = async () => {
    try {
      await doctorPanelApi.toggleOnline(!panelData.profile?.isOnline);
      const next = !panelData.profile?.isOnline;
      panelData.setProfile({ ...panelData.profile, isOnline: next });
      showToast(next ? 'Вы в сети — пациенты видят вас онлайн' : 'Вы офлайн', 'success');
    } catch (err) {
      showToast(err.message || 'Не удалось изменить статус', 'error');
    }
  };

  const handleOpenPatientProfile = (patientId, fallbackName) => {
    const patient = patientById.get(String(patientId));
    setSelectedPatient(patient || {
      id: patientId,
      name: fallbackName || 'Пациент',
      phone: '—',
      birthDate: '',
      consultationCount: 0
    });
  };

  const handleOpenPatientMedicalRecord = (patient) => {
    medicalRecord.openMedicalRecord(patient);
  };

  if (panelData.loading) {
    return <PageLayout><div className="loading-spinner">Загрузка...</div></PageLayout>;
  }

  return (
    <PageLayout title="Кабинет врача" hideBack>
      <div className="doctor-panel">
        {/* Profile Header */}
        <ProfileHeader
          profile={panelData.profile}
          isOnline={panelData.profile?.isOnline}
          onToggleOnline={handleToggleOnline}
        />

        <div className="doctor-insights" aria-label="Краткая сводка">
          <div className="insight-card">
            <span className="insight-label">Новые заявки</span>
            <span className="insight-value">{consultations.pendingConsultations.length}</span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Ближайшие приёмы</span>
            <span className="insight-value">{upcomingSchedule.length}</span>
          </div>
          <div className="insight-card">
            <span className="insight-label">Активные записи</span>
            <span className="insight-value">{activeAppointmentsCount}</span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="doctor-tabs" role="tablist" aria-label="Разделы кабинета">
          <button
            type="button"
            className={`d-tab ${tab === 'requests' ? 'active' : ''}`}
            onClick={() => setTab('requests')}
          >
            Заявки {consultations.pendingConsultations.length > 0 && (
              <span className="badge">{consultations.pendingConsultations.length}</span>
            )}
          </button>
          <button
            type="button"
            className={`d-tab ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            Расписание {upcomingSchedule.length > 0 && <span className="badge">{upcomingSchedule.length}</span>}
          </button>
          <button
            type="button"
            className={`d-tab ${tab === 'appointments' ? 'active' : ''}`}
            onClick={() => setTab('appointments')}
          >
            Записи {activeAppointmentsCount > 0 && <span className="badge">{activeAppointmentsCount}</span>}
          </button>
          <button type="button" className={`d-tab ${tab === 'patients' ? 'active' : ''}`} onClick={() => setTab('patients')}>
            Пациенты
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'requests' && (
          <RequestsTab
            consultations={consultations.pendingConsultations}
            onAccept={consultations.handleAccept}
            onReject={consultations.handleReject}
          />
        )}

        {tab === 'upcoming' && (
          <UpcomingTab
            schedule={upcomingSchedule}
            onSelectPatient={handleOpenPatientProfile}
          />
        )}

        {tab === 'appointments' && (
          <AppointmentsTab
            appointmentForm={appointments.appointmentForm}
            patients={panelData.patients}
            workingHours={workingHours.workingHours}
            workingDays={workingHours.workingDays}
            appointments={appointments.appointments}
            onFormChange={appointments.handleFormChange}
            onAssign={(e) => appointments.handleAssign(e, panelData.loadData)}
            onSaveWorkingHours={workingHours.save}
            onToggleDay={workingHours.toggleDay}
            onSetWorkingHours={workingHours.setWorkingHours}
            onCancelAppointment={(id) => appointments.handleCancel(id, panelData.loadData)}
            onOpenCommentModal={commentModal.openModal}
          />
        )}

        {tab === 'patients' && (
          <PatientsTab
            patients={panelData.patients}
            onSelectPatient={handleOpenPatientMedicalRecord}
            onPrescription={(p) => setPrescriptionPatient(p)}
          />
        )}

        {/* Modals */}
        <CommentModal
          open={commentModal.modal.open}
          appointment={commentModal.modal.appointment}
          text={commentModal.modal.text}
          onChangeText={(text) => commentModal.setModal((prev) => ({ ...prev, text }))}
          onSave={() => {
            commentModal.save(appointments.appointments, appointments.setAppointments);
          }}
          onClose={commentModal.closeModal}
        />

        <PatientProfileModal
          patient={selectedPatient}
          onOpenMedicalRecord={handleOpenPatientMedicalRecord}
          onClose={() => setSelectedPatient(null)}
        />

        {prescriptionPatient && (
          <PrescriptionModal
            patient={prescriptionPatient}
            onClose={() => setPrescriptionPatient(null)}
            onSaved={() => panelData.loadData()}
          />
        )}

        <MedicalRecordModal
          open={medicalRecord.modal.open}
          patient={medicalRecord.modal.patient}
          record={medicalRecord.modal.record}
          loading={medicalRecord.modal.loading}
          error={medicalRecord.modal.error}
          tab={medicalRecord.tab}
          expandedSection={medicalRecord.expandedSection}
          historyOpen={medicalRecord.historyOpen}
          showSickLeaveHistory={medicalRecord.showSickLeaveHistory}
          savingSectionKey={medicalRecord.modal.savingSectionKey}
          onSetTab={medicalRecord.setTab}
          onToggleSection={(key) => medicalRecord.setExpandedSection(medicalRecord.expandedSection === key ? '' : key)}
          onFieldChange={medicalRecord.updateMedicalField}
          onSaveSection={medicalRecord.saveSection}
          onAddSickLeaveDraft={() => medicalRecord.addSickLeaveDraft(user)}
          onSickLeaveFieldChange={medicalRecord.updateSickLeaveField}
          onSaveSickLeave={medicalRecord.saveSickLeave}
          onToggleHistory={() => medicalRecord.setHistoryOpen(!medicalRecord.historyOpen)}
          onToggleSickLeaveHistory={() => medicalRecord.setShowSickLeaveHistory(!medicalRecord.showSickLeaveHistory)}
          onClose={medicalRecord.closeMedicalRecord}
        />
      </div>
    </PageLayout>
  );
}
