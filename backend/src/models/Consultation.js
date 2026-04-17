const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file'],
    default: 'text'
  },
  message: { type: String, default: '' },
  sender: { type: String, required: true },
  senderId: { type: String, default: null },
  timestamp: { type: String, required: true },
  fileUrl: { type: String, default: null },
  fileName: { type: String, default: null },
  fileMimeType: { type: String, default: null },
  fileSize: { type: Number, default: null }
}, { _id: true });

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
