const ApiError = require('../utils/ApiError');

class DoctorController {
  constructor(doctorService) {
    this.doctorService = doctorService;
  }

  async getAll(req, res) {
    const doctors = await this.doctorService.getAll();
    res.json(doctors);
  }

  async getById(req, res) {
    const doctor = await this.doctorService.getById(req.params.id);
    if (!doctor) {
      throw ApiError.notFound('Врач не найден');
    }
    res.json(doctor);
  }
}

module.exports = DoctorController;
