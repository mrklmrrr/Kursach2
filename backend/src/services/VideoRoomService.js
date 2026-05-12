const { consultationStatus } = require('../constants');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

class VideoRoomService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async _resolveLegacyId(userId) {
    try {
      const user = await User.findById(userId).select('legacyId');
      return user?.legacyId != null ? String(user.legacyId) : '';
    } catch {
      return '';
    }
  }

  async createRoom(consultationId, userId, userRole) {
    const consultation = await this.consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new ApiError(404, 'Consultation not found');
    }
    
    // Check access: must be doctor or patient of this consultation
    const normalizedUserId = String(userId);
    const normalizedPatientId = String(consultation.patientId || '');
    const userLegacyId = await this._resolveLegacyId(userId);
    const isDoctor = String(consultation.doctorId) === normalizedUserId;
    const isPatient = normalizedPatientId === normalizedUserId || (userLegacyId && normalizedPatientId === userLegacyId);
    
    if (!isDoctor && !isPatient) {
      throw new ApiError(403, 'Access denied: you are not part of this consultation');
    }
    
    // Allow creating video room for pending, waiting, or active consultations
    const allowedStatuses = ['pending', 'waiting', 'active', 'completed'];
    if (!allowedStatuses.includes(consultation.status)) {
      throw new ApiError(400, `Video room can only be created for ${allowedStatuses.join('/')} consultations. Current status: ${consultation.status}`);
    }
    
    // Idempotent behavior: if room is already active/waiting, reuse it
    if (consultation.videoRoom?.status === 'active' || consultation.videoRoom?.status === 'waiting') {
      logger.info(`Video room reused: ${consultation.videoRoom.roomId} for consultation ${consultationId} by ${userRole}`);
      return consultation.videoRoom;
    }

    // Generate roomId = consultation._id for simplicity
    const roomId = consultation._id.toString();
    // Prepare update data
    const updateData = {
      'videoRoom.roomId': roomId,
      'videoRoom.status': 'waiting',
      'videoRoom.startedAt': null,
      'videoRoom.endedAt': null,
      'videoRoom.duration': null,
      'videoRoom.participants': []
    };
    
    // Only update consultation status if it's pending (first time)
    if (consultation.status === 'pending' || consultation.status === 'completed') {
      updateData.status = 'waiting';
    }

    const updated = await this.consultationRepository.updateVideoRoom(consultationId, updateData);

    logger.info(`Video room created: ${roomId} for consultation ${consultationId} by ${userRole}`);
    return updated.videoRoom;
  }

  async joinRoom(roomId, userId, role) {
    const consultation = await this.consultationRepository.findById(roomId);
    if (!consultation?.videoRoom) {
      throw new ApiError(404, 'Room not found');
    }

    const videoRoom = consultation.videoRoom;
    const vs = videoRoom.status;
    if (vs === 'ended' || vs === 'failed') {
      throw new ApiError(400, 'Room not available for joining');
    }

    const normalizedUserId = String(userId);
    const normalizedPatientId = String(consultation.patientId || '');
    const userLegacyId = await this._resolveLegacyId(userId);

    if (role === 'doctor' && String(consultation.doctorId) !== normalizedUserId) {
      throw new ApiError(403, 'Access denied');
    }
    if (role !== 'doctor' && normalizedPatientId !== normalizedUserId && (!userLegacyId || normalizedPatientId !== userLegacyId)) {
      throw new ApiError(403, 'Access denied');
    }

    const allParts = Array.isArray(videoRoom.participants) ? [...videoRoom.participants] : [];
    const withLeft = allParts.filter((p) => p.leftAt);
    const withoutLeft = allParts.filter((p) => !p.leftAt);
    const uid = String(userId);

    if (withoutLeft.some((p) => String(p.userId) === uid)) {
      return videoRoom;
    }

    const normalizedRole = role === 'doctor' ? 'doctor' : 'patient';
    const now = new Date();
    const nextActive = [
      ...withoutLeft,
      { userId, role: normalizedRole, joinedAt: now, leftAt: null }
    ];

    const mergedParticipants = [...withLeft, ...nextActive];

    const update = {
      'videoRoom.participants': mergedParticipants,
      'videoRoom.status': 'active',
      status: 'active'
    };

    if (!videoRoom.startedAt && nextActive.length >= 2) {
      update['videoRoom.startedAt'] = now;
    }

    const updated = await this.consultationRepository.updateVideoRoom(roomId, update);
    return updated.videoRoom;
  }

  async leaveRoom(roomId, userId) {
    const consultation = await this.consultationRepository.findById(roomId);
    if (!consultation?.videoRoom) return;

    const participants = consultation.videoRoom.participants;
    if (!Array.isArray(participants)) return;

    const participantIdx = participants.findIndex(
      p => String(p.userId) === String(userId) && !p.leftAt
    );
    if (participantIdx === -1) return;

    const now = new Date();
    const updatedParticipants = [...participants];
    updatedParticipants[participantIdx].leftAt = now;

    await this.consultationRepository.updateVideoRoom(roomId, {
      'videoRoom.participants': updatedParticipants
    });

    logger.info(`User ${userId} left room: ${roomId}`);
  }

  async endRoom(roomId, doctorId) {
    const consultation = await this.consultationRepository.findById(roomId);
    if (!consultation) {
      throw new ApiError(404, 'Room not found');
    }
    if (String(consultation.doctorId) !== String(doctorId)) {
      throw new ApiError(403, 'Only doctor can end room');
    }

    const now = new Date();
    const startedAt = consultation.videoRoom?.startedAt ? new Date(consultation.videoRoom.startedAt) : null;
    const duration = startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : 0;

    const updated = await this.consultationRepository.updateVideoRoom(roomId, {
      'videoRoom.status': 'ended',
      'videoRoom.endedAt': now,
      'videoRoom.duration': duration,
      status: 'completed'
    });

    logger.info(`Room ended: ${roomId}, duration: ${duration}s`);
    return updated.videoRoom;
  }

  async getRoomInfo(roomId) {
    const consultation = await this.consultationRepository.findById(roomId);
    return consultation?.videoRoom || null;
  }
}

module.exports = VideoRoomService;

