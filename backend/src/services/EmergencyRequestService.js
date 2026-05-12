const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { isGeneralPractitionerSpecialty } = require('../constants/generalPractitioner');

class EmergencyRequestService {
  constructor(emergencyRequestRepository, userRepository, consultationRepository) {
    this.emergencyRequestRepository = emergencyRequestRepository;
    this.userRepository = userRepository;
    this.consultationRepository = consultationRepository;
  }

  _emitPatientAccepted(patientUserId, payload) {
    try {
      const { emitToUser } = require('../config/socket');
      emitToUser(patientUserId, 'emergency-request-accepted', payload);
    } catch {
      // noop
    }
  }

  _notifyGpEmergencyCreated(request) {
    if (!request?._id) return;
    try {
      const { emitToEmergencyGp } = require('../config/socket');
      emitToEmergencyGp('emergency-request-created', {
        id: String(request._id),
        patientName: request.patientName,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt
      });
    } catch {
      // noop
    }
  }

  _notifyGpEmergencyRemoved(requestId) {
    if (!requestId) return;
    try {
      const { emitToEmergencyGp } = require('../config/socket');
      emitToEmergencyGp('emergency-request-removed', { id: String(requestId) });
    } catch {
      // noop
    }
  }

  async createForPatient(patientUserId) {
    const patient = await this.userRepository.findById(patientUserId);
    if (!patient || patient.role !== 'patient') {
      throw ApiError.forbidden('Только пациент может вызвать скорую помощь');
    }
    if (patient.legacyId === undefined || patient.legacyId === null) {
      throw ApiError.badRequest('Профиль пациента не готов к экстренному вызову');
    }

    const openIds = await this.emergencyRequestRepository.findOpenIdsForPatient(patientUserId);
    if (openIds.length) {
      await this.emergencyRequestRepository.cancelOpenForPatient(patientUserId);
      openIds.forEach((id) => this._notifyGpEmergencyRemoved(id));
    }

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Пациент';
    const request = await this.emergencyRequestRepository.create({
      patientUserId: patient._id || patient.id,
      patientLegacyId: patient.legacyId,
      patientName,
      status: 'open',
      expiresAt
    });
    this._notifyGpEmergencyCreated(request);
    return { request, reused: false };
  }

  async getCurrentForPatient(patientUserId) {
    const row = await this.emergencyRequestRepository.findCurrentForPatient(patientUserId);
    if (!row) return null;
    let doctorName = null;
    if (row.acceptedByDoctorId) {
      const doc = await this.userRepository.findById(row.acceptedByDoctorId);
      if (doc) {
        doctorName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || null;
      }
    }
    return {
      id: row._id,
      status: row.status,
      expiresAt: row.expiresAt,
      consultationId: row.consultationId || null,
      doctorName,
      patientName: row.patientName,
      createdAt: row.createdAt
    };
  }

  async cancelForPatient(patientUserId) {
    const openIds = await this.emergencyRequestRepository.findOpenIdsForPatient(patientUserId);
    if (!openIds.length) return { ok: true };
    await this.emergencyRequestRepository.cancelOpenForPatient(patientUserId);
    openIds.forEach((id) => this._notifyGpEmergencyRemoved(id));
    return { ok: true };
  }

  async listOpenForGpDoctor(doctorUserId) {
    const doctor = await this.userRepository.findById(doctorUserId);
    if (!doctor || doctor.role !== 'doctor') return [];
    if (!isGeneralPractitionerSpecialty(doctor.specialty)) return [];
    return this.emergencyRequestRepository.findOpenForDoctors();
  }

  async acceptRequest(requestId, doctorUserId) {
    const doctor = await this.userRepository.findById(doctorUserId);
    if (!doctor || doctor.role !== 'doctor') {
      throw ApiError.forbidden('Только врач может принять заявку');
    }
    if (!isGeneralPractitionerSpecialty(doctor.specialty)) {
      throw ApiError.forbidden('Принимать экстренные заявки могут только врачи общей практики');
    }

    const locked = await this.emergencyRequestRepository.acceptIfOpen(requestId, doctorUserId);
    if (!locked) {
      throw ApiError.conflict('Заявка уже недоступна (истекла или принята другим врачом)');
    }

    const patient = await this.userRepository.findById(locked.patientUserId);
    if (!patient || patient.legacyId === undefined || patient.legacyId === null) {
      throw ApiError.badRequest('Не удалось связать заявку с пациентом');
    }

    const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Врач';
    const specialty = doctor.specialty || 'Врач общей практики';

    let consultation = await this.consultationRepository.findLatestThreadForDoctorPatient(
      doctor._id || doctor.id,
      patient.legacyId
    );

    if (!consultation?._id) {
      consultation = await this.consultationRepository.create({
        doctorId: doctor._id || doctor.id,
        doctorName,
        specialty,
        price: 0,
        duration: 30,
        patientId: patient.legacyId,
        patientName: locked.patientName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim(),
        type: 'video'
      });
    }

    await this.emergencyRequestRepository.setConsultationId(locked._id, consultation._id);

    try {
      const VideoRoomService = require('./VideoRoomService');
      const videoRoomService = new VideoRoomService(this.consultationRepository);
      await videoRoomService.createRoom(String(consultation._id), String(doctorUserId), 'doctor');
    } catch (err) {
      logger.warn('Emergency accept: video room init failed', { err: err?.message, consultationId: consultation._id });
    }

    this._notifyGpEmergencyRemoved(locked._id);

    const patientOid = String(patient._id || patient.id || locked.patientUserId);
    this._emitPatientAccepted(patientOid, {
      emergencyRequestId: String(locked._id),
      consultationId: String(consultation._id),
      doctorName
    });

    return { consultation, emergencyRequestId: locked._id };
  }
}

module.exports = EmergencyRequestService;
