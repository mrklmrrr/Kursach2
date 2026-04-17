const config = require('../config');

function maskMeta(meta = {}) {
  const masked = { ...meta };
  if (masked.userId) masked.userId = '[masked]';
  if (masked.phone) masked.phone = '[masked]';
  if (masked.email) masked.email = '[masked]';
  return masked;
}

function log(level, message, meta = {}) {
  const payload = {
    level,
    message,
    ...maskMeta(meta),
    timestamp: new Date().toISOString()
  };

  if (config.nodeEnv === 'production' && level === 'debug') {
    return;
  }

  console[level === 'error' ? 'error' : 'log'](JSON.stringify(payload));
}

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  debug: (message, meta) => log('debug', message, meta)
};
