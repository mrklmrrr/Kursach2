const mongoose = require('mongoose');
const { roles } = require('../constants');

const userSchema = new mongoose.Schema({
  legacyId: { type: Number, index: true },
  role: { type: String, enum: Object.values(roles), default: roles.PATIENT },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, index: true },
  email: { type: String, unique: true, sparse: true },
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
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

// Индекс для поиска врачей
userSchema.index({ role: 1, specialty: 1 });

module.exports = mongoose.model('User', userSchema);
