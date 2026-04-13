class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  async processPayment(req, res) {
    const { consultationId, cardNumber, expiry, cvc } = req.body;

    try {
      const result = await this.paymentService.processPayment(consultationId, { cardNumber, expiry, cvc });
      res.json(result);
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = PaymentController;
