const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(authController) {
  // Регистрация (телефон + пароль)
  router.post('/api/auth/register', (req, res) => authController.register(req, res));

  // Единый вход: телефон + пароль (пациент / врач)
  router.post('/api/auth/login', (req, res) => authController.login(req, res));

  // Профиль
  router.get('/api/auth/me', authMiddleware, (req, res) => authController.getMe(req, res));
  router.put('/api/auth/user', authMiddleware, (req, res) => authController.updateUser(req, res));
  router.post('/api/auth/change-password', authMiddleware, (req, res) => authController.changePassword(req, res));

  return router;
};
