import { useRef } from 'react';
import { CONSULTATION_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../constants/labels';
import { EmptyState } from '../../../../components/ui';

const formatDateTime = (date, time) => {
  const [yyyy, mm, dd] = date.split('-');
  return `${dd}.${mm}.${yyyy} ${time}`;
};

function formatScheduleHeadline(ymd) {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function recordsWord(n) {
  const mod100 = Math.abs(n) % 100;
  const mod10 = mod100 % 10;
  if (mod100 > 10 && mod100 < 20) return 'записей';
  if (mod10 === 1) return 'запись';
  if (mod10 >= 2 && mod10 <= 4) return 'записи';
  return 'записей';
}

export default function UpcomingTab({
  schedule,
  selectedDate,
  onSelectDate,
  todayYmd,
  onSelectPatient
}) {
  const dateInputRef = useRef(null);
  const isViewingToday = selectedDate === todayYmd;
  const headline = formatScheduleHeadline(selectedDate);
  const count = schedule.length;
  /** После фильтра «только предстоящие» первый в списке — ближайший на выбранный день. */
  const nearestIndex = isViewingToday && count > 0 ? 0 : -1;

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') {
      el.showPicker();
    } else {
      el.click();
    }
  };

  const emptyTitle = isViewingToday
    ? 'Нет предстоящих записей на сегодня'
    : 'Нет предстоящих записей на этот день';
  const emptyDescription = isViewingToday
    ? 'Прошедшие приёмы смотрите в истории записей. Здесь только то, что ещё впереди.'
    : 'На выбранную дату все слоты уже прошли или записей не было. История — в разделе записей.';

  return (
    <div className="schedule-day-panel">
      <div className="schedule-day-toolbar">
        <div className="schedule-day-toolbar-text">
          <span className="schedule-day-headline">{headline}</span>
          <span className="schedule-day-count" aria-live="polite">
            {count} {recordsWord(count)}
          </span>
        </div>
        <div className="schedule-day-toolbar-actions">
          {!isViewingToday && (
            <button
              type="button"
              className="schedule-day-btn schedule-day-btn--ghost"
              onClick={() => onSelectDate(todayYmd)}
            >
              Сегодня
            </button>
          )}
          <button
            type="button"
            className="schedule-day-btn schedule-day-btn--calendar"
            onClick={openDatePicker}
            aria-label="Выбрать дату в календаре"
            title="Выбрать дату"
          >
            <span className="material-icons" aria-hidden="true">calendar_today</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            className="schedule-date-input-hidden"
            value={selectedDate}
            onChange={(e) => {
              const v = e.target.value;
              if (v) onSelectDate(v);
            }}
            aria-label="Дата расписания"
          />
        </div>
      </div>

      <div className="consultations-list">
        {schedule.length === 0 ? (
          <EmptyState
            variant="plain"
            icon="event_available"
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          schedule.map((item, index) => (
            <div key={item._id} className="consultation-card upcoming">
              <div className="consultation-info">
                <h3>
                  <button
                    type="button"
                    className="patient-link"
                    onClick={() => onSelectPatient(item.patientId, item.patientName)}
                  >
                    {item.patientName}
                  </button>
                </h3>
                <p className="consult-type">
                  {CONSULTATION_TYPE_LABELS[item.consultationType] || '🌐 Онлайн'}
                </p>
                <p className="consult-date">{formatDateTime(item.date, item.time)}</p>
                {index === nearestIndex && (
                  <span className="status-badge active">Ближайшая консультация</span>
                )}
                <span className={`status-badge payment-${item.paymentStatus || 'unpaid'}`}>
                  {PAYMENT_STATUS_LABELS[item.paymentStatus || 'unpaid']}
                </span>
              </div>
              <div className="consultation-actions">
                <span className={`status-badge ${item.status}`}>
                  {APPOINTMENT_STATUS_LABELS[item.status]}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
