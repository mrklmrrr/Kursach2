import api from './api';
import { apiCache } from './cache';

const PROFILE_CACHE_KEY = 'doctor_profile';
const PATIENTS_CACHE_KEY = 'doctor_patients';
const CONSULTATIONS_CACHE_KEY = 'doctor_consultations';
const CACHE_TTL = 30000; // 30 seconds

export const doctorPanelApi = {
  getProfile: () => {
    const cached = apiCache.get(PROFILE_CACHE_KEY);
    if (cached) {
      return Promise.resolve({ data: cached });
    }
    return api.get('/doctor/profile').then((response) => {
      apiCache.set(PROFILE_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  },
  updateProfile: (data) => {
    apiCache.delete(PROFILE_CACHE_KEY);
    return api.put('/doctor/profile', data);
  },
  toggleOnline: (isOnline) => {
    apiCache.delete(PROFILE_CACHE_KEY);
    return api.patch('/doctor/online', { isOnline });
  },
  getConsultations: () => {
    const cached = apiCache.get(CONSULTATIONS_CACHE_KEY);
    if (cached) {
      return Promise.resolve({ data: cached });
    }
    return api.get('/doctor/consultations').then((response) => {
      apiCache.set(CONSULTATIONS_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  },
  getPendingConsultations: () => {
    const cached = apiCache.get(CONSULTATIONS_CACHE_KEY);
    if (cached) {
      const pending = cached.filter(c => c.status === 'pending');
      return Promise.resolve({ data: pending });
    }
    return api.get('/doctor/consultations/pending').then((response) => {
      apiCache.set(CONSULTATIONS_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  },
  getUpcomingConsultations: () => api.get('/doctor/consultations/upcoming'),
  acceptConsultation: (id) => {
    apiCache.delete(CONSULTATIONS_CACHE_KEY);
    return api.patch(`/doctor/consultations/${id}/accept`);
  },
  rejectConsultation: (id) => {
    apiCache.delete(CONSULTATIONS_CACHE_KEY);
    return api.patch(`/doctor/consultations/${id}/reject`);
  },
  completeConsultation: (id) => {
    apiCache.delete(CONSULTATIONS_CACHE_KEY);
    return api.patch(`/doctor/consultations/${id}/complete`);
  },
  getPatients: () => {
    const cached = apiCache.get(PATIENTS_CACHE_KEY);
    if (cached) {
      return Promise.resolve({ data: cached });
    }
    return api.get('/doctor/patients').then((response) => {
      apiCache.set(PATIENTS_CACHE_KEY, response.data, CACHE_TTL);
      return response;
    });
  }
};
