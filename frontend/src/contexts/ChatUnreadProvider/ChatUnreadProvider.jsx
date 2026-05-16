import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { chatApi } from '../../services/chatApi';
import { getChatSocket } from '../../services/chatSocket';
import { getActiveChatId } from '../../services/activeChat';

const ChatUnreadContext = createContext(null);

function isIncomingMessage(message, isDoctor) {
  if (!message || typeof message !== 'object') return false;
  const sender = String(message.sender || '').toLowerCase();
  if (sender === 'system' || message.messageType === 'system') return false;
  return sender !== (isDoctor ? 'doctor' : 'user');
}

export function ChatUnreadProvider({ children }) {
  const { token, user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [unreadByChatId, setUnreadByChatId] = useState({});

  const totalUnread = useMemo(
    () => Object.values(unreadByChatId).reduce((sum, value) => {
      const n = Number(value) || 0;
      return n > 0 ? sum + n : sum;
    }, 0),
    [unreadByChatId]
  );

  const setUnreadForChat = useCallback((chatId, count) => {
    if (chatId == null) return;
    const key = String(chatId);
    const nextCount = Math.max(0, Number(count) || 0);
    setUnreadByChatId((prev) => {
      if (Number(prev[key] || 0) === nextCount) return prev;
      return { ...prev, [key]: nextCount };
    });
  }, []);

  const applyChatPayload = useCallback((payload = {}) => {
    const chatId = payload?.chatId;
    if (!chatId) return;

    const message = payload?.message && typeof payload.message === 'object'
      ? payload.message
      : null;
    const isViewingChat = getActiveChatId() === String(chatId);

    if (isViewingChat) {
      setUnreadForChat(chatId, 0);
      return;
    }

    if (message && isIncomingMessage(message, isDoctor)) {
      setUnreadByChatId((prev) => {
        const key = String(chatId);
        const bumped = Number(prev[key] || 0) + 1;
        const fromServer = payload.unreadCount != null ? Number(payload.unreadCount) : null;
        const nextCount = fromServer != null ? Math.max(bumped, fromServer) : bumped;
        if (Number(prev[key] || 0) === nextCount) return prev;
        return { ...prev, [key]: nextCount };
      });
      return;
    }

    if (payload.unreadCount != null) {
      setUnreadForChat(chatId, payload.unreadCount);
    }
  }, [isDoctor, setUnreadForChat]);

  const syncFromChatsList = useCallback((chats) => {
    if (!Array.isArray(chats)) return;
    const activeId = getActiveChatId();
    setUnreadByChatId((prev) => {
      const next = { ...prev };
      chats.forEach((chat) => {
        const id = String(chat.id || chat._id || '');
        if (!id) return;
        next[id] = activeId === id ? 0 : Math.max(0, Number(chat.unread ?? chat.unreadCount ?? 0));
      });
      return next;
    });
  }, []);

  const refreshFromServer = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await chatApi.getChats();
      const activeId = getActiveChatId();
      const next = {};
      (Array.isArray(data) ? data : []).forEach((chat) => {
        const id = String(chat._id || '');
        if (!id) return;
        next[id] = activeId === id ? 0 : Math.max(0, Number(chat.unreadCount || 0));
      });
      setUnreadByChatId(next);
    } catch {
      /* offline / unauthorized */
    }
  }, [token]);

  const getChatUnread = useCallback(
    (chatId) => Number(unreadByChatId[String(chatId)] || 0),
    [unreadByChatId]
  );

  useEffect(() => {
    if (!token) {
      setUnreadByChatId({});
      return undefined;
    }
    refreshFromServer();
    return undefined;
  }, [token, refreshFromServer]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = getChatSocket(token);
    const handleChatUpdated = (payload) => applyChatPayload(payload);
    const handleChatRead = ({ chatId, unreadCount = 0 } = {}) => {
      if (chatId) setUnreadForChat(chatId, unreadCount);
    };

    socket.on('chat-updated', handleChatUpdated);
    socket.on('chat-read', handleChatRead);

    return () => {
      socket.off('chat-updated', handleChatUpdated);
      socket.off('chat-read', handleChatRead);
    };
  }, [token, applyChatPayload, setUnreadForChat]);

  const value = useMemo(() => ({
    unreadByChatId,
    totalUnread,
    getChatUnread,
    setUnreadForChat,
    syncFromChatsList,
    refreshFromServer,
    applyChatPayload
  }), [
    unreadByChatId,
    totalUnread,
    getChatUnread,
    setUnreadForChat,
    syncFromChatsList,
    refreshFromServer,
    applyChatPayload
  ]);

  return (
    <ChatUnreadContext.Provider value={value}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  const context = useContext(ChatUnreadContext);
  if (!context) {
    throw new Error('useChatUnread must be used within ChatUnreadProvider');
  }
  return context;
}
