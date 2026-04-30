const mongoose = require('mongoose');

const MEDICAL_SYSTEMS = [
  { key: 'musculoskeletal', name: 'Опорно-двигательная система (скелетная и мышечная)' },
  { key: 'nervous', name: 'Нервная система' },
  { key: 'cardiovascular', name: 'Кровеносная система (сердечно-сосудистая)' },
  { key: 'respiratory', name: 'Дыхательная система' },
  { key: 'digestive', name: 'Пищеварительная система' },
  { key: 'urinary', name: 'Мочевыделительная система' },
  { key: 'endocrine', name: 'Эндокринная система' },
  { key: 'immune', name: 'Иммунная и лимфатическая системы' },
  { key: 'integumentary', name: 'Покровная система' },
  { key: 'reproductive', name: 'Репродуктивная система (половая)' }
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

const sickLeaveSchema = new mongoose.Schema({
  issueDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  disease: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  recommendations: { type: String, default: '' },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.Mixed, required: true, unique: true },
  systems: { type: [systemSectionSchema], default: () => MEDICAL_SYSTEMS.map((section) => ({ ...section })) },
  changeLogs: { type: [changeLogSchema], default: [] },
  sickLeaves: { type: [sickLeaveSchema], default: [] },
  laboratoryResearch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResearchResult' }],
  instrumentalResearch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ResearchResult' }]
}, { timestamps: true });

// Индекс для patientId - теперь Mixed тип
medicalRecordSchema.index({ patientId: 1 }, { unique: true, name: 'medical_record_patient_idx' });

module.exports = {
  MedicalRecord: mongoose.model('MedicalRecord', medicalRecordSchema),
  MEDICAL_SYSTEMS
};
