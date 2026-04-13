import api from './api';

export const dependentApi = {
  getAll: () => api.get('/dependents'),
  create: (data) => api.post('/dependents', data),
};
