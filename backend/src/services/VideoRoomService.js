const { consultationStatus } = require('../constants');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

class VideoRoomService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async createRoom(consultationId, userId, userRole) {
    const consultation = await this.consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new ApiError(404, 'Consultation not found');
    }
    
    // Check access: must be doctor or patient of this consultation
    const isDoctor = String(consultation.doctorId) === String(userId);
    const isPatient = String(consultation.patientId) === String(userId);
    
    if (!isDoctor && !isPatient) {
      throw new ApiError(403, 'Access denied: you are not part of this consultation');
    }
    
    // Allow creating video room for pending, waiting, or active consultations
    const allowedStatuses = ['pending', 'waiting', 'active'];
    if (!allowedStatuses.includes(consultation.status)) {
      throw new ApiError(400, `Video room can only be created for ${allowedStatuses.join('/')} consultations. Current status: ${consultation.status}`);
    }
    
    // Don't create if video room is already active
    if (consultation.videoRoom?.status === 'active') {
      throw new ApiError(400, 'Video room already active');
    }

    // Generate roomId = consultation._id for simplicity
    const roomId = consultation._id.toString();
    const now = new Date();

    // Prepare update data
    const updateData = {
      'videoRoom.roomId': roomId,
      'videoRoom.status': 'waiting',
      'videoRoom.startedAt': now
    };
    
    // Only update consultation status if it's pending (first time)
    if (consultation.status === 'pending') {
      updateData.status = 'waiting';
    }

    const updated = await this.consultationRepository.updateVideoRoom(consultationId, updateData);

    logger.info(`Video room created: ${roomId} for consultation ${consultationId} by ${userRole}`);
    return updated.videoRoom;
  }

  async joinRoom(roomId, userId, role) {
    const consultation = await this.consultationRepository.findById(roomId);
    if (!consultation) {
      throw new ApiError(404, 'Room not found');
    }
    const videoRoom = consultation.videoRoom;
    if (!videoRoom || videoRoom.status !== 'waiting') {
      throw new ApiError(400, 'Room not available for joining');
    }

    const participant = {
      userId,
      role,
      joinedAt: new Date(),
      leftAt: null
    };

    // Check access: doctor or patient of this consultation
    if (role === 'doctor' && String(consultation.doctorId) !== String(userId)) {
      throw new ApiError(403, 'Access denied');
    }
    if (role === 'patient' && String(consultation.patientId) !== String(userId)) {
      throw new ApiError(403, 'Access denied');
    }

    const updated = await this.consultationRepository.updateVideoRoom(roomId, {
      'videoRoom.participants': [...consultation.videoRoom.participants, participant],
      'videoRoom.status': 'active',
      status: 'active'
    });

    logger.info(`${role} joined room: ${roomId}`);
    return updated.videoRoom;
  }

  async leaveRoom(roomId, userId) {
    const consultation = await this.consultationRepository.findById(roomId);
    if (!consultation?.videoRoom) return;

    const participantIdx = consultation.videoRoom.participants.findIndex(
      p => String(p.userId) === String(userId) && !p.leftAt
    );
    if (participantIdx === -1) return;

    const now = new Date();
    const updatedParticipants = [...consultation.videoRoom.participants];
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
    const duration = Math.round((now - consultation.videoRoom.startedAt) / 1000);

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

