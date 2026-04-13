const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isDoctor } = require('../middleware/roleAuth');

module.exports = function(doctorPanelController) {
  // Все маршруты защищены: auth + isDoctor
  router.get('/api/doctor/profile', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.getProfile(req, res));
  router.put('/api/doctor/profile', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.updateProfile(req, res));
  router.patch('/api/doctor/online', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.toggleOnline(req, res));

  // Консультации
  router.get('/api/doctor/consultations', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.getConsultations(req, res));
  router.get('/api/doctor/consultations/pending', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.getPendingConsultations(req, res));
  router.get('/api/doctor/consultations/upcoming', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.getUpcomingConsultations(req, res));

  // Управление заявками
  router.patch('/api/doctor/consultations/:id/accept', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.acceptConsultation(req, res));
  router.patch('/api/doctor/consultations/:id/reject', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.rejectConsultation(req, res));
  router.patch('/api/doctor/consultations/:id/complete', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.completeConsultation(req, res));

  // Пациенты
  router.get('/api/doctor/patients', authMiddleware, isDoctor,
    (req, res) => doctorPanelController.getPatients(req, res));

  return router;
};
