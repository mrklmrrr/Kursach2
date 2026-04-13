const config = require('../config');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);

  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Внутренняя ошибка сервера' : err.message;

  res.status(status).json({ message });
}

module.exports = errorHandler;
