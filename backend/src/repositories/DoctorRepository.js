const { User } = require('../models');
const { roles } = require('../constants');
const { findById, updateById, deleteById } = require('../utils/dbHelpers');

const DOCTOR_FILTER = { role: roles.DOCTOR };

class DoctorRepository {
  async findAll() {
    const doctors = await User.find(DOCTOR_FILTER).sort({ rating: -1 });
    return doctors.map(d => this._format(d.toObject()));
  }

  async findById(id) {
    const doctor = await findById(User, id, DOCTOR_FILTER);
    return doctor ? this._format(doctor.toObject()) : null;
  }

  async createDoctor(data) {
    const counter = await User.countDocuments();
    const doctor = new User({
      ...data,
      role: roles.DOCTOR,
      legacyId: counter + 1
    });
    const saved = await doctor.save();
    return this._format(saved.toObject());
  }

  async updateDoctor(id, updates) {
    const doctor = await updateById(User, id, updates, DOCTOR_FILTER);
    return doctor ? this._format(doctor.toObject()) : null;
  }

  async deleteDoctor(id) {
    const doctor = await deleteById(User, id, DOCTOR_FILTER);
    return doctor ? this._format(doctor.toObject()) : null;
  }

  async toggleOnline(id, isOnline) {
    return this.updateById(id, { isOnline });
  }

  async updatePrice(id, price) {
    return this.updateById(id, { price });
  }

  _format(doc) {
    return {
      ...doc,
      id: doc._id,
      name: `${doc.firstName} ${doc.lastName}`
    };
  }
}

module.exports = DoctorRepository;
