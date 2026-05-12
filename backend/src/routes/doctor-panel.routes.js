const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isDoctor } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(doctorPanelController) {
  // Все маршруты защищены: auth + isDoctor
  router.get('/api/doctor/profile', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.getProfile(...args)));
  router.put('/api/doctor/profile', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.updateProfile(...args)));
  router.patch('/api/doctor/online', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.toggleOnline(...args)));

  // Консультации
  router.get('/api/doctor/consultations', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.getConsultations(...args)));
  router.get('/api/doctor/consultations/upcoming', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.getUpcomingConsultations(...args)));

  router.patch('/api/doctor/consultations/:id/complete', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.completeConsultation(...args)));

  // Пациенты
  router.get('/api/doctor/patients', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.getPatients(...args)));
  router.get('/api/doctor/patients/:patientId/dependents', authMiddleware, isDoctor,
    asyncHandler((...args) => doctorPanelController.getPatientDependents(...args)));

  return router;
};
