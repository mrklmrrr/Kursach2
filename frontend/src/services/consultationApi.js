import api from './api';

export const consultationApi = {
  create: (data) => api.post('/consultations', data),
  getById: (id) => api.get(`/consultations/${id}`),
  getByPatientId: (patientId) => api.get(`/consultations/patient/${patientId}`),
};
