const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/helpers');
const config = require('../config');
const logger = require('../utils/logger');
const { formatUser, normalizeUsername } = require('../utils/userSerializer');
const { roles } = require('../constants');
const ApiError = require('../utils/ApiError');

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
      throw ApiError.badRequest('Некорректные данные для входа');
    }

    let user = await this.userRepository.findByPhone(phone);
    if (!user && /^\S+@\S+\.\S+$/.test(phone)) {
      user = await this.userRepository.findByEmail(phone);
    }
    if (!user) {
      throw ApiError.notFound('Пользователь не найден');
    }

    if (!user.password) {
      throw ApiError.badRequest('Учётная запись не имеет пароля');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Неверный пароль');
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
      throw ApiError.badRequest('Некорректные данные для входа');
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw ApiError.notFound('Пользователь не найден');
    }

    if (user.role !== roles.ADMIN) {
      throw ApiError.forbidden('Доступ только для администраторов');
    }

    if (!user.password) {
      throw ApiError.badRequest('Учётная запись не имеет пароля');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Неверный пароль');
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
      throw ApiError.notFound('Пользователь не найден');
    }
    return this.formatUser(user);
  }

  updateUser(userId, updates) {
    return this.userRepository.updateById(userId, updates);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw ApiError.notFound('Пользователь не найден');
    }

    if (!user.password) {
      throw ApiError.badRequest('Для этой учетной записи пароль не задан');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw ApiError.unauthorized('Текущий пароль неверный');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateById(userId, { password: hashedPassword });
  }

  formatUser(user) {
    return formatUser(user);
  }

  normalizeUsername(raw) {
    return normalizeUsername(raw);
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
      throw ApiError.notFound('Пользователь не найден');
    }
    if (user.role !== roles.PATIENT) {
      throw ApiError.forbidden('Только для аккаунтов пациентов');
    }
    const username = this.normalizeUsername(raw);
    const taken = await this.userRepository.findByUsername(username);
    if (taken && String(taken._id) !== String(userId)) {
      throw ApiError.badRequest('Этот username уже занят');
    }
    const updated = await this.userRepository.updateById(userId, { username });
    if (!updated) throw new ApiError(500, 'Не удалось сохранить');
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
      throw ApiError.badRequest('Нет данных для обновления');
    }
    const user = await this.userRepository.updateById(userId, updates);
    if (!user) throw ApiError.notFound('Пользователь не найден');
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
