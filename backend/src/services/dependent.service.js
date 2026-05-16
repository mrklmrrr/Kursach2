const { calculateAge } = require('../utils/helpers');
const { roles } = require('../constants');
const { getInverseRelation } = require('../constants/relativeRelations');
const ApiError = require('../utils/ApiError');

class DependentService {
  constructor(dependentRepository, userRepository, relativeInviteRepository) {
    this.dependentRepository = dependentRepository;
    this.userRepository = userRepository;
    this.relativeInviteRepository = relativeInviteRepository;
  }

  async getByUserId(userId) {
    return this.dependentRepository.findByUserId(userId);
  }

  async getIncomingInvites(userId) {
    const invites = await this.relativeInviteRepository.findPendingByToUserId(userId);
    return invites.map((inv) => this._formatInvite(inv));
  }

  async create(userId, data) {
    const relativeUsername = data.relativeUsername != null ? String(data.relativeUsername).trim() : '';

    if (relativeUsername) {
      return this._createInviteByUsername(userId, relativeUsername, data);
    }

    const {
      name,
      age,
      relation,
      birthDate,
      gender,
      phone,
      notes,
      allergies,
      chronicConditions
    } = data;
    const ageNum = parseInt(age, 10);
    if (!name || Number.isNaN(ageNum)) {
      throw ApiError.badRequest('Укажите имя и возраст или username родственника в приложении');
    }
    return this.dependentRepository.create(userId, {
      name,
      age: ageNum,
      relation,
      birthDate: birthDate || '',
      gender: gender || '',
      phone: phone || '',
      notes: notes || '',
      allergies: allergies || '',
      chronicConditions: chronicConditions || '',
      linkedUserId: null,
      linkedUsername: ''
    });
  }

  async acceptInvite(userId, inviteId) {
    const invite = await this.relativeInviteRepository.findById(inviteId);
    if (!invite || invite.status !== 'pending') {
      throw ApiError.notFound('Приглашение не найдено или уже обработано');
    }
    if (String(invite.toUserId) !== String(userId)) {
      throw ApiError.forbidden('Нет доступа к этому приглашению');
    }

    const fromUser = await this.userRepository.findById(invite.fromUserId);
    const toUser = await this.userRepository.findById(invite.toUserId);
    if (!fromUser || !toUser) {
      throw ApiError.notFound('Пользователь не найден');
    }

    await this._ensureLinkedPair(fromUser, toUser, invite.relation, invite.notes || '');
    await this.relativeInviteRepository.updateStatus(inviteId, 'accepted');

    return { ok: true, message: 'Родственная связь подтверждена' };
  }

  async rejectInvite(userId, inviteId) {
    const invite = await this.relativeInviteRepository.findById(inviteId);
    if (!invite || invite.status !== 'pending') {
      throw ApiError.notFound('Приглашение не найдено или уже обработано');
    }
    if (String(invite.toUserId) !== String(userId)) {
      throw ApiError.forbidden('Нет доступа к этому приглашению');
    }
    await this.relativeInviteRepository.updateStatus(inviteId, 'rejected');
    return { ok: true, message: 'Приглашение отклонено' };
  }

  async _createInviteByUsername(userId, relativeUsername, data) {
    const un = relativeUsername.replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,24}$/.test(un)) {
      throw ApiError.badRequest('Username: 3–24 символа, латиница, цифры и подчёркивание');
    }

    const target = await this.userRepository.findByUsername(un);
    if (!target || target.role !== roles.PATIENT) {
      throw ApiError.notFound('Пациент с таким username не найден');
    }
    if (String(target._id) === String(userId)) {
      throw ApiError.badRequest('Нельзя добавить себя в родственники');
    }

    const dup = await this.dependentRepository.findByOwnerAndLinkedUserId(userId, target._id);
    if (dup) {
      throw ApiError.badRequest('Этот пользователь уже в вашем списке');
    }

    const existingInvite = await this.relativeInviteRepository.findBetween(userId, target._id);
    if (existingInvite?.status === 'pending') {
      throw ApiError.badRequest('Приглашение уже отправлено — ожидайте подтверждения');
    }
    if (existingInvite?.status === 'accepted') {
      throw ApiError.badRequest('Этот пользователь уже в вашем списке');
    }

    let invite;
    if (existingInvite?.status === 'rejected') {
      invite = await this.relativeInviteRepository.resetToPending(existingInvite._id, {
        relation: data.relation,
        notes: data.notes || ''
      });
    } else {
      invite = await this.relativeInviteRepository.create({
        fromUserId: userId,
        toUserId: target._id,
        relation: data.relation,
        notes: data.notes || '',
        status: 'pending'
      });
    }

    return {
      invite: true,
      pending: true,
      id: invite._id,
      message: 'Приглашение отправлено. Родственник появится в списке после подтверждения.'
    };
  }

  async _ensureLinkedPair(fromUser, toUser, relationFromSender, notesFromSender) {
    const dupA = await this.dependentRepository.findByOwnerAndLinkedUserId(fromUser._id, toUser._id);
    if (!dupA) {
      await this._createLinkedDependent(fromUser._id, toUser, relationFromSender, notesFromSender);
    }

    const inverseRelation = getInverseRelation(relationFromSender);
    const dupB = await this.dependentRepository.findByOwnerAndLinkedUserId(toUser._id, fromUser._id);
    if (!dupB) {
      await this._createLinkedDependent(toUser._id, fromUser, inverseRelation, '');
    }
  }

  async _createLinkedDependent(ownerUserId, targetUser, relation, notes) {
    const un = String(targetUser.username || '').trim().toLowerCase();
    const name = `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || un || 'Родственник';
    const ageNum = calculateAge(targetUser.birthDate);

    return this.dependentRepository.create(ownerUserId, {
      name,
      age: ageNum != null && !Number.isNaN(ageNum) ? ageNum : 0,
      relation,
      linkedUserId: targetUser._id,
      linkedUsername: un,
      birthDate: targetUser.birthDate || '',
      gender: targetUser.gender || '',
      phone: targetUser.phone || '',
      notes: notes || '',
      allergies: '',
      chronicConditions: ''
    });
  }

  _formatInvite(inv) {
    const from = inv.fromUserId && typeof inv.fromUserId === 'object' ? inv.fromUserId : null;
    const fromName = from
      ? `${from.firstName || ''} ${from.lastName || ''}`.trim() || from.username || 'Пользователь'
      : 'Пользователь';
    return {
      id: inv._id,
      fromUserId: from?._id || inv.fromUserId,
      fromName,
      fromUsername: from?.username || '',
      relation: inv.relation,
      notes: inv.notes || '',
      status: inv.status,
      createdAt: inv.createdAt
    };
  }
}

module.exports = DependentService;
