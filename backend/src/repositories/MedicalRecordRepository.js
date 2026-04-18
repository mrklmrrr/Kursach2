const { MedicalRecord } = require('../models');
const { MEDICAL_SYSTEMS } = require('../models/MedicalRecord');

class MedicalRecordRepository {
  async findByPatientId(patientId) {
    return MedicalRecord.findOne({ patientId }).lean();
  }

  async findOrCreateByPatientId(patientId) {
    const doc = await MedicalRecord.findOneAndUpdate(
      { patientId },
      {
        $setOnInsert: {
          patientId,
          systems: MEDICAL_SYSTEMS.map((section) => ({ ...section })),
          changeLogs: [],
          sickLeaves: []
        }
      },
      { returnDocument: 'after', upsert: true }
    );
    return doc;
  }

  async save(document) {
    return document.save();
  }
}

module.exports = MedicalRecordRepository;
