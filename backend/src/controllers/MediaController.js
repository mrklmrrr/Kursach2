const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { hasConsultationAccess } = require('../utils/chatAccess');
const { findChatFileDoc, pipeChatFileToResponse } = require('../services/chatMediaStorage');

class MediaController {
  constructor(userRepository, consultationRepository) {
    this.userRepository = userRepository;
    this.consultationRepository = consultationRepository;
  }

  async getAvatar(req, res) {
    const { userId } = req.params;
    const payload = await this.userRepository.findAvatarBinaryById(userId);
    if (!payload) {
      return res.status(404).end();
    }
    res.setHeader('Content-Type', payload.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(payload.buffer);
  }

  async getChatFile(req, res) {
    const { fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      throw ApiError.badRequest('Некорректный идентификатор файла');
    }
    const fileDoc = await findChatFileDoc(fileId);
    if (!fileDoc || !fileDoc.metadata || fileDoc.metadata.consultationId == null) {
      throw ApiError.notFound('Файл не найден');
    }
    const consultation = await this.consultationRepository.findById(fileDoc.metadata.consultationId);
    if (!consultation) {
      throw ApiError.notFound('Файл не найден');
    }
    const ok = await hasConsultationAccess(
      consultation,
      req.userId,
      req.userRole,
      (id) => this.userRepository.findById(id)
    );
    if (!ok) {
      throw ApiError.forbidden('Нет доступа к файлу');
    }
    const mime = fileDoc.metadata.mimeType || fileDoc.contentType || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    if (fileDoc.metadata.fileName) {
      res.setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(String(fileDoc.metadata.fileName))}`
      );
    }
    await pipeChatFileToResponse(fileId, res);
  }
}

module.exports = MediaController;
