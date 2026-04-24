const config = require('../config');
const { roles } = require('../constants');

function resolveAvatarUrl(stored) {
  if (!stored) return '';
  const s = String(stored);
  if (/^https?:\/\//i.test(s)) return s;
  const base = config.publicApiBase || '';
  return `${base}${s.startsWith('/') ? s : `/${s}`}`;
}

function formatUser(user) {
  const base = {
    id: user._id,
    legacyId: user.legacyId,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    birthDate: user.birthDate,
    gender: user.gender,
    age: user.age
  };

  if (user.role === roles.DOCTOR) {
    return {
      ...base,
      avatarUrl: resolveAvatarUrl(user.avatarUrl),
      specialty: user.specialty,
      price: user.price,
      experience: user.experience,
      description: user.description,
      isOnline: user.isOnline,
      rating: user.rating
    };
  }

  if (user.role === roles.ADMIN) {
    return { ...base, email: user.email, avatarUrl: resolveAvatarUrl(user.avatarUrl) };
  }

  return {
    ...base,
    avatarUrl: resolveAvatarUrl(user.avatarUrl),
    username: user.username || '',
    reminderEmail: user.reminderEmail !== false,
    reminderTelegram: Boolean(user.reminderTelegram),
    telegramUsername: user.telegramUsername || '',
    telegramChatId: user.telegramChatId || '',
    consentPersonalDataAt: user.consentPersonalDataAt || null,
    consentMarketing: Boolean(user.consentMarketing)
  };
}

const ApiError = require('./ApiError');
function normalizeUsername(raw) {
  const s = String(raw || '').trim().replace(/^@+/g, '').toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(s)) {
    throw ApiError.badRequest('Username: 3–24 символа, только латиница, цифры и _');
  }
  return s;
}

module.exports = { resolveAvatarUrl, formatUser, normalizeUsername };