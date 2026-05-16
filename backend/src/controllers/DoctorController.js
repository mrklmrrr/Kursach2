const ApiError = require('../utils/ApiError');
const { isUserConnected } = require('../config/socket');
const { mapDoctorPresence } = require('../utils/presence');

class DoctorController {
  constructor(doctorService) {
    this.doctorService = doctorService;
  }

  async getAll(req, res) {
    const doctors = await this.doctorService.getAll();
    res.json(doctors.map((doctor) => mapDoctorPresence(doctor, isUserConnected)));
  }

  async getById(req, res) {
    const doctor = await this.doctorService.getById(req.params.id);
    if (!doctor) {
      throw ApiError.notFound('Врач не найден');
    }
    res.json(mapDoctorPresence(doctor, isUserConnected));
  }
}

module.exports = DoctorController;
