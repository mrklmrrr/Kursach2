const config = require('../config');

function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);

  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Внутренняя ошибка сервера' : err.message;
  const payload = { message };
  if (err.details && status < 500) {
    payload.details = err.details;
  }
  if (config.nodeEnv === 'development' && status >= 500) {
    payload.debug = { stack: err.stack };
  }
  res.status(status).json(payload);
}

module.exports = errorHandler;
