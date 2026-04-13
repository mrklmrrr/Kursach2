export const ROUTES = {
  HOME: '/home',
  SPLASH: '/splash',
  REGISTER: '/register',
  LOGIN: '/login',
  DOCTORS: '/doctors',
  DOCTOR_PROFILE: (id) => `/doctor/${id}`,
  CHATS: '/chats',
  CHAT_ROOM: (id) => `/chat/doctor/${id}`,
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
  { value: 'other', label: 'Другой родственник' },
];

export const GENDER_TYPES = [
  { value: 'male', label: 'Мужской' },
  { value: 'female', label: 'Женский' },
];
