const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./index');
const { User, Consultation } = require('../models');
const { roles } = require('../constants');
const logger = require('../utils/logger');
const { hasConsultationAccess } = require('../utils/chatAccess');
const { isGeneralPractitionerSpecialty } = require('../constants/generalPractitioner');
const { getPresenceForUser } = require('../utils/presence');

/** Комната для push-уведомлений о экстренных заявках (врачи общей практики). */
const EMERGENCY_GP_ROOM = 'emergency-gp';

let io = null;
const userSockets = new Map();
const pendingVideoInvites = new Map();

function registerUserSocket(userId, socketId) {
  const key = String(userId);
  if (!userSockets.has(key)) {
    userSockets.set(key, new Set());
  }
  userSockets.get(key).add(socketId);
}

function unregisterUserSocket(userId, socketId) {
  const key = String(userId);
  const sockets = userSockets.get(key);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSockets.delete(key);
  }
}

function emitToUser(targetUserId, eventName, payload) {
  const sockets = userSockets.get(String(targetUserId));
  if (!sockets || sockets.size === 0 || !io) return false;
  sockets.forEach((socketId) => {
    io.to(socketId).emit(eventName, payload);
  });
  return true;
}

function emitToEmergencyGp(eventName, payload) {
  if (!io) return;
  try {
    io.to(EMERGENCY_GP_ROOM).emit(eventName, payload);
  } catch (err) {
    logger.warn('emitToEmergencyGp failed', { eventName, err: err?.message });
  }
}

function isUserConnected(userId) {
  if (!userId) return false;
  return (userSockets.get(String(userId))?.size || 0) > 0;
}

/** Для пациентов и админов — флаг «в сети» в БД синхронизируется с socket. */
async function updatePresence(userId, isOnline, role) {
  if (!userId) return;
  if (role === roles.DOCTOR) return;

  try {
    await User.updateOne({ _id: userId }, { $set: { isOnline: Boolean(isOnline) } });
  } catch (err) {
    logger.warn('Presence update failed', {
      userId: String(userId),
      isOnline: Boolean(isOnline),
      err: err?.message
    });
  }
}

function emitPresenceChange(userId) {
  if (!io || !userId) return;

  void (async () => {
    try {
      const user = await User.findById(userId).select('role isOnline').lean();
      if (!user) return;

      const payload = {
        userId: String(userId),
        isOnline: getPresenceForUser(user, isUserConnected),
        role: user.role
      };

      io.emit('user-presence', payload);
    } catch (err) {
      logger.warn('emitPresenceChange failed', { userId: String(userId), err: err?.message });
    }
  })();
}

async function resolvePatientSocketUserId(rawPatientId) {
  if (rawPatientId == null) return null;
  const direct = await User.findById(rawPatientId).select('_id').lean();
  if (direct?._id) return direct._id;
  const byLegacy = await User.findOne({ legacyId: rawPatientId }).select('_id').lean();
  return byLegacy?._id || null;
}

