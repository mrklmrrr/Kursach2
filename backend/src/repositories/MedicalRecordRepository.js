const { MedicalRecord } = require('../models');
const { MEDICAL_SYSTEMS } = require('../models/MedicalRecord');
const { ResearchResult } = require('../models/Research');

class MedicalRecordRepository {
  async findByPatientId(patientId) {
    const doc = await MedicalRecord.findOne({ patientId });
    if (!doc) return null;
    return this._syncSystems(doc);
  }

  async findOrCreateByPatientId(patientId) {
    let doc = await MedicalRecord.findOneAndUpdate(
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
    doc = await this._syncSystems(doc);
    return doc;
  }

  _syncSystems(doc) {
    if (!doc || !Array.isArray(doc.systems)) return doc;
    let modified = false;
    const existingByKey = new Map(doc.systems.map((s) => [s.key, s]));

    for (const sys of MEDICAL_SYSTEMS) {
      if (!existingByKey.has(sys.key)) {
        doc.systems.push({ ...sys });
        modified = true;
      } else {
        const existing = existingByKey.get(sys.key);
        if (existing.name !== sys.name) {
          existing.name = sys.name;
          modified = true;
        }
      }
    }

    if (modified) {
      return doc.save();
    }
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
