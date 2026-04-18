const mongoose = require('mongoose');

const MEDICAL_SYSTEMS = [
  { key: 'cardiovascular', name: 'Сердечно-сосудистая система' },
  { key: 'respiratory', name: 'Дыхательная система' },
  { key: 'digestive', name: 'Пищеварительная система' },
  { key: 'nervous', name: 'Нервная система' },
  { key: 'musculoskeletal', name: 'Костно-мышечная система' },
  { key: 'endocrine', name: 'Эндокринная система' },
  { key: 'genitourinary', name: 'Мочеполовая система' },
  { key: 'immune', name: 'Иммунная система' }
];

const systemSectionSchema = new mongoose.Schema({
  key: { type: String, required: true },
  name: { type: String, required: true },
  notes: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  treatment: { type: String, default: '' },
  recommendations: { type: String, default: '' },
  updatedAt: { type: Date, default: null },
  updatedBy: {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    doctorName: { type: String, default: '' }
  }
}, { _id: false });

const changeLogSchema = new mongoose.Schema({
  sectionKey: { type: String, required: true },
  sectionName: { type: String, required: true },
  field: { type: String, required: true },
  previousValue: { type: String, default: '' },
  newValue: { type: String, default: '' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  systems: { type: [systemSectionSchema], default: () => MEDICAL_SYSTEMS.map((section) => ({ ...section })) },
  changeLogs: { type: [changeLogSchema], default: [] }
}, { timestamps: true });

medicalRecordSchema.index({ patientId: 1 }, { unique: true, name: 'medical_record_patient_idx' });

module.exports = {
  MedicalRecord: mongoose.model('MedicalRecord', medicalRecordSchema),
  MEDICAL_SYSTEMS
};
