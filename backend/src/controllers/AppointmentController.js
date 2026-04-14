class AppointmentController {
  constructor(appointmentService, userRepository) {
    this.appointmentService = appointmentService;
    this.userRepository = userRepository;
  }

  /** Создать запись (пациент записывается к врачу) */
  async create(req, res) {
    try {
      const { doctorId, date, time, type, consultationType, duration } = req.body;

      const appointment = await this.appointmentService.create(
        doctorId,
        req.userId,
        { date, time, type, consultationType, duration: duration || 30 }
      );

      res.status(201).json(appointment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** Получить запись по ID */
  async getById(req, res) {
    try {
      const appointment = await this.appointmentService.getById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Запись не найдена' });
      }
      res.json(appointment);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Получить записи текущего пользователя (пациента) */
  async getByPatient(req, res) {
    try {
      const appointments = await this.appointmentService.getByPatientId(req.userId);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Получить записи врача */
  async getByDoctor(req, res) {
    try {
      const appointments = await this.appointmentService.getByDoctorId(req.userId);
      res.json(appointments);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Получить доступные слоты для врача на дату */
  async getAvailableSlots(req, res) {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ message: 'Параметр date обязателен' });
      }

      const slots = await this.appointmentService.getAvailableSlots(req.params.doctorId, date);
      res.json({ date, slots });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Отменить запись */
  async cancel(req, res) {
    try {
      const appointment = await this.appointmentService.updateStatus(
        req.params.id,
        'cancelled'
      );
      if (!appointment) {
        return res.status(404).json({ message: 'Запись не найдена' });
      }
      res.json({ message: 'Запись отменена', appointment });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Удалить запись (врач может удалить свою запись) */
  async delete(req, res) {
    try {
      const deleted = await this.appointmentService.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Запись не найдена' });
      }
      res.json({ message: 'Запись удалена' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Назначить запись пациенту (врач/админ) */
  async assignAppointment(req, res) {
    try {
      const { patientId, date, time, type, consultationType, duration } = req.body;

      if (!patientId) {
        return res.status(400).json({ message: 'patientId обязателен' });
      }

      const patient = await this.userRepository.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: 'Пациент не найден' });
      }

      const appointment = await this.appointmentService.create(
        req.userId,
        patientId,
        { date, time, type, consultationType, duration: duration || 30 }
      );

      res.status(201).json(appointment);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** Обновить рабочее время врача */
  async updateWorkingHours(req, res) {
    try {
      const { workingHours, workingDays } = req.body;
      const updates = {};
      if (workingHours) updates.workingHours = workingHours;
      if (workingDays) updates.workingDays = workingDays;

      const doctor = await this.userRepository.updateDoctor(req.userId, updates);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json({ message: 'Рабочее время обновлено', doctor });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Получить рабочее время врача */
  async getWorkingHours(req, res) {
    try {
      const doctor = await this.userRepository.findById(req.userId);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json({
        workingHours: doctor.workingHours,
        workingDays: doctor.workingDays
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AppointmentController;
