const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(dependentController) {
  router.get('/api/dependents', authMiddleware, (req, res) => dependentController.getByUserId(req, res));
  router.get('/api/dependents/invites', authMiddleware, (req, res) => dependentController.getIncomingInvites(req, res));
  router.post('/api/dependents/invites/:id/accept', authMiddleware, (req, res) => dependentController.acceptInvite(req, res));
  router.post('/api/dependents/invites/:id/reject', authMiddleware, (req, res) => dependentController.rejectInvite(req, res));
  router.post('/api/dependents', authMiddleware, (req, res) => dependentController.create(req, res));

  return router;
};
