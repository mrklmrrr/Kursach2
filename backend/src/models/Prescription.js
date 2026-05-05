const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dosage: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { _id: false });

const blockSchema = new mongoose.Schema({
  title: { type: String, default: '', trim: true },
  items: { type: [itemSchema], default: [] }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  doctorSpecialty: { type: String, default: '' },
  /** Блочная структура назначений (аналогично структуре исследований в UI) */
  blocks: { type: [blockSchema], default: [] },
  /** Backward compatibility: плоский список всех позиций из blocks */
  items: { type: [itemSchema], default: [] },
  /** Рекомендации врача (режим, диета и т.д.) — уходят в Telegram */
  recommendations: { type: String, default: '' },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', default: null }
}, { timestamps: true, autoIndex: false });

prescriptionSchema.index({ patientId: 1, createdAt: -1 }, { name: 'patient_created_idx' });

module.exports = mongoose.model('Prescription', prescriptionSchema);
