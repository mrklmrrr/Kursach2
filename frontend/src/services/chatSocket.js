import { chatApi } from './chatApi';

let socketInstance = null;
let boundToken = null;

/**
 * Единый сокет чата на сессию: не рвём соединение при навигации между списком чатов и комнатой.
 * При смене токена — пересоздаём.
 */
export function getChatSocket(token) {
  if (!token) return null;
  const tokenStr = String(token);
  if (socketInstance && boundToken === tokenStr) {
    return socketInstance;
  }
  if (socketInstance) {
    try {
      socketInstance.removeAllListeners();
    } catch {
      /* ignore */
    }
    socketInstance.disconnect();
    socketInstance = null;
    boundToken = null;
  }
  boundToken = tokenStr;
  socketInstance = chatApi.connectSocket(tokenStr);
  return socketInstance;
}

export function disconnectChatSocket() {
  if (!socketInstance) return;
  try {
    socketInstance.removeAllListeners();
  } catch {
    /* ignore */
  }
  socketInstance.disconnect();
  socketInstance = null;
  boundToken = null;
}

export function getChatSocketIfConnected() {
  return socketInstance?.connected ? socketInstance : null;
}
