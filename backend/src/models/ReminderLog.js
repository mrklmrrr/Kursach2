const mongoose = require('mongoose');

const reminderLogSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  kind: { type: String, required: true, enum: ['24h', '1h'] },
  emailSent: { type: Boolean, default: false },
  telegramSent: { type: Boolean, default: false }
}, { timestamps: true, autoIndex: false });

reminderLogSchema.index({ appointmentId: 1, kind: 1 }, { unique: true, name: 'appointment_kind_reminder_idx' });

module.exports = mongoose.model('ReminderLog', reminderLogSchema);
