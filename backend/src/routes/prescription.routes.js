const express = require('express');
const authMiddleware = require('../middleware/auth');
const { isDoctor, isPatient } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');

module.exports = function(prescriptionController) {
  const router = express.Router();
  router.get('/api/prescriptions', authMiddleware, isPatient,
    asyncHandler((...args) => prescriptionController.listForPatient(...args)));
  router.get('/api/doctor/prescriptions/:patientId', authMiddleware, isDoctor,
    asyncHandler((...args) => prescriptionController.listForDoctorPatient(...args)));
  router.post('/api/doctor/prescriptions', authMiddleware, isDoctor,
    asyncHandler((...args) => prescriptionController.createByDoctor(...args)));
  router.put('/api/doctor/prescriptions/:id', authMiddleware, isDoctor,
    asyncHandler((...args) => prescriptionController.updateByDoctor(...args)));
  return router;
};
