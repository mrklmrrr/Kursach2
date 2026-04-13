const { Server } = require('socket.io');

let io = null;

function setupSocket(server, consultationModel) {
  if (io) return io;

  io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
  });

  io.on('connection', (socket) => {
    console.log('✅ Новый клиент подключился');

    socket.on('join-chat', (chatId) => {
      socket.join(`chat-${chatId}`);
      console.log(`Клиент присоединился к комнате chat-${chatId}`);

      const consultation = consultationModel.findById(chatId);
      if (consultation && consultation.messages) {
        socket.emit('chat-history', consultation.messages);
      } else {
        socket.emit('chat-history', []);
      }
    });

    socket.on('send-message', (data) => {
      const { chatId, message, sender, timestamp } = data;
      consultationModel.addMessage(chatId, { message, sender, timestamp });
      io.to(`chat-${chatId}`).emit('new-message', { message, sender, timestamp, chatId });
    });

    socket.on('disconnect', () => console.log('❌ Клиент отключился'));
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { setupSocket, getIO };
