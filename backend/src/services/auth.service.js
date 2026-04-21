const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/helpers');
const config = require('../config');

function resolveAvatarUrl(stored) {
  if (!stored) return '';
  const s = String(stored);
  if (/^https?:\/\//i.test(s)) return s;
  const base = config.publicApiBase || '';
  return `${base}${s.startsWith('/') ? s : `/${s}`}`;
}
const { roles } = require('../constants');

class AuthService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  /* ---------- Регистрация пациента (с паролем) ---------- */

  async register(userData) {
    const { firstName, lastName, phone, birthDate, gender, password } = userData;
    const age = calculateAge(birthDate);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      firstName,
      lastName,
      phone,
      birthDate,
      gender,
      age,
      password: hashedPassword
    });

    const token = this._createAccessToken(user);

    return {
      token,
      user: this.formatUser(user)
    };
  }

  /* ---------- Единый вход: телефон + пароль (пациент / врач) ---------- */

  async login(phone, password) {
    if (typeof phone !== 'string' || typeof password !== 'string') {
      throw new Error('Некорректные данные для входа');
    }

    const user = await this.userRepository.findByPhone(phone);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (!user.password) {
      throw new Error('Учётная запись не имеет пароля');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Неверный пароль');
    }

    if (user.role === roles.ADMIN) {
      throw new Error('Для администратора используйте /admin');
    }

    const token = this._createAccessToken(user);

    return {
      token,
      user: this.formatUser(user)
    };
  }

  /* ---------- Вход админа (email + пароль) ---------- */

  async loginAdmin(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Некорректные данные для входа');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.role !== roles.ADMIN) {
      throw new Error('Доступ только для администраторов');
    }

    if (!user.password) {
      throw new Error('Учётная запись не имеет пароля');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Неверный пароль');
    }

    const token = this._createAccessToken(user);

    return {
      token,
      user: this.formatUser(user)
    };
  }

  async getMe(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    return this.formatUser(user);
  }

  updateUser(userId, updates) {
    return this.userRepository.updateById(userId, updates);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (!user.password) {
      throw new Error('Для этой учетной записи пароль не задан');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Текущий пароль неверный');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateById(userId, { password: hashedPassword });
  }

  formatUser(user) {
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

  normalizeUsername(raw) {
    const s = String(raw || '').trim().replace(/^@+/g, '').toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(s)) {
      throw new Error('Username: 3–24 символа, только латиница, цифры и _');
    }
    return s;
  }

  async checkUsernameAvailability(raw) {
    let username;
    try {
      username = this.normalizeUsername(raw);
    } catch (e) {
      return { ok: false, available: false, reason: 'format', message: e.message };
    }
    const existing = await this.userRepository.findByUsername(username);
    return { ok: true, available: !existing, username };
  }

  async setUsername(userId, raw) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    if (user.role !== roles.PATIENT) {
      throw new Error('Только для аккаунтов пациентов');
    }
    const username = this.normalizeUsername(raw);
    const taken = await this.userRepository.findByUsername(username);
    if (taken && String(taken._id) !== String(userId)) {
      throw new Error('Этот username уже занят');
    }
    const updated = await this.userRepository.updateById(userId, { username });
    if (!updated) throw new Error('Не удалось сохранить');
    return this.formatUser(updated);
  }

  async updateReminderPreferences(userId, { reminderEmail, reminderTelegram, telegramUsername, telegramChatId }) {
    const updates = {};
    if (typeof reminderEmail === 'boolean') updates.reminderEmail = reminderEmail;
    if (typeof reminderTelegram === 'boolean') updates.reminderTelegram = reminderTelegram;
    if (typeof telegramUsername === 'string') updates.telegramUsername = telegramUsername.trim().replace(/^@/, '');
    if (typeof telegramChatId === 'string') {
      updates.telegramChatId = telegramChatId.replace(/\s/g, '');
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('Нет данных для обновления');
    }
    const user = await this.userRepository.updateById(userId, updates);
    if (!user) throw new Error('Пользователь не найден');
    return this.formatUser(user);
  }

  _createAccessToken(user) {
    return jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      }
    );
  }
}

module.exports = AuthService;
