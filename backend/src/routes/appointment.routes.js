const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isDoctor, isPatient } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { appointmentSchemas } = require('../validation/schemas');

module.exports = function(appointmentController) {
  // Пациент: получить свои записи
  router.get('/api/appointments', authMiddleware, isPatient, asyncHandler((...args) => appointmentController.getByPatient(...args)));

  // Пациент: создать запись
  router.post('/api/appointments', authMiddleware, isPatient, validate(appointmentSchemas.create), asyncHandler((...args) => appointmentController.create(...args)));

  // Пациент: отменить запись
  router.patch('/api/appointments/:id/cancel', authMiddleware, isPatient, validate(appointmentSchemas.idParam), asyncHandler((...args) => appointmentController.cancel(...args)));
  router.patch('/api/appointments/:id/pay', authMiddleware, isPatient, validate(appointmentSchemas.idParam), asyncHandler((...args) => appointmentController.pay(...args)));

  // Получить доступные слоты врача
  router.get('/api/appointments/doctor/:doctorId/slots', authMiddleware, validate(appointmentSchemas.slots), asyncHandler((...args) => appointmentController.getAvailableSlots(...args)));

  // Врач: получить свои записи
  router.get('/api/doctor/appointments', authMiddleware, isDoctor, asyncHandler((...args) => appointmentController.getByDoctor(...args)));

  // Врач: назначить запись пациенту
  router.post('/api/doctor/appointments', authMiddleware, isDoctor, validate(appointmentSchemas.assign), asyncHandler((...args) => appointmentController.assignAppointment(...args)));

  // Врач: обновить комментарий к записи
  router.patch('/api/doctor/appointments/:id/comment', authMiddleware, isDoctor, validate(appointmentSchemas.updateComment), asyncHandler((...args) => appointmentController.updateDoctorComment(...args)));

  // Врач: удалить запись
  router.delete('/api/doctor/appointments/:id', authMiddleware, isDoctor, validate(appointmentSchemas.idParam), asyncHandler((...args) => appointmentController.delete(...args)));

  // Врач: рабочее время
  router.get('/api/doctor/working-hours', authMiddleware, isDoctor, asyncHandler((...args) => appointmentController.getWorkingHours(...args)));
  router.put('/api/doctor/working-hours', authMiddleware, isDoctor, asyncHandler((...args) => appointmentController.updateWorkingHours(...args)));

  return router;
};
