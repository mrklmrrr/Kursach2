const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./index');
const { User } = require('../models');
const logger = require('../utils/logger');
const { hasConsultationAccess } = require('../utils/chatAccess');

let io = null;

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
        });

        io.to(`chat-${chatId}`).emit('new-message', savedMessage);
      } catch {
        socket.emit('chat-error', { message: 'Ошибка отправки сообщения' });
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

        // Role-based access
        if (socket.userRole !== 'doctor' && socket.userRole !== 'patient') {
          socket.emit('video-error', { message: 'Invalid role' });
          return;
        }

        // Doctor or patient check
        if (socket.userRole === 'doctor' && String(consultation.doctorId) !== String(socket.userId)) {
          socket.emit('video-error', { message: 'Access denied' });
          return;
        }
        if (socket.userRole === 'patient' && String(consultation.patientId) !== String(socket.userId)) {
          socket.emit('video-error', { message: 'Access denied' });
          return;
        }

        socket.join(`video-${roomId}`);
        socket.emit('room-joined', { 
          roomId, 
          status: videoRoom.status, 
          participants: videoRoom.participants || [],
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        io.to(`video-${roomId}`).emit('participant-joined', { userId: socket.userId, role: socket.userRole });
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

    socket.on('leave-video-room', (roomId) => {
      socket.leave(`video-${roomId}`);
      io.to(`video-${roomId}`).emit('participant-left', { userId: socket.userId });
      logger.debug('Client left video room', { roomId, userId: socket.userId });
    });

    socket.on('disconnect', () => logger.info('Socket client disconnected'));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
