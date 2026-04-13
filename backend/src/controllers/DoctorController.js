class DoctorController {
  constructor(doctorService) {
    this.doctorService = doctorService;
  }

  async getAll(req, res) {
    try {
      const doctors = await this.doctorService.getAll();
      res.json(doctors);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const doctor = await this.doctorService.getById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = DoctorController;
