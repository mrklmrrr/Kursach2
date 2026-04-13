const { consultationStatus } = require('../constants');

class PaymentService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async processPayment(consultationId, cardData) {
    const { cardNumber, expiry, cvc } = cardData;

    if (!cardNumber || !expiry || !cvc) {
      throw new Error('Заполните все поля карты');
    }

    const consultation = await this.consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new Error('Консультация не найдена');
    }

    await this.consultationRepository.markAsPaid(consultationId);

    return {
      success: true,
      paymentId: Date.now(),
      consultationId
    };
  }
}

module.exports = PaymentService;
