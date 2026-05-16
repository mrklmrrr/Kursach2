import api from './api';

export const dependentApi = {
  getAll: () => api.get('/dependents'),
  getIncomingInvites: () => api.get('/dependents/invites'),
  acceptInvite: (id) => api.post(`/dependents/invites/${id}/accept`),
  rejectInvite: (id) => api.post(`/dependents/invites/${id}/reject`),
  create: (data) => api.post('/dependents', data),
};
