import { io } from 'socket.io-client';
import api from './api';
import { apiCache } from './cache';

const CHATS_CACHE_KEY = 'chats_list';
const CHATS_CACHE_TTL = 30000; // 30 seconds

function getSocketUrl() {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.startsWith('/')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  return import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5001';
}

function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.startsWith('/')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return getSocketUrl();
}

export const chatApi = {
  getChats: () => {
    // Always fetch fresh chats, because doctor profile data may change in admin panel.
    return api.get('/chats').then((response) => {
      // Keep cache for quick subsequent reads in the same session.
      apiCache.set(CHATS_CACHE_KEY, response.data, CHATS_CACHE_TTL);
      return response;
    });
  },
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId, message) => {
    // Invalidate cache when sending a message
    apiCache.delete(CHATS_CACHE_KEY);
    return api.post(`/chats/${chatId}/messages`, { message });
  },
  createDoctorChat: (doctorId) => {
    apiCache.delete(CHATS_CACHE_KEY);
    return api.post('/chats/doctor', { doctorId });
  },
  uploadAttachment: (chatId, file, message = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);
    // Invalidate cache when uploading attachment
    apiCache.delete(CHATS_CACHE_KEY);
    return api.post(`/chats/${chatId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  connectSocket: (token) => io(getSocketUrl(), {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 10000
  }),
  getBackendOrigin,
  /**
   * Invalidate chats cache when chats are modified
   */
  invalidateChatsCache: () => {
    apiCache.delete(CHATS_CACHE_KEY);
  }
};
