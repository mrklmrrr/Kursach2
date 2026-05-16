const FIELD_MESSAGE_HINTS = [
  { pattern: /телефон|phone/i, field: 'phone' },
  { pattern: /парол/i, field: 'password' },
  { pattern: /email/i, field: 'email' }
];

function fieldFromDetailPath(path) {
  if (!path) return '';
  const match = String(path).match(/^body\.(.+)$/);
  return match ? match[1] : '';
}

function fieldFromMessage(message) {
  const hint = FIELD_MESSAGE_HINTS.find(({ pattern }) => pattern.test(message));
  return hint?.field || '';
}

/**
 * Разбирает ответ API в ошибки полей и общее сообщение формы.
 * @returns {{ fieldErrors: Record<string, string>, form?: string }}
 */
export function parseAuthFormError(err, fallback = 'Произошла ошибка') {
  const data = err?.response?.data;
  if (!data) {
    return { fieldErrors: {}, form: err?.message === 'Network Error' ? 'Нет связи с сервером' : fallback };
  }

  const fieldErrors = {};

  if (Array.isArray(data.details)) {
    for (const detail of data.details) {
      const field = fieldFromDetailPath(detail.path) || fieldFromMessage(detail.message);
      if (field) {
        fieldErrors[field] = detail.message;
      }
    }
  }

  const message = data.message || fallback;
  const hintedField = fieldFromMessage(message);
  if (hintedField && !fieldErrors[hintedField]) {
    fieldErrors[hintedField] = message;
  }

  const form = Object.keys(fieldErrors).length === 0 ? message : undefined;
  return { fieldErrors, form };
}
