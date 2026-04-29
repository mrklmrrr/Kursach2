import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { useAuth } from '@hooks/useAuth';
import PageLayout from '@components/layout/PageLayout/PageLayout';
import { AppHeader, BottomNav } from '@components/layout';

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
import DoctorSidebar from './components/DoctorSidebar/DoctorSidebar';

import './DoctorPanel.css';

/** Маппинг URL-segment → внутреннее имя таба */
const TAB_MAP = {
  permit: 'requests',
  schedule: 'upcoming',
  appointments: 'appointments',
  patients: 'patients',
};

const VALID_TABS = Object.keys(TAB_MAP);

export default function DoctorPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab: urlTab } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Data management hooks
  const panelData = useDoctorPanelData();
  const medicalRecord = useMedicalRecordModal();
  const consultations = useConsultations();
  const commentModal = useCommentModal();
  const appointments = useAppointments();
  const workingHours = useWorkingHours();

  // Определяем активный таб из URL; невалидный → редирект
  const activeTab = TAB_MAP[urlTab] || null;

  // Local state
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = React.useState(null);

  /* eslint-disable react-hooks/exhaustive-deps -- кабинет врача: узкие deps, полный список даёт лишние циклы с panelData / хуками */

  // Редирект невалидного или пустого tab → /doctor/permit
  useEffect(() => {
    if (!urlTab || !VALID_TABS.includes(urlTab)) {
      navigate('/doctor/permit', { replace: true });
    }
  }, [urlTab, navigate]);

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
      navigate('/doctor/permit', { replace: true, state: {} });
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
    <div className="doctor-panel-layout">
      <DoctorSidebar profile={panelData.profile} />

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

            {/* Mobile Tabs Navigation */}
            <div className="doctor-tabs">
              {[
                { id: 'requests', label: 'Заявки', path: 'permit', badge: consultations.pendingConsultations.length },
                { id: 'upcoming', label: 'Расписание', path: 'schedule', badge: upcomingSchedule.length },
                { id: 'appointments', label: 'Записи', path: 'appointments', badge: activeAppointmentsCount },
                { id: 'patients', label: 'Пациенты', path: 'patients', badge: null },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`d-tab ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => navigate(`/doctor/${t.path}`)}
                >
                  {t.label}
                  {t.badge > 0 && <span className="badge">{t.badge}</span>}
                </button>
              ))}
            </div>

            {/* Content by route */}
            {activeTab === 'requests' && (
              <RequestsTab
                consultations={consultations.pendingConsultations}
                onAccept={consultations.handleAccept}
                onReject={consultations.handleReject}
              />
            )}

            {activeTab === 'upcoming' && (
              <UpcomingTab
                schedule={upcomingSchedule}
                onSelectPatient={handleOpenPatientProfile}
              />
            )}

            {activeTab === 'appointments' && (
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

            {activeTab === 'patients' && (
              <PatientsTab
                patients={panelData.patients}
                onSelectPatient={handleOpenPatientMedicalRecord}
              />
            )}

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
    </div>
  );
}
