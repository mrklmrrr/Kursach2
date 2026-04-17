const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(appointmentController) {
  // Пациент: получить свои записи
  router.get('/api/appointments', authMiddleware, (req, res) => appointmentController.getByPatient(req, res));

  // Пациент: создать запись
  router.post('/api/appointments', authMiddleware, (req, res) => appointmentController.create(req, res));

  // Пациент: отменить запись
  router.patch('/api/appointments/:id/cancel', authMiddleware, (req, res) => appointmentController.cancel(req, res));

  // Получить доступные слоты врача
  router.get('/api/appointments/doctor/:doctorId/slots', authMiddleware, (req, res) => appointmentController.getAvailableSlots(req, res));

  // Врач: получить свои записи
  router.get('/api/doctor/appointments', authMiddleware, (req, res) => appointmentController.getByDoctor(req, res));

  // Врач: назначить запись пациенту
  router.post('/api/doctor/appointments', authMiddleware, (req, res) => appointmentController.assignAppointment(req, res));

  // Врач: обновить комментарий к записи
  router.patch('/api/doctor/appointments/:id/comment', authMiddleware, (req, res) => appointmentController.updateDoctorComment(req, res));

  // Врач: удалить запись
  router.delete('/api/doctor/appointments/:id', authMiddleware, (req, res) => appointmentController.delete(req, res));

  // Врач: рабочее время
  router.get('/api/doctor/working-hours', authMiddleware, (req, res) => appointmentController.getWorkingHours(req, res));
  router.put('/api/doctor/working-hours', authMiddleware, (req, res) => appointmentController.updateWorkingHours(req, res));

  return router;
};
