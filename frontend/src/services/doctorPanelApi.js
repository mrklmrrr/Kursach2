import api from './api';

export const doctorPanelApi = {
  getProfile: () => api.get('/doctor/profile'),
  updateProfile: (data) => api.put('/doctor/profile', data),
  toggleOnline: (isOnline) => api.patch('/doctor/online', { isOnline }),
  getConsultations: () => api.get('/doctor/consultations'),
  getPendingConsultations: () => api.get('/doctor/consultations/pending'),
  getUpcomingConsultations: () => api.get('/doctor/consultations/upcoming'),
  acceptConsultation: (id) => api.patch(`/doctor/consultations/${id}/accept`),
  rejectConsultation: (id) => api.patch(`/doctor/consultations/${id}/reject`),
  completeConsultation: (id) => api.patch(`/doctor/consultations/${id}/complete`),
  getPatients: () => api.get('/doctor/patients')
};
