const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { chatUpload } = require('../middleware/chatUpload');

module.exports = function(consultationController) {
  router.post('/api/consultations', authMiddleware, (req, res) => consultationController.create(req, res));
  router.get('/api/consultations/:id', authMiddleware, (req, res) => consultationController.getById(req, res));
  router.get('/api/consultations/patient/:patientId', authMiddleware, (req, res) => consultationController.getByPatientId(req, res));
  router.get('/api/chats', authMiddleware, (req, res) => consultationController.getChats(req, res));
  router.get('/api/chats/:id/messages', authMiddleware, (req, res) => consultationController.getMessages(req, res));
  router.post('/api/chats/:id/messages', authMiddleware, (req, res) => consultationController.sendMessage(req, res));
  router.post('/api/chats/:id/attachments', authMiddleware, chatUpload.single('file'), (req, res) => consultationController.uploadAttachment(req, res));

  return router;
};
