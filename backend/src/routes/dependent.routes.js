const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(dependentService) {
  router.get('/api/dependents', authMiddleware, (req, res) => {
    const dependents = dependentService.getByUserId(req.userId);
    res.json(dependents);
  });

  router.post('/api/dependents', authMiddleware, (req, res) => {
    const dependent = dependentService.create(req.userId, req.body);
    res.json(dependent);
  });

  return router;
};
