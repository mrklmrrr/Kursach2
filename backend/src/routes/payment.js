const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');

// Middleware для проверки авторизации
const authenticate = (req, res, next) => {
  // ...existing auth middleware...
  next();
};

// Получить статус оплаты записи
router.get('/appointment/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) return res.status(404).json({ success: false, message: 'Запись не найдена' });
    
    // Получаем последний платеж для этой записи
    const payment = await Payment.findOne({ appointmentId: req.params.id });
    
    res.json({
      success: true,
      data: {
        paid: !!payment,
        status: payment?.status || 'no_payment',
        amount: payment?.amount || 0,
        paymentMethod: payment?.paymentMethod || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Обработка платежа
router.post('/appointment/:id/pay', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) return res.status(404).json({ success: false, message: 'Запись не найдена' });
    
    // Проверка на наличие оплаты
    const existingPayment = await Payment.findOne({ appointmentId: req.params.id });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Для этой записи уже создана запись об оплате' 
      });
    }
    
    // Создание платежа
    const payment = new Payment({
      appointmentId: req.params.id,
      patientId: req.body.patientId || appointment.patientId,
      amount: parseFloat(req.body.amount) || 0,
      status: 'completed',
      paymentMethod: req.body.paymentMethod || 'card'
    });
    
    await payment.save();
    
    // Обновляем статус записи на confirmed после оплаты
    appointment.status = 'confirmed';
    await appointment.save();
    
    res.json({ 
      success: true, 
      message: 'Оплата прошла успешно', 
      data: { paid: true, amount: payment.amount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Отмена оплаты (для администратора/врача при отмене приема)
router.delete('/appointment/:id/cancel-payment', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) return res.status(404).json({ success: false, message: 'Запись не найдена' });
    
    // Удаляем запись об оплате
    await Payment.deleteOne({ appointmentId: req.params.id });
    
    // Возвращаем статус записи в scheduled
    appointment.status = 'scheduled';
    await appointment.save();
    
    res.json({ success: true, message: 'Оплата отменена' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;