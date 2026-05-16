class DependentController {
  constructor(dependentService) {
    this.dependentService = dependentService;
  }

  async getByUserId(req, res) {
    const dependents = await this.dependentService.getByUserId(req.userId);
    res.json(dependents);
  }

  async create(req, res) {
    const result = await this.dependentService.create(req.userId, req.body);
    res.json(result);
  }

  async getIncomingInvites(req, res) {
    const invites = await this.dependentService.getIncomingInvites(req.userId);
    res.json(invites);
  }

  async acceptInvite(req, res) {
    const result = await this.dependentService.acceptInvite(req.userId, req.params.id);
    res.json(result);
  }

  async rejectInvite(req, res) {
    const result = await this.dependentService.rejectInvite(req.userId, req.params.id);
    res.json(result);
  }
}

module.exports = DependentController;
