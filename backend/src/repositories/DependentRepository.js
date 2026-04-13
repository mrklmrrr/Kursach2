const { Dependent } = require('../models');
const { User } = require('../models');

class DependentRepository {
  async create(userId, data) {
    // Получаем legacyId пользователя
    let legacyUserId = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId);
        if (user) legacyUserId = user.legacyId;
      }
    } catch {
      // Игнорируем
    }

    const dependent = new Dependent({ userId: legacyUserId || userId, ...data });
    const saved = await dependent.save();
    return saved.toObject();
  }

  async findByUserId(userId) {
    // Сначала пробуем по legacyId
    let legacyUserId = null;
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId);
        if (user) legacyUserId = user.legacyId;
      }
    } catch {
      // Игнорируем
    }

    const searchId = legacyUserId || userId;
    const dependents = await Dependent.find({ userId: searchId }).sort({ createdAt: -1 });
    return dependents.map(d => d.toObject());
  }
}

module.exports = DependentRepository;
