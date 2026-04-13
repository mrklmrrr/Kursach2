import api from './api';

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (phone) => api.post('/auth/login', { phone }),
  getMe: () => api.get('/auth/me'),
  updateUser: (updates) => api.put('/auth/user', updates),
};
