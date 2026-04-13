const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./index');

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
      // Проверка: пользователь имеет доступ к консультации
      const consultation = await consultationRepository.findById(chatId);
      if (!consultation) {
        socket.emit('chat-error', { message: 'Консультация не найдена' });
        return;
      }

      // Пациент или врач этой консультации
      const isPatient = String(consultation.patientId) === String(socket.userId);
      const isDoctor = String(consultation.doctorId) === String(socket.userId);

      if (!isPatient && !isDoctor && socket.userRole !== 'admin') {
        socket.emit('chat-error', { message: 'Нет доступа к этому чату' });
        return;
      }

      socket.join(`chat-${chatId}`);
      console.log(`Клиент присоединился к комнате chat-${chatId}`);

      if (consultation.messages) {
        socket.emit('chat-history', consultation.messages);
      } else {
        socket.emit('chat-history', []);
      }
    });

    socket.on('send-message', async (data) => {
      const { chatId, message, sender, timestamp } = data;
      await consultationRepository.addMessage(chatId, { message, sender, timestamp });
      io.to(`chat-${chatId}`).emit('new-message', { message, sender, timestamp, chatId });
    });

    socket.on('disconnect', () => console.log(`❌ Клиент отключился (userId: ${socket.userId})`));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
