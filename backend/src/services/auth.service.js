const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { calculateAge } = require('../utils/helpers');
const config = require('../config');
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: this.formatUser(user)
    };
  }

  /* ---------- Единый вход: телефон + пароль (пациент / врач) ---------- */

  async login(phone, password) {
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    return {
      token,
      user: this.formatUser(user)
    };
  }

  /* ---------- Вход админа (email + пароль) ---------- */

  async loginAdmin(email, password) {
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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

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
        specialty: user.specialty,
        price: user.price,
        experience: user.experience,
        description: user.description,
        isOnline: user.isOnline,
        rating: user.rating
      };
    }

    return base;
  }
}

module.exports = AuthService;
