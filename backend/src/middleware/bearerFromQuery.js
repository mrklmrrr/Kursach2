/**
 * Для GET, где клиент не может передать заголовок (например <img src>).
 * Подставляет JWT из query в Authorization для следующего middleware.
 */
function bearerFromQuery(req, res, next) {
  if (req.headers.authorization) {
    return next();
  }
  const q = req.query?.access_token;
  if (typeof q === 'string' && q.trim()) {
    req.headers.authorization = `Bearer ${q.trim()}`;
  }
  next();
}

module.exports = bearerFromQuery;
