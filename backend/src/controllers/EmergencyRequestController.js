class EmergencyRequestController {
  constructor(emergencyRequestService) {
    this.emergencyRequestService = emergencyRequestService;
  }

  async create(req, res) {
    const { request } = await this.emergencyRequestService.createForPatient(req.userId);
    res.status(201).json({
      id: request._id,
      status: request.status,
      expiresAt: request.expiresAt
    });
  }

  async getCurrent(req, res) {
    const row = await this.emergencyRequestService.getCurrentForPatient(req.userId);
    if (!row) {
      return res.json(null);
    }
    res.json(row);
  }

  async cancel(req, res) {
    await this.emergencyRequestService.cancelForPatient(req.userId);
    res.json({ ok: true });
  }
}

module.exports = EmergencyRequestController;
