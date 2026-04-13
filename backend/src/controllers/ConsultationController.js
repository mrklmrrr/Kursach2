class ConsultationController {
  constructor(consultationService, userRepository) {
    this.consultationService = consultationService;
    this.userRepository = userRepository;
  }

  async create(req, res) {
    try {
      const { doctorId, doctorName, specialty, price, duration, type = 'video' } = req.body;

      const user = await this.userRepository.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      const consultation = await this.consultationService.create({
        doctorId,
        doctorName,
        specialty,
        price,
        duration,
        patientId: user.legacyId,
        patientName: `${user.firstName} ${user.lastName}`,
        type
      });

      res.json({ consultationId: consultation._id, ...consultation });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const consultation = await this.consultationService.getById(req.params.id);
      if (!consultation) {
        return res.status(404).json({ message: 'Консультация не найдена' });
      }
      res.json(consultation);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getByPatientId(req, res) {
    try {
      const consultations = await this.consultationService.getByPatientId(parseInt(req.params.patientId));
      res.json(consultations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = ConsultationController;
