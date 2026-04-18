const ApiError = require('../utils/ApiError');
const { roles } = require('../constants');

const EDITABLE_FIELDS = ['notes', 'diagnosis', 'treatment', 'recommendations'];
const SICK_LEAVE_FIELDS = ['disease', 'diagnosis', 'recommendations'];

class MedicalRecordService {
  constructor(medicalRecordRepository, userRepository) {
    this.medicalRecordRepository = medicalRecordRepository;
    this.userRepository = userRepository;
  }

  async getByPatientId(patientId) {
    return this.medicalRecordRepository.findOrCreateByPatientId(patientId);
  }

  async updateSection(patientId, sectionKey, updates, doctorId) {
    const { doctor } = await this._resolvePatientAndDoctor(patientId, doctorId);

    const record = await this.medicalRecordRepository.findOrCreateByPatientId(patientId);
    const section = record.systems.find((item) => item.key === sectionKey);
    if (!section) {
      throw ApiError.badRequest('Неизвестный раздел медицинской карты');
    }

    const doctorName = `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Врач';
    const logsToAdd = [];
    let hasChanges = false;

    EDITABLE_FIELDS.forEach((field) => {
      if (updates[field] === undefined) return;
      const newValue = String(updates[field] ?? '').trim();
      const previousValue = String(section[field] || '');
      if (newValue === previousValue) return;

      section[field] = newValue;
      logsToAdd.push({
        sectionKey,
        sectionName: section.name,
        field,
        previousValue,
        newValue,
        doctorId,
        doctorName
      });
      hasChanges = true;
    });

    if (!hasChanges) return record;

    section.updatedAt = new Date();
    section.updatedBy = {
      doctorId,
      doctorName
    };
    record.changeLogs.unshift(...logsToAdd);
    record.changeLogs = record.changeLogs.slice(0, 300);

    return this.medicalRecordRepository.save(record);
  }

  async createSickLeave(patientId, payload, doctorId) {
    const { doctor } = await this._resolvePatientAndDoctor(patientId, doctorId);
    const doctorName = this._toDoctorName(doctor);
    const record = await this.medicalRecordRepository.findOrCreateByPatientId(patientId);

    record.sickLeaves.push({
      issueDate: this._toDateOrNow(payload.issueDate),
      startDate: this._toDateOrNull(payload.startDate),
      endDate: this._toDateOrNull(payload.endDate),
      disease: String(payload.disease || '').trim(),
      diagnosis: String(payload.diagnosis || '').trim(),
      recommendations: String(payload.recommendations || '').trim(),
      status: payload.status === 'closed' ? 'closed' : 'open',
      doctorId,
      doctorName,
      updatedAt: new Date()
    });

    return this.medicalRecordRepository.save(record);
  }

  async updateSickLeave(patientId, sickLeaveId, payload, doctorId) {
    const { doctor } = await this._resolvePatientAndDoctor(patientId, doctorId);
    const doctorName = this._toDoctorName(doctor);
    const record = await this.medicalRecordRepository.findOrCreateByPatientId(patientId);
    const sickLeave = record.sickLeaves.id(sickLeaveId);

    if (!sickLeave) {
      throw ApiError.notFound('Лист нетрудоспособности не найден');
    }

    if (sickLeave.status === 'closed') {
      throw ApiError.badRequest('Закрытый больничный лист нельзя изменять');
    }

    // Allow updating open sick leaves
    if (payload.issueDate !== undefined) sickLeave.issueDate = this._toDateOrNow(payload.issueDate);
    if (payload.startDate !== undefined) sickLeave.startDate = this._toDateOrNull(payload.startDate);
    if (payload.endDate !== undefined) sickLeave.endDate = this._toDateOrNull(payload.endDate);

    SICK_LEAVE_FIELDS.forEach((field) => {
      if (payload[field] === undefined) return;
      sickLeave[field] = String(payload[field] || '').trim();
    });

    if (payload.status !== undefined) {
      if (payload.status === 'closed' || payload.status === 'open') {
        sickLeave.status = payload.status;
      }
    }

    sickLeave.doctorId = doctorId;
    sickLeave.doctorName = doctorName;
    sickLeave.updatedAt = new Date();

    return this.medicalRecordRepository.save(record);
  }



  async _resolvePatientAndDoctor(patientId, doctorId) {
    const [patient, doctor] = await Promise.all([
      this.userRepository.findById(patientId),
      this.userRepository.findById(doctorId)
    ]);

    if (!patient || patient.role !== roles.PATIENT) {
      throw ApiError.notFound('Пациент не найден');
    }
    if (!doctor || doctor.role !== roles.DOCTOR) {
      throw ApiError.forbidden('Только врач может редактировать медицинскую карту');
    }
    return { patient, doctor };
  }

  _toDoctorName(doctor) {
    return `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Врач';
  }

  _toDateOrNull(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  _toDateOrNow(value) {
    const parsed = this._toDateOrNull(value);
    return parsed || new Date();
  }
}

module.exports = MedicalRecordService;
