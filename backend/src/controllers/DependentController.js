class DependentController {
  constructor(dependentService) {
    this.dependentService = dependentService;
  }

  async getByUserId(req, res) {
    try {
      const dependents = await this.dependentService.getByUserId(req.userId);
      res.json(dependents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const dependent = await this.dependentService.create(req.userId, req.body);
      res.json(dependent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = DependentController;
