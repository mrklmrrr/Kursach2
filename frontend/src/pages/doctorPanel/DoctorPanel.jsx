import React, { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { appointmentApi } from '@services/appointmentApi';
import { useAuth } from '@hooks/useAuth';
import { AppHeader, BottomNav } from '@components/layout';

import {
  useDoctorPanelData,
  useMedicalRecordModal,
  useConsultations,
  useCommentModal,
  useAppointments
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
import ChatsPage from '../chat/Chats/Chats';

import './DoctorPanel.css';

/** Маппинг URL-segment → внутреннее имя таба */
const TAB_MAP = {
  permit: 'requests',
  schedule: 'upcoming',
  appointments: 'appointments',
  chats: 'chats',
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
  const { openMedicalRecord } = medicalRecord;
  const consultations = useConsultations();
  const commentModal = useCommentModal();
  const appointments = useAppointments();

  const {
    loadData,
    refreshAppointments,
    pendingConsultations,
    setPendingConsultations,
    appointments: panelAppointments,
    setAppointments,
    patients,
    workingHours: panelWorkingHours,
    setWorkingHours,
    workingDays: panelWorkingDays,
    setWorkingDays,
    loading,
    profile,
    setProfile,
  } = panelData;

  // Определяем активный таб из URL; невалидный → редирект
  const activeTab = TAB_MAP[urlTab] || null;

  // Local state
  const [selectedPatient, setSelectedPatient] = React.useState(null);
  const [prescriptionPatient, setPrescriptionPatient] = React.useState(null);

  // Редирект невалидного или пустого tab → /doctor/permit
  useEffect(() => {
    if (!urlTab || !VALID_TABS.includes(urlTab)) {
      navigate('/doctor/permit', { replace: true });
    }
  }, [urlTab, navigate]);

  // Initialize data on mount (одноразово)
  useEffect(() => {
    if (user?.role !== 'doctor') {
      navigate('/home');
      return;
    }
    loadData();
  }, [user?.role, navigate, loadData]);

  // Memoized values
  const patientById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => {
      map.set(String(patient.id), patient);
    });
    return map;
  }, [patients]);

  // Автооткрытие медкарты при возврате из lab/instrumental
  const lastAutoOpenedPatientIdRef = React.useRef(null);
  useEffect(() => {
    const targetId = location.state?.openMedicalRecordForPatientId;

    if (!targetId) {
      lastAutoOpenedPatientIdRef.current = null;
      return;
    }

    if (loading) return;

    const normalizedId = String(targetId);
    if (lastAutoOpenedPatientIdRef.current === normalizedId) return;

    const patient = patientById.get(normalizedId);
    if (!patient) return;

    lastAutoOpenedPatientIdRef.current = normalizedId;
    openMedicalRecord(patient);
    navigate('/doctor/permit', { replace: true, state: {} });
  }, [location.state?.openMedicalRecordForPatientId, loading, patientById, openMedicalRecord, navigate]);

  // Вычисляемые данные (только когда нужны)
  const activeAppointmentsCount = useMemo(
    () => panelAppointments?.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length ?? 0,
    [panelAppointments]
  );

  const upcomingSchedule = useMemo(() => {
    if (!panelAppointments?.length) return [];
    const now = new Date();
    return panelAppointments
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [panelAppointments]);

  // Мобильные табы (memoized)
  const mobileTabs = useMemo(() => [
    { id: 'requests', label: 'Заявки', path: 'permit', badge: pendingConsultations?.length ?? 0 },
    { id: 'upcoming', label: 'Расписание', path: 'schedule', badge: upcomingSchedule.length },
    { id: 'appointments', label: 'Записи', path: 'appointments', badge: activeAppointmentsCount },
    { id: 'chats', label: 'Чаты', path: 'chats', badge: null },
    { id: 'patients', label: 'Пациенты', path: 'patients', badge: null },
  ], [pendingConsultations, upcomingSchedule.length, activeAppointmentsCount]);

  const mergeAppointment = useCallback((appointment) => {
    if (!appointment?._id) return;
    setAppointments((prev) => {
      const exists = prev.some((item) => item._id === appointment._id);
      const next = exists
        ? prev.map((item) => (item._id === appointment._id ? appointment : item))
        : [appointment, ...prev];
      return next.sort((a, b) => {
        const ad = new Date(`${a.date}T${a.time}:00`).getTime();
        const bd = new Date(`${b.date}T${b.time}:00`).getTime();
        return ad - bd;
      });
    });
  }, [setAppointments]);

  const removeAppointment = useCallback((appointmentId) => {
    setAppointments((prev) => prev.filter((item) => item._id !== appointmentId));
  }, [setAppointments]);

  // Handlers
  const handleToggleOnline = async () => {
    try {
      await doctorPanelApi.toggleOnline(!profile?.isOnline);
      const next = !profile?.isOnline;
      setProfile({ ...profile, isOnline: next });
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
      openMedicalRecord(patient);
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      await appointmentApi.updateWorkingHours({
        workingHours: panelWorkingHours,
        workingDays: panelWorkingDays,
      });
      return { success: true, message: 'Рабочее время сохранено' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Ошибка сохранения',
      };
    }
  };

  if (loading) {
    return (
      <div className="doctor-panel-page">
        <DoctorSidebar profile={profile} />
        <div className="page-shell page-shell--flex-grow">
          <div className="loading-spinner">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="doctor-panel-page">
      <DoctorSidebar profile={profile} />
      <AppHeader title="Кабинет врача" />
      <div className="page-shell page-shell--flex-grow">
        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          isOnline={profile?.isOnline}
          onToggleOnline={handleToggleOnline}
        />

        {/* Stats Cards */}
        <DoctorPanelStats
          pendingConsultationsCount={pendingConsultations?.length ?? 0}
          upcomingScheduleCount={upcomingSchedule.length}
          activeAppointmentsCount={activeAppointmentsCount}
        />

        {/* Mobile Tabs Navigation */}
        <div className="doctor-tabs">
          {mobileTabs.map((t) => (
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
            consultations={pendingConsultations}
            onAccept={(id) => consultations.handleAccept(id, () => {
              setPendingConsultations((prev) => prev.filter((item) => item._id !== id));
            })}
            onReject={(id) => consultations.handleReject(id, () => {
              setPendingConsultations((prev) => prev.filter((item) => item._id !== id));
            })}
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
            patients={patients}
            workingHours={panelWorkingHours}
            workingDays={panelWorkingDays}
            appointments={panelAppointments}
            onFormChange={appointments.handleFormChange}
            onAssign={(e) => appointments.handleAssign(e, (payload) => {
              const createdAppointment = payload?.appointment || payload?.data || payload;
              if (createdAppointment?._id) {
                mergeAppointment(createdAppointment);
                return;
              }
              refreshAppointments();
            })}
            onSaveWorkingHours={handleSaveWorkingHours}
            onToggleDay={(day) => {
              setWorkingDays((prev) => (
                prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
              ));
            }}
            onSetWorkingHours={setWorkingHours}

            onCancelAppointment={(id) => appointments.handleCancel(id, removeAppointment)}
            onOpenCommentModal={commentModal.openModal}
          />
        )}

        {activeTab === 'patients' && (
          <PatientsTab
            patients={patients}
            onSelectPatient={handleOpenPatientMedicalRecord}
          />
        )}

        {activeTab === 'chats' && (
          <ChatsPage inDoctorPanel={true} />
        )}
      </div>

      <BottomNav />

      {/* Modals */}
      <DoctorPanelModals
        // CommentModal
        commentModal={commentModal.modal}
        appointments={panelAppointments}
        setAppointments={setAppointments}
        onCloseCommentModal={commentModal.closeModal}
        onSaveComment={commentModal.save}


        // PatientProfileModal
        selectedPatient={selectedPatient}
        onClosePatientProfile={() => setSelectedPatient(null)}
        onOpenMedicalRecord={handleOpenPatientMedicalRecord}

        // PrescriptionModal
        prescriptionPatient={prescriptionPatient}
        onClosePrescription={() => setPrescriptionPatient(null)}
        onPrescriptionSaved={refreshAppointments}


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
  );
}
