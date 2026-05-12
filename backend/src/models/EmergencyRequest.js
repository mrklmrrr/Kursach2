const mongoose = require('mongoose');

const emergencyRequestSchema = new mongoose.Schema({
  patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientLegacyId: { type: Number, default: null },
  patientName: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'accepted', 'cancelled', 'expired'],
    default: 'open'
  },
  acceptedByDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', default: null },
  expiresAt: { type: Date, required: true }
}, { timestamps: true, autoIndex: false });

emergencyRequestSchema.index({ status: 1, expiresAt: 1 }, { name: 'emergency_status_expires_idx' });
emergencyRequestSchema.index({ patientUserId: 1, status: 1, createdAt: -1 }, { name: 'emergency_patient_status_idx' });

module.exports = mongoose.model('EmergencyRequest', emergencyRequestSchema);
