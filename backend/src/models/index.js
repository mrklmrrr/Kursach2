const User = require('./User');
const EmergencyRequest = require('./EmergencyRequest');
const Consultation = require('./Consultation');
const Dependent = require('./Dependent');
const Appointment = require('./Appointment');
const { MedicalRecord } = require('./MedicalRecord');
const { ResearchType, ResearchResult } = require('./Research');
const Prescription = require('./Prescription');
const AuditLog = require('./AuditLog');
const ReminderLog = require('./ReminderLog');

module.exports = {
  User,
  EmergencyRequest,
  Consultation,
  Dependent,
  Appointment,
  MedicalRecord,
  ResearchType,
  ResearchResult,
  Prescription,
  AuditLog,
  ReminderLog
};
