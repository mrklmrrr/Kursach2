const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');

module.exports = function(authController) {
  // Регистрация (телефон + пароль)
  router.post('/api/auth/register', validate(authSchemas.register), asyncHandler((req, res) => authController.register(req, res)));

  // Единый вход: телефон + пароль (пациент / врач)
  router.post('/api/auth/login', validate(authSchemas.login), asyncHandler((req, res) => authController.login(req, res)));

  // Профиль
  router.get('/api/auth/me', authMiddleware, asyncHandler((req, res) => authController.getMe(req, res)));
  router.put('/api/auth/user', authMiddleware, asyncHandler((req, res) => authController.updateUser(req, res)));
  router.post('/api/auth/change-password', authMiddleware, validate(authSchemas.changePassword), asyncHandler((req, res) => authController.changePassword(req, res)));

  return router;
};
