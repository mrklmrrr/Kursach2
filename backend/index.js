require('dotenv').config();
const logger = require('./src/utils/logger');

try {
  const { isLabAiConfigured } = require('./src/services/lab-insight.service');
  if (isLabAiConfigured()) {
    logger.info('lab-insight: OPENAI_API_KEY задан — пояснения к анализам для пациентов через ИИ включены');
  }
} catch {
  /* ignore */
}

const { startApp } = require('./src/app');
const config = require('./src/config');

startApp().then(({ server }) => {
  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`🚀 Сервер запущен на порту ${config.port}`);
    const { startReminderWorker } = require('./src/workers/reminderWorker');
    startReminderWorker();
  });
}).catch((err) => {
  logger.error('❌ Ошибка запуска сервера:', err.message);
  process.exit(1);
});
