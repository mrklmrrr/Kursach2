class PaymentService {
  constructor(consultationModel) {
    this.consultationModel = consultationModel;
  }

  processPayment(consultationId, cardData) {
    const { cardNumber, expiry, cvc } = cardData;

    if (!cardNumber || !expiry || !cvc) {
      throw new Error('Заполните все поля карты');
    }

    const consultation = this.consultationModel.findById(consultationId);
    if (consultation) {
      consultation.status = 'paid';
      consultation.paymentId = Date.now();
      consultation.paidAt = new Date().toISOString();
    }

    return {
      success: true,
      paymentId: Date.now(),
      consultationId
    };
  }
}

module.exports = PaymentService;
