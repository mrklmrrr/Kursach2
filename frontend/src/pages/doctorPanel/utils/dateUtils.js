export const toDateTime = (item) => {
  const dateTime = new Date(`${item?.date || ''}T${item?.time || ''}:00`);
  if (Number.isNaN(dateTime.getTime())) return Number.MAX_SAFE_INTEGER;
  return dateTime.getTime();
};

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
