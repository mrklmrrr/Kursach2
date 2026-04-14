import api from './api';

export const appointmentApi = {
  // Пациент
  getAll: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),

  // Общие
  getById: (id) => api.get(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/doctor/${doctorId}/slots`, { params: { date } }),

  // Врач
  getDoctorAppointments: () => api.get('/doctor/appointments'),
  assignAppointment: (data) => api.post('/doctor/appointments', data),
  deleteAppointment: (id) => api.delete(`/doctor/appointments/${id}`),
  getWorkingHours: () => api.get('/doctor/working-hours'),
  updateWorkingHours: (data) => api.put('/doctor/working-hours', data),
};
