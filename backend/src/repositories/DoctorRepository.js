const { User } = require('../models');
const { roles } = require('../constants');
const { doctorsList } = require('../data/doctors');

class DoctorRepository {
  /** Список всех врачей */
  async findAll(filter = {}) {
    const query = { role: roles.DOCTOR, ...filter };
    const doctors = await User.find(query).sort({ rating: -1 });

    // Seed только если нет фильтров и коллекция пуста
    if (Object.keys(filter).length === 0 && doctors.length === 0) {
      const counter = await User.countDocuments();
      const docs = await User.insertMany(
        doctorsList.map((d, i) => ({
          legacyId: counter + i + 1,
          role: roles.DOCTOR,
          firstName: d.name.split(' ')[0],
          lastName: d.name.split(' ').slice(1).join(' '),
          specialty: d.specialty,
          rating: d.rating,
          isOnline: d.isOnline,
          price: d.price
        }))
      );
      return docs.map(d => this.formatDoctor(d.toObject()));
    }
    return doctors.map(d => this.formatDoctor(d.toObject()));
  }

  /** Найти врача по ID (ObjectId или legacyId) */
  async findById(id) {
    if (!id || id === 'undefined' || id === 'null') return null;

    // Попробуем найти как ObjectId
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doctor = await User.findOne({ _id: id, role: roles.DOCTOR });
        if (doctor) return this.formatDoctor(doctor.toObject());
      }
    } catch {
      // Игнорируем
    }

    // Попробуем найти по legacyId
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      const doctor = await User.findOne({ legacyId: numId, role: roles.DOCTOR });
      if (doctor) return this.formatDoctor(doctor.toObject());
    }

    return null;
  }

  /** Создать врача (из админки) */
  async createDoctor(data) {
    const counter = await User.countDocuments();
    const doctor = new User({
      ...data,
      role: roles.DOCTOR,
      legacyId: counter + 1
    });
    const saved = await doctor.save();
    return this.formatDoctor(saved.toObject());
  }

  /** Обновить врача (поддержка ObjectId и legacyId) */
  async updateDoctor(id, updates) {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      const doctor = await User.findOneAndUpdate(
        { legacyId: numId, role: roles.DOCTOR },
        updates,
        { new: true, runValidators: true }
      );
      if (doctor) return this.formatDoctor(doctor.toObject());
    }

    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doctor = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (doctor && doctor.role === roles.DOCTOR) return this.formatDoctor(doctor.toObject());
      }
    } catch {
      // Игнорируем
    }

    return null;
  }

  /** Удалить врача */
  async deleteDoctor(id) {
    const numId = parseInt(id);
    if (!isNaN(numId)) {
      const doctor = await User.findOneAndDelete({ legacyId: numId, role: roles.DOCTOR });
      if (doctor) return this.formatDoctor(doctor.toObject());
    }

    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        const doctor = await User.findByIdAndDelete(id);
        if (doctor && doctor.role === roles.DOCTOR) return this.formatDoctor(doctor.toObject());
      }
    } catch {
      // Игнорируем
    }

    return null;
  }

  /** Переключить онлайн-статус */
  async toggleOnline(id, isOnline) {
    const doc = await this.findById(id);
    if (!doc) return null;
    return this.updateById(doc._id, { isOnline });
  }

  /** Обновить цену */
  async updatePrice(id, price) {
    const doc = await this.findById(id);
    if (!doc) return null;
    return this.updateById(doc._id, { price });
  }

  /** Универсальное обновление по _id */
  async updateById(id, updates) {
    const doc = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    return doc ? this.formatDoctor(doc.toObject()) : null;
  }

  /** Форматирование врача для фронтенда */
  formatDoctor(doc) {
    return {
      ...doc,
      id: doc._id || doc.legacyId,
      name: `${doc.firstName} ${doc.lastName}`
    };
  }
}

module.exports = DoctorRepository;
