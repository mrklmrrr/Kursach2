const { consultationStatus } = require('../constants');

class PaymentService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async processPayment(consultationId, patientId, cardData) {
    const { cardNumber, expiry, cvc } = cardData;

    if (!cardNumber || !expiry || !cvc) {
      throw new Error('Заполните все поля карты');
    }

    // Валидация формата
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      throw new Error('Неверный номер карты');
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw new Error('Неверный формат срока (ММ/ГГ)');
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      throw new Error('Неверный CVC');
    }

    const consultation = await this.consultationRepository.findById(consultationId);
    if (!consultation) {
      throw new Error('Консультация не найдена');
    }

    // Проверка: только пациент этой консультации может оплатить
    if (String(consultation.patientId) !== String(patientId)) {
      throw new Error('Вы не можете оплатить чужую консультацию');
    }

    if (consultation.status === consultationStatus.PAID) {
      throw new Error('Консультация уже оплачена');
    }

    await this.consultationRepository.markAsPaid(consultationId);

    return {
      success: true,
      paymentId: Date.now() + Math.floor(Math.random() * 1000),
      consultationId
    };
  }
}

module.exports = PaymentService;
