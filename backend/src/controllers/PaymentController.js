class PaymentController {
  constructor(paymentService) {
    this.paymentService = paymentService;
  }

  async processPayment(req, res) {
    const { consultationId, cardNumber, expiry, cvc } = req.body;

    const result = await this.paymentService.processPayment(
      consultationId,
      req.userId,
      { cardNumber, expiry, cvc }
    );
    res.json(result);
  }
}

module.exports = PaymentController;
