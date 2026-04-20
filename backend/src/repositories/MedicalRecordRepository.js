const { MedicalRecord } = require('../models');
const { MEDICAL_SYSTEMS } = require('../models/MedicalRecord');
const { ResearchResult } = require('../models/Research');

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

  async getLaboratoryResults(patientId) {
    return ResearchResult.find({ patientId })
      .populate({
        path: 'researchTypeId',
        match: { category: 'laboratory' }
      })
      .sort({ date: -1 })
      .then(results => results.filter(r => r.researchTypeId));
  }

  async getInstrumentalResults(patientId) {
    return ResearchResult.find({ patientId })
      .populate({
        path: 'researchTypeId',
        match: { category: 'instrumental' }
      })
      .sort({ date: -1 })
      .then(results => results.filter(r => r.researchTypeId));
  }
}

module.exports = MedicalRecordRepository;
