const ApiError = require('../utils/ApiError');

class AppointmentController {
  constructor(appointmentService, userRepository) {
    this.appointmentService = appointmentService;
    this.userRepository = userRepository;
  }

  /** Создать запись (пациент записывается к врачу) */
  async create(req, res) {
    const { doctorId, date, time, type, consultationType, duration } = req.body;
    const appointment = await this.appointmentService.create(
      doctorId,
      req.userId,
      { date, time, type, consultationType, duration: duration || 30 }
    );
    res.status(201).json(appointment);
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
    const appointments = await this.appointmentService.getByPatientId(req.userId);
    res.json(appointments);
  }

  /** Пациент: оплатить прием перед началом */
  async pay(req, res) {
    const appointment = await this.appointmentService.payByPatient(req.params.id, req.userId);
    if (!appointment) {
      throw ApiError.notFound('Запись не найдена');
    }
    res.json({ message: 'Прием успешно оплачен', appointment });
  }

  /** Получить записи врача */
  async getByDoctor(req, res) {
    const appointments = await this.appointmentService.getByDoctorId(req.userId);
    res.json(appointments);
  }

  /** Получить доступные слоты для врача на дату */
  async getAvailableSlots(req, res) {
    const { date } = req.query;
    const slots = await this.appointmentService.getAvailableSlots(req.params.doctorId, date);
    res.json({ date, slots });
  }

  /** Отменить запись */
  async cancel(req, res) {
    const appointment = await this.appointmentService.cancelByPatient(req.params.id, req.userId);
    if (!appointment) {
      throw ApiError.notFound('Запись не найдена');
    }
    res.json({ message: 'Запись отменена', appointment });
  }

  /** Удалить запись (врач может удалить свою запись) */
  async delete(req, res) {
    const deleted = await this.appointmentService.deleteByDoctor(req.params.id, req.userId);
    if (!deleted) {
      throw ApiError.notFound('Запись не найдена');
    }
    res.json({ message: 'Запись удалена' });
  }

  /** Назначить запись пациенту (врач/админ) */
  async assignAppointment(req, res) {
    const { patientId, date, time, type, consultationType, duration } = req.body;
    const patient = await this.userRepository.findById(patientId);
    if (!patient) {
      throw ApiError.notFound('Пациент не найден');
    }

    const appointment = await this.appointmentService.create(
      req.userId,
      patientId,
      { date, time, type, consultationType, duration: duration || 30 }
    );

    res.status(201).json(appointment);
  }

  /** Врач: обновить комментарий к записи */
  async updateDoctorComment(req, res) {
    const { comment } = req.body;
    const updated = await this.appointmentService.updateDoctorCommentByDoctor(req.params.id, req.userId, comment || '');
    if (!updated) {
      throw ApiError.notFound('Запись не найдена');
    }
    res.json(updated);
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
