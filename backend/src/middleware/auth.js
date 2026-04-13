const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Нет токена' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.id;

    // Загружаем роль пользователя из БД
    const user = await User.findById(decoded.id);
    if (user) {
      req.userRole = user.role;
    }

    next();
  } catch {
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

module.exports = authMiddleware;
