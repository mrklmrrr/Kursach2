const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isPatient } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(emergencyRequestController) {
  router.post('/api/emergency-requests', authMiddleware, isPatient,
    asyncHandler((...args) => emergencyRequestController.create(...args)));
  router.get('/api/emergency-requests/current', authMiddleware, isPatient,
    asyncHandler((...args) => emergencyRequestController.getCurrent(...args)));
  router.delete('/api/emergency-requests/current', authMiddleware, isPatient,
    asyncHandler((...args) => emergencyRequestController.cancel(...args)));

  return router;
};
