class ConsultationService {
  constructor(consultationRepository) {
    this.consultationRepository = consultationRepository;
  }

  async create(data) {
    return this.consultationRepository.create(data);
  }

  async getById(id) {
    return this.consultationRepository.findById(id);
  }

  async getByPatientId(patientId) {
    return this.consultationRepository.findByPatientId(patientId);
  }

  async getByDoctorId(doctorId) {
    return this.consultationRepository.findByDoctorId(doctorId);
  }

  async getChatsForUser(userId, userRole) {
    return this.consultationRepository.findChatsForUser(userId, userRole);
  }

  async getMessages(consultationId) {
    return this.consultationRepository.getMessages(consultationId);
  }

  async addMessage(consultationId, messageData) {
    return this.consultationRepository.addMessage(consultationId, messageData);
  }

  async countAll() {
    return this.consultationRepository.countAll();
  }

  async countByStatus(status) {
    return this.consultationRepository.countByStatus(status);
  }

  async updateStatus(id, status) {
    return this.consultationRepository.updateStatus(id, status);
  }

  async updateStatusByDoctor(id, doctorId, status) {
    const consultation = await this.getById(id);
    if (!consultation) {
      return null;
    }
    if (String(consultation.doctorId) !== String(doctorId)) {
      const error = new Error('Нельзя менять статус чужой консультации');
      error.status = 403;
      throw error;
    }
    return this.updateStatus(id, status);
  }
}

module.exports = ConsultationService;
