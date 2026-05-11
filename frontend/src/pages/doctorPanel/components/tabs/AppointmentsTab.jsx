import { useEffect, useMemo, useState } from 'react';
import { DAY_MAP, CONSULTATION_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../../constants/labels";
import { EmptyState } from '../../../../components/ui';
import { parseHistoryDate } from '@utils/date';

const formatDateTime = (date, time) => {
  if (!date && !time) return '—';
  if (date && time && /^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    const [yyyy, mm, dd] = String(date).split('-');
    return `${dd}.${mm}.${yyyy} ${time}`;
  }
  const parsed = parseHistoryDate(`${date || ''}${time ? ` ${time}` : ''}`) || parseHistoryDate(date);
  if (!parsed) return `${date || '—'}${time ? ` ${time}` : ''}`;
  const dd = String(parsed.getDate()).padStart(2, '0');
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const yyyy = parsed.getFullYear();
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};

const getAppointmentTimestamp = (item) => {
  if (!item) return Number.NaN;
  if (item.date && item.time) {
    const normalizedTime = String(item.time).slice(0, 5);
    const candidate = new Date(`${item.date}T${normalizedTime}`).getTime();
    if (Number.isFinite(candidate)) return candidate;
    const withSeconds = new Date(`${item.date}T${normalizedTime}:00`).getTime();
    if (Number.isFinite(withSeconds)) return withSeconds;
    const parsedCombined = parseHistoryDate(`${item.date} ${normalizedTime}`);
    if (parsedCombined) return parsedCombined.getTime();
  }
  if (item.datetime) {
    const dt = new Date(item.datetime).getTime();
    if (Number.isFinite(dt)) return dt;
  }
  if (item.date) {
    const parsed = parseHistoryDate(item.date);
    if (parsed) return parsed.getTime();
  }
  return Number.NaN;
};

export default function AppointmentsTab({
  appointmentForm,
  patients,
  workingHours,
  workingDays,
  appointments,
  onFormChange,
  onAssign,
  onSaveWorkingHours,
  onToggleDay,
  onSetWorkingHours,
  onCancelAppointment,
  onOpenCommentModal
}) {
  const [notification, setNotification] = useState(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const INITIAL_UPCOMING_LIMIT = 5;
  const INITIAL_HISTORY_LIMIT = 8;

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .map((item) => {
        const timestamp = getAppointmentTimestamp(item);
        return { ...item, __sortTime: timestamp };
      })
      .filter((item) => Number.isFinite(item.__sortTime) && item.__sortTime >= now.getTime())
      .sort((a, b) => a.__sortTime - b.__sortTime);
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    const now = new Date();
    return (appointments || [])
      .map((item) => {
        const timestamp = getAppointmentTimestamp(item);
        return { ...item, __sortTime: timestamp };
      })
      .filter((item) => Number.isFinite(item.__sortTime) && item.__sortTime < now.getTime())
      .sort((a, b) => b.__sortTime - a.__sortTime);
  }, [appointments]);

  const visibleAppointments = showAllUpcoming
    ? upcomingAppointments
    : upcomingAppointments.slice(0, INITIAL_UPCOMING_LIMIT);
  const hiddenUpcomingCount = Math.max(0, upcomingAppointments.length - INITIAL_UPCOMING_LIMIT);
  const hasPastAppointments = pastAppointments.length > 0;
  const visibleHistoryAppointments = showAllHistory
    ? pastAppointments
    : pastAppointments.slice(0, INITIAL_HISTORY_LIMIT);
  const hiddenHistoryCount = Math.max(0, pastAppointments.length - INITIAL_HISTORY_LIMIT);

  useEffect(() => {
    if (upcomingAppointments.length <= INITIAL_UPCOMING_LIMIT && showAllUpcoming) {
      setShowAllUpcoming(false);
    }
  }, [upcomingAppointments.length, showAllUpcoming]);

  useEffect(() => {
    if (pastAppointments.length <= INITIAL_HISTORY_LIMIT && showAllHistory) {
      setShowAllHistory(false);
    }
  }, [pastAppointments.length, showAllHistory]);

  const handleSaveWorkingHours = async () => {
    const result = await onSaveWorkingHours();
    setNotification(result);
    if (result.success) {
      setTimeout(() => setNotification(null), 3000);
    }
  };
  return (
    <div className="appointments-section">
      {/* Форма назначения */}
      <section className="section-card">
        <h3>Назначить запись</h3>
        <form onSubmit={onAssign} className="appointment-form">
          <div className="form-group">
            <label>Пациент</label>
            <select name="patientId" value={appointmentForm.patientId} onChange={onFormChange} required>
              <option value="">Выберите пациента</option>
              {patients.map((p) => (
                <option key={String(p.id || p._id)} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Дата и время</label>
            <input type="datetime-local" name="datetime" value={appointmentForm.datetime} onChange={onFormChange} required />
          </div>
          <div className="form-group">
            <label>Тип консультации</label>
            <select name="consultationType" value={appointmentForm.consultationType} onChange={onFormChange}>
              <option value="online">Онлайн</option>
              <option value="offline">Офлайн</option>
            </select>
          </div>
          <div className="form-group">
            <label>Продолжительность (мин)</label>
            <input type="number" name="duration" value={appointmentForm.duration} onChange={onFormChange} min="15" step="15" />
          </div>
          <button type="submit" className="btn btn-primary btn-medium">Назначить запись</button>
        </form>
      </section>

      {/* Рабочее время */}
      <section className="section-card">
        <h3>Рабочее время</h3>
        <div className="working-hours-form">
          <div className="form-group">
            <label>Начало рабочего дня</label>
            <input
              type="time"
              value={workingHours.start}
              onChange={(e) => onSetWorkingHours({ ...workingHours, start: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Конец рабочего дня</label>
            <input
              type="time"
              value={workingHours.end}
              onChange={(e) => onSetWorkingHours({ ...workingHours, end: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Рабочие дни</label>
            <div className="working-days-grid">
              {DAY_MAP.map(day => (
                <label key={day.value} className={`day-checkbox ${workingDays.includes(day.value) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day.value)}
                    onChange={() => onToggleDay(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <div className="appointments-working-actions">
            <button type="button" className="btn btn-primary btn-medium" onClick={handleSaveWorkingHours}>
              Сохранить рабочее время
            </button>
            {notification && (
              <div
                className={`appointments-inline-notification ${
                  notification.success ? 'appointments-inline-notification--success' : 'appointments-inline-notification--error'
                }`}
                role="status"
              >
                <span className="appointments-inline-notification__icon" aria-hidden="true">
                  {notification.success ? '✓' : '✕'}
                </span>
                {notification.message}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Список записей */}
      <section className="section-card">
        <div className="appointments-list-head">
          <h3>Мои записи</h3>
          <div className="appointments-list-head__actions">
            <span className="appointments-list-head__badge">Следующие</span>
            <button
              type="button"
              className={`appointments-history-toggle ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory((prev) => !prev)}
            >
              {showHistory ? 'Скрыть историю' : 'История записей'}
            </button>
          </div>
        </div>
        {upcomingAppointments.length === 0 ? (
          <EmptyState
            variant="plain"
            icon="calendar_month"
            title="Следующих записей пока нет"
            description={
              hasPastAppointments
                ? 'В списке есть только прошедшие приёмы. Новые будущие записи появятся здесь.'
                : 'Когда появятся будущие приёмы, они отобразятся в этом разделе.'
            }
          />
        ) : (
          <div className="appointments-list">
            <div className="appointments-list-meta">
              <span>
                Показано {visibleAppointments.length} из {upcomingAppointments.length} следующих записей
              </span>
            </div>
            {visibleAppointments.map(a => (
              <div
                key={a._id}
                className="appointment-card"
                onDoubleClick={() => onOpenCommentModal(a)}
              >
                <div className="appointment-info">
                  <h4>{a.patientName}</h4>
                   <p className="appointment-date">{formatDateTime(a.date, a.time)}</p>
                  <p className="appointment-type">
                    {CONSULTATION_TYPE_LABELS[a.consultationType] || '🌐 Онлайн'} • {a.duration} мин
                  </p>
                  <span className={`status-badge ${a.status}`}>
                    {APPOINTMENT_STATUS_LABELS[a.status]}
                  </span>
                  <span className={`status-badge payment-${a.paymentStatus || 'unpaid'}`}>
                    {PAYMENT_STATUS_LABELS[a.paymentStatus || 'unpaid']}
                  </span>
                </div>
                {(a.status === 'scheduled' || a.status === 'confirmed') && (
                  <button className="cancel-btn" onClick={() => onCancelAppointment(a._id)}>
                    Отменить
                  </button>
                )}
              </div>
            ))}
            {upcomingAppointments.length > INITIAL_UPCOMING_LIMIT && (
              <button
                type="button"
                className="appointments-show-more"
                onClick={() => setShowAllUpcoming((prev) => !prev)}
              >
                {showAllUpcoming
                  ? 'Скрыть дополнительные записи'
                  : `Показать ещё (${hiddenUpcomingCount})`}
              </button>
            )}
          </div>
        )}
        {showHistory && (
          <div className="appointments-history">
            <div className="appointments-history__head">
              <h4>Прошедшие записи</h4>
              <span>{pastAppointments.length}</span>
            </div>
            {pastAppointments.length === 0 ? (
              <p className="appointments-history__empty">Прошедших записей пока нет.</p>
            ) : (
              <div className="appointments-list">
                {visibleHistoryAppointments.map((a) => (
                  <div
                    key={`past-${a._id}`}
                    className="appointment-card appointment-card--history"
                    onDoubleClick={() => onOpenCommentModal(a)}
                  >
                    <div className="appointment-info">
                      <h4>{a.patientName}</h4>
                      <p className="appointment-date">{formatDateTime(a.date, a.time)}</p>
                      <p className="appointment-type">
                        {CONSULTATION_TYPE_LABELS[a.consultationType] || '🌐 Онлайн'} • {a.duration} мин
                      </p>
                      <span className={`status-badge ${a.status}`}>
                        {APPOINTMENT_STATUS_LABELS[a.status]}
                      </span>
                      <span className={`status-badge payment-${a.paymentStatus || 'unpaid'}`}>
                        {PAYMENT_STATUS_LABELS[a.paymentStatus || 'unpaid']}
                      </span>
                    </div>
                  </div>
                ))}
                {pastAppointments.length > INITIAL_HISTORY_LIMIT && (
                  <button
                    type="button"
                    className="appointments-show-more appointments-show-more--history"
                    onClick={() => setShowAllHistory((prev) => !prev)}
                  >
                    {showAllHistory
                      ? 'Скрыть историю'
                      : `Показать ещё из истории (${hiddenHistoryCount})`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
