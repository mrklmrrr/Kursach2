const mongoose = require('mongoose');
const { roles } = require('../constants');

const userSchema = new mongoose.Schema({
  legacyId: { type: Number },
  role: { type: String, enum: Object.values(roles), default: roles.PATIENT },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  /** Уникальный ник в приложении (латиница, цифры, _), для связи «родственники» */
  username: { type: String, default: '', trim: true, lowercase: true },
  email: { type: String, index: { unique: true, sparse: true, name: 'unique_email_idx' } },
  /** Путь к файлу аватара, например /uploads/avatars/xxx.jpg */
  avatarUrl: { type: String, default: '' },
  password: { type: String },
  birthDate: { type: String },
  gender: { type: String },
  age: { type: Number },
  // Поля для врачей
  specialty: { type: String },
  price: { type: Number },
  experience: { type: Number },
  description: { type: String },
  isOnline: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  // Рабочее время врача
  workingHours: { type: { start: String, end: String }, default: { start: '09:00', end: '18:00' } },
  workingDays: { type: [String], default: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  // Пациент: напоминания и согласия (телемед-платформа)
  reminderEmail: { type: Boolean, default: true },
  reminderTelegram: { type: Boolean, default: false },
  telegramUsername: { type: String, default: '' },
  /** Числовой chat_id из Telegram (после /start у бота); нужен для sendMessage */
  telegramChatId: { type: String, default: '' },
  consentPersonalDataAt: { type: Date, default: null },
  consentMarketing: { type: Boolean, default: false },
  /** Текст рекомендаций врача для напоминаний в Telegram (последние с назначения) */
  healthRecommendations: { type: String, default: '' },
  /** Когда последний раз отправляли напоминание о рекомендациях */
  lastHealthPushAt: { type: Date, default: null }
}, { timestamps: true, autoIndex: false });

// Индексы
userSchema.index({ legacyId: 1 }, { name: 'legacyId_idx' });
userSchema.index({ phone: 1 }, { name: 'phone_idx' });
userSchema.index({ role: 1, specialty: 1 }, { name: 'role_specialty_idx' });
userSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'unique_email_idx' });
userSchema.index(
  { username: 1 },
  { unique: true, sparse: true, name: 'username_unique_idx', partialFilterExpression: { username: { $gt: '' } } }
);

module.exports = mongoose.model('User', userSchema);
