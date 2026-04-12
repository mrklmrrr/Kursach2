import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (chatId) => {
  const [messages, setMessages] = useState([]);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io('/', { path: '/socket.io' });
    socketRef.current.emit('join-chat', chatId);

    socketRef.current.on('chat-history', (history) => {
      setMessages(history);
    });

    socketRef.current.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [chatId]);

  const sendMessage = (message, sender = 'user') => {
    const timestamp = new Date().toISOString();
    socketRef.current.emit('send-message', { chatId, message, sender, timestamp });
  };

  return { messages, sendMessage };
};