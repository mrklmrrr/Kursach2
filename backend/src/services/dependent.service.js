const { calculateAge } = require('../utils/helpers');
const { roles } = require('../constants');

class DependentService {
  constructor(dependentRepository, userRepository) {
    this.dependentRepository = dependentRepository;
    this.userRepository = userRepository;
  }

  async getByUserId(userId) {
    return this.dependentRepository.findByUserId(userId);
  }

  async create(userId, data) {
    const relativeUsername = data.relativeUsername != null ? String(data.relativeUsername).trim() : '';

    if (relativeUsername) {
      const un = relativeUsername.replace(/^@+/, '').toLowerCase();
      if (!/^[a-z0-9_]{3,24}$/.test(un)) {
        throw new Error('Username: 3–24 символа, латиница, цифры и подчёркивание');
      }
      const target = await this.userRepository.findByUsername(un);
      if (!target || target.role !== roles.PATIENT) {
        throw new Error('Пациент с таким username не найден');
      }
      if (String(target._id) === String(userId)) {
        throw new Error('Нельзя добавить себя в родственники');
      }
      const dup = await this.dependentRepository.findByOwnerAndLinkedUserId(userId, target._id);
      if (dup) {
        throw new Error('Этот пользователь уже в вашем списке');
      }
      const name = `${target.firstName || ''} ${target.lastName || ''}`.trim() || un;
      const ageNum = calculateAge(target.birthDate);
      return this.dependentRepository.create(userId, {
        name,
        age: ageNum != null && !Number.isNaN(ageNum) ? ageNum : 0,
        relation: data.relation,
        linkedUserId: target._id,
        linkedUsername: un,
        birthDate: target.birthDate || '',
        gender: target.gender || '',
        phone: target.phone || '',
        notes: data.notes || '',
        allergies: '',
        chronicConditions: ''
      });
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
      throw new Error('Укажите имя и возраст или username родственника в приложении');
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
}

module.exports = DependentService;
