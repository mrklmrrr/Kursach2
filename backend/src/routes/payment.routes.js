const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(paymentController) {
  router.post('/api/payments', authMiddleware, (req, res) => paymentController.processPayment(req, res));

  return router;
};
