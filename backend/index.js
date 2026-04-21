require('dotenv').config();

try {
  const { isLabAiConfigured } = require('./src/services/lab-insight.service');
  if (isLabAiConfigured()) {
    console.log('lab-insight: OPENAI_API_KEY задан — пояснения к анализам для пациентов через ИИ включены');
  }
} catch {
  /* ignore */
}

const { startApp } = require('./src/app');
const config = require('./src/config');

startApp().then(({ server }) => {
  server.listen(config.port, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${config.port}`);
    const { startReminderWorker } = require('./src/workers/reminderWorker');
    startReminderWorker();
  });
}).catch((err) => {
  console.error('❌ Ошибка запуска сервера:', err.message);
  process.exit(1);
});
