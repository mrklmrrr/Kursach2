const { Consultation } = require('../models');
const { User } = require('../models');
const { consultationStatus } = require('../constants');
const { findById: dbFindById, resolveId } = require('../utils/dbHelpers');

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
    const consultation = await dbFindById(Consultation, id);
    return consultation ? consultation.toObject() : null;
  }

  async findByPatientId(patientId) {
    // Пробуем как число (legacyId) и как ObjectId
    const numId = parseInt(patientId);
    const query = isNaN(numId) ? { patientId } : { $or: [{ patientId: numId }, { patientId: patientId }] };
    const consultations = await Consultation.find(query).sort({ createdAt: -1 });
    return consultations.map(c => c.toObject());
  }

  async findByDoctorId(doctorId) {
    // Пробуем ObjectId и legacyId врача
    const resolved = resolveId(doctorId);
    if (!resolved) return [];

    const conditions = [];
    if (resolved.byObjectId) conditions.push({ doctorId: resolved.byObjectId });
    if (resolved.byLegacyId) conditions.push({ doctorId: resolved.byLegacyId });

    // Дополнительно: ищем врача по ObjectId, получаем его legacyId
    if (resolved.byObjectId) {
      try {
        const user = await User.findById(resolved.byObjectId);
        if (user && user.legacyId) {
          conditions.push({ doctorId: user.legacyId });
        }
      } catch {
        // Игнорируем
      }
    }

    const consultations = await Consultation.find({ $or: conditions }).sort({ createdAt: -1 });
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

  async countAll() {
    return Consultation.countDocuments();
  }

  async countByStatus(status) {
    return Consultation.countDocuments({ status });
  }
}

module.exports = ConsultationRepository;
