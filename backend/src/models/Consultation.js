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
  status: { type: String, default: 'pending', enum: ['pending', 'waiting', 'active', 'completed', 'cancelled', 'failed'] },
  paymentId: { type: Number, default: null },
  paidAt: { type: String, default: null },
  scheduledAt: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  messages: { type: [messageSchema], default: [] },
  
  // Поля для видео чатов
  videoRoom: {
    roomId: { type: String, unique: true, sparse: true },
    status: { type: String, default: 'created', enum: ['created', 'waiting', 'active', 'ended', 'failed'] },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: null },
    participants: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['doctor', 'patient'] },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date, default: null }
    }],
    sessionInfo: {
      iceServers: [{ type: String }],
      videoQuality: { type: String, default: 'hd', enum: ['sd', 'hd', 'fullhd'] },
      screenShareEnabled: { type: Boolean, default: false },
      recordingEnabled: { type: Boolean, default: false }
    }
  }
}, { timestamps: true, autoIndex: false });

consultationSchema.index({ doctorId: 1, status: 1 }, { name: 'doctor_status_idx' });
consultationSchema.index({ patientId: 1 }, { name: 'patientId_idx' });
consultationSchema.index({ 'videoRoom.roomId': 1 }, { name: 'video_room_id_idx', sparse: true });
consultationSchema.index({ 'videoRoom.status': 1 }, { name: 'video_room_status_idx' });
consultationSchema.index({ status: 1, 'videoRoom.status': 1 }, { name: 'consultation_video_status_idx' });
consultationSchema.index({ createdAt: -1 }, { name: 'created_at_idx' });

module.exports = mongoose.model('Consultation', consultationSchema);
