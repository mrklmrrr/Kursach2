import api from './api';

export const researchApi = {
  getResearchTypes: () => api.get('/research-types'),
  createResearchType: (payload) => api.post('/research-types', payload),
  updateResearchType: (id, payload) => api.put(`/research-types/${id}`, payload),
  deleteResearchType: (id) => api.delete(`/research-types/${id}`)
};