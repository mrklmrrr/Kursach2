const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  patientName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  duration: { type: Number, required: true, min: 10 }, // в минутах
  type: { type: String, required: true, enum: ['online', 'offline'] }, // тип приема
  consultationType: { type: String, required: true, enum: ['online', 'offline'] }, // формат консультации
  status: { type: String, default: 'scheduled', enum: ['scheduled', 'confirmed', 'completed', 'cancelled'] },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', default: null }
}, { timestamps: true, autoIndex: false });

appointmentSchema.index({ doctorId: 1, date: 1 }, { name: 'doctor_date_idx' });
appointmentSchema.index({ patientId: 1, date: 1 }, { name: 'patient_date_idx' });

module.exports = mongoose.model('Appointment', appointmentSchema);
