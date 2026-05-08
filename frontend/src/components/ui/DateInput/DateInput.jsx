import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { format, isValid, parse, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './DateInput.css';

const toDate = (value) => {
  if (!value) return null;

  try {
    return parseISO(value);
  } catch {
    return null;
  }
};

const isoToDisplay = (value) => {
  const parsed = toDate(value);
  return parsed ? format(parsed, 'dd.MM.yyyy') : '';
};

const maskDateInput = (rawValue) => {
  const digits = rawValue.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('.');
};

export default function DateInput({
  name,
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'дд.мм.гггг'
}) {
  const [inputValue, setInputValue] = useState(isoToDisplay(value));
  const selectedDate = toDate(value);
  const maxDate = new Date();
  const minDate = new Date(1900, 0, 1);

  useEffect(() => {
    setInputValue(isoToDisplay(value));
  }, [value]);

  const handleChange = (date) => {
    const nextValue = date ? format(date, 'yyyy-MM-dd') : '';
    setInputValue(date ? format(date, 'dd.MM.yyyy') : '');
    onChange?.({ target: { name, value: nextValue } });
  };

  const handleRawChange = (event) => {
    const maskedValue = maskDateInput(event.target.value);
    event.target.value = maskedValue;
    setInputValue(maskedValue);

    if (!maskedValue) {
      onChange?.({ target: { name, value: '' } });
      return;
    }

    if (maskedValue.length !== 10) return;

    const parsed = parse(maskedValue, 'dd.MM.yyyy', new Date());
    if (!isValid(parsed)) return;
    if (parsed < minDate || parsed > maxDate) return;

    onChange?.({ target: { name, value: format(parsed, 'yyyy-MM-dd') } });
  };

  const handleBlur = () => {
    if (!inputValue) return;

    if (inputValue.length !== 10) {
      setInputValue(isoToDisplay(value));
    }
  };

  return (
    <div className="date-input-wrap">
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd.MM.yyyy"
        locale={ru}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={120}
        minDate={minDate}
        maxDate={maxDate}
        isClearable={!required}
        required={required}
        name={name}
        placeholderText={placeholder}
        className={`date-input-field ${className}`.trim()}
        calendarClassName="date-input-calendar"
        popperClassName="date-input-popper"
        value={inputValue}
        onChangeRaw={handleRawChange}
        onBlur={handleBlur}
      />
      <span className="material-icons date-input-icon" aria-hidden="true">calendar_month</span>
    </div>
  );
}
