const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/auth');
const { isDoctor, isPatient } = require('../middleware/roleAuth');

const router = express.Router();

module.exports = function medicalRecordRoutes(medicalRecordController) {
  router.get(
    '/api/medical-record/me',
    authMiddleware,
    isPatient,
    asyncHandler((req, res) => medicalRecordController.getMyRecord(req, res))
  );

  router.get(
    '/api/medical-record/patient/:patientId',
    authMiddleware,
    isDoctor,
    asyncHandler((req, res) => medicalRecordController.getPatientRecord(req, res))
  );

  router.patch(
    '/api/medical-record/patient/:patientId/sections/:sectionKey',
    authMiddleware,
    isDoctor,
    asyncHandler((req, res) => medicalRecordController.updatePatientSection(req, res))
  );

  router.post(
    '/api/medical-record/patient/:patientId/sick-leaves',
    authMiddleware,
    isDoctor,
    asyncHandler((req, res) => medicalRecordController.createPatientSickLeave(req, res))
  );

  router.patch(
    '/api/medical-record/patient/:patientId/sick-leaves/:sickLeaveId',
    authMiddleware,
    isDoctor,
    asyncHandler((req, res) => medicalRecordController.updatePatientSickLeave(req, res))
  );

  return router;
};
