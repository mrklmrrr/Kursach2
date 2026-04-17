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

    socket.on('disconnect', () => logger.info('Socket client disconnected'));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
