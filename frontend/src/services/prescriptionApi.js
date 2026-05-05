import api from './api';

export const prescriptionApi = {
  list: () => api.get('/prescriptions'),
  listForDoctorPatient: (patientId) => api.get(`/doctor/prescriptions/${patientId}`),
  create: (payload) => api.post('/doctor/prescriptions', payload),
  update: (id, payload) => api.put(`/doctor/prescriptions/${id}`, payload)
};
