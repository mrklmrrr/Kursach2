import { io } from 'socket.io-client';
import api from './api';

function getSocketUrl() {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  if (explicitSocketUrl) {
    return explicitSocketUrl;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.startsWith('/')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  return 'http://localhost:5001';
}

function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && !apiUrl.startsWith('/')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return getSocketUrl();
}

export const chatApi = {
  getChats: () => api.get('/chats'),
  getMessages: (chatId) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId, message) => api.post(`/chats/${chatId}/messages`, { message }),
  uploadAttachment: (chatId, file, message = '') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);
    return api.post(`/chats/${chatId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  connectSocket: (token) => io(getSocketUrl(), {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  }),
  getBackendOrigin
};
