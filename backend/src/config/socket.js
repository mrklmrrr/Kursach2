const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./index');
const { User } = require('../models');

let io = null;

function setupSocket(server, consultationRepository) {
  if (io) return io;

  io = new Server(server, {
    cors: { origin: config.frontendUrl, methods: ['GET', 'POST'] }
  });

  // Аутентификация socket подключений
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Нет токена'));

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Неверный токен'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Новый клиент подключился (userId: ${socket.userId})`);

    socket.on('join-chat', async (chatId) => {
      try {
        const consultation = await consultationRepository.findById(chatId);
        if (!consultation) {
          socket.emit('chat-error', { message: 'Консультация не найдена' });
          return;
        }

        const isDoctor = String(consultation.doctorId) === String(socket.userId);
        let isPatient = String(consultation.patientId) === String(socket.userId);
        if (!isPatient) {
          const currentUser = await User.findById(socket.userId).select('legacyId');
          if (currentUser && currentUser.legacyId !== null && currentUser.legacyId !== undefined) {
            isPatient = String(consultation.patientId) === String(currentUser.legacyId);
          }
        }
        if (!isPatient && !isDoctor && socket.userRole !== 'admin') {
          socket.emit('chat-error', { message: 'Нет доступа к этому чату' });
          return;
        }

        socket.join(`chat-${chatId}`);
        console.log(`Клиент присоединился к комнате chat-${chatId}`);
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

        const isDoctor = String(consultation.doctorId) === String(socket.userId);
        let isPatient = String(consultation.patientId) === String(socket.userId);
        if (!isPatient) {
          const currentUser = await User.findById(socket.userId).select('legacyId');
          if (currentUser && currentUser.legacyId !== null && currentUser.legacyId !== undefined) {
            isPatient = String(consultation.patientId) === String(currentUser.legacyId);
          }
        }
        if (!isPatient && !isDoctor && socket.userRole !== 'admin') {
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

    socket.on('disconnect', () => console.log(`❌ Клиент отключился (userId: ${socket.userId})`));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
