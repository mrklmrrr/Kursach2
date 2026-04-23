export const parseHistoryDate = (value) => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const stringValue = String(value);
  const dotMatch = stringValue.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (dotMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00'] = dotMatch;
    const parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

export const formatHistoryDate = (value) => {
  const parsed = parseHistoryDate(value);
  if (parsed) return parsed.toLocaleDateString('ru-RU');
  return value ? String(value) : '—';
};

export const formatPrice = (value) => `${Number(value) || 0} BYN`;

export const formatDateTime = (value) => {
  if (!value) return '—';
  
  // Если это строка в формате YYYY-MM-DD, форматируем её
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Иначе обрабатываем как Date объект
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('ru-RU');
};

export const getDoctorInfo = (item) => {
  const doctorName = item?.doctorName || item?.rawAppointment?.doctorName || 'Имя врача не указано';
  const doctorProfession =
    item?.doctorProfession ||
    item?.rawAppointment?.doctorSpecialty ||
    (item?.source === 'consultation' ? item?.specialty : '') ||
    'Врач';

  return { doctorName, doctorProfession };
};

export const toSortTime = (value) => {
  const parsed = parseHistoryDate(value);
  if (parsed) return parsed.getTime();
  return Number.MAX_SAFE_INTEGER;
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