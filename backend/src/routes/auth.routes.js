const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AuthService = require('../services/auth.service');

module.exports = function(userModel) {
  const authService = new AuthService(userModel);

  router.post('/api/auth/register', async (req, res) => {
    try {
      const result = await authService.register(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  router.post('/api/auth/login', (req, res) => {
    try {
      const result = authService.login(req.body.phone);
      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  });

  router.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
      const user = await authService.getMe(req.userId);
      res.json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  });

  router.put('/api/auth/user', authMiddleware, (req, res) => {
    try {
      const user = authService.updateUser(req.userId, req.body);
      res.json(user);
    } catch (err) {
      res.status(404).json({ message: err.message });
    }
  });

  return router;
};
