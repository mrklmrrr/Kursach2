const express = require('express');
const authMiddleware = require('../middleware/auth');
const { isDoctor, isPatient } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(prescriptionController) {
  const router = express.Router();
  router.get('/api/prescriptions', authMiddleware, isPatient,
    asyncHandler((req, res) => prescriptionController.listForPatient(req, res)));
  router.post('/api/doctor/prescriptions', authMiddleware, isDoctor,
    asyncHandler((req, res) => prescriptionController.createByDoctor(req, res)));
  return router;
};
