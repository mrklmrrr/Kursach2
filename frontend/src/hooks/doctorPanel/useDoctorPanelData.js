import { useState, useCallback } from 'react';
import { doctorPanelApi } from '@services/doctorPanelApi';
import { appointmentApi } from '@services/appointmentApi';
import { toDateTime } from '@utils/date';

export const useDoctorPanelData = () => {
  const [profile, setProfile] = useState(null);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [workingDays, setWorkingDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, pendingRes, patientsRes, appointmentsRes, workingHoursRes] = await Promise.allSettled([
        doctorPanelApi.getProfile(),
        doctorPanelApi.getPendingConsultations(),
        doctorPanelApi.getPatients(),
        appointmentApi.getDoctorAppointments(),
        appointmentApi.getWorkingHours()
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value.data);
      } else {
        console.error('Ошибка загрузки профиля врача:', profileRes.reason);
      }

      if (pendingRes.status === 'fulfilled') {
        setPendingConsultations(pendingRes.value.data);
      } else {
        setPendingConsultations([]);
        console.error('Ошибка загрузки заявок:', pendingRes.reason);
      }

      if (patientsRes.status === 'fulfilled') {
        setPatients(patientsRes.value.data);
      } else {
        setPatients([]);
        console.error('Ошибка загрузки пациентов:', patientsRes.reason);
      }

      if (appointmentsRes.status === 'fulfilled') {
        const sortedAppointments = [...appointmentsRes.value.data].sort((a, b) => toDateTime(a) - toDateTime(b));
        setAppointments(sortedAppointments);
      } else {
        setAppointments([]);
        console.error('Ошибка загрузки записей врача:', appointmentsRes.reason);
      }

      if (workingHoursRes.status === 'fulfilled') {
        setWorkingHours(workingHoursRes.value.data.workingHours || { start: '09:00', end: '18:00' });
        setWorkingDays(workingHoursRes.value.data.workingDays || ['mon', 'tue', 'wed', 'thu', 'fri']);
      } else {
        setWorkingHours({ start: '09:00', end: '18:00' });
        setWorkingDays(['mon', 'tue', 'wed', 'thu', 'fri']);
        console.error('Ошибка загрузки рабочего времени:', workingHoursRes.reason);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    profile,
    setProfile,
    pendingConsultations,
    setPendingConsultations,
    patients,
    setPatients,
    appointments,
    setAppointments,
    workingHours,
    setWorkingHours,
    workingDays,
    setWorkingDays,
    loading,
    setLoading,
    loadData
  };
};