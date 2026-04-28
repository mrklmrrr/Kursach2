import { toSortTime, parseHistoryDate, formatDate, formatDateTime } from '@utils/date';

// Re-export from date utils
export { parseHistoryDate, formatDate, toSortTime, formatDateTime };

export const formatHistoryDate = (value) => {
  const parsed = parseHistoryDate(value);
  if (parsed) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear());
    return `${day}.${month}.${year}`;
  }
  return value ? String(value) : '—';
};

export const formatPrice = (value) => `${Number(value) || 0} BYN`;

export const getDoctorInfo = (item) => {
  const doctorName = item?.doctorName || item?.rawAppointment?.doctorName || 'Имя врача не указано';
  const doctorProfession =
    item?.doctorProfession ||
    item?.rawAppointment?.doctorSpecialty ||
    (item?.source === 'consultation' ? item?.specialty : '') ||
    'Врач';

  return { doctorName, doctorProfession };
};

export const getConsultationTimeline = (consultation) => {
  const now = new Date();
  const status = String(consultation.status || '').toLowerCase();
  const parsedDate = parseHistoryDate(consultation.date);
  const hasValidDate = !!parsedDate;

  if (status === 'completed' || status === 'cancelled') {
    return { key: 'past', label: 'Была' };
  }

  if (status === 'scheduled' || status === 'confirmed' || status === 'pending' || status === 'paid' || status === 'active') {
    if (hasValidDate && parsedDate < now) {
      return { key: 'past', label: 'Была' };
    }
    return { key: 'future', label: 'Предстоит' };
  }

  if (hasValidDate && parsedDate > now) {
    return { key: 'future', label: 'Предстоит' };
  }

  return { key: 'past', label: 'Была' };
};