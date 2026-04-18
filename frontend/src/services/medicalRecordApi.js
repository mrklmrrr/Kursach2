import api from './api';

export const medicalRecordApi = {
  getMyRecord: () => api.get('/medical-record/me'),
  getPatientRecord: (patientId) => api.get(`/medical-record/patient/${patientId}`),
  updatePatientSection: (patientId, sectionKey, payload) =>
    api.patch(`/medical-record/patient/${patientId}/sections/${sectionKey}`, payload),
  createPatientSickLeave: (patientId, payload) =>
    api.post(`/medical-record/patient/${patientId}/sick-leaves`, payload),
  updatePatientSickLeave: (patientId, sickLeaveId, payload) =>
    api.patch(`/medical-record/patient/${patientId}/sick-leaves/${sickLeaveId}`, payload)
};
