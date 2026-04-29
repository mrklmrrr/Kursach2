import api from './api';
import { apiCache } from './cache';

const DOCTOR_APPOINTMENTS_CACHE_KEY = 'doctor_appointments';
const WORKING_HOURS_CACHE_KEY = 'doctor_working_hours';
const CACHE_TTL = 30000; // 30 seconds

export const appointmentApi = {
  // Пациент
  getAll: () => api.get('/appointments'),
  create: (data) => api.post('/appointments', data),
  cancel: (id) => api.patch(`/appointments/${id}/cancel`),
  pay: (id, data = {}) => api.patch(`/appointments/${id}/pay`, data),

  // Общие
  getById: (id) => api.get(`/appointments/${id}`),
  getAvailableSlots: (doctorId, date) => api.get(`/appointments/doctor/${doctorId}/slots`, { params: { date } }),

  // Врач
  getDoctorAppointments: () => {
    const cached = apiCache.get(DOCTOR_APPOINTMENTS_CACHE_KEY);
    if (cached) {
      return Promise.resolve({ data: cached });
    }
    return api.get('/doctor/appointments').then((response) => {
      apiCache.set(DOCTOR_APPOINTMENTS_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  },
  assignAppointment: (data) => {
    apiCache.delete(DOCTOR_APPOINTMENTS_CACHE_KEY);
    return api.post('/doctor/appointments', data);
  },
  deleteAppointment: (id) => {
    apiCache.delete(DOCTOR_APPOINTMENTS_CACHE_KEY);
    return api.delete(`/doctor/appointments/${id}`);
  },
  updateDoctorComment: (id, comment) => api.patch(`/doctor/appointments/${id}/comment`, { comment }),
  getWorkingHours: () => {
    const cached = apiCache.get(WORKING_HOURS_CACHE_KEY);
    if (cached) {
      return Promise.resolve({ data: cached });
    }
    return api.get('/doctor/working-hours').then((response) => {
      apiCache.set(WORKING_HOURS_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  },
  updateWorkingHours: (data) => {
    apiCache.delete(WORKING_HOURS_CACHE_KEY);
    return api.put('/doctor/working-hours', data);
  },
};
