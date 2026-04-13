export function getInitials(name) {
  if (!name) return 'А';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount, currency = 'BYN') {
  return `${amount} ${currency}`;
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }
  return `${mins} мин`;
}
