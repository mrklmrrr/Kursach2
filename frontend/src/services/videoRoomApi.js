import api from './api';

const BASE_URL = '/video-rooms';

export const videoRoomApi = {
  createRoom: async (consultationId) => {
    const response = await api.post(BASE_URL, { consultationId });
    return response.data;
  },

  getRoomInfo: async (roomId) => {
    const response = await api.get(`${BASE_URL}/${roomId}`);
    return response.data;
  },

  joinRoom: async (roomId) => {
    const response = await api.post(`${BASE_URL}/${roomId}/join`);
    return response.data;
  },

  leaveRoom: async (roomId) => {
    await api.post(`${BASE_URL}/${roomId}/leave`);
  },

  endRoom: async (roomId) => {
    await api.post(`${BASE_URL}/${roomId}/end`);
  }
};

export default videoRoomApi;

