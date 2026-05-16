import { forwardRef, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { format, isValid, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateInput.css';

const parseStoredDate = (value) => {
  if (!value) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    return isValid(parsed) ? parsed : null;
  }

  const dotted = parse(value, 'dd.MM.yyyy', new Date());
  return isValid(dotted) ? dotted : null;
};

const maskDateInput = (rawValue) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('.');
};

const MaskedDateInput = forwardRef(function MaskedDateInput(
  {
    value,
    onClick,
    onChange,
    className,
    placeholder,
    name,
    id,
    required,
    onBlur,
    autoComplete = 'off',
    preventAutofill = false
  },
  ref
) {
  const handleInputChange = (event) => {
    const maskedValue = maskDateInput(event.target.value);
    onChange?.({
      ...event,
      target: { ...event.target, value: maskedValue }
    });
  };

  const handleFocus = (event) => {
    if (preventAutofill) {
      event.target.removeAttribute('readonly');
    }
  };

  return (
    <input
      ref={ref}
      type="text"
      name={name}
      id={id}
      value={value ?? ''}
      onClick={onClick}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={onBlur}
      className={className}
      placeholder={placeholder}
      required={required}
      inputMode="numeric"
      autoComplete={autoComplete}
      readOnly={preventAutofill || undefined}
      data-lpignore="true"
      data-1p-ignore="true"
    />
  );
});

export default function DateInput({
  name,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'дд.мм.гггг',
  id,
  autoComplete = 'off',
  preventAutofill = false
}) {
  const selectedDate = useMemo(() => parseStoredDate(value), [value]);
  const maxDate = new Date();
  const minDate = new Date(1900, 0, 1);
  const inputClassName = `date-input-field ${className}`.trim();

  const handleChange = (date) => {
    if (date && !isValid(date)) return;
    if (date && (date < minDate || date > maxDate)) return;

    const nextValue = date ? format(date, 'yyyy-MM-dd') : '';
    onChange?.({ target: { name, value: nextValue } });
  };

  return (
    <div className="date-input-wrap">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        customInput={
          <MaskedDateInput
            name={name}
            id={id}
            required={required}
            className={inputClassName}
            placeholder={placeholder}
            autoComplete={autoComplete}
            preventAutofill={preventAutofill}
          />
        }
        dateFormat="dd.MM.yyyy"
        locale={ru}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={120}
        minDate={minDate}
        maxDate={maxDate}
        isClearable={!required}
        placeholderText={placeholder}
        calendarClassName="date-input-calendar"
        popperClassName="date-input-popper"
        shouldCloseOnSelect
      />
      <span className="material-icons date-input-icon" aria-hidden="true">
        calendar_month
      </span>
    </div>
  );
}
