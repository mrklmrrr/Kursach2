const EmergencyRequest = require('../models/EmergencyRequest');

class EmergencyRequestRepository {
  async expireStaleOpen() {
    const now = new Date();
    await EmergencyRequest.updateMany(
      { status: 'open', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } }
    );
  }

  async findOpenByPatientUserId(patientUserId) {
    await this.expireStaleOpen();
    return EmergencyRequest.findOne({
      patientUserId,
      status: 'open',
      expiresAt: { $gt: new Date() }
    }).lean();
  }

  async create(data) {
    const doc = new EmergencyRequest(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  async findOpenForDoctors() {
    await this.expireStaleOpen();
    return EmergencyRequest.find({
      status: 'open',
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  async acceptIfOpen(id, doctorUserId) {
    await this.expireStaleOpen();
    return EmergencyRequest.findOneAndUpdate(
      {
        _id: id,
        status: 'open',
        expiresAt: { $gt: new Date() }
      },
      { $set: { status: 'accepted', acceptedByDoctorId: doctorUserId } },
      { new: true }
    ).lean();
  }

  async setConsultationId(requestId, consultationId) {
    const updated = await EmergencyRequest.findByIdAndUpdate(
      requestId,
      { $set: { consultationId } },
      { new: true }
    ).lean();
    return updated;
  }

  async cancelOpenForPatient(patientUserId) {
    await this.expireStaleOpen();
    const result = await EmergencyRequest.updateMany(
      { patientUserId, status: 'open' },
      { $set: { status: 'cancelled' } }
    );
    return result?.modifiedCount ?? 0;
  }

  /** Все открытые заявки пациента (для отмены перед новым вызовом). */
  async findOpenIdsForPatient(patientUserId) {
    await this.expireStaleOpen();
    const rows = await EmergencyRequest.find({
      patientUserId,
      status: 'open',
      expiresAt: { $gt: new Date() }
    })
      .select('_id')
      .lean();
    return (rows || []).map((r) => r._id);
  }

  /**
   * Текущая заявка для пациента: сначала открытая;
   * иначе недавно принятая с consultationId (короткое окно — для опроса, если сокет отстал).
   */
  async findCurrentForPatient(patientUserId) {
    await this.expireStaleOpen();
    const open = await EmergencyRequest.findOne({
      patientUserId,
      status: 'open',
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1 })
      .lean();
    if (open) return open;
    const sinceAccepted = new Date(Date.now() - 3 * 60 * 1000);
    return EmergencyRequest.findOne({
      patientUserId,
      status: 'accepted',
      consultationId: { $exists: true, $nin: [null] },
      updatedAt: { $gte: sinceAccepted }
    })
      .sort({ updatedAt: -1 })
      .lean();
  }
}

module.exports = EmergencyRequestRepository;
