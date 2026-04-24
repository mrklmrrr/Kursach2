class DependentController {
  constructor(dependentService) {
    this.dependentService = dependentService;
  }

  async getByUserId(req, res) {
    const dependents = await this.dependentService.getByUserId(req.userId);
    res.json(dependents);
  }

  async create(req, res) {
    const dependent = await this.dependentService.create(req.userId, req.body);
    res.json(dependent);
  }
}

module.exports = DependentController;
