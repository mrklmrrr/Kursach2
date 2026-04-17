const { hasConsultationAccess } = require('../utils/chatAccess');

const ConsultationController = class {
  constructor(consultationService, userRepository, doctorRepository) {
    this.consultationService = consultationService;
    this.userRepository = userRepository;
    this.doctorRepository = doctorRepository;
  }

  async create(req, res) {
    try {
      const { doctorId, doctorName, specialty, price, duration, type = 'video' } = req.body;

      // Валидация: врач существует
      if (!doctorId) {
        return res.status(400).json({ message: 'doctorId обязателен' });
      }

      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }

      const user = await this.userRepository.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      const consultation = await this.consultationService.create({
        doctorId: doctor._id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        price: doctor.price,
        duration,
        patientId: user.legacyId,
        patientName: `${user.firstName} ${user.lastName}`,
        type
      });

      res.json({ consultationId: consultation._id, ...consultation });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const consultation = await this.consultationService.getById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Консультация не найдена' });
      }
      res.json(consultation);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getByPatientId(req, res) {
    try {
      // Историю отдаём для текущего авторизованного пользователя,
      // чтобы не терять записи из-за разных форматов id на клиенте.
      const consultations = await this.consultationService.getByPatientId(req.userId);
      res.json(consultations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getChats(req, res) {
    try {
      const consultations = await this.consultationService.getChatsForUser(req.userId, req.userRole);
      const chats = consultations.map((consultation) => {
        const messages = consultation.messages || [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        return {
          _id: consultation._id,
          type: consultation.type,
          doctorId: consultation.doctorId,
          doctorName: consultation.doctorName,
          patientId: consultation.patientId,
          patientName: consultation.patientName,
          specialty: consultation.specialty,
          status: consultation.status,
          createdAt: consultation.createdAt,
          updatedAt: consultation.updatedAt,
          lastMessage,
          messageCount: messages.length
        };
      });

      res.json(chats);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getMessages(req, res) {
    try {
      const consultation = await this.consultationService.getById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Чат не найден' });
      }
      if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
        return res.status(403).json({ message: 'Нет доступа к этому чату' });
      }
      res.json({
        consultationId: consultation._id,
        doctorName: consultation.doctorName,
        specialty: consultation.specialty,
        messages: consultation.messages || []
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const consultation = await this.consultationService.getById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Чат не найден' });
      }
      if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
        return res.status(403).json({ message: 'Нет доступа к этому чату' });
      }

      const text = String(req.body.message || '').trim();
      if (!text) {
        return res.status(400).json({ message: 'Текст сообщения обязателен' });
      }

      const savedMessage = await this.consultationService.addMessage(consultation._id, {
        messageType: 'text',
        message: text,
        sender: this._resolveSender(req.userRole),
        senderId: String(req.userId),
        timestamp: new Date().toISOString()
      });

      this._emitMessage(consultation._id, savedMessage);
      res.status(201).json(savedMessage);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async uploadAttachment(req, res) {
    try {
      const consultation = await this.consultationService.getById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Чат не найден' });
      }
      if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
        return res.status(403).json({ message: 'Нет доступа к этому чату' });
      }
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не передан' });
      }

      const fileType = this._resolveMessageType(req.file.mimetype);
      const publicPath = `/uploads/chat/${req.file.filename}`;
      const savedMessage = await this.consultationService.addMessage(consultation._id, {
        messageType: fileType,
        message: String(req.body.message || '').trim(),
        sender: this._resolveSender(req.userRole),
        senderId: String(req.userId),
        timestamp: new Date().toISOString(),
        fileUrl: publicPath,
        fileName: req.file.originalname,
        fileMimeType: req.file.mimetype,
        fileSize: req.file.size
      });

      this._emitMessage(consultation._id, savedMessage);
      res.status(201).json(savedMessage);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async _hasChatAccess(consultation, userId, userRole) {
    return hasConsultationAccess(
      consultation,
      userId,
      userRole,
      this.userRepository ? (id) => this.userRepository.findById(id) : null
    );
  }

  _resolveSender(userRole) {
    if (userRole === 'doctor') return 'doctor';
    if (userRole === 'admin') return 'admin';
    return 'user';
  }

  _resolveMessageType(mimeType = '') {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'file';
  }

  _emitMessage(chatId, payload) {
    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.to(`chat-${chatId}`).emit('new-message', payload);
      }
    } catch {
      // noop
    }
  }
};

module.exports = ConsultationController;
