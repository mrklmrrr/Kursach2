require('dotenv').config();
const { app, server } = require('./src/app');

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
