const https = require('https');

/**
 * @param {string} chatId
 * @param {string} text
 * @param {'HTML'|'Markdown'|undefined} parseMode
 */
function sendTelegramMessage(chatId, text, parseMode = 'HTML') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return Promise.resolve(false);
  const payload = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: parseMode
  });
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (ch) => {
          body += ch;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.warn('[telegram]', res.statusCode, body);
            resolve(false);
          }
        });
      }
    );
    req.on('error', (e) => {
      console.warn('[telegram] request', e.message);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

module.exports = { sendTelegramMessage };
