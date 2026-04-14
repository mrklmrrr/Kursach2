import api from './api';

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getMe: () => api.get('/auth/me'),
  updateUser: (updates) => api.put('/auth/user', updates),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const adminApi = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  getDashboard: () => api.get('/admin/dashboard'),
  getDoctors: () => api.get('/admin/doctors'),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`),
  toggleDoctorOnline: (id, isOnline) => api.patch(`/admin/doctors/${id}/online`, { isOnline })
};
