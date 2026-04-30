const { hasConsultationAccess } = require('../utils/chatAccess');
const { resolveAvatarUrl } = require('../utils/userSerializer');
const ApiError = require('../utils/ApiError');

const ConsultationController = class {
  constructor(consultationService, userRepository, doctorRepository) {
    this.consultationService = consultationService;
    this.userRepository = userRepository;
    this.doctorRepository = doctorRepository;
  }

  async create(req, res) {
    const { doctorId, doctorName, specialty, price, duration, type = 'video' } = req.body;

    // Валидация: врач существует
    if (!doctorId) {
      throw ApiError.badRequest('doctorId обязателен');
    }

    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw ApiError.notFound('Врач не найден');
    }

    const user = await this.userRepository.findById(req.userId);
    if (!user) {
      throw ApiError.unauthorized('Пользователь не найден');
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
  }

  async getById(req, res) {
    const consultation = await this.consultationService.getById(req.params.id);
    if (!consultation) {
      throw ApiError.notFound('Консультация не найдена');
    }
    res.json(consultation);
  }

  async getByPatientId(req, res) {
    // Историю отдаём для текущего авторизованного пользователя,
    // чтобы не терять записи из-за разных форматов id на клиенте.
    const consultations = await this.consultationService.getByPatientId(req.userId);
    res.json(consultations);
  }

  async getChats(req, res) {
    const consultations = await this.consultationService.getChatsForUser(req.userId, req.userRole);

    // Batch-загрузка аватаров для врачей и пациентов
    const doctorIds = [...new Set(consultations.map((c) => String(c.doctorId)))];
    const patientIds = [...new Set(consultations.map((c) => c.patientId))].filter(Boolean);

    const [doctors, patients] = await Promise.all([
      Promise.all(doctorIds.map((id) => this.doctorRepository.findById(id))),
      Promise.all(patientIds.map((id) => this.userRepository.findById(id)))
    ]);

    const doctorMap = new Map();
    doctors.filter(Boolean).forEach((d) => {
      doctorMap.set(String(d.id || d._id), resolveAvatarUrl(d.avatarUrl || ''));
    });

    const patientMap = new Map();
    patients.filter(Boolean).forEach((p) => {
      const avatar = resolveAvatarUrl(p.avatarUrl || '');
      patientMap.set(String(p.id || p._id), avatar);
      if (p.legacyId != null) {
        patientMap.set(String(p.legacyId), avatar);
      }
    });

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
        messageCount: messages.length,
        doctorAvatarUrl: doctorMap.get(String(consultation.doctorId)) || '',
        patientAvatarUrl: patientMap.get(String(consultation.patientId)) || ''
      };
    });

    res.json(chats);
  }

  async getMessages(req, res) {
    const consultation = await this.consultationService.getById(req.params.id);
    if (!consultation) {
      throw ApiError.notFound('Чат не найден');
    }
    if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
      throw ApiError.forbidden('Нет доступа к этому чату');
    }

    const response = {
      consultationId: consultation._id,
      doctorName: consultation.doctorName,
      specialty: consultation.specialty,
      messages: consultation.messages || []
    };

    // Include patient info and avatar for doctors
    if (req.userRole === 'doctor') {
      const patient = await this.userRepository.findById(consultation.patientId);
      if (patient) {
        response.patientId = consultation.patientId;
        response.patientName = consultation.patientName;
        response.patientAvatarUrl = resolveAvatarUrl(patient.avatarUrl || '');
      }
    }

    res.json(response);
  }

  async sendMessage(req, res) {
    const consultation = await this.consultationService.getById(req.params.id);
    if (!consultation) {
      throw ApiError.notFound('Чат не найден');
    }
    if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
      throw ApiError.forbidden('Нет доступа к этому чату');
    }

    const text = String(req.body.message || '').trim();
    if (!text) {
      throw ApiError.badRequest('Текст сообщения обязателен');
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
  }

  async uploadAttachment(req, res) {
    const consultation = await this.consultationService.getById(req.params.id);
    if (!consultation) {
      throw ApiError.notFound('Чат не найден');
    }
    if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
      throw ApiError.forbidden('Нет доступа к этому чату');
    }
    if (!req.file) {
      throw ApiError.badRequest('Файл не передан');
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
