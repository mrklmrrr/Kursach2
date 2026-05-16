/**
 * Helpers for chat message lists (HTTP + socket).
 */

export function getMessageKey(msg) {
  if (!msg) return '';
  const id = msg._id ?? msg.id;
  if (id != null && String(id)) return String(id);
  return `${msg.timestamp || ''}-${msg.message || ''}-${msg.sender || ''}-${msg.fileUrl || ''}`;
}

export function isTempMessage(msg) {
  const key = getMessageKey(msg);
  return key.startsWith('temp-');
}

export function mergeMessageLists(prev, incoming) {
  const map = new Map();
  const add = (m) => {
    const key = getMessageKey(m);
    if (!key) return;
    map.set(key, m);
  };

  (Array.isArray(prev) ? prev : []).forEach(add);
  (Array.isArray(incoming) ? incoming : []).forEach(add);

  return Array.from(map.values()).sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    return ta - tb;
  });
}

/** Drop optimistic temp rows replaced by a persisted server message. */
export function stripReplacedTempMessages(messages, savedMessage) {
  if (!savedMessage) return messages;
  const savedText = String(savedMessage.message || '').trim();
  const savedSender = String(savedMessage.sender || '');
  const savedTs = new Date(savedMessage.timestamp || 0).getTime();

  return (Array.isArray(messages) ? messages : []).filter((m) => {
    if (!isTempMessage(m)) return true;
    const sameSender = String(m.sender || '') === savedSender;
    const sameText = String(m.message || '').trim() === savedText;
    if (!sameSender || !sameText) return true;
    const tempTs = new Date(m.timestamp || 0).getTime();
    if (Number.isNaN(savedTs) || Number.isNaN(tempTs)) return false;
    return Math.abs(savedTs - tempTs) > 120_000;
  });
}

export function upsertMessage(prev, incoming) {
  if (!incoming) return Array.isArray(prev) ? prev : [];
  const key = getMessageKey(incoming);
  if (!key) return [...(Array.isArray(prev) ? prev : []), incoming];

  let next = stripReplacedTempMessages(prev, incoming);
  const exists = next.some((m) => getMessageKey(m) === key);
  if (exists) {
    next = next.map((m) => (getMessageKey(m) === key ? { ...m, ...incoming } : m));
    return next.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
  }
  return mergeMessageLists(next, [incoming]);
}

/**
 * Normalize socket payloads: raw message or { chatId, message }.
 */
export function parseSocketMessagePayload(payload, currentChatId) {
  if (!payload || typeof payload !== 'object') return null;

  const nested = payload.message;
  const isWrapped =
    payload.chatId != null
    && nested
    && typeof nested === 'object'
    && (nested.sender != null || nested.timestamp != null || nested.messageType != null);

  if (isWrapped) {
    if (String(payload.chatId) !== String(currentChatId)) return null;
    return nested;
  }

  if (payload.sender != null || payload.timestamp != null || payload.messageType != null) {
    return payload;
  }

  return null;
}
