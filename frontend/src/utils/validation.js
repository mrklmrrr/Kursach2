const PHONE_REGEX = /^\+375\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validate = {
  phone(value) {
    if (!value) return 'Введите номер телефона';
    if (!PHONE_REGEX.test(value.replace(/[\s()-]/g, ''))) {
      return 'Формат: +375XXXXXXXXX';
    }
    return '';
  },

  password(value) {
    if (!value) return 'Введите пароль';
    if (value.length < 6) return 'Минимум 6 символов';
    return '';
  },

  email(value) {
    if (!value) return 'Введите email';
    if (!EMAIL_REGEX.test(value)) return 'Неверный формат email';
    return '';
  },

  name(value, label = 'Имя') {
    if (!value.trim()) return `Введите ${label.toLowerCase()}`;
    if (value.trim().length < 2) return `${label} — минимум 2 символа`;
    return '';
  },

  birthDate(value) {
    if (!value) return 'Выберите дату рождения';
    const age = Math.floor((Date.now() - new Date(value)) / 31557600000);
    if (age < 14) return 'Минимальный возраст — 14 лет';
    if (age > 120) return 'Проверьте дату рождения';
    return '';
  },

  gender(value) {
    if (!value) return 'Выберите пол';
    return '';
  },

  confirmPassword(value, password) {
    if (!value) return 'Повторите пароль';
    if (value !== password) return 'Пароли не совпадают';
    return '';
  }
};

/** Запустить валидацию всех полей */
export function validateFields(rules, values) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const error = typeof rule === 'function' ? rule(values) : rule;
    if (error) errors[field] = error;
  }
  return errors;
}
