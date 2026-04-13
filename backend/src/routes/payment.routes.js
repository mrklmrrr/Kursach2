const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(paymentService) {
  router.post('/api/payments', authMiddleware, (req, res) => {
    const { consultationId, cardNumber, expiry, cvc } = req.body;

    try {
      const result = paymentService.processPayment(consultationId, { cardNumber, expiry, cvc });
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  return router;
};
