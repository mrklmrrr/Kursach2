export const toDateTime = (item) => {
  const dateTime = new Date(`${item?.date || ''}T${item?.time || ''}:00`);
  if (Number.isNaN(dateTime.getTime())) return Number.MAX_SAFE_INTEGER;
  return dateTime.getTime();
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('ru-RU');
};

export const toDateInputValue = (value) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};
