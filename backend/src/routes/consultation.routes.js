const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatUpload, validateUploadedFile } = require('../middleware/chatUpload');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { consultationSchemas } = require('../validation/schemas');

module.exports = function(consultationController) {
  router.post('/api/consultations', authMiddleware, validate(consultationSchemas.create), asyncHandler((req, res) => consultationController.create(req, res)));
  router.get('/api/consultations/:id', authMiddleware, validate(consultationSchemas.idParam), asyncHandler((req, res) => consultationController.getById(req, res)));
  router.get('/api/consultations/patient/:patientId', authMiddleware, asyncHandler((req, res) => consultationController.getByPatientId(req, res)));
  router.get('/api/chats', authMiddleware, asyncHandler((req, res) => consultationController.getChats(req, res)));
  router.get('/api/chats/:id/messages', authMiddleware, validate(consultationSchemas.idParam), asyncHandler((req, res) => consultationController.getMessages(req, res)));
  router.post('/api/chats/:id/messages', authMiddleware, validate(consultationSchemas.sendMessage), asyncHandler((req, res) => consultationController.sendMessage(req, res)));
  router.post('/api/chats/:id/attachments', authMiddleware, validate(consultationSchemas.idParam), chatUpload.single('file'), validateUploadedFile, asyncHandler((req, res) => consultationController.uploadAttachment(req, res)));

  return router;
};
