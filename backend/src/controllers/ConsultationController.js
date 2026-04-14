const ConsultationController = class {
  constructor(consultationService, userRepository, doctorRepository) {
    this.consultationService = consultationService;
    this.userRepository = userRepository;
    this.doctorRepository = doctorRepository;
  }

  async create(req, res) {
    try {
      const { doctorId, doctorName, specialty, price, duration, type = 'video' } = req.body;

      // Валидация: врач существует
      if (!doctorId) {
        return res.status(400).json({ message: 'doctorId обязателен' });
      }

      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }

      const user = await this.userRepository.findById(req.userId);
      if (!user) {
        return res.status(401).json({ message: 'Пользователь не найден' });
      }

      const consultation = await this.consultationService.create({
        doctorId: doctor._id,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        price: doctor.price,
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
      // Историю отдаём для текущего авторизованного пользователя,
      // чтобы не терять записи из-за разных форматов id на клиенте.
      const consultations = await this.consultationService.getByPatientId(req.userId);
      res.json(consultations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = ConsultationController;
