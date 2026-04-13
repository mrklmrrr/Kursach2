const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
  try {
    const conn = await mongoose.connect(config.mongoUri);

    console.log(`✅ MongoDB подключён: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  }
}

// Обработка отключения
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB отключён');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Ошибка MongoDB соединения:', err);
});

module.exports = connectDB;
