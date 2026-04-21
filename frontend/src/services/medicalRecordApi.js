import api from './api';

export const medicalRecordApi = {
  getMyRecord: () => api.get('/medical-record/me'),
  getPatientRecord: (patientId) => api.get(`/medical-record/patient/${patientId}`),
  updatePatientSection: (patientId, sectionKey, payload) =>
    api.patch(`/medical-record/patient/${patientId}/sections/${sectionKey}`, payload),
  createPatientSickLeave: (patientId, payload) =>
    api.post(`/medical-record/patient/${patientId}/sick-leaves`, payload),
  updatePatientSickLeave: (patientId, sickLeaveId, payload) =>
    api.patch(`/medical-record/patient/${patientId}/sick-leaves/${sickLeaveId}`, payload),
  getLaboratoryResults: (patientId) => api.get(`/medical-record/patient/${patientId}/laboratory-research`),
  /** Список лабораторных результатов текущего пациента */
  getMyLaboratoryResults: () => api.get('/medical-record/me/laboratory-research'),
  /** ИИ для пояснений: включён ли ключ на сервере (без секретов) */
  getMyLabInsightConfig: () => api.get('/medical-record/me/lab-insight-config'),
  /** Пояснение (ИИ при наличии ключа на сервере) */
  postPatientLabInsight: (researchResultId) =>
    api.post('/medical-record/me/lab-insights', { researchResultId }),
  getInstrumentalResults: (patientId) => api.get(`/medical-record/patient/${patientId}/instrumental-research`),
  createResearchResult: (patientId, payload) => api.post(`/medical-record/patient/${patientId}/research-results`, payload)
};
