const mongoose = require('mongoose');
const { roles } = require('../constants');

const userSchema = new mongoose.Schema({
  legacyId: { type: Number },
  role: { type: String, enum: Object.values(roles), default: roles.PATIENT },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  email: { type: String, index: { unique: true, sparse: true, name: 'unique_email_idx' } },
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
  workingDays: { type: [String], default: ['mon', 'tue', 'wed', 'thu', 'fri'] }
}, { timestamps: true, autoIndex: false });

// Индексы
userSchema.index({ legacyId: 1 }, { name: 'legacyId_idx' });
userSchema.index({ phone: 1 }, { name: 'phone_idx' });
userSchema.index({ role: 1, specialty: 1 }, { name: 'role_specialty_idx' });
userSchema.index({ email: 1 }, { unique: true, sparse: true, name: 'unique_email_idx' });

module.exports = mongoose.model('User', userSchema);
