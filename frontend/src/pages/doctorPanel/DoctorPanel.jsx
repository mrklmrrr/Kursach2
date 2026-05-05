import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { useAuth } from '@hooks/useAuth';
import { AppHeader, BottomNav } from '@components/layout';
import { useDoctorPanelData, useMedicalRecordModal } from '@hooks/doctorPanel';
import { useToast } from '@contexts/ToastProvider/useToast';
import Chats from '../chat/Chats/Chats';
import Profile from '../profile/Profile/Profile';
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
import { SkeletonStats, SkeletonConsultationList, SkeletonAppointmentsList, SkeletonCircle, SkeletonBlock } from '@components/ui/SkeletonLoader/SkeletonLoader';
import './DoctorPanel.css';

const TAB_MAP = {
  permit: 'requests',
  schedule: 'upcoming',
  appointments: 'appointments',
  chats: 'chats',
  profile: 'profile',
  patients: 'patients',
};
const VALID_TABS = Object.keys(TAB_MAP);

const DoctorContent = ({ currentTab, activeTab, profile, onOpenPatientProfile, panelData, toast, navigate }) => {
  const removeAppointment = (appointmentId) => {
    panelData.setAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
  };

  if (activeTab === 'chats') {
    return <Chats inDoctorPanel={true} />;
  }
  if (activeTab === 'profile') {
    return <Profile />;
  }
  if (panelData.loading) {
    return (
      <div className="page-shell page-shell--flex-grow">
        <div className="profile-header">
          <SkeletonCircle size="70px" />
          <div style={{ flex: 1, marginLeft: '16px' }}>
            <SkeletonBlock width="200px" height="22px" radius="10px" />
            <SkeletonBlock width="140px" height="16px" radius="8px" />
          </div>
          <SkeletonBlock width="110px" height="40px" radius="12px" />
        </div>
        <SkeletonStats />
        <SkeletonConsultationList count={2} />
        <SkeletonAppointmentsList count={2} />
      </div>
    );
  }

  const handleToggleOnline = async () => {
    const next = !profile?.isOnline;
    try {
      // Оптимистичное обновление UI
      panelData.setProfile((prev) => ({ ...prev, isOnline: next }));
      await doctorPanelApi.toggleOnline(next);
      toast(next ? 'Вы в сети — пациенты видят вас онлайн' : 'Вы офлайн', 'success');
    } catch (err) {
      // Откат при ошибке
      panelData.setProfile((prev) => ({ ...prev, isOnline: !next }));
      toast(err.message || 'Не удалось изменить статус', 'error');
    }
  };

  return (
    <div className="page-shell page-shell--flex-grow">
      <ProfileHeader profile={profile} isOnline={profile?.isOnline} onToggleOnline={handleToggleOnline} />
      <DoctorPanelStats
        pendingConsultationsCount={panelData.pendingConsultations?.length ?? 0}
        upcomingScheduleCount={panelData.upcomingSchedule?.length ?? 0}
        activeAppointmentsCount={panelData.activeAppointmentsCount}
      />
      <div className="doctor-tabs">
        <button
          type="button"
          className={`d-tab ${currentTab === 'requests' ? 'active' : ''}`}
          onClick={() => navigate('/doctor/permit')}
        >
          Заявки
          {(panelData.pendingConsultations?.length ?? 0) > 0 && (
            <span className="badge">{panelData.pendingConsultations?.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`d-tab ${currentTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => navigate('/doctor/schedule')}
        >
          Расписание
          {panelData.upcomingSchedule?.length > 0 && (
            <span className="badge">{panelData.upcomingSchedule.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`d-tab ${currentTab === 'appointments' ? 'active' : ''}`}
          onClick={() => navigate('/doctor/appointments')}
        >
          Записи
          {panelData.activeAppointmentsCount > 0 && (
            <span className="badge">{panelData.activeAppointmentsCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`d-tab ${currentTab === 'patients' ? 'active' : ''}`}
          onClick={() => navigate('/doctor/patients')}
        >
          Пациенты
        </button>
      </div>

      {activeTab === 'requests' && (
        <RequestsTab
          consultations={panelData.pendingConsultations}
          onAccept={(id) => panelData.handleAcceptConsultation?.(id)}
          onReject={(id) => panelData.handleRejectConsultation?.(id)}
        />
      )}

      {activeTab === 'upcoming' && (
        <UpcomingTab
          schedule={panelData.upcomingSchedule}
          onSelectPatient={(patientId, fallbackName) => {
            const pat = panelData.patientById?.get(String(patientId));
            onOpenPatientProfile(patientId, fallbackName || (pat ? pat.name : 'Пациент'));
          }}
        />
      )}

      {activeTab === 'appointments' && (
        <AppointmentsTab
          appointmentForm={panelData.appointmentForm || {}}
          patients={panelData.patients}
          workingHours={panelData.workingHours}
          workingDays={panelData.workingDays}
          appointments={panelData.appointments}
          onFormChange={panelData.handleFormChange || (() => {})}
          onAssign={(e) => panelData.handleAssignAppointment?.(e)}
          onSaveWorkingHours={panelData.handleSaveWorkingHours}
          onToggleDay={(day) => panelData.setWorkingDays?.((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
          )}
          onSetWorkingHours={panelData.setWorkingHours}
          onCancelAppointment={(id) => removeAppointment(id)}
          onOpenCommentModal={panelData.openCommentModal || (() => {})}
        />
      )}

      {activeTab === 'patients' && (
        <PatientsTab
          patients={panelData.patients}
          onSelectPatient={onOpenPatientProfile}
        />
      )}
    </div>
  );
};

export default function DoctorPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tab: urlTab } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const panelData = useDoctorPanelData();
  const medicalRecordModal = useMedicalRecordModal();

  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = React.useState(null);
  const profile = panelData.profile;

  const currentTab = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/doctor/chats')) return 'chats';
    if (path.startsWith('/doctor/profile')) return 'profile';
    if (urlTab && VALID_TABS.includes(urlTab)) return TAB_MAP[urlTab];
    return 'requests';
  }, [urlTab, location.pathname]);

  useEffect(() => {
    if (urlTab && !VALID_TABS.includes(urlTab) && location.pathname.startsWith('/doctor/')) {
      navigate('/doctor/permit', { replace: true });
    }
  }, [urlTab, navigate, location.pathname]);

  useEffect(() => {
    if (user?.role !== 'doctor') {
      navigate('/home');
      return;
    }
    if (!panelData.profile && !panelData.hasLoaded) {
      panelData.loadData();
    }
  }, [user?.role, navigate, panelData]);

  // Открыть медицинскую карту пациента при возвращении с /laboratory или /instrumental
  useEffect(() => {
    const state = location.state;
    if (state?.openMedicalRecordForPatientId) {
      const patientId = String(state.openMedicalRecordForPatientId);
      const tabFromState = state.openMedicalRecordTab;
      let patient = panelData.patientById?.get(patientId);
      if (!patient) {
        patient = panelData.patients.find((p) =>
          String(p.id) === patientId || String(p._id) === patientId
        );
      }
      if (!patient) {
        patient = { id: patientId, name: 'Пациент' };
      } else if (!patient.id && patient._id) {
        patient = { ...patient, id: patient._id };
      }
      if (patient) {
        medicalRecordModal.openMedicalRecord(patient);
        if (tabFromState === 'laboratory' || tabFromState === 'instrumental' || tabFromState === 'systems' || tabFromState === 'sickLeave') {
          medicalRecordModal.setTab(tabFromState);
        }
      }
      // Очистить state после обработки
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Intentionally depends on navigation and patient collections; modal handlers are stable enough for this flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, panelData.patients, panelData.patientById, navigate, location.pathname]);

  const handleOpenPatientProfile = (patientId, fallbackName) => {
    let patient = panelData.patientById?.get(String(patientId));
    if (!patient) {
      patient = panelData.patients.find((p) => String(p.id) === String(patientId));
    }
    if (!patient) {
      patient = {
        id: patientId,
        name: fallbackName || 'Пациент',
        phone: '—',
        birthDate: '',
        consultationCount: 0
      };
    }
    setSelectedPatient(patient);
  };

  const handleOpenPatientMedicalRecord = (patient) => {
    if (patient) {
      medicalRecordModal.openMedicalRecord(patient);
    }
  };

  if (user?.role !== 'doctor') {
    return null;
  }

  return (
    <div className="doctor-panel-page">
      <DoctorSidebar profile={profile} />
      <AppHeader title="Кабинет врача" />
      <DoctorContent
        currentTab={currentTab}
        activeTab={currentTab}
        profile={profile}
        onOpenPatientProfile={handleOpenPatientProfile}
        panelData={panelData}
        toast={showToast}
        navigate={navigate}
      />

      <BottomNav />

      <DoctorPanelModals
        commentModal={panelData.commentModal?.modal || {}}
        appointments={panelData.appointments || []}
        setAppointments={panelData.setAppointments}
        onCloseCommentModal={panelData.commentModal?.closeModal || (() => {})}
        onSaveComment={panelData.commentModal?.save || (() => {})}
        selectedPatient={selectedPatient}
        onClosePatientProfile={() => setSelectedPatient(null)}
        onOpenMedicalRecord={handleOpenPatientMedicalRecord}
        prescriptionPatient={prescriptionPatient}
        onClosePrescription={() => setPrescriptionPatient(null)}
        onPrescriptionSaved={panelData.refreshAppointments}
        medicalRecordModal={medicalRecordModal}
        user={user}
        onCloseMedicalRecord={medicalRecordModal.closeMedicalRecord}
        onSetTab={medicalRecordModal.setTab}
        onToggleSection={medicalRecordModal.setExpandedSection}
        onFieldChange={medicalRecordModal.updateMedicalField}
        onSaveSection={medicalRecordModal.saveSection}
        onAddSickLeaveDraft={medicalRecordModal.addSickLeaveDraft}
        onSickLeaveFieldChange={medicalRecordModal.updateSickLeaveField}
        onSaveSickLeave={medicalRecordModal.saveSickLeave}
        onToggleHistory={medicalRecordModal.toggleHistory}
        onToggleSickLeaveHistory={medicalRecordModal.toggleSickLeaveHistory}
        getSickLeaveWithChanges={medicalRecordModal.getSickLeaveWithChanges}
        hasUnsavedChanges={medicalRecordModal.hasUnsavedChanges}
        onOpenPrescription={setPrescriptionPatient}
      />
    </div>
  );
}
