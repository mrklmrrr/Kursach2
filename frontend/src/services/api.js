import axios from 'axios';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

/**
 * Calculate exponential delay with jitter
 */
function calculateRetryDelay(attempt, maxDelay) {
  const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 200;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error) {
  const status = error.response?.status;
  // Retry on 429 (Too Many Requests), 500, 502, 503, 504
  return status === 429 || (status >= 500 && status < 600);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000 // 10 seconds timeout
});

api.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Диспатчим событие для уведомления приложения
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return Promise.reject(error);
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && !originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    if (originalRequest._retryCount < MAX_RETRIES && isRetryableError(error)) {
      originalRequest._retryCount += 1;

      const delay = calculateRetryDelay(originalRequest._retryCount, MAX_RETRY_DELAY);

      // If 429, check for Retry-After header
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, delay) : delay;

      console.warn(`Request failed with status ${error.response?.status}. Retrying after ${Math.round(waitTime / 1000)}s (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`);

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
