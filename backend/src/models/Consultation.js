const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  duration: { type: Number, min: 1 },
  patientId: { type: Number },
  patientName: { type: String, required: true },
  type: { type: String, default: 'video', enum: ['video', 'chat'] },
  status: { type: String, default: 'pending' },
  paymentId: { type: Number, default: null },
  paidAt: { type: String, default: null },
  scheduledAt: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  messages: { type: [messageSchema], default: [] }
}, { timestamps: true, autoIndex: false });

consultationSchema.index({ doctorId: 1, status: 1 }, { name: 'doctor_status_idx' });
consultationSchema.index({ patientId: 1 }, { name: 'patientId_idx' });

module.exports = mongoose.model('Consultation', consultationSchema);
