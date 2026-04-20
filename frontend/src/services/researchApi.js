import api from './api';

export const researchApi = {
  getResearchTypes: () => api.get('/research-types'),
  createResearchType: (payload) => api.post('/research-types', payload)
};