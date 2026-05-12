const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const bearerFromQuery = require('../middleware/bearerFromQuery');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(mediaController) {
  router.get('/api/media/avatar/:userId', asyncHandler((...args) => mediaController.getAvatar(...args)));
  router.get('/api/media/chat/:fileId', bearerFromQuery, authMiddleware, asyncHandler((...args) => mediaController.getChatFile(...args)));
  return router;
};
