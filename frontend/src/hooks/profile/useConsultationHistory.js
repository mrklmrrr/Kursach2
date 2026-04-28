import { useState, useEffect } from 'react';
import { consultationApi } from '@services/consultationApi';
import { appointmentApi } from '@services/appointmentApi';
import { toSortTime } from '@utils/date';

export const useConsultationHistory = (user) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadConsultations = async () => {
      if (!user || user.role === 'doctor') return;

      const patientId = user.legacyId || user.id;
      if (!patientId) return;

      setLoading(true);
      setError('');
      try {
        const [consultationsRes, appointmentsRes] = await Promise.all([
          consultationApi.getByPatientId(patientId),
          appointmentApi.getAll()
        ]);

        const consultations = Array.isArray(consultationsRes.data) ? consultationsRes.data : [];
        const appointments = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];

        const normalizedConsultations = consultations.map((item) => ({
          id: `consultation-${item._id}`,
          source: 'consultation',
          status: item.status,
          date: item.scheduledAt || item.createdAt,
          specialty: item.specialty || 'Консультация',
          doctorName: item.doctorName || '',
          doctorProfession: item.specialty || '',
          duration: item.duration || 0,
          price: item.price || 0
        }));

        const normalizedAppointments = appointments.map((item) => ({
          id: `appointment-${item._id}`,
          source: 'appointment',
          status: item.status,
          date: item.date && item.time ? `${item.date}T${item.time}:00` : item.createdAt,
          specialty: item.consultationType === 'offline' || item.consultationType === 'chat' ? 'Офлайн' : 'Онлайн',
          doctorName: item.doctorName || '',
          doctorProfession: item.doctorSpecialty || '',
          duration: item.duration || 0,
          price: item.paymentAmount || item.price || 0,
          rawAppointment: item
        }));

        const nowTs = Date.now();
        const merged = [...normalizedConsultations, ...normalizedAppointments]
          .sort((a, b) => {
            const timeA = toSortTime(a.date);
            const timeB = toSortTime(b.date);
            const aUpcoming = timeA >= nowTs;
            const bUpcoming = timeB >= nowTs;

            if (aUpcoming !== bUpcoming) {
              return aUpcoming ? -1 : 1;
            }

            if (aUpcoming) {
              return timeA - timeB;
            }

            return timeB - timeA;
          });

        setHistoryItems(merged);
      } catch (error) {
        setHistoryItems([]);
        setError(error.response?.data?.message || 'Не удалось загрузить историю консультаций');
      } finally {
        setLoading(false);
      }
    };

    loadConsultations();
  }, [user]);

  return { historyItems, loading, error };
};