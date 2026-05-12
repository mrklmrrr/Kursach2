const { Consultation } = require('../models');
const { User } = require('../models');
const { consultationStatus } = require('../constants');
const { findById: dbFindById, resolveId } = require('../utils/dbHelpers');

class ConsultationRepository {
  async create(data) {
    const normalizedType = String(data?.type || 'video').toLowerCase();
    const initialStatus = normalizedType === 'chat'
      ? consultationStatus.ACTIVE
      : consultationStatus.PENDING;

    const consultation = new Consultation({
      ...data,
      type: normalizedType,
      status: initialStatus
    });
    const saved = await consultation.save();
    return saved.toObject();
  }

  async findById(id) {
    const consultation = await dbFindById(Consultation, id);
    return consultation ? consultation.toObject() : null;
  }

  async findByAppointmentId(appointmentId) {
    if (!appointmentId) return null;
    const consultation = await Consultation.findOne({ appointmentId }).lean();
    return consultation || null;
  }

  async findByPatientId(patientId) {
    // Ищем консультации пациента по legacyId (number) и при необходимости по строковому значению.
    // Это нужно для совместимости со старыми и новыми данными.
    const resolved = resolveId(patientId);
    if (!resolved) return [];

    const patientIds = new Set();

    if (resolved.byLegacyId !== null && resolved.byLegacyId !== undefined) {
      patientIds.add(resolved.byLegacyId);
      patientIds.add(String(resolved.byLegacyId));
    }

    if (resolved.byObjectId) {
      try {
        const user = await User.findById(resolved.byObjectId).select('legacyId');
        if (user && user.legacyId !== null && user.legacyId !== undefined) {
          patientIds.add(user.legacyId);
          patientIds.add(String(user.legacyId));
        }
      } catch {
        // Игнорируем и продолжаем с уже собранными id
      }
    }

    if (patientIds.size === 0) return [];

    const consultations = await Consultation.find({
      patientId: { $in: Array.from(patientIds) }
    }).sort({ createdAt: -1 });
    return consultations.map(c => c.toObject());
  }

  async findByDoctorId(doctorId) {
    // Поле consultation.doctorId хранится как ObjectId.
    // Ищем только по валидным ObjectId, чтобы избежать CastError.
    const resolved = resolveId(doctorId);
    if (!resolved) return [];

    const doctorIds = new Set();
    if (resolved.byObjectId) doctorIds.add(String(resolved.byObjectId));

    // Если пришёл legacyId, найдём пользователя и добавим его _id
    if (resolved.byLegacyId) {
      try {
        const userByLegacy = await User.findOne({ legacyId: resolved.byLegacyId }).select('_id');
        if (userByLegacy && userByLegacy._id) {
          doctorIds.add(String(userByLegacy._id));
        }
      } catch {
        // Игнорируем и продолжаем с тем, что уже нашли
      }
    }

    // Дополнительно: если пришёл _id, можно найти пользователя и проверить связку с legacy
    if (resolved.byObjectId) {
      try {
        const user = await User.findById(resolved.byObjectId).select('_id');
        if (user && user._id) {
          doctorIds.add(String(user._id));
        }
      } catch {
        // Игнорируем
      }
    }

    if (doctorIds.size === 0) return [];

    const consultations = await Consultation.find({
      doctorId: { $in: Array.from(doctorIds) }
    }).sort({ createdAt: -1 });
    return consultations.map(c => c.toObject());
  }

  async findChatsForUser(userId, userRole) {
    if (userRole === 'doctor') {
      const [doctorChats, participantChats] = await Promise.all([
        this.findByDoctorId(userId),
        this.findByPatientId(userId)
      ]);
      const deduped = new Map();
      [...doctorChats, ...participantChats].forEach((chat) => {
        deduped.set(String(chat._id), chat);
      });
      return Array.from(deduped.values()).sort((a, b) => {
        const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bTs - aTs;
      });
    }
    return this.findByPatientId(userId);
  }

  async getMessages(consultationId) {
    const consultation = await Consultation.findById(consultationId).select('messages');
    return consultation ? (consultation.messages || []).map((m) => m.toObject()) : null;
  }

  async addMessage(consultationId, messageData, unreadReceiver = null) {
    const update = { $push: { messages: messageData } };
    if (unreadReceiver === 'doctor' || unreadReceiver === 'patient') {
      update.$inc = { [`unreadCounts.${unreadReceiver}`]: 1 };
    }
    const consultation = await Consultation.findByIdAndUpdate(consultationId, update, { returnDocument: 'after' });
    if (!consultation) return null;
    const lastMessage = consultation.messages?.[consultation.messages.length - 1];
    return lastMessage ? lastMessage.toObject() : null;
  }

  async resetUnreadForViewer(consultationId, viewerSide) {
    if (viewerSide !== 'doctor' && viewerSide !== 'patient') return null;
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { $set: { [`unreadCounts.${viewerSide}`]: 0 } },
      { returnDocument: 'after' }
    );
    return consultation ? consultation.toObject() : null;
  }

  async updateStatus(consultationId, status) {
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { status },
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
    );
    return consultation ? consultation.toObject() : null;
  }

  async countAll() {
    return Consultation.countDocuments();
  }

  async countByStatus(status) {
    return Consultation.countDocuments({ status });
  }

  async updateVideoRoom(consultationId, videoRoomData) {
    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { $set: videoRoomData },
      { returnDocument: 'after' }
    );
    return consultation ? consultation.toObject() : null;
  }

  async syncDoctorSnapshot(doctorId, snapshot) {
    const resolved = resolveId(doctorId);
    if (!resolved?.byObjectId) return 0;

    const update = {};
    if (typeof snapshot?.doctorName === 'string' && snapshot.doctorName.trim()) {
      update.doctorName = snapshot.doctorName.trim();
    }
    if (typeof snapshot?.specialty === 'string' && snapshot.specialty.trim()) {
      update.specialty = snapshot.specialty.trim();
    }
    if (Object.keys(update).length === 0) return 0;

    const result = await Consultation.updateMany(
      { doctorId: resolved.byObjectId },
      { $set: update }
    );
    return result?.modifiedCount || 0;
  }
}

module.exports = ConsultationRepository;
