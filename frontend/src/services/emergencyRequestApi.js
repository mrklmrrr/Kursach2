import api from './api';

export const emergencyRequestApi = {
  create: () => api.post('/emergency-requests'),
  getCurrent: () => api.get('/emergency-requests/current'),
  cancelCurrent: () => api.delete('/emergency-requests/current')
};
