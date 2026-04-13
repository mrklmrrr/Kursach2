class DoctorService {
  constructor(doctorRepository) {
    this.doctorRepository = doctorRepository;
  }

  // Публичные методы
  async getAll(filter = {}) {
    return this.doctorRepository.findAll(filter);
  }

  async getById(id) {
    return this.doctorRepository.findById(id);
  }

  // Методы админки
  async createDoctor(data) {
    return this.doctorRepository.createDoctor(data);
  }

  async updateDoctor(id, updates) {
    return this.doctorRepository.updateDoctor(id, updates);
  }

  async deleteDoctor(id) {
    return this.doctorRepository.deleteDoctor(id);
  }

  async toggleOnline(id, isOnline) {
    return this.doctorRepository.toggleOnline(id, isOnline);
  }

  async updatePrice(id, price) {
    return this.doctorRepository.updatePrice(id, price);
  }
}

module.exports = DoctorService;
