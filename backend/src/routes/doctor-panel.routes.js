const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isDoctor } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(doctorPanelController) {
  // Все маршруты защищены: auth + isDoctor
  router.get('/api/doctor/profile', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.getProfile(req, res)));
  router.put('/api/doctor/profile', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.updateProfile(req, res)));
  router.patch('/api/doctor/online', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.toggleOnline(req, res)));

  // Консультации
  router.get('/api/doctor/consultations', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.getConsultations(req, res)));
  router.get('/api/doctor/consultations/pending', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.getPendingConsultations(req, res)));
  router.get('/api/doctor/consultations/upcoming', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.getUpcomingConsultations(req, res)));

  // Управление заявками
  router.patch('/api/doctor/consultations/:id/accept', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.acceptConsultation(req, res)));
  router.patch('/api/doctor/consultations/:id/reject', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.rejectConsultation(req, res)));
  router.patch('/api/doctor/consultations/:id/complete', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.completeConsultation(req, res)));

  // Пациенты
  router.get('/api/doctor/patients', authMiddleware, isDoctor,
    asyncHandler((req, res) => doctorPanelController.getPatients(req, res)));

  return router;
};
