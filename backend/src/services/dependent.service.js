class DependentService {
  constructor(dependentModel) {
    this.dependentModel = dependentModel;
  }

  getByUserId(userId) {
    return this.dependentModel.findByUserId(userId);
  }

  create(userId, data) {
    const { name, age, relation } = data;
    return this.dependentModel.create(userId, {
      name,
      age: parseInt(age),
      relation
    });
  }
}

module.exports = DependentService;
