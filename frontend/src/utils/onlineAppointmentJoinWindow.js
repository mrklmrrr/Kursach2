/** За сколько до начала онлайн-приёма доступно подключение к видеокомнате */
export const ONLINE_PRESTART_MS = 10 * 60 * 1000;

/** Сколько после начала приёма запись ещё показывается и можно подключиться (запас после старта) */
export const ONLINE_POSTSTART_GRACE_MS = 5 * 60 * 1000;

export function parseAppointmentStartMs(dateStr, timeStr) {
  if (!dateStr || !timeStr) return NaN;
  const normalizedTime = String(timeStr).length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${normalizedTime}`).getTime();
}

export function getOnlineAppointmentDurationMs(durationMinutes) {
  return (Number(durationMinutes) || 30) * 60 * 1000;
}

/** Пациент / врач могут войти в видеокомнату: за 10 мин до начала и до конца слота + 5 мин */
export function isWithinOnlineJoinWindow(nowMs, startMs, durationMinutes = 30) {
  if (Number.isNaN(startMs)) return false;
  const durationMs = getOnlineAppointmentDurationMs(durationMinutes);
  const delta = startMs - nowMs;
  return delta <= ONLINE_PRESTART_MS && delta >= -(durationMs + ONLINE_POSTSTART_GRACE_MS);
}

/** Запись остаётся в «ближайших» после фактического начала: до конца длительности + 5 мин */
export function isOnlineAppointmentVisibleInUpcoming(nowMs, startMs, durationMinutes = 30) {
  if (Number.isNaN(startMs)) return false;
  const durationMs = getOnlineAppointmentDurationMs(durationMinutes);
  return nowMs < startMs + durationMs + ONLINE_POSTSTART_GRACE_MS;
}
