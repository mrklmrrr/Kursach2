import api from './api';

export const platformApi = {
  getPlans: () => api.get('/platform/plans')
};
