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

  async countAll() {
    return this.consultationRepository.countAll();
  }

  async countByStatus(status) {
    return this.consultationRepository.countByStatus(status);
  }

  async updateStatus(id, status) {
    return this.consultationRepository.updateStatus(id, status);
  }
}

module.exports = ConsultationService;
