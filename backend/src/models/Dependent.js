const mongoose = require('mongoose');

const dependentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  /** Если родственник — зарегистрированный пациент (связь по username) */
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  linkedUsername: { type: String, default: '' },
  relation: { type: String, required: true },
  birthDate: { type: String, default: '' },
  gender: { type: String, default: '' },
  phone: { type: String, default: '' },
  notes: { type: String, default: '' },
  allergies: { type: String, default: '' },
  chronicConditions: { type: String, default: '' }
}, { timestamps: true, autoIndex: false });

dependentSchema.index({ userId: 1 }, { name: 'userId_idx' });

module.exports = mongoose.model('Dependent', dependentSchema);
