const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatUpload, validateUploadedFile } = require('../middleware/chatUpload');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { consultationSchemas } = require('../validation/schemas');

module.exports = function(consultationController) {
  router.post('/api/consultations', authMiddleware, validate(consultationSchemas.create), asyncHandler((...args) => consultationController.create(...args)));
  router.get('/api/consultations/:id', authMiddleware, validate(consultationSchemas.idParam), asyncHandler((...args) => consultationController.getById(...args)));
  router.get('/api/consultations/patient/:patientId', authMiddleware, asyncHandler((...args) => consultationController.getByPatientId(...args)));
  router.get('/api/chats', authMiddleware, asyncHandler((...args) => consultationController.getChats(...args)));
  router.get('/api/chats/:id/messages', authMiddleware, validate(consultationSchemas.idParam), asyncHandler((...args) => consultationController.getMessages(...args)));
  router.post('/api/chats/:id/messages', authMiddleware, validate(consultationSchemas.sendMessage), asyncHandler((...args) => consultationController.sendMessage(...args)));
  router.post('/api/chats/:id/attachments', authMiddleware, validate(consultationSchemas.idParam), chatUpload.single('file'), validateUploadedFile, asyncHandler((...args) => consultationController.uploadAttachment(...args)));

  return router;
};
