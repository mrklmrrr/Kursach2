const { User } = require('../models');
const { roles } = require('../constants');
const { findById, updateById, deleteById } = require('../utils/dbHelpers');
const { resolveAvatarUrl } = require('../utils/userSerializer');

const DOCTOR_FILTER = { role: roles.DOCTOR };

class DoctorRepository {
  async findAll() {
    const doctors = await User.find(DOCTOR_FILTER)
      .select('firstName lastName specialty price rating isOnline avatarUrl')
      .sort({ rating: -1 })
      .lean();
    return doctors.map((d) => this._format(d));
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
    return this.updateDoctor(id, { isOnline });
  }

  async updatePrice(id, price) {
    return this.updateDoctor(id, { price });
  }

  _format(doc) {
    const id = doc._id?.toString ? doc._id.toString() : doc._id;
    return {
      ...doc,
      id,
      name: `${doc.firstName} ${doc.lastName}`,
      avatarUrl: resolveAvatarUrl(doc.avatarUrl || doc.avatar || '')
    };
  }
}

module.exports = DoctorRepository;
