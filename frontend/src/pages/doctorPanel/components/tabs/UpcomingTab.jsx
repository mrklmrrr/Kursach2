import { forwardRef, useMemo } from 'react';
import { offset } from '@floating-ui/react';
import DatePicker from 'react-datepicker';
import { format, isValid } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../../../../components/ui/DateInput/DateInput.css';
import { CONSULTATION_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../../constants/labels';
import { EmptyState } from '../../../../components/ui';

const parseScheduleDate = (ymd) => {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const scheduleDatePopperModifiers = [
  offset({ crossAxis: -16 }),
];

const ScheduleCalendarButton = forwardRef(function ScheduleCalendarButton(
  { onClick, onKeyDown },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className="schedule-day-btn schedule-day-btn--calendar"
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label="Выбрать дату в календаре"
      title="Выбрать дату"
    >
      <span className="material-icons" aria-hidden="true">calendar_today</span>
    </button>
  );
});

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
  const isViewingToday = selectedDate === todayYmd;
  const headline = formatScheduleHeadline(selectedDate);
  const count = schedule.length;
  /** После фильтра «только предстоящие» первый в списке — ближайший на выбранный день. */
  const nearestIndex = isViewingToday && count > 0 ? 0 : -1;
  const selectedPickerDate = useMemo(() => parseScheduleDate(selectedDate), [selectedDate]);

  const handleScheduleDateChange = (date) => {
    if (!date || !isValid(date)) return;
    onSelectDate(format(date, 'yyyy-MM-dd'));
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
          <DatePicker
            selected={selectedPickerDate}
            onChange={handleScheduleDateChange}
            customInput={<ScheduleCalendarButton />}
            locale={ru}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={10}
            calendarClassName="date-input-calendar"
            popperClassName="schedule-date-popper"
            popperPlacement="bottom-end"
            popperModifiers={scheduleDatePopperModifiers}
            showPopperArrow={false}
            shouldCloseOnSelect
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
