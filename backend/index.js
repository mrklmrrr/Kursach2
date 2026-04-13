require('dotenv').config();
const { startApp } = require('./src/app');
const config = require('./src/config');

startApp().then(({ server }) => {
  server.listen(config.port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${config.port}`);
  });
}).catch((err) => {
  console.error('❌ Ошибка запуска сервера:', err.message);
  process.exit(1);
});
