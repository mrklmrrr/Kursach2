import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@contexts/ToastProvider/useToast';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { appointmentApi } from '@services/appointmentApi';
import { toDateTime } from '@utils/date';

export const useDoctorPanelData = () => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [loading, setLoading] = useState(true);

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
    const now = new Date();
    return appointments
      .filter((item) => item.status === 'scheduled' || item.status === 'confirmed')
      .map((item) => {
        const dateTime = new Date(`${item.date}T${item.time}:00`);
        return { ...item, dateTime };
      })
      .filter((item) => !Number.isNaN(item.dateTime.getTime()) && item.dateTime >= now)
      .sort((a, b) => a.dateTime - b.dateTime);
  }, [appointments]);

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

  const handleAcceptConsultation = useCallback(async (id, onSuccess) => {
    try {
      await doctorPanelApi.acceptConsultation(id);
      setPendingConsultations((prev) => prev.filter((c) => c._id !== id));
      showToast('Заявка принята', 'success');
      if (onSuccess) onSuccess();
    } catch {
      showToast('Ошибка принятия заявки', 'error');
    }
  }, [setPendingConsultations, showToast]);

  const handleRejectConsultation = useCallback(async (id, onSuccess) => {
    try {
      await doctorPanelApi.rejectConsultation(id);
      setPendingConsultations((prev) => prev.filter((c) => c._id !== id));
      showToast('Заявка отклонена', 'success');
      if (onSuccess) onSuccess();
    } catch {
      showToast('Ошибка отклонения заявки', 'error');
    }
  }, [setPendingConsultations, showToast]);

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
      const [profileRes, pendingRes, patientsRes, appointmentsRes, workingHoursRes] = await Promise.allSettled([
        doctorPanelApi.getProfile(),
        doctorPanelApi.getPendingConsultations(),
        doctorPanelApi.getPatients(),
        appointmentApi.getDoctorAppointments(),
        appointmentApi.getWorkingHours(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
      if (pendingRes.status === 'fulfilled') setPendingConsultations(pendingRes.value.data); else setPendingConsultations([]);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile, setProfile, pendingConsultations, setPendingConsultations, patients, setPatients, appointments, setAppointments,
    workingHours, setWorkingHours, workingDays, setWorkingDays, loading, hasLoaded: !!profile,
    loadData, refreshAppointments, upcomingSchedule, activeAppointmentsCount, patientById,
    appointmentForm, handleFormChange, handleAssignAppointment, handleSaveWorkingHours,
    openCommentModal, closeCommentModal, saveComment,
    openMedicalRecord, closeMedicalRecord, medicalRecord: { modal: { open: medicalRecordModalVisible }, tab: medicalRecordTab, expandedSection: medicalRecordExpandedSection, historyOpen: medicalRecordHistoryOpen, showSickLeaveHistory: medicalRecordShowSickLeaveHistory, setTab, setExpandedSection, setHistoryOpen, setShowSickLeaveHistory, updateMedicalField, saveSection, addSickLeaveDraft, updateSickLeaveField, saveSickLeave, closeMedicalRecord: closeMedicalRecord },
    commentModal: { modal: { open: commentModalVisible }, closeModal: closeCommentModal, save: saveComment },
    handleAcceptConsultation, handleRejectConsultation,
  };
};
