const mongoose = require('mongoose');

// Шаблоны исследований
const researchFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['number', 'string', 'date'], default: 'string' },
  unit: { type: String, default: '' },
  required: { type: Boolean, default: false }
}, { _id: false });

const researchTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['laboratory', 'instrumental'], required: true },
  template: { type: [researchFieldSchema], default: [] }
}, { timestamps: true });

// Результаты исследований
const researchResultSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  researchTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchType', required: true },
  date: { type: Date, default: Date.now },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  results: [{
    fieldName: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' }
  }],
  customResults: [{
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' }
  }]
}, { timestamps: true });

// Добавляем индексы для поиска
researchResultSchema.index({ patientId: 1, researchTypeId: 1, date: -1 });
researchResultSchema.index({ patientId: 1, date: -1 });

module.exports = {
  ResearchType: mongoose.model('ResearchType', researchTypeSchema),
  ResearchResult: mongoose.model('ResearchResult', researchResultSchema)
};