function formatVideoCallDurationRu(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s < 60) return `${s} сек`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m < 60) {
    return sec > 0 ? `${m} мин ${sec} сек` : `${m} мин`;
  }
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h} ч ${min} мин` : `${h} ч`;
}

async function finalizeVideoCallForAll({
  roomId,
  actorUserId,
  consultationRepository,
  forceCompleteStatus = false
}) {
  if (!roomId) return;
  const consultation = await consultationRepository.findById(roomId);
  if (!consultation) {
    io?.to(`video-${roomId}`).emit('video-call-ended', {
      roomId,
      endedBy: String(actorUserId || '')
    });
    return;
  }

  const vr = consultation.videoRoom;
  const vrStatus = vr?.status;
  if (vr && (vrStatus === 'waiting' || vrStatus === 'active')) {
    const now = new Date();
    const startMs = vr.startedAt ? new Date(vr.startedAt).getTime() : null;
    const durationSec = startMs ? Math.max(0, Math.round((now.getTime() - startMs) / 1000)) : 0;

    const updatePayload = {
      'videoRoom.status': 'ended',
      'videoRoom.endedAt': now,
      'videoRoom.duration': durationSec
    };
    if (consultation.status === 'active' || forceCompleteStatus) {
      updatePayload.status = 'completed';
    }

    const updatedConsultation = await Consultation.findOneAndUpdate(
      {
        _id: roomId,
        'videoRoom.status': { $in: ['waiting', 'active'] }
      },
      { $set: updatePayload },
      { new: true }
    );

    if (updatedConsultation) {
      const text = `Видеозвонок завершён. Длительность: ${formatVideoCallDurationRu(durationSec)}.`;
      const savedMessage = await consultationRepository.addMessage(roomId, {
        messageType: 'system',
        message: text,
        sender: 'system',
        senderId: null,
        timestamp: now.toISOString()
      });
      if (savedMessage) {
        const chatId = String(roomId);
        io.to(`chat-${chatId}`).emit('new-message', { chatId: String(chatId), message: savedMessage });

        const pushPayload = { chatId, message: savedMessage };
        emitToUser(consultation.doctorId, 'new-message', pushPayload);
        emitToUser(consultation.doctorId, 'chat-updated', pushPayload);

        try {
          if (consultation.patientId != null) {
            const patientUser = await User.findOne({ legacyId: consultation.patientId }).select('_id').lean();
            if (patientUser?._id) {
              emitToUser(patientUser._id, 'new-message', pushPayload);
              emitToUser(patientUser._id, 'chat-updated', pushPayload);
            }
          }
        } catch (emitErr) {
          logger.warn('finalizeVideoCall: patient notify failed', { err: emitErr?.message });
        }
      }
    }
  }

  io.to(`video-${roomId}`).emit('video-call-ended', {
    roomId,
    endedBy: String(actorUserId || '')
  });
}

function setupSocket(server, consultationRepository) {
  if (io) return io;

  io = new Server(server, {
    cors: { origin: config.frontendOrigins, methods: ['GET', 'POST'] }
  });

  // Аутентификация socket подключений
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Нет токена'));

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience
      });
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Неверный токен'));
    }
  });

  io.on('connection', (socket) => {
    logger.info('Socket client connected');
    registerUserSocket(socket.userId, socket.id);
    updatePresence(socket.userId, true, socket.userRole);
    emitPresenceChange(socket.userId);
    const pendingInvite = pendingVideoInvites.get(String(socket.userId));
    if (pendingInvite) {
      socket.emit('video-call-incoming', pendingInvite);
      pendingVideoInvites.delete(String(socket.userId));
    }

    if (String(socket.userRole) === 'doctor') {
      void (async () => {
        try {
          const u = await User.findById(socket.userId).select('role specialty').lean();
          if (!u || u.role !== 'doctor') return;
          if (isGeneralPractitionerSpecialty(u.specialty)) {
            socket.join(EMERGENCY_GP_ROOM);
            logger.debug('Socket joined emergency GP room', { userId: String(socket.userId) });
          }
        } catch (err) {
          logger.warn('emergency GP room join skipped', { err: err?.message });
        }
      })();
    }

    socket.on('join-chat', async (chatId) => {
      try {
        const consultation = await consultationRepository.findById(chatId);
        if (!consultation) {
          socket.emit('chat-error', { message: 'Консультация не найдена' });
          return;
        }

        const canAccess = await hasConsultationAccess(
          consultation,
          socket.userId,
          socket.userRole,
          async (id) => User.findById(id).select('legacyId')
        );
        if (!canAccess) {
          socket.emit('chat-error', { message: 'Нет доступа к этому чату' });
          return;
        }

        socket.join(`chat-${chatId}`);
        const viewerSide = String(consultation.doctorId) === String(socket.userId) ? 'doctor' : 'patient';
        await consultationRepository.resetUnreadForViewer(chatId, viewerSide);
        logger.debug('Client joined chat room', { chatId });
        socket.emit('chat-history', consultation.messages || []);
      } catch {
        socket.emit('chat-error', { message: 'Ошибка подключения к чату' });
      }
    });

    socket.on('send-message', async (data) => {
      try {
        const { chatId, message } = data || {};
        const text = String(message || '').trim();
        if (!chatId || !text) return;

        const consultation = await consultationRepository.findById(chatId);
        if (!consultation) {
          socket.emit('chat-error', { message: 'Чат не найден' });
          return;
        }

        const canAccess = await hasConsultationAccess(
          consultation,
          socket.userId,
          socket.userRole,
          async (id) => User.findById(id).select('legacyId')
        );
        if (!canAccess) {
          socket.emit('chat-error', { message: 'Нет доступа к отправке' });
          return;
        }

        const savedMessage = await consultationRepository.addMessage(chatId, {
          messageType: 'text',
          message: text,
          sender: socket.userRole === 'doctor' ? 'doctor' : 'user',
          senderId: String(socket.userId),
          timestamp: new Date().toISOString()
        }, socket.userRole === 'doctor' ? 'patient' : 'doctor');

        io.to(`chat-${chatId}`).emit('new-message', { chatId: String(chatId), message: savedMessage });
        emitToUser(consultation.doctorId, 'chat-updated', { chatId: String(chatId), message: savedMessage });
        const patientSocketUserId = await resolvePatientSocketUserId(consultation.patientId);
        if (patientSocketUserId) {
          emitToUser(patientSocketUserId, 'chat-updated', { chatId: String(chatId), message: savedMessage });
        }
      } catch {
        socket.emit('chat-error', { message: 'Ошибка отправки сообщения' });
      }
    });

    socket.on('video-call-invite', async ({ chatId } = {}) => {
      try {
        if (!chatId) {
          socket.emit('video-error', { message: 'Некорректный chatId' });
          return;
        }

        const consultation = await consultationRepository.findById(chatId);
        if (!consultation) {
          socket.emit('video-error', { message: 'Консультация не найдена' });
          return;
        }
        const doctorProfile = await User.findById(consultation.doctorId)
          .select('firstName lastName specialty avatarUrl');

        const canAccess = await hasConsultationAccess(
          consultation,
          socket.userId,
          socket.userRole,
          async (id) => User.findById(id).select('legacyId')
        );
        if (!canAccess || socket.userRole !== 'doctor') {
          socket.emit('video-error', { message: 'Только врач может начать звонок' });
          return;
        }

        const currentVideoStatus = consultation.videoRoom?.status;
        if (currentVideoStatus && currentVideoStatus !== 'waiting' && currentVideoStatus !== 'active') {
          socket.emit('video-error', { message: 'Видеокомната недоступна для звонка' });
          return;
        }

        const roomId = String(consultation._id);
        const updateData = {
          'videoRoom.roomId': roomId,
          'videoRoom.status': 'waiting',
          'videoRoom.startedAt': null,
          'videoRoom.endedAt': null,
          'videoRoom.duration': null
        };
        if (consultation.status === 'pending' || consultation.status === 'completed') {
          updateData.status = 'waiting';
        }

        if (!currentVideoStatus || currentVideoStatus === 'created') {
          await consultationRepository.updateVideoRoom(chatId, updateData);
        }

        const patientLegacyId = consultation.patientId != null ? String(consultation.patientId) : '';
        let patientUserId = consultation.patientId;
        if (patientUserId != null) {
          const patientUser = await User.findOne({ legacyId: consultation.patientId }).select('_id');
          if (patientUser?._id) {
            patientUserId = patientUser._id;
          }
        }
        const patientObjectId = patientUserId != null ? String(patientUserId) : '';

        const payload = {
          chatId: String(chatId),
          roomId,
          fromDoctorId: String(socket.userId),
          doctorName: doctorProfile
            ? `${doctorProfile.firstName || ''} ${doctorProfile.lastName || ''}`.trim() || 'Врач'
            : (consultation.doctorName || 'Врач'),
          doctorSpecialty: doctorProfile?.specialty || consultation.specialty || 'Специалист',
          doctorAvatarUrl: doctorProfile?.avatarUrl || ''
        };

        const deliveredToObjectId = patientObjectId ? emitToUser(patientObjectId, 'video-call-incoming', payload) : false;
        const deliveredToLegacyId = patientLegacyId ? emitToUser(patientLegacyId, 'video-call-incoming', payload) : false;
        const delivered = deliveredToObjectId || deliveredToLegacyId;
        if (!delivered) {
          // Fallback: if patient currently opened this chat room, notify through room channel.
          io.to(`chat-${chatId}`).emit('video-call-incoming', payload);
          // If user is temporarily offline, deliver right after next socket reconnect.
          if (patientObjectId) pendingVideoInvites.set(patientObjectId, payload);
          if (patientLegacyId) pendingVideoInvites.set(patientLegacyId, payload);
        }
        logger.info('Video call invite sent', {
          chatId: String(chatId),
          roomId,
          doctorId: String(socket.userId),
          patientUserId: patientObjectId || patientLegacyId || String(patientUserId),
          delivered
        });
        socket.emit('video-call-ringing', { ...payload, delivered });
      } catch (err) {
        logger.error('video-call-invite error', err);
        socket.emit('video-error', { message: 'Не удалось начать звонок' });
      }
    });

    socket.on('video-call-response', async ({ chatId, accepted } = {}) => {
      try {
        if (!chatId || typeof accepted !== 'boolean') return;
        const consultation = await consultationRepository.findById(chatId);
        if (!consultation) return;

        const canAccess = await hasConsultationAccess(
          consultation,
          socket.userId,
          socket.userRole,
          async (id) => User.findById(id).select('legacyId')
        );
        if (!canAccess) return;

        const roomId = String(consultation._id);
        const doctorId = String(consultation.doctorId);
        const patientLegacyId = consultation.patientId != null ? String(consultation.patientId) : '';
        let patientUserId = consultation.patientId;
        if (patientUserId != null) {
          const patientUser = await User.findOne({ legacyId: consultation.patientId }).select('_id');
          if (patientUser?._id) {
            patientUserId = patientUser._id;
          }
        }
        const patientObjectId = patientUserId != null ? String(patientUserId) : '';

        if (!accepted) {
          if (patientObjectId) pendingVideoInvites.delete(patientObjectId);
          if (patientLegacyId) pendingVideoInvites.delete(patientLegacyId);
          await consultationRepository.updateVideoRoom(chatId, {
            'videoRoom.status': 'failed'
          });
          emitToUser(doctorId, 'video-call-rejected', {
            chatId: String(chatId),
            roomId,
            byUserId: String(socket.userId)
          });
          if (patientObjectId) {
            emitToUser(patientObjectId, 'video-call-ended', {
              chatId: String(chatId),
              roomId
            });
          }
          if (patientLegacyId) {
            emitToUser(patientLegacyId, 'video-call-ended', {
              chatId: String(chatId),
              roomId
            });
          }
          return;
        }

        const existingParticipants = Array.isArray(consultation.videoRoom?.participants)
          ? consultation.videoRoom.participants
          : [];
        const now = new Date();
        const withoutLeft = existingParticipants.filter((p) => !p.leftAt);
        const seen = new Set(withoutLeft.map((p) => String(p.userId)));
        const participants = [...withoutLeft];
        if (!seen.has(String(consultation.doctorId))) {
          participants.push({ userId: consultation.doctorId, role: 'doctor', joinedAt: now, leftAt: null });
        }
        if (!seen.has(String(socket.userId))) {
          participants.push({ userId: socket.userId, role: 'patient', joinedAt: now, leftAt: null });
        }

        await consultationRepository.updateVideoRoom(chatId, {
          'videoRoom.status': 'active',
          'videoRoom.startedAt': now,
          'videoRoom.participants': participants,
          status: 'active'
        });

        const acceptedPayload = {
          chatId: String(chatId),
          roomId
        };
        if (patientObjectId) pendingVideoInvites.delete(patientObjectId);
        if (patientLegacyId) pendingVideoInvites.delete(patientLegacyId);
        emitToUser(doctorId, 'video-call-accepted', acceptedPayload);
        if (patientObjectId) emitToUser(patientObjectId, 'video-call-accepted', acceptedPayload);
        if (patientLegacyId) emitToUser(patientLegacyId, 'video-call-accepted', acceptedPayload);
      } catch (err) {
        logger.error('video-call-response error', err);
        socket.emit('video-error', { message: 'Ошибка ответа на звонок' });
      }
    });

    // WebRTC Video Room Signaling
    socket.on('join-video-room', async (roomId) => {
      try {
        const consultation = await consultationRepository.findById(roomId);
        if (!consultation || !consultation.videoRoom) {
          socket.emit('video-error', { message: 'Video room not found' });
          return;
        }

        const videoRoom = consultation.videoRoom;
        if (videoRoom.status !== 'waiting' && videoRoom.status !== 'active') {
          socket.emit('video-error', { message: 'Room not available' });
          return;
        }

        const canAccess = await hasConsultationAccess(
          consultation,
          socket.userId,
          socket.userRole,
          async (userId) => User.findById(userId).select('legacyId')
        );
        if (!canAccess) {
          socket.emit('video-error', { message: 'Access denied' });
          return;
        }

        try {
          const VideoRoomService = require('../services/VideoRoomService');
          const vrs = new VideoRoomService(consultationRepository);
          const joinRole = String(socket.userRole) === 'doctor' ? 'doctor' : 'patient';
          await vrs.joinRoom(String(roomId), socket.userId, joinRole);
        } catch (syncErr) {
          logger.warn('join-video-room: DB participant sync', { roomId, err: syncErr?.message });
        }

        const fresh = await consultationRepository.findById(roomId);
        const vr = fresh?.videoRoom || videoRoom;

        socket.join(`video-${roomId}`);
        socket.emit('room-joined', {
          roomId,
          status: vr.status,
          participants: vr.participants || [],
          startedAt: vr.startedAt || null,
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        socket.to(`video-${roomId}`).emit('participant-joined', { userId: socket.userId, role: socket.userRole });
        logger.debug('Client joined video room', { roomId, userId: socket.userId, role: socket.userRole });
      } catch (err) {
        logger.error('Join video room error:', err);
        socket.emit('video-error', { message: 'Join failed' });
      }
    });

    // WebRTC Signaling Events
    socket.on('webrtc-offer', ({ roomId, offer }) => {
      socket.to(`video-${roomId}`).emit('webrtc-offer', {
        offer,
        from: socket.userId
      });
    });

    socket.on('webrtc-answer', ({ roomId, answer }) => {
      socket.to(`video-${roomId}`).emit('webrtc-answer', {
        answer,
        from: socket.userId
      });
    });

    socket.on('webrtc-ice-candidate', ({ roomId, candidate }) => {
      socket.to(`video-${roomId}`).emit('webrtc-ice-candidate', {
        candidate,
        from: socket.userId
      });
    });

    socket.on('leave-video-room', async (roomId) => {
      socket.leave(`video-${roomId}`);
      logger.debug('Client left video room', { roomId, userId: socket.userId });
      try {
        // Product requirement: if any participant drops, end call for both.
        await finalizeVideoCallForAll({
          roomId,
          actorUserId: socket.userId,
          consultationRepository,
          forceCompleteStatus: true
        });
      } catch (err) {
        logger.error('leave-video-room finalize error', err);
        io.to(`video-${roomId}`).emit('video-call-ended', {
          roomId,
          endedBy: String(socket.userId)
        });
      }
    });

    socket.on('end-video-call', async ({ roomId } = {}) => {
      if (!roomId) return;

      try {
        const consultation = await consultationRepository.findById(roomId);
        if (consultation) {
          const canAccess = await hasConsultationAccess(
            consultation,
            socket.userId,
            socket.userRole,
            async (id) => User.findById(id).select('legacyId')
          );
          if (!canAccess) {
            logger.warn('end-video-call denied', { roomId, userId: socket.userId });
            return;
          }
        }

        await finalizeVideoCallForAll({
          roomId,
          actorUserId: socket.userId,
          consultationRepository
        });
        logger.info('Video call ended for all participants', { roomId, endedBy: socket.userId });
      } catch (err) {
        logger.error('end-video-call error', err);
        io.to(`video-${roomId}`).emit('video-call-ended', {
          roomId,
          endedBy: String(socket.userId)
        });
      }
    });

    socket.on('disconnect', () => {
      unregisterUserSocket(socket.userId, socket.id);
      const hasActiveSockets = (userSockets.get(String(socket.userId))?.size || 0) > 0;
      if (!hasActiveSockets) {
        updatePresence(socket.userId, false, socket.userRole);
        emitPresenceChange(socket.userId);
      }
      logger.info('Socket client disconnected');
    });
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = {
  setupSocket,
  getIO,
  emitToUser,
  emitToEmergencyGp,
  isUserConnected,
  emitPresenceChange
};
