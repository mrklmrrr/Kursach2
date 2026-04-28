/**
 * Утилиты для работы с датами
 * Объединяет функционал из dateUtils.js и profileUtils.js
 */

// Конвертирует дату/время записи в timestamp для сортировки
export const toDateTime = (item) => {
  const dateTime = new Date(`${item?.date || ''}T${item?.time || ''}:00`);
  if (Number.isNaN(dateTime.getTime())) return Number.MAX_SAFE_INTEGER;
  return dateTime.getTime();
};

// Парсит дату из различных форматов
export const parseHistoryDate = (value) => {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  const stringValue = String(value);
  const dotMatch = stringValue.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
  if (dotMatch) {
    const [, dd, mm, yyyy, hh = '00', min = '00'] = dotMatch;
    const parsed = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

// Конвертирует дату в timestamp для сортировки (из профиля)
export const toSortTime = (value) => {
  const parsed = parseHistoryDate(value);
  if (parsed) return parsed.getTime();
  return Number.MAX_SAFE_INTEGER;
};

// Форматирует дату для истории (ДД.ММ.ГГГГ)
export const formatHistoryDate = (value) => {
  const parsed = parseHistoryDate(value);
  if (parsed) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear());
    return `${day}.${month}.${year}`;
  }
  return value ? String(value) : '—';
};

// Форматирует дату и время
export const formatDateTime = (value) => {
  if (!value) return '—';
  
  // Если это строка в формате YYYY-MM-DD, форматируем её
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  // Иначе обрабатываем как Date объект
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('ru-RU');
};

// Форматирует дату для инпута (YYYY-MM-DD)
export const toDateInputValue = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  // Используем локальную дату, а не UTC
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Форматирует дату (для профиля)
export const formatDate = (value) => {
  if (!value) return '—';

  let parsed;
  // Если это строка в формате YYYY-MM-DD, парсим её
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    parsed = new Date(year, month - 1, day);
  } else {
    parsed = new Date(value);
  }

  if (Number.isNaN(parsed.getTime())) return '—';

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());

  return `${day}.${month}.${year}`;
};