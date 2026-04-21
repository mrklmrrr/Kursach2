const { Dependent, User } = require('../models');

class DependentRepository {
  async create(userId, data) {
    const legacyUserId = await this._resolveUserId(userId);
    const dependent = new Dependent({ userId: legacyUserId || userId, ...data });
    const saved = await dependent.save();
    return saved.toObject();
  }

  async findByUserId(userId) {
    const legacyUserId = await this._resolveUserId(userId);
    const searchId = legacyUserId || userId;
    const dependents = await Dependent.find({ userId: searchId }).sort({ createdAt: -1 });
    return dependents.map(d => d.toObject());
  }

  async findByOwnerAndLinkedUserId(ownerUserId, linkedUserId) {
    const legacyUserId = await this._resolveUserId(ownerUserId);
    const searchId = legacyUserId || ownerUserId;
    const doc = await Dependent.findOne({ userId: searchId, linkedUserId });
    return doc ? doc.toObject() : null;
  }

  /** Конвертирует ObjectId пользователя в legacyId */
  async _resolveUserId(userId) {
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(userId)) {
        const user = await User.findById(userId);
        if (user) return user.legacyId;
      }
    } catch {
      // Игнорируем
    }
    return null;
  }
}

module.exports = DependentRepository;
