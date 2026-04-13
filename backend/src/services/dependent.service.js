class DependentService {
  constructor(dependentRepository) {
    this.dependentRepository = dependentRepository;
  }

  async getByUserId(userId) {
    return this.dependentRepository.findByUserId(userId);
  }

  async create(userId, data) {
    const { name, age, relation } = data;
    return this.dependentRepository.create(userId, {
      name,
      age: parseInt(age),
      relation
    });
  }
}

module.exports = DependentService;
