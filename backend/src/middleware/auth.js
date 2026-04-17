const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(ApiError.unauthorized('Нет токена'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Неверный токен'));
  }
};

module.exports = authMiddleware;
