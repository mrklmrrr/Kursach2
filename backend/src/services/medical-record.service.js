const ApiError = require('../utils/ApiError');
const { roles } = require('../constants');
const { ResearchResult, ResearchType } = require('../models/Research');

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

    const disease = String(payload.disease || '').trim();
    const diagnosis = String(payload.diagnosis || '').trim();
    const recommendations = String(payload.recommendations || '').trim();


    // Check for duplicate sick leaves within the last 30 seconds (more lenient)
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const existingDuplicate = record.sickLeaves.find(sickLeave =>
      sickLeave.disease === disease &&
      sickLeave.diagnosis === diagnosis &&
      sickLeave.recommendations === recommendations &&
      new Date(sickLeave.updatedAt) > thirtySecondsAgo
    );

    if (existingDuplicate) {
      throw ApiError.badRequest('Лист нетрудоспособности с такими данными уже создан недавно');
    }

    record.sickLeaves.push({
      issueDate: this._toDateOrNow(payload.issueDate),
      startDate: this._toDateOrNull(payload.startDate),
      endDate: this._toDateOrNull(payload.endDate),
      disease,
      diagnosis,
      recommendations,
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
      const value = String(payload[field] || '').trim();
      if (!value) {
        throw ApiError.badRequest(`Поле ${field} не может быть пустым`);
      }
      sickLeave[field] = value;
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

  async getLaboratoryResults(patientId) {
    await this._resolvePatient(patientId);
    return this.medicalRecordRepository.getLaboratoryResults(patientId);
  }

  async getPatientLabInsight(patientId, researchResultId) {
    const { generatePatientLabInsight } = require('./lab-insight.service');
    return generatePatientLabInsight(patientId, researchResultId);
  }

  getPatientLabInsightConfig() {
    const { getLabInsightConfig } = require('./lab-insight.service');
    return getLabInsightConfig();
  }

  async getInstrumentalResults(patientId) {
    await this._resolvePatient(patientId);
    return this.medicalRecordRepository.getInstrumentalResults(patientId);
  }

  async createResearchResult(patientId, payload, doctorId) {
    const { doctor } = await this._resolvePatientAndDoctor(patientId, doctorId);
    const doctorName = this._toDoctorName(doctor);

    const researchType = await ResearchType.findById(payload.researchTypeId).lean();
    if (!researchType) {
      throw ApiError.badRequest('Тип исследования не найден');
    }

    const gtMeta = researchType.gridTemplate || {};
    const gridRows = Number(gtMeta.rows) || 0;
    const gridCols = Number(gtMeta.cols) || 0;
    const hasValidGrid = gridRows >= 1 && gridCols >= 1;

    /** С фронта таблица определяется по размеру сетки; templateMode по умолчанию в БД — fields, иначе сохранение шло бы в режим полей без gridResults */
    let mode = 'fields';
    if (researchType.templateMode === 'grid' || hasValidGrid) {
      mode = 'grid';
    }

    let results = [];
    let gridResults = [];

    if (mode === 'grid') {
      const gt = researchType.gridTemplate || {};
      const rows = Number(gt.rows) || 0;
      const cols = Number(gt.cols) || 0;
      if (rows < 1 || cols < 1) {
        throw ApiError.badRequest('Некорректный шаблон сетки');
      }
      const incoming = Array.isArray(payload.gridResults) ? payload.gridResults : [];
      const seen = new Set();
      for (const cell of incoming) {
        const r = Number(cell.row);
        const c = Number(cell.col);
        if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r >= rows || c < 0 || c >= cols) {
          continue;
        }
        const key = `${r},${c}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const st = ['normal', 'deviation', 'severe'].includes(cell.status) ? cell.status : 'normal';
        gridResults.push({
          row: r,
          col: c,
          value: cell.value != null && cell.value !== '' ? cell.value : '',
          comment: String(cell.comment || '').slice(0, 4000),
          status: st
        });
      }
      if (gridResults.length === 0) {
        throw ApiError.badRequest('Укажите хотя бы одну ячейку таблицы (значение, комментарий или статус)');
      }
    } else {
      const templateFields = researchType.template || [];
      for (const field of templateFields) {
        if (field.required && (!payload.results || payload.results[field.name] === undefined || payload.results[field.name] === '')) {
          throw ApiError.badRequest(`Обязательное поле "${field.name}" не заполнено`);
        }
        if (payload.results && payload.results[field.name] !== undefined) {
          let value = payload.results[field.name];
          if (field.type === 'number') {
            value = Number(value);
            if (isNaN(value)) {
              throw ApiError.badRequest(`Поле "${field.name}" должно быть числом`);
            }
          } else if (field.type === 'date') {
            value = new Date(value);
            if (isNaN(value.getTime())) {
              throw ApiError.badRequest(`Поле "${field.name}" должно быть датой`);
            }
          } else {
            value = String(value);
          }
          results.push({
            fieldName: field.name,
            value,
            unit: field.unit || ''
          });
        }
      }
    }

    const overallStatus = ['normal', 'deviation', 'severe'].includes(payload.overallStatus)
      ? payload.overallStatus
      : 'normal';
    const studyNote = payload.studyNote != null ? String(payload.studyNote).slice(0, 8000) : '';

    // Дата сохраняется как строка YYYY-MM-DD для избежания проблем с часовыми поясами
    let researchDate = '';
    if (payload.date) {
      // Если передан формат YYYY-MM-DD, используем его напрямую
      if (typeof payload.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
        researchDate = payload.date;
      } else {
        // Если передан Date объект, конвертируем в локальную дату
        const d = new Date(payload.date);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          researchDate = `${yyyy}-${mm}-${dd}`;
        }
      }
    }

    // Если дата не установлена, используем сегодняшнюю дату
    if (!researchDate) {
      const d = new Date();
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      researchDate = `${yyyy}-${mm}-${dd}`;
    }

    const researchResult = new ResearchResult({
      patientId,
      researchTypeId: payload.researchTypeId,
      date: researchDate,
      doctorId,
      doctorName,
      results,
      gridResults,
      customResults: (payload.customResults || []).map(cr => ({
        name: cr.name,
        value: cr.value,
        unit: cr.unit || ''
      })),
      studyNote,
      overallStatus
    });

    await researchResult.save();

    const record = await this.medicalRecordRepository.findOrCreateByPatientId(patientId);
    if (researchType.category === 'laboratory') {
      record.laboratoryResearch.push(researchResult._id);
    } else if (researchType.category === 'instrumental') {
      record.instrumentalResearch.push(researchResult._id);
    }
    await this.medicalRecordRepository.save(record);

    return researchResult.populate('researchTypeId');
  }

  async _resolvePatient(patientId) {
    const patient = await this.userRepository.findById(patientId);
    if (!patient || patient.role !== roles.PATIENT) {
      throw ApiError.notFound('Пациент не найден');
    }
    return patient;
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
    if (!value || typeof value !== 'string') return null;

    // Try parsing DD.MM.YYYY format
    const ddmmyyyyMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Try parsing date range format like "20.04.2026 — 27.04.2026"
    const rangeMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\s*—\s*(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (rangeMatch) {
      const [, startDay, startMonth, startYear] = rangeMatch;
      const parsed = new Date(`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback to standard Date parsing
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  _toDateOrNow(value) {
    const parsed = this._toDateOrNull(value);
    return parsed || new Date();
  }
}

module.exports = MedicalRecordService;
