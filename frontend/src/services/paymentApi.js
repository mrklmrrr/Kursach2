import api from './api';

export const paymentApi = {
  process: (data) => api.post('/payments', data),
};
