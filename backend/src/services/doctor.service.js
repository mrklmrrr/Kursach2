const mongoose = require('mongoose');
const { Appointment, Prescription, ResearchResult } = require('../models');

class DoctorService {
  constructor(doctorRepository, consultationRepository = null) {
    this.doctorRepository = doctorRepository;
    this.consultationRepository = consultationRepository;
  }

  // Публичные методы
  async getAll(filter = {}) {
    return this.doctorRepository.findAll(filter);
  }

  async getAllForAdmin() {
    return this.doctorRepository.findAllForAdmin();
  }

  async getById(id) {
    return this.doctorRepository.findById(id);
  }

  // Методы админки
  async createDoctor(data) {
    return this.doctorRepository.createDoctor(data);
  }

  async updateDoctor(id, updates) {
    const doctor = await this.doctorRepository.updateDoctor(id, updates);
    if (!doctor) return null;

    const doctorId = doctor.id || doctor._id;
    const doctorName = doctor.name || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    const doctorSpecialty = doctor.specialty || '';
    const canSyncById = mongoose.Types.ObjectId.isValid(String(doctorId));

    if (this.consultationRepository) {
      await this.consultationRepository.syncDoctorSnapshot(doctorId, {
        doctorName,
        specialty: doctorSpecialty
      });
    }

    if (canSyncById) {
      await Promise.all([
        Appointment.updateMany(
          { doctorId },
          { $set: { doctorName } }
        ),
        Prescription.updateMany(
          { doctorId },
          { $set: { doctorName, doctorSpecialty } }
        ),
        ResearchResult.updateMany(
          { doctorId },
          { $set: { doctorName } }
        )
      ]);
    }

    return doctor;
  }

  async deleteDoctor(id) {
    return this.doctorRepository.deleteDoctor(id);
  }

  async toggleOnline(id, isOnline) {
    return this.doctorRepository.toggleOnline(id, isOnline);
  }

  async updatePrice(id, price) {
    return this.doctorRepository.updatePrice(id, price);
  }
}

module.exports = DoctorService;
