const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isDoctor, isPatient } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { appointmentSchemas } = require('../validation/schemas');

module.exports = function(appointmentController) {
  // Пациент: получить свои записи
  router.get('/api/appointments', authMiddleware, isPatient, asyncHandler((req, res) => appointmentController.getByPatient(req, res)));

  // Пациент: создать запись
  router.post('/api/appointments', authMiddleware, isPatient, validate(appointmentSchemas.create), asyncHandler((req, res) => appointmentController.create(req, res)));

  // Пациент: отменить запись
  router.patch('/api/appointments/:id/cancel', authMiddleware, isPatient, validate(appointmentSchemas.idParam), asyncHandler((req, res) => appointmentController.cancel(req, res)));
  router.patch('/api/appointments/:id/pay', authMiddleware, isPatient, validate(appointmentSchemas.idParam), asyncHandler((req, res) => appointmentController.pay(req, res)));

  // Получить доступные слоты врача
  router.get('/api/appointments/doctor/:doctorId/slots', authMiddleware, validate(appointmentSchemas.slots), asyncHandler((req, res) => appointmentController.getAvailableSlots(req, res)));

  // Врач: получить свои записи
  router.get('/api/doctor/appointments', authMiddleware, isDoctor, asyncHandler((req, res) => appointmentController.getByDoctor(req, res)));

  // Врач: назначить запись пациенту
  router.post('/api/doctor/appointments', authMiddleware, isDoctor, validate(appointmentSchemas.assign), asyncHandler((req, res) => appointmentController.assignAppointment(req, res)));

  // Врач: обновить комментарий к записи
  router.patch('/api/doctor/appointments/:id/comment', authMiddleware, isDoctor, validate(appointmentSchemas.updateComment), asyncHandler((req, res) => appointmentController.updateDoctorComment(req, res)));

  // Врач: удалить запись
  router.delete('/api/doctor/appointments/:id', authMiddleware, isDoctor, validate(appointmentSchemas.idParam), asyncHandler((req, res) => appointmentController.delete(req, res)));

  // Врач: рабочее время
  router.get('/api/doctor/working-hours', authMiddleware, isDoctor, asyncHandler((req, res) => appointmentController.getWorkingHours(req, res)));
  router.put('/api/doctor/working-hours', authMiddleware, isDoctor, asyncHandler((req, res) => appointmentController.updateWorkingHours(req, res)));

  return router;
};
