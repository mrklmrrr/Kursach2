const { User } = require('../models');
const { findById, updateById } = require('../utils/dbHelpers');

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
    const user = await findById(User, id);
    return user ? user.toObject() : null;
  }

  async findByPhone(phone) {
    if (typeof phone !== 'string') return null;
    const user = await User.findOne({ phone });
    return user ? user.toObject() : null;
  }

  async findByEmail(email) {
    if (typeof email !== 'string') return null;
    const user = await User.findOne({ email });
    return user ? user.toObject() : null;
  }

  async findByUsername(username) {
    const u = String(username || '').trim().replace(/^@+/, '').toLowerCase();
    if (!u) return null;
    const user = await User.findOne({ username: u });
    return user ? user.toObject() : null;
  }

  async updateById(id, updates) {
    const user = await updateById(User, id, updates);
    return user ? user.toObject() : null;
  }

  async updateDoctor(id, updates) {
    return this.updateById(id, updates);
  }
}

module.exports = UserRepository;
