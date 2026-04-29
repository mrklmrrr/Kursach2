import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { useAuth } from '@hooks/useAuth';
import PageLayout from '@components/layout/PageLayout/PageLayout';
import { AppHeader, BottomNav } from '@components/layout';
import { Tabs } from '@components/ui';

import {
  useDoctorPanelData,
  useMedicalRecordModal,
  useConsultations,
  useCommentModal,
  useAppointments,
  useWorkingHours
} from '@hooks/doctorPanel';
import { useToast } from '@contexts/ToastProvider/useToast';

// Components
import {
  ProfileHeader,
  DoctorPanelStats,
  DoctorPanelModals,
  RequestsTab,
  UpcomingTab,
  AppointmentsTab,
  PatientsTab
} from './components';

import './DoctorPanel.css';

export default function DoctorPanel() {
  const navigate = useNavigate();
  const location = useLocation();
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

  useEffect(() => {
    workingHours.setWorkingHours(panelData.workingHours);
  }, [panelData.workingHours]);

  useEffect(() => {
    workingHours.setWorkingDays(panelData.workingDays);
  }, [panelData.workingDays]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Memoized values
  const patientById = useMemo(() => {
    const map = new Map();
    panelData.patients.forEach((patient) => {
      map.set(String(patient.id), patient);
    });
    return map;
  }, [panelData.patients]);

  // Автооткрытие медкарты при возврате из lab/instrumental
  useEffect(() => {
    const targetId = location.state?.openMedicalRecordForPatientId;
    if (!targetId || panelData.loading) return;
    const patient = patientById.get(String(targetId));
    if (patient) {
      medicalRecord.openMedicalRecord(patient);
      navigate('/doctor', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, panelData.loading, patientById]);

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
    if (patient && (patient.id || patient._id)) {
      medicalRecord.openMedicalRecord(patient);
    }
  };

  if (panelData.loading) {
    return (
      <PageLayout>
        <PageLayout.Content>
          <div className="loading-spinner">Загрузка...</div>
        </PageLayout.Content>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageLayout.Header>
        <AppHeader title="Кабинет врача" />
      </PageLayout.Header>
      <PageLayout.Content>
        <div className="doctor-panel">
        {/* Profile Header */}
        <ProfileHeader
          profile={panelData.profile}
          isOnline={panelData.profile?.isOnline}
          onToggleOnline={handleToggleOnline}
        />

        {/* Stats Cards */}
        <DoctorPanelStats
          pendingConsultationsCount={consultations.pendingConsultations.length}
          upcomingScheduleCount={upcomingSchedule.length}
          activeAppointmentsCount={activeAppointmentsCount}
        />

        {/* Tabs Navigation */}
        <Tabs value={tab} onValueChange={setTab}>
          <Tabs.List>
            <Tabs.Trigger value="requests">
              Заявки
              {consultations.pendingConsultations.length > 0 && (
                <span className="badge">{consultations.pendingConsultations.length}</span>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="upcoming">
              Расписание
              {upcomingSchedule.length > 0 && (
                <span className="badge">{upcomingSchedule.length}</span>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="appointments">
              Записи
              {activeAppointmentsCount > 0 && (
                <span className="badge">{activeAppointmentsCount}</span>
              )}
            </Tabs.Trigger>
            <Tabs.Trigger value="patients">Пациенты</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="requests">
            <RequestsTab
              consultations={consultations.pendingConsultations}
              onAccept={consultations.handleAccept}
              onReject={consultations.handleReject}
            />
          </Tabs.Content>

          <Tabs.Content value="upcoming">
            <UpcomingTab
              schedule={upcomingSchedule}
              onSelectPatient={handleOpenPatientProfile}
            />
          </Tabs.Content>

          <Tabs.Content value="appointments">
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
          </Tabs.Content>

          <Tabs.Content value="patients">
            <PatientsTab
              patients={panelData.patients}
              onSelectPatient={handleOpenPatientMedicalRecord}
            />
          </Tabs.Content>
        </Tabs>

        {/* Modals */}
        <DoctorPanelModals
          // CommentModal
          commentModal={commentModal.modal}
          appointments={appointments.appointments}
          setAppointments={appointments.setAppointments}
          onCloseCommentModal={commentModal.closeModal}
          onSaveComment={commentModal.save}
          
          // PatientProfileModal
          selectedPatient={selectedPatient}
          onClosePatientProfile={() => setSelectedPatient(null)}
          onOpenMedicalRecord={handleOpenPatientMedicalRecord}
          
          // PrescriptionModal
          prescriptionPatient={prescriptionPatient}
          onClosePrescription={() => setPrescriptionPatient(null)}
          onPrescriptionSaved={() => panelData.loadData()}
          
          // MedicalRecordModal
          medicalRecordModal={{
            ...medicalRecord.modal,
            tab: medicalRecord.tab,
            expandedSection: medicalRecord.expandedSection,
            historyOpen: medicalRecord.historyOpen,
            showSickLeaveHistory: medicalRecord.showSickLeaveHistory
          }}
          user={user}
          onCloseMedicalRecord={medicalRecord.closeMedicalRecord}
          onSetTab={medicalRecord.setTab}
          onToggleSection={medicalRecord.setExpandedSection}
          onFieldChange={medicalRecord.updateMedicalField}
          onSaveSection={medicalRecord.saveSection}
          onAddSickLeaveDraft={medicalRecord.addSickLeaveDraft}
          onSickLeaveFieldChange={medicalRecord.updateSickLeaveField}
          onSaveSickLeave={medicalRecord.saveSickLeave}
          onToggleHistory={(isOpen) => medicalRecord.setHistoryOpen(isOpen)}
          onToggleSickLeaveHistory={() => medicalRecord.setShowSickLeaveHistory(!medicalRecord.showSickLeaveHistory)}
          onOpenPrescription={setPrescriptionPatient}
        />
        </div>
      </PageLayout.Content>
      <PageLayout.Footer>
        <BottomNav />
      </PageLayout.Footer>
    </PageLayout>
  );
}
