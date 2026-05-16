/** ID чата, который пользователь сейчас просматривает (если открыта комната). */
let activeChatId = null;

export function setActiveChatId(chatId) {
  activeChatId = chatId != null ? String(chatId) : null;
}

export function getActiveChatId() {
  return activeChatId;
}
