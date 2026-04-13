const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(consultationController) {
  router.post('/api/consultations', authMiddleware, (req, res) => consultationController.create(req, res));
  router.get('/api/consultations/:id', authMiddleware, (req, res) => consultationController.getById(req, res));
  router.get('/api/consultations/patient/:patientId', authMiddleware, (req, res) => consultationController.getByPatientId(req, res));

  return router;
};
