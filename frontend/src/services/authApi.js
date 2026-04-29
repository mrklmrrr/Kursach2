import axios from 'axios';

// Separate API instance for auth endpoints with more retries
const authApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000
});

// Add token to auth requests
authApiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Auth-specific retry config - more aggressive retries for login
const MAX_AUTH_RETRIES = 5;
const INITIAL_AUTH_RETRY_DELAY = 2000;
const MAX_AUTH_RETRY_DELAY = 30000;

function calculateAuthRetryDelay(attempt, maxDelay) {
  const exponentialDelay = INITIAL_AUTH_RETRY_DELAY * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 500;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

authApiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 unauthorized
    if (status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return Promise.reject(error);
    }

    // Retry on 429 or 5xx errors
    const isRetryable = status === 429 || (status >= 500 && status < 600);

    if (isRetryable && !originalRequest._authRetryCount) {
      originalRequest._authRetryCount = 0;
    }

    if (originalRequest._authRetryCount < MAX_AUTH_RETRIES && isRetryable) {
      originalRequest._authRetryCount += 1;
      const delay = calculateAuthRetryDelay(originalRequest._authRetryCount, MAX_AUTH_RETRY_DELAY);
      
      // Respect Retry-After header for 429
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter 
        ? Math.min(parseInt(retryAfter, 10) * 1000, delay) 
        : delay;

      console.warn(
        `Auth request failed with status ${status}. Retrying after ${Math.round(waitTime / 1000)}s (attempt ${originalRequest._authRetryCount}/${MAX_AUTH_RETRIES})`
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return authApiInstance(originalRequest);
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (userData) => authApiInstance.post('/auth/register', userData),
  login: (phone, password) => authApiInstance.post('/auth/login', { phone, password }),
  getMe: () => authApiInstance.get('/auth/me'),
  updateUser: (updates) => authApiInstance.put('/auth/user', updates),
  checkUsername: (username) => authApiInstance.get(`/auth/user/username/${username}`),
  setUsername: (username) => authApiInstance.put('/auth/user/username', { username }),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return authApiInstance.post('/auth/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  changePassword: (currentPassword, newPassword) =>
    authApiInstance.post('/auth/change-password', { currentPassword, newPassword }),
  updateReminderPreferences: (preferences) => 
    authApiInstance.put('/auth/user/reminder', preferences)
};

export const adminApi = {
  login: (email, password) => authApiInstance.post('/admin/login', { email, password }),
  getDashboard: () => authApiInstance.get('/admin/dashboard'),
  getDoctors: () => authApiInstance.get('/admin/doctors'),
  getPatients: () => authApiInstance.get('/admin/patients'),
  getConsultations: () => authApiInstance.get('/admin/consultations'),
  updateDoctorStatus: (doctorId, status) => 
    authApiInstance.put(`/admin/doctors/${doctorId}/status`, { status }),
  banDoctor: (doctorId) => authApiInstance.put(`/admin/doctors/${doctorId}/ban`),
  unbanDoctor: (doctorId) => authApiInstance.put(`/admin/doctors/${doctorId}/unban`)
};

