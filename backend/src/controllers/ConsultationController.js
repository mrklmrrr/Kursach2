const { hasConsultationAccess } = require('../utils/chatAccess');
const { resolveAvatarUrl } = require('../utils/userSerializer');
const { getPresenceForUser } = require('../utils/presence');
const { isUserConnected } = require('../config/socket');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const { uploadChatFile, deleteChatFile } = require('../services/chatMediaStorage');

function lastMessageTimestamp(chat) {
  const ts = chat?.lastMessage?.timestamp || chat?.updatedAt || null;
  const t = new Date(ts || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Схлопывает несколько консультаций одной пары врач–пациент в один элемент списка чатов */
function mergeChatListRowsByDoctorPatient(chats) {
  if (!Array.isArray(chats) || chats.length <= 1) return chats;
  const groups = new Map();
  for (const chat of chats) {
    const key = `${String(chat.doctorId)}|${String(chat.patientId ?? '')}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(chat);
  }
  const merged = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }
    group.sort((a, b) => {
      const d = lastMessageTimestamp(b) - lastMessageTimestamp(a);
      if (d !== 0) return d;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
    const primary = { ...group[0] };
    primary.unreadCount = group.reduce((s, c) => s + Number(c.unreadCount || 0), 0);
    merged.push(primary);
  }
  merged.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return merged;
}

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

    const existing = await this.consultationService.findLatestThreadForDoctorPatient(
      doctor._id,
      user.legacyId
    );
    if (existing?._id) {
      return res.json({
        consultationId: existing._id,
        ...existing,
        reused: true
      });
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
    const currentUser = await this.userRepository.findById(req.userId);
    const currentUserId = String(req.userId || '');
    const currentUserLegacyId = String(currentUser?.legacyId || '');

    // Batch-загрузка аватаров для врачей и пациентов
    const doctorIds = [...new Set(consultations.map((c) => String(c.doctorId)))];
    const patientIds = [...new Set(consultations.map((c) => c.patientId))].filter(Boolean);

    const validDoctorObjectIds = doctorIds
      .map((id) => String(id || '').trim())
      .filter((id) => /^[a-fA-F0-9]{24}$/.test(id));
    const patientNumericLegacyIds = patientIds
      .map((id) => {
        const value = Number(id);
        return Number.isNaN(value) ? null : value;
      })
      .filter((id) => id !== null);

    const [usersByObjectIds, usersByLegacyIds] = await Promise.all([
      validDoctorObjectIds.length > 0
        ? User.find({ _id: { $in: validDoctorObjectIds } })
          .select('firstName lastName specialty avatarUrl role legacyId isOnline')
          .lean()
        : Promise.resolve([]),
      patientNumericLegacyIds.length > 0
        ? User.find({ legacyId: { $in: patientNumericLegacyIds } })
          .select('firstName lastName specialty avatarUrl role legacyId isOnline')
          .lean()
        : Promise.resolve([])
    ]);

    const users = [...usersByObjectIds, ...usersByLegacyIds];
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [String(user._id), user])).values()
    );

    const doctors = uniqueUsers.filter((user) => String(user.role) === 'doctor');
    const patients = uniqueUsers.filter((user) => String(user.role) !== 'doctor');

    const doctorMap = new Map();
    doctors.filter(Boolean).forEach((d) => {
      doctorMap.set(String(d.id || d._id), {
        avatarUrl: resolveAvatarUrl(d.avatarUrl || ''),
        doctorName: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim(),
        specialty: d.specialty || '',
        isOnline: getPresenceForUser(d, isUserConnected)
      });
    });

    const patientMap = new Map();
    patients.filter(Boolean).forEach((p) => {
      const payload = {
        id: String(p.id || p._id || ''),
        avatarUrl: resolveAvatarUrl(p.avatarUrl || ''),
        role: p.role || 'patient',
        fullName: `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        specialty: p.specialty || '',
        isOnline: getPresenceForUser(p, isUserConnected)
      };
      patientMap.set(String(p.id || p._id), payload);
      if (p.legacyId != null) {
        patientMap.set(String(p.legacyId), payload);
      }
    });

    let chats = consultations.map((consultation) => {
      const messages = consultation.messages || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      const doctorInfo = doctorMap.get(String(consultation.doctorId)) || {
        doctorName: consultation.doctorName,
        avatarUrl: '',
        specialty: consultation.specialty,
        isOnline: false
      };
      const patientInfo = patientMap.get(String(consultation.patientId)) || {
        id: String(consultation.patientId || ''),
        fullName: consultation.patientName,
        avatarUrl: '',
        role: 'patient',
        specialty: '',
        isOnline: false
      };
      const isSelfOnPatientSide = String(consultation.patientId || '') === currentUserId
        || String(consultation.patientId || '') === currentUserLegacyId;
      const companion = isSelfOnPatientSide
        ? {
            id: String(consultation.doctorId || ''),
            role: 'doctor',
            name: doctorInfo.doctorName || consultation.doctorName || 'Врач',
            avatarUrl: doctorInfo.avatarUrl || '',
            specialty: doctorInfo.specialty || consultation.specialty || 'Специалист',
            isOnline: Boolean(doctorInfo.isOnline)
          }
        : {
            id: String(patientInfo.id || consultation.patientId || ''),
            role: patientInfo.role || 'patient',
            name: patientInfo.fullName || consultation.patientName || 'Пациент',
            avatarUrl: patientInfo.avatarUrl || '',
            specialty: (patientInfo.role === 'doctor' ? (patientInfo.specialty || 'Специалист') : 'Пациент'),
            isOnline: Boolean(patientInfo.isOnline)
          };

      return {
        _id: consultation._id,
        type: consultation.type,
        doctorId: consultation.doctorId,
        doctorName: doctorInfo.doctorName || consultation.doctorName,
        patientId: consultation.patientId,
        patientName: consultation.patientName,
        specialty: doctorInfo.specialty || consultation.specialty,
        status: consultation.status,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
        lastMessage,
        messageCount: messages.length,
        unreadCount: Number(
          isSelfOnPatientSide
            ? (consultation.unreadCounts?.patient || 0)
            : (consultation.unreadCounts?.doctor || 0)
        ),
        doctorAvatarUrl: doctorInfo.avatarUrl || '',
        doctorIsOnline: Boolean(doctorInfo.isOnline),
        patientAvatarUrl: patientInfo.avatarUrl || '',
        patientIsOnline: Boolean(patientInfo.isOnline),
        patientRole: patientInfo.role || 'patient',
        patientSpecialty: patientInfo.specialty || '',
        companion
      };
    });

    chats = mergeChatListRowsByDoctorPatient(chats);

    res.json(chats);
  }

  async createDoctorChat(req, res) {
    if (req.userRole !== 'doctor') {
      throw ApiError.forbidden('Только врач может создать чат с другим врачом');
    }

    const targetDoctorId = String(req.body?.doctorId || '');
    if (!targetDoctorId) {
      throw ApiError.badRequest('doctorId обязателен');
    }
    if (String(req.userId) === targetDoctorId) {
      throw ApiError.badRequest('Нельзя создать чат с самим собой');
    }

    const [currentUser, targetDoctor] = await Promise.all([
      this.userRepository.findById(req.userId),
      this.userRepository.findById(targetDoctorId)
    ]);
    if (!currentUser || currentUser.role !== 'doctor') {
      throw ApiError.forbidden('Текущий пользователь не является врачом');
    }
    if (!targetDoctor || targetDoctor.role !== 'doctor') {
      throw ApiError.notFound('Врач для чата не найден');
    }
    if (currentUser.legacyId === null || currentUser.legacyId === undefined) {
      throw ApiError.badRequest('Невозможно создать чат: отсутствует legacyId врача');
    }
    if (targetDoctor.legacyId === null || targetDoctor.legacyId === undefined) {
      throw ApiError.badRequest('Невозможно создать чат: отсутствует legacyId второго врача');
    }

    const existingChats = await this.consultationService.getChatsForUser(req.userId, req.userRole);
    const existing = existingChats.find((chat) => (
      String(chat.type || '').toLowerCase() === 'chat'
      && (
        (String(chat.doctorId) === String(targetDoctorId) && String(chat.patientId) === String(currentUser.legacyId))
        || (String(chat.doctorId) === String(req.userId) && String(chat.patientId) === String(targetDoctor.legacyId))
      )
    ));

    if (existing) {
      return res.status(200).json({
        success: true,
        data: {
          consultationId: existing._id,
          reused: true
        }
      });
    }

    const newChat = await this.consultationService.create({
      doctorId: targetDoctor._id || targetDoctor.id,
      doctorName: `${targetDoctor.firstName || ''} ${targetDoctor.lastName || ''}`.trim() || 'Врач',
      specialty: targetDoctor.specialty || 'Специалист',
      price: Number(targetDoctor.price) || 0,
      duration: 30,
      patientId: currentUser.legacyId,
      patientName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Врач',
      type: 'chat'
    });

    res.status(201).json({
      success: true,
      data: {
        consultationId: newChat._id,
        reused: false
      }
    });
  }

  async getMessages(req, res) {
    const consultation = await this.consultationService.getById(req.params.id);
    if (!consultation) {
      throw ApiError.notFound('Чат не найден');
    }
    if (!(await this._hasChatAccess(consultation, req.userId, req.userRole))) {
      throw ApiError.forbidden('Нет доступа к этому чату');
    }
    const viewerSide = this._resolveViewerSide(consultation, req.userId, req.userRole);
    if (viewerSide) {
      await this.consultationService.resetUnreadForViewer(consultation._id, viewerSide);
    }

    const doctor = await this.doctorRepository.findById(consultation.doctorId);
    const doctorUser = doctor
      ? await User.findById(doctor.id || doctor._id).select('role isOnline').lean()
      : null;
    const response = {
      consultationId: consultation._id,
      doctorName: doctor?.name || consultation.doctorName,
      specialty: doctor?.specialty || consultation.specialty,
      doctorIsOnline: getPresenceForUser(doctorUser, isUserConnected),
      messages: consultation.messages || []
    };

    // Include patient info and avatar for doctors
    if (req.userRole === 'doctor') {
      const patient = await this.userRepository.findById(consultation.patientId);
      if (patient) {
        response.patientId = consultation.patientId;
        response.patientName = consultation.patientName;
        response.patientAvatarUrl = resolveAvatarUrl(patient.avatarUrl || '');
        response.patientIsOnline = getPresenceForUser(patient, isUserConnected);
      }
    } else {
      // Include doctor info and avatar for patients
      if (doctor) {
        response.doctorId = consultation.doctorId;
        response.doctorAvatarUrl = resolveAvatarUrl(doctor.avatarUrl || '');
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
    }, this._resolveUnreadReceiverBySenderRole(req.userRole));

    await this._emitChatUpdateToParticipants(consultation, savedMessage);
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
    if (!req.file || !req.file.buffer) {
      throw ApiError.badRequest('Файл не передан');
    }

    const fileType = this._resolveMessageType(req.file.mimetype);
    const safeOriginal = String(req.file.originalname || 'file').replace(/[^\w.\-()\s\u0400-\u04FF]/g, '_').slice(0, 200);

    let gridFileId = null;
    try {
      gridFileId = await uploadChatFile(req.file.buffer, safeOriginal, {
        consultationId: String(consultation._id),
        mimeType: req.file.mimetype,
        fileName: req.file.originalname || safeOriginal
      });
      const publicPath = `/api/media/chat/${String(gridFileId)}`;
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
      }, this._resolveUnreadReceiverBySenderRole(req.userRole));

      await this._emitChatUpdateToParticipants(consultation, savedMessage);
      res.status(201).json(savedMessage);
    } catch (err) {
      if (gridFileId) {
        await deleteChatFile(String(gridFileId));
      }
      throw err;
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

  _resolveUnreadReceiverBySenderRole(userRole) {
    if (userRole === 'doctor') return 'patient';
    return 'doctor';
  }

  _resolveViewerSide(consultation, userId, userRole) {
    if (!consultation) return null;
    const currentUserId = String(userId || '');
    const consultationDoctorId = String(consultation.doctorId || '');
    const consultationPatientId = String(consultation.patientId || '');
    if (consultationDoctorId && consultationDoctorId === currentUserId) {
      return 'doctor';
    }
    if (consultationPatientId && consultationPatientId === currentUserId) {
      return 'patient';
    }
    if (userRole === 'doctor') return 'doctor';
    return 'patient';
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

  async _emitChatUpdateToParticipants(consultation, payload) {
    try {
      const { getIO, emitToUser } = require('../config/socket');
      const io = getIO();
      if (!io || !consultation) return;

      io.to(`chat-${consultation._id}`).emit('new-message', payload);
      emitToUser(consultation.doctorId, 'chat-updated', { chatId: String(consultation._id), message: payload });

      const patientLegacyId = consultation.patientId;
      if (patientLegacyId !== null && patientLegacyId !== undefined) {
        const patientUser = await User.findOne({ legacyId: patientLegacyId }).select('_id').lean();
        if (patientUser?._id) {
          emitToUser(patientUser._id, 'chat-updated', { chatId: String(consultation._id), message: payload });
        }
      }
    } catch {
      // noop
    }
  }
};

module.exports = ConsultationController;
