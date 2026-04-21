import api from './api';

export const prescriptionApi = {
  list: () => api.get('/prescriptions'),
  create: (payload) => api.post('/doctor/prescriptions', payload)
};
