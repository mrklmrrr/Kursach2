const mongoose = require('mongoose');

// Шаблоны исследований
const researchFieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['number', 'string', 'date'], default: 'string' },
  unit: { type: String, default: '' },
  required: { type: Boolean, default: false }
}, { _id: false });

const gridCellDefaultSchema = new mongoose.Schema({
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  value: { type: mongoose.Schema.Types.Mixed, default: '' },
  comment: { type: String, default: '' },
  status: {
    type: String,
    enum: ['normal', 'deviation', 'severe'],
    default: 'normal'
  }
}, { _id: false });

const gridTemplateSchema = new mongoose.Schema({
  rows: { type: Number, default: 0 },
  cols: { type: Number, default: 0 },
  rowHeaders: [{ type: String }],
  colHeaders: [{ type: String }],
  /** Единицы измерения по столбцам (длина = cols), подпись к колонке «Значение» */
  colUnits: [{ type: String, default: '' }],
  /** Необязательные значения в ячейках при создании шаблона (подставляются при новом вводе анализа) */
  cellDefaults: { type: [gridCellDefaultSchema], default: [] }
}, { _id: false });

const researchTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['laboratory', 'instrumental'], required: true },
  /** Кто создал шаблон; null — глобальный (сид) */
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  /** fields — список полей (старое); grid — таблица строк×столбцов */
  templateMode: { type: String, enum: ['fields', 'grid'], default: 'fields' },
  template: { type: [researchFieldSchema], default: [] },
  gridTemplate: { type: gridTemplateSchema, default: () => ({}) }
}, { timestamps: true });

// Результаты исследований
const researchResultSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  researchTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResearchType', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD, чтобы избежать проблем с часовыми поясами
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorName: { type: String, required: true },
  results: [{
    fieldName: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' }
  }],
  /** Результаты для шаблона-сетки: каждая ячейка */
  gridResults: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true },
    value: { type: mongoose.Schema.Types.Mixed, default: '' },
    comment: { type: String, default: '' },
    status: {
      type: String,
      enum: ['normal', 'deviation', 'severe'],
      default: 'normal'
    }
  }],
  customResults: [{
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: '' }
  }],
  /** Свободный текст врача ко всему исследованию (заключение, примечание) */
  studyNote: { type: String, default: '' },
  /** Общая оценка всего анализа (дополнительно к оценкам по ячейкам сетки) */
  overallStatus: {
    type: String,
    enum: ['normal', 'deviation', 'severe'],
    default: 'normal'
  }
}, { timestamps: true });

// Добавляем индексы для поиска
researchResultSchema.index({ patientId: 1, researchTypeId: 1, date: -1 });
researchResultSchema.index({ patientId: 1, date: -1 });

module.exports = {
  ResearchType: mongoose.model('ResearchType', researchTypeSchema),
  ResearchResult: mongoose.model('ResearchResult', researchResultSchema)
};