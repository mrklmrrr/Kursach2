const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');
const avatarUpload = require('../middleware/avatarUpload');

module.exports = function(authController) {
  router.get('/api/auth/username/check', asyncHandler((...args) => authController.checkUsername(...args)));

  // Регистрация (телефон + пароль)
  router.post('/api/auth/register', validate(authSchemas.register), asyncHandler((...args) => authController.register(...args)));

  // Единый вход: телефон + пароль (пациент / врач)
  router.post('/api/auth/login', validate(authSchemas.login), asyncHandler((...args) => authController.login(...args)));

  // Профиль
  router.get('/api/auth/me', authMiddleware, asyncHandler((...args) => authController.getMe(...args)));
  router.patch('/api/auth/username', authMiddleware, asyncHandler((...args) => authController.setUsername(...args)));
  router.put('/api/auth/user', authMiddleware, asyncHandler((...args) => authController.updateUser(...args)));
  router.patch('/api/auth/reminder-preferences', authMiddleware, asyncHandler((...args) => authController.updateReminderPreferences(...args)));
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
    asyncHandler((...args) => authController.uploadAvatar(...args))
  );
  router.post('/api/auth/change-password', authMiddleware, validate(authSchemas.changePassword), asyncHandler((...args) => authController.changePassword(...args)));

  return router;
};
