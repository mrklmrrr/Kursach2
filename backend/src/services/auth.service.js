const jwt = require('jsonwebtoken');
const { calculateAge } = require('../utils/helpers');

class AuthService {
  constructor(userModel) {
    this.userModel = userModel;
  }

  async register(userData) {
    const { firstName, lastName, phone, birthDate, gender } = userData;
    const age = calculateAge(birthDate);

    const user = this.userModel.create({
      firstName,
      lastName,
      phone,
      birthDate,
      gender,
      age
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '30d' });

    return {
      token,
      user: this.formatUser(user)
    };
  }

  login(phone) {
    const user = this.userModel.findByPhone(phone);
    if (!user) {
      throw new Error('Неверный телефон');
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secretkey');

    return {
      token,
      user: this.formatUser(user)
    };
  }

  async getMe(userId) {
    const user = this.userModel.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }
    return this.formatUser(user);
  }

  updateUser(userId, updates) {
    const user = this.userModel.findById(userId);
    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (updates.birthDate) {
      user.birthDate = updates.birthDate;
      user.age = calculateAge(updates.birthDate);
    }
    if (updates.gender) {
      user.gender = updates.gender;
    }

    return this.formatUser(user);
  }

  formatUser(user) {
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      birthDate: user.birthDate,
      gender: user.gender,
      age: user.age
    };
  }
}

module.exports = AuthService;
