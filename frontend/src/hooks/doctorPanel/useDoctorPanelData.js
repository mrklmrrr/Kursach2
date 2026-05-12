import { useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@contexts/ToastProvider/useToast';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { appointmentApi } from '@services/appointmentApi';
import { toDateTime, toDateInputValue } from '@utils/date';
import { isOnlineAppointmentVisibleInUpcoming } from '@utils/onlineAppointmentJoinWindow';
import { isGeneralPractitionerSpecialty } from '@utils/generalPractitionerSpecialty';
import { getChatSocket } from '@services/chatSocket';

/** Слот ещё в «предстоящих»: офлайн — до начала; онлайн — до конца слота + запас (как в общем расписании). */
function isSlotStillUpcoming(item, nowMs) {
  if (!item.dateTime || Number.isNaN(item.dateTime.getTime())) return false;
  const startMs = item.dateTime.getTime();
  const isOnline = String(item.consultationType || item.type || '').toLowerCase() === 'online';
  if (isOnline) {
    return isOnlineAppointmentVisibleInUpcoming(nowMs, startMs, item.duration);
  }
  return startMs >= nowMs;
}

export const useDoctorPanelData = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [loading, setLoading] = useState(true);
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  /** Дата списка в расписании (YYYY-MM-DD), по умолчанию сегодня */
  const [scheduleViewDate, setScheduleViewDate] = useState(() => toDateInputValue(new Date()));
  const [emergencyRequests, setEmergencyRequests] = useState([]);

  useEffect(() => {
    const id = window.setInterval(() => setScheduleClock(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    datetime: '',
    type: 'online',
    consultationType: 'online',
    duration: 30
  });

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [medicalRecordModalVisible, setMedicalRecordModalVisible] = useState(false);
  const [medicalRecordTab, setMedicalRecordTab] = useState('consultations');
  const [medicalRecordExpandedSection, setMedicalRecordExpandedSection] = useState(null);
  const [medicalRecordHistoryOpen, setMedicalRecordHistoryOpen] = useState(false);
  const [medicalRecordShowSickLeaveHistory, setMedicalRecordShowSickLeaveHistory] = useState(false);

  // Must be declared before any function that references it
  const refreshAppointments = useCallback(async () => {
    try {
      const response = await appointmentApi.getDoctorAppointments();
      const sortedAppointments = [...response.data].sort((a, b) => toDateTime(a) - toDateTime(b));
      setAppointments(sortedAppointments);
    } catch {
      setAppointments([]);
    }
  }, []);

  const upcomingSchedule = useMemo(() => {
    if (!appointments.length) return [];
    const nowMs = scheduleClock;
    return appointments
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => isSlotStillUpcoming(item, nowMs))
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [appointments, scheduleClock]);

  const todayYmd = useMemo(() => toDateInputValue(new Date(scheduleClock)), [scheduleClock]);

  const scheduleForViewDate = useMemo(() => {
    if (!appointments.length || !scheduleViewDate) return [];
    const nowMs = scheduleClock;
    return appointments
      .filter((item) =>
        (item.status === 'scheduled' || item.status === 'confirmed') && item.date === scheduleViewDate
      )
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => isSlotStillUpcoming(item, nowMs))
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [appointments, scheduleViewDate, scheduleClock]);

  const todayScheduleCount = useMemo(() => {
    const nowMs = scheduleClock;
    return appointments.filter((a) => {
      if ((a.status !== 'scheduled' && a.status !== 'confirmed') || a.date !== todayYmd) return false;
      const dateTime = new Date(`${a.date}T${a.time}:00`);
      if (Number.isNaN(dateTime.getTime())) return false;
      return isSlotStillUpcoming({ ...a, dateTime }, nowMs);
    }).length;
  }, [appointments, todayYmd, scheduleClock]);

  const activeAppointmentsCount = useMemo(() =>
    appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length ?? 0,
    [appointments]
  );

  const patientById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => {
      map.set(String(patient.id), patient);
    });
    return map;
  }, [patients]);

  const isGeneralPracticeDoctor = useMemo(
    () => isGeneralPractitionerSpecialty(profile?.specialty),
    [profile?.specialty]
  );

  const refreshEmergencyRequests = useCallback(async () => {
    try {
      const res = await doctorPanelApi.getEmergencyRequests();
      setEmergencyRequests(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEmergencyRequests([]);
    }
  }, []);

  useEffect(() => {
    if (!isGeneralPracticeDoctor) {
      setEmergencyRequests([]);
      return undefined;
    }
    refreshEmergencyRequests();
    const id = window.setInterval(refreshEmergencyRequests, 45000);
    return () => window.clearInterval(id);
  }, [isGeneralPracticeDoctor, refreshEmergencyRequests]);

  useEffect(() => {
    if (!isGeneralPracticeDoctor) return undefined;
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return undefined;

    const socket = getChatSocket(token);

    const onCreated = (payload) => {
      if (!payload?.id) return;
      setEmergencyRequests((prev) => {
        if (prev.some((r) => String(r.id) === String(payload.id))) return prev;
        const next = [
          ...prev,
          {
            id: payload.id,
            patientName: payload.patientName,
            createdAt: payload.createdAt,
            expiresAt: payload.expiresAt
          }
        ];
        next.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        return next;
      });
    };

    const onRemoved = (payload) => {
      if (payload?.id == null) return;
      const rid = String(payload.id);
      setEmergencyRequests((prev) => prev.filter((r) => String(r.id) !== rid));
    };

    socket.on('emergency-request-created', onCreated);
    socket.on('emergency-request-removed', onRemoved);

    return () => {
      socket.off('emergency-request-created', onCreated);
      socket.off('emergency-request-removed', onRemoved);
    };
  }, [isGeneralPracticeDoctor]);

  const handleFormChange = useCallback((e) => {
    setAppointmentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleAssignAppointment = useCallback(async (e) => {
    e.preventDefault();
    try {
      let payload = { ...appointmentForm };
      if (payload.datetime) {
        const [date, timeWithSec] = payload.datetime.split('T');
        const time = timeWithSec.slice(0, 5);
        payload.date = date;
        payload.time = time;
        delete payload.datetime;
      }
      await appointmentApi.assignAppointment(payload);
      setAppointmentForm({ patientId: '', datetime: '', type: 'online', consultationType: 'online', duration: 30 });
      refreshAppointments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ошибка создания записи', 'error');
    }
  }, [appointmentForm, refreshAppointments, showToast]);

  const handleSaveWorkingHours = useCallback(async () => {
    try {
      await appointmentApi.updateWorkingHours({ workingHours, workingDays });
      return { success: true, message: 'Рабочее время сохранено' };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Ошибка сохранения' };
    }
  }, [workingHours, workingDays]);

  const openCommentModal = useCallback(() => setCommentModalVisible(true), []);
  const closeCommentModal = useCallback(() => setCommentModalVisible(false), []);
  const saveComment = useCallback(() => {
    closeCommentModal();
    showToast('Комментарий сохранён', 'success');
  }, [closeCommentModal, showToast]);

  const openMedicalRecord = useCallback(() => setMedicalRecordModalVisible(true), []);
  const closeMedicalRecord = useCallback(() => setMedicalRecordModalVisible(false), []);

  const setTab = useCallback((tab) => setMedicalRecordTab(tab), []);
  const setExpandedSection = useCallback((section) => setMedicalRecordExpandedSection(section), []);
  const setHistoryOpen = useCallback((open) => setMedicalRecordHistoryOpen(open), []);
  const setShowSickLeaveHistory = useCallback((show) => setMedicalRecordShowSickLeaveHistory(show), []);

  const updateMedicalField = useCallback(() => {
    // placeholder
  }, []);

  const saveSection = useCallback(() => {
    showToast('Сохранено', 'success');
  }, [showToast]);

  const addSickLeaveDraft = useCallback(() => {
    showToast('Добавлено', 'success');
  }, [showToast]);

  const updateSickLeaveField = useCallback(() => {
    // placeholder
  }, []);

  const saveSickLeave = useCallback(() => {
    showToast('Лист нетрудоспособности сохранён', 'success');
  }, [showToast]);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, patientsRes, appointmentsRes, workingHoursRes] = await Promise.allSettled([
        doctorPanelApi.getProfile(),
        doctorPanelApi.getPatients(),
        appointmentApi.getDoctorAppointments(),
        appointmentApi.getWorkingHours(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (patientsRes.status === 'fulfilled') setPatients(patientsRes.value.data); else setPatients([]);
      if (appointmentsRes.status === 'fulfilled') {
        const sorted = [...appointmentsRes.value.data].sort((a, b) => toDateTime(a) - toDateTime(b));
        setAppointments(sorted);
      } else setAppointments([]);
      if (workingHoursRes.status === 'fulfilled') {
        setWorkingHours(workingHoursRes.value.data.workingHours || { start: '09:00', end: '18:00' });
        setWorkingDays(workingHoursRes.value.data.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri']);
      } else {
        setWorkingHours({ start: '09:00', end: '18:00' });
        setWorkingDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      }

      if (profileRes.status === 'fulfilled' && isGeneralPractitionerSpecialty(profileRes.value.data?.specialty)) {
        try {
          const er = await doctorPanelApi.getEmergencyRequests();
          setEmergencyRequests(Array.isArray(er.data) ? er.data : []);
        } catch {
          setEmergencyRequests([]);
        }
      } else {
        setEmergencyRequests([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile, setProfile, patients, setPatients, appointments, setAppointments,
    workingHours, setWorkingHours, workingDays, setWorkingDays, loading, hasLoaded: !!profile,
    loadData, refreshAppointments, upcomingSchedule, scheduleViewDate, setScheduleViewDate,
    scheduleForViewDate, todayYmd, todayScheduleCount, activeAppointmentsCount, patientById,
    emergencyRequests, refreshEmergencyRequests, isGeneralPracticeDoctor,
    appointmentForm, handleFormChange, handleAssignAppointment, handleSaveWorkingHours,
    openCommentModal, closeCommentModal, saveComment,
    openMedicalRecord, closeMedicalRecord, medicalRecord: { modal: { open: medicalRecordModalVisible }, tab: medicalRecordTab, expandedSection: medicalRecordExpandedSection, historyOpen: medicalRecordHistoryOpen, showSickLeaveHistory: medicalRecordShowSickLeaveHistory, setTab, setExpandedSection, setHistoryOpen, setShowSickLeaveHistory, updateMedicalField, saveSection, addSickLeaveDraft, updateSickLeaveField, saveSickLeave, closeMedicalRecord: closeMedicalRecord },
    commentModal: { modal: { open: commentModalVisible }, closeModal: closeCommentModal, save: saveComment },
  };
};
