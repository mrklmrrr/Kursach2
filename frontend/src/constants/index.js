/** Публичное имя продукта (единая точка для UI и маркетинга в приложении) */
export const APP_BRAND_NAME = 'Мед24';
export const APP_BRAND_TAGLINE = 'Запись, консультации и карта в одном приложении';

export const ROUTES = {
  LANDING: '/',
  TRIAGE: '/triage',
  PLANS: '/plans',
  DEMO: '/demo',
  TRUST: '/trust',
  HOME: '/home',
  SPLASH: '/splash',
  REGISTER: '/register',
  LOGIN: '/login',
  DOCTORS: '/doctors',
  DOCTOR_PROFILE: (id) => `/doctor/${id}`,
  CHATS: '/chats',
  CHAT_ROOM: (id) => `/chat/${id}`,
  EMERGENCY: '/emergency',
  PROFILE: '/profile',
  ADD_RELATIVE: '/profile/add-relative',
  CONFIRM: '/confirm',
  PAYMENT: '/payment',
  LOADER: '/loader',
  CONSULTATION: (id) => `/consultation/${id}`,
};

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const RELATION_TYPES = [
  { value: 'child', label: 'Ребёнок' },
  { value: 'parent', label: 'Родитель' },
  { value: 'spouse', label: 'Супруг/супруга' },
  { value: 'sibling', label: 'Брат / сестра' },
  { value: 'grandparent', label: 'Бабушка / дедушка' },
  { value: 'other', label: 'Другой родственник' },
];

export const GENDER_TYPES = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];

export const CONSULTATION_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачено',
  active: 'Активна',
  completed: 'Завершена',
  cancelled: 'Отменена'
};

export const STATUS_OPTIONS = [
  { value: 'normal', label: 'Норма' },
  { value: 'deviation', label: 'Отклонение от нормы' },
  { value: 'severe', label: 'Сильное нарушение' }
];
