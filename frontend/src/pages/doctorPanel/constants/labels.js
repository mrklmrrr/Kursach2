export const APPOINTMENT_STATUS_LABELS = {
  scheduled: 'Запланирована',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена'
};

export const CONSULTATION_TYPE_LABELS = {
  online: '🌐 Онлайн',
  offline: '🏥 Офлайн',
  video: '🌐 Онлайн',
  chat: '🏥 Офлайн'
};

export const PAYMENT_STATUS_LABELS = {
  paid: 'Прием оплачен',
  unpaid: 'Не оплачен'
};

export const DAY_MAP = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' }
];

export const RECORD_FIELD_LABELS = {
  notes: 'Осмотр и жалобы',
  diagnosis: 'Диагноз',
  treatment: 'Лечение',
  recommendations: 'Рекомендации'
};
