const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(platformController) {
  const router = express.Router();
  router.get('/api/platform/plans', asyncHandler((...args) => platformController.getPlans(...args)));
  return router;
};
