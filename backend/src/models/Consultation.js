const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { _id: false });

const consultationSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.Mixed, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number },
  patientId: { type: mongoose.Schema.Types.Mixed },
  patientName: { type: String, required: true },
  type: { type: String, default: 'video' },
  status: { type: String, default: 'pending' },
  paymentId: { type: Number, default: null },
  paidAt: { type: String, default: null },
  scheduledAt: { type: String },
  messages: [messageSchema]
}, { timestamps: true });

consultationSchema.index({ doctorId: 1, status: 1 });
consultationSchema.index({ patientId: 1 });

module.exports = mongoose.model('Consultation', consultationSchema);
