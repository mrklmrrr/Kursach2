const { Consultation } = require('../models');
const { consultationStatus } = require('../constants');

class ConsultationRepository {
  async create(data) {
    const consultation = new Consultation({
      ...data,
      status: consultationStatus.PENDING
    });
    const saved = await consultation.save();
    return saved.toObject();
  }

  async findById(id) {
    const consultation = await Consultation.findById(id);
    return consultation ? consultation.toObject() : null;
  }

  async findByPatientId(patientId) {
    const consultations = await Consultation.find({ patientId }).sort({ createdAt: -1 });
    return consultations.map(c => c.toObject());
  }

  async addMessage(consultationId, messageData) {
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { $push: { messages: messageData } },
      { new: true }
    );
    return consultation ? consultation.toObject() : null;
  }

  async updateStatus(consultationId, status) {
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { status },
      { new: true }
    );
    return consultation ? consultation.toObject() : null;
  }

  async markAsPaid(consultationId) {
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      {
        status: consultationStatus.PAID,
        paymentId: Date.now(),
        paidAt: new Date().toISOString()
      },
      { new: true }
    );
    return consultation ? consultation.toObject() : null;
  }

  async findByDoctorId(doctorId) {
    // doctorId из JWT — это ObjectId строка, но в консультации может быть legacyId или ObjectId
    const consultations = await Consultation.find({ doctorId }).sort({ createdAt: -1 });
    if (consultations.length > 0) return consultations.map(c => c.toObject());

    // Пробуем найти по legacyId врача
    const { User } = require('../models');
    try {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        const user = await User.findById(doctorId);
        if (user && user.legacyId) {
          const byLegacy = await Consultation.find({ doctorId: user.legacyId }).sort({ createdAt: -1 });
          return byLegacy.map(c => c.toObject());
        }
      }
    } catch {
      // Игнорируем
    }

    return [];
  }

  async countAll() {
    return Consultation.countDocuments();
  }

  async countByStatus(status) {
    return Consultation.countDocuments({ status });
  }
}

module.exports = ConsultationRepository;
