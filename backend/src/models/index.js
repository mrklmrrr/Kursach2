const { doctorsList } = require('../data/doctors');

class UserModel {
  constructor() {
    this.users = [];
  }

  create(userData) {
    const user = { ...userData, id: Date.now() };
    this.users.push(user);
    return user;
  }

  findById(id) {
    return this.users.find(u => u.id === id);
  }

  findByPhone(phone) {
    return this.users.find(u => u.phone === phone);
  }
}

class ConsultationModel {
  constructor() {
    this.consultations = [];
    this.nextId = 1;
  }

  create(data) {
    const consultation = {
      id: this.nextId++,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentId: null,
      paidAt: null,
      messages: []
    };
    this.consultations.push(consultation);
    return consultation;
  }

  findById(id) {
    return this.consultations.find(c => c.id === parseInt(id));
  }

  findByPatientId(patientId) {
    return this.consultations.filter(c => c.patientId === patientId);
  }

  addMessage(consultationId, messageData) {
    const consultation = this.findById(consultationId);
    if (consultation) {
      consultation.messages.push(messageData);
    }
    return consultation;
  }
}

class DependentModel {
  constructor() {
    this.dependents = [];
    this.nextId = 1;
  }

  create(userId, data) {
    const dependent = {
      id: this.nextId++,
      userId,
      ...data
    };
    this.dependents.push(dependent);
    return dependent;
  }

  findByUserId(userId) {
    return this.dependents.filter(d => d.userId === userId);
  }
}

class DoctorModel {
  findAll() {
    return doctorsList;
  }

  findById(id) {
    return doctorsList.find(d => d.id === parseInt(id));
  }
}

module.exports = {
  UserModel,
  ConsultationModel,
  DependentModel,
  DoctorModel
};
