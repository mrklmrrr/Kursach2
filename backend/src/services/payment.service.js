const { consultationStatus } = require('../constants');

class PaymentService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async processPayment(consultationId, patientId, cardData) {
    const { cardNumber, expiry, cvc } = cardData;

    const ApiError = require('../utils/ApiError');
    if (!cardNumber || !expiry || !cvc) {
      throw ApiError.badRequest('Заполните все поля карты');
    }

    // Валидация формата
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      throw ApiError.badRequest('Неверный номер карты');
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw ApiError.badRequest('Неверный формат срока (ММ/ГГ)');
    }

    if (!/^\d{3,4}$/.test(cvc)) {
      throw ApiError.badRequest('Неверный CVC');
    }

    const consultation = await this.consultationRepository.findById(consultationId);
    if (!consultation) {
      const ApiError = require('../utils/ApiError');
      throw ApiError.notFound('Консультация не найдена');
    }

    // Проверка: только пациент этой консультации может оплатить
    if (String(consultation.patientId) !== String(patientId)) {
      const ApiError = require('../utils/ApiError');
      throw ApiError.forbidden('Вы не можете оплатить чужую консультацию');
    }

    if (consultation.status === consultationStatus.PAID) {
      const ApiError = require('../utils/ApiError');
      throw ApiError.badRequest('Консультация уже оплачена');
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
