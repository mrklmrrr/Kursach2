const { User } = require('../models');

class UserRepository {
  async create(userData) {
    // Проверка на дубликат
    const existing = await User.findOne({ phone: userData.phone });
    if (existing) {
      throw new Error('Пользователь с таким номером телефона уже существует');
    }

    const counter = await User.countDocuments();
    const user = new User({ ...userData, legacyId: counter + 1 });
    const saved = await user.save();
    return saved.toObject();
  }

  async findById(id) {
    if (!id) return null;

    // Пробуем по ObjectId
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await User.findById(id);
        if (user) return user.toObject();
      }
    } catch {
      // Игнорируем — пробуем legacyId
    }

    // Пробуем по legacyId (число)
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      const user = await User.findOne({ legacyId: numId });
      if (user) return user.toObject();
    }

    return null;
  }

  async findByPhone(phone) {
    const user = await User.findOne({ phone });
    return user ? user.toObject() : null;
  }

  async findByEmail(email) {
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  }

  async updateById(id, updates) {
    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return user ? user.toObject() : null;
  }
}

module.exports = UserRepository;
