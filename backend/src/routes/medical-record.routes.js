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
    asyncHandler((...args) => medicalRecordController.getMyRecord(...args))
  );

  router.get(
    '/api/medical-record/me/laboratory-research',
    authMiddleware,
    isPatient,
    asyncHandler((...args) => medicalRecordController.getMyLaboratoryResults(...args))
  );

  router.get(
    '/api/medical-record/me/lab-insight-config',
    authMiddleware,
    isPatient,
    asyncHandler((...args) => medicalRecordController.getMyLabInsightConfig(...args))
  );

  router.post(
    '/api/medical-record/me/lab-insights',
    authMiddleware,
    isPatient,
    asyncHandler((...args) => medicalRecordController.postPatientLabInsight(...args))
  );

  router.get(
    '/api/medical-record/me/instrumental-research',
    authMiddleware,
    isPatient,
    asyncHandler((...args) => medicalRecordController.getMyInstrumentalResults(...args))
  );

  router.get(
    '/api/medical-record/patient/:patientId',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.getPatientRecord(...args))
  );

  router.patch(
    '/api/medical-record/patient/:patientId/sections/:sectionKey',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.updatePatientSection(...args))
  );

  router.post(
    '/api/medical-record/patient/:patientId/sick-leaves',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.createPatientSickLeave(...args))
  );

  router.patch(
    '/api/medical-record/patient/:patientId/sick-leaves/:sickLeaveId',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.updatePatientSickLeave(...args))
  );

  router.get(
    '/api/medical-record/patient/:patientId/laboratory-research',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.getLaboratoryResults(...args))
  );

  router.get(
    '/api/medical-record/patient/:patientId/instrumental-research',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.getInstrumentalResults(...args))
  );

  router.post(
    '/api/medical-record/patient/:patientId/research-results',
    authMiddleware,
    isDoctor,
    asyncHandler((...args) => medicalRecordController.createResearchResult(...args))
  );

  return router;
};
