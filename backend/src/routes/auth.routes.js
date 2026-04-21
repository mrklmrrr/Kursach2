const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');
const avatarUpload = require('../middleware/avatarUpload');

module.exports = function(authController) {
  router.get('/api/auth/username/check', asyncHandler((req, res) => authController.checkUsername(req, res)));

  // Регистрация (телефон + пароль)
  router.post('/api/auth/register', validate(authSchemas.register), asyncHandler((req, res) => authController.register(req, res)));

  // Единый вход: телефон + пароль (пациент / врач)
  router.post('/api/auth/login', validate(authSchemas.login), asyncHandler((req, res) => authController.login(req, res)));

  // Профиль
  router.get('/api/auth/me', authMiddleware, asyncHandler((req, res) => authController.getMe(req, res)));
  router.patch('/api/auth/username', authMiddleware, asyncHandler((req, res) => authController.setUsername(req, res)));
  router.put('/api/auth/user', authMiddleware, asyncHandler((req, res) => authController.updateUser(req, res)));
  router.patch('/api/auth/reminder-preferences', authMiddleware, asyncHandler((req, res) => authController.updateReminderPreferences(req, res)));
  router.post(
    '/api/auth/avatar',
    authMiddleware,
    (req, res, next) => {
      avatarUpload(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
        }
        next();
      });
    },
    asyncHandler((req, res) => authController.uploadAvatar(req, res))
  );
  router.post('/api/auth/change-password', authMiddleware, validate(authSchemas.changePassword), asyncHandler((req, res) => authController.changePassword(req, res)));

  return router;
};
