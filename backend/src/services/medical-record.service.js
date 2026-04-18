const ApiError = require('../utils/ApiError');
const { roles } = require('../constants');

const EDITABLE_FIELDS = ['notes', 'diagnosis', 'treatment', 'recommendations'];

class MedicalRecordService {
  constructor(medicalRecordRepository, userRepository) {
    this.medicalRecordRepository = medicalRecordRepository;
    this.userRepository = userRepository;
  }

  async getByPatientId(patientId) {
    return this.medicalRecordRepository.findOrCreateByPatientId(patientId);
  }

  async updateSection(patientId, sectionKey, updates, doctorId) {
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
}

module.exports = MedicalRecordService;
