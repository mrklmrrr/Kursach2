const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(dependentController) {
  router.get('/api/dependents', authMiddleware, (req, res) => dependentController.getByUserId(req, res));
  router.post('/api/dependents', authMiddleware, (req, res) => dependentController.create(req, res));

  return router;
};
