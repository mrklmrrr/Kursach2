const AuthService = require('./auth.service');
const DoctorService = require('./doctor.service');
const ConsultationService = require('./consultation.service');
const PaymentService = require('./payment.service');
const DependentService = require('./dependent.service');
const AppointmentService = require('./AppointmentService');
const MedicalRecordService = require('./medical-record.service');

module.exports = {
  AuthService,
  DoctorService,
  ConsultationService,
  PaymentService,
  DependentService,
  AppointmentService,
  MedicalRecordService
};
