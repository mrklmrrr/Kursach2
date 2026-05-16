import { useEffect } from 'react';
import { getChatSocket } from '../services/chatSocket';

/**
 * Подписка на изменения онлайн-статуса пользователей (socket user-presence).
 */
export function usePresenceSocket(token, onPresenceChange) {
  useEffect(() => {
    if (!token || typeof onPresenceChange !== 'function') return undefined;

    const socket = getChatSocket(token);
    const handlePresence = ({ userId, isOnline } = {}) => {
      if (!userId) return;
      onPresenceChange(String(userId), Boolean(isOnline));
    };

    socket.on('user-presence', handlePresence);
    return () => {
      socket.off('user-presence', handlePresence);
    };
  }, [token, onPresenceChange]);
}
