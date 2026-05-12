const ApiError = require('../utils/ApiError');

class AppointmentService {
  constructor(appointmentRepository, userRepository, consultationRepository) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
    this.consultationRepository = consultationRepository;
  }

  _isOnlineAppointment(appointment) {
    const format = String(appointment?.consultationType || appointment?.type || '').toLowerCase();
    return format === 'online';
  }

  /**
   * Для онлайн-записи создаёт (или подвязывает) Consultation — нужен consultationId для видеокомнаты и чата.
   */
  async ensureConsultationForOnlineAppointment(appointment) {
    if (!appointment?._id) return appointment;
    if (appointment.consultationId) return appointment;
    if (!this._isOnlineAppointment(appointment)) return appointment;

    const existing = await this.consultationRepository.findByAppointmentId(appointment._id);
    if (existing?._id) {
      return this.appointmentRepository.updateConsultationId(appointment._id, existing._id);
    }

    const doctor = await this.userRepository.findById(appointment.doctorId);
    const patient = await this.userRepository.findById(appointment.patientId);
    if (!doctor || !patient) return appointment;
    if (patient.legacyId === undefined || patient.legacyId === null) return appointment;

    const doctorName = appointment.doctorName
      || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim();
    const patientName = appointment.patientName
      || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

    const consultation = await this.consultationRepository.create({
      doctorId: appointment.doctorId,
      doctorName: doctorName || 'Врач',
      specialty: doctor.specialty || 'Врач',
      price: Number(appointment.paymentAmount) || Number(doctor.price) || 0,
      duration: Number(appointment.duration) || 30,
      patientId: patient.legacyId,
      patientName: patientName || 'Пациент',
      type: 'video',
      appointmentId: appointment._id
    });

    return this.appointmentRepository.updateConsultationId(appointment._id, consultation._id);
  }

  async attachMissingConsultationsForOnline(appointments) {
    if (!Array.isArray(appointments) || appointments.length === 0) return appointments;
    return Promise.all(
      appointments.map(async (a) => {
        if (a.consultationId) return a;
        if (!this._isOnlineAppointment(a)) return a;
        return this.ensureConsultationForOnlineAppointment(a);
      })
    );
  }

  async create(doctorId, patientId, data) {
    const doctor = await this.userRepository.findById(doctorId);
    const patient = await this.userRepository.findById(patientId);

    if (!doctor) throw ApiError.notFound('Врач не найден');
    if (!patient) throw ApiError.notFound('Пациент не найден');

    // Проверка, что время в пределах рабочего дня врача
    const dayOfWeek = this._getDayOfWeekCode(data.date);
    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      throw ApiError.badRequest('Врач не работает в этот день');
    }

    const [timeHour, timeMin] = data.time.split(':').map(Number);
    const [startHour, startMin] = doctor.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = doctor.workingHours.end.split(':').map(Number);

    const timeInMinutes = timeHour * 60 + timeMin;
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;

    if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
      throw ApiError.badRequest('Время выходит за рамки рабочего дня врача');
    }

    const appointmentDateTime = new Date(`${data.date}T${data.time}:00`);
    if (Number.isNaN(appointmentDateTime.getTime())) {
      throw ApiError.badRequest('Некорректная дата или время записи');
    }
    if (appointmentDateTime <= new Date()) {
      throw ApiError.badRequest('Нельзя записаться на прошедшую дату или время');
    }

    // Проверка, что слот не занят
    const bookedAppointments = await this.appointmentRepository.findByDoctorIdAndDate(doctorId, data.date);
    const isBooked = bookedAppointments.some(a => a.time === data.time && a.status !== 'cancelled');
    if (isBooked) {
      throw new ApiError(409, 'Этот временной слот уже занят');
    }

    const created = await this.appointmentRepository.create({
      doctorId,
      patientId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
      paymentAmount: Number(doctor.price) || 0,
      paymentStatus: 'unpaid',
      ...data
    });
    return this.ensureConsultationForOnlineAppointment(created);
  }

  async getById(id) {
    return this.appointmentRepository.findById(id);
  }

  async getByDoctorId(doctorId) {
    return this.appointmentRepository.findByDoctorId(doctorId);
  }

  async getByPatientId(patientId) {
    return this.appointmentRepository.findByPatientId(patientId);
  }

  async updateStatus(id, status) {
    return this.appointmentRepository.updateStatus(id, status);
  }

  async cancelByPatient(appointmentId, patientId) {
    const appointment = await this.getById(appointmentId);
    if (!appointment) return null;
    if (String(appointment.patientId) !== String(patientId)) {
      throw ApiError.forbidden('Нельзя отменять чужую запись');
    }
    return this.updateStatus(appointmentId, 'cancelled');
  }

  async updateConsultationId(id, consultationId) {
    return this.appointmentRepository.updateConsultationId(id, consultationId);
  }

  async updateDoctorComment(id, doctorComment) {
    return this.appointmentRepository.updateDoctorComment(id, doctorComment);
  }

  async updateDoctorCommentByDoctor(appointmentId, doctorId, doctorComment) {
    const appointment = await this.getById(appointmentId);
    if (!appointment) return null;
    if (String(appointment.doctorId) !== String(doctorId)) {
      throw ApiError.forbidden('Нельзя менять комментарий чужой записи');
    }
    return this.updateDoctorComment(appointmentId, doctorComment);
  }

  async payByPatient(appointmentId, patientId) {
    const appointment = await this.getById(appointmentId);
    if (!appointment) return null;

    if (String(appointment.patientId) !== String(patientId)) {
      throw ApiError.forbidden('Нельзя оплачивать чужую запись');
    }

    if (appointment.status === 'cancelled') {
      throw ApiError.badRequest('Нельзя оплатить отмененную запись');
    }

    if (appointment.paymentStatus === 'paid') {
      return this.ensureConsultationForOnlineAppointment(appointment);
    }

    const amount = Number(appointment.paymentAmount) || 0;
    const paid = await this.appointmentRepository.markAsPaid(appointmentId, amount);
    return paid ? this.ensureConsultationForOnlineAppointment(paid) : null;
  }

  async delete(id) {
    return this.appointmentRepository.delete(id);
  }

  async deleteByDoctor(appointmentId, doctorId) {
    const appointment = await this.getById(appointmentId);
    if (!appointment) return null;
    if (String(appointment.doctorId) !== String(doctorId)) {
      throw ApiError.forbidden('Нельзя удалять чужую запись');
    }
    return this.delete(appointmentId);
  }

  async getAvailableSlots(doctorId, date) {
    const doctor = await this.userRepository.findById(doctorId);
    if (!doctor) throw ApiError.notFound('Врач не найден');

    const dayOfWeek = this._getDayOfWeekCode(date);
    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      return [];
    }

    const bookedAppointments = await this.appointmentRepository.findByDoctorIdAndDate(doctorId, date);
    const allSlots = await this.appointmentRepository.findAvailableSlots(doctorId, date, doctor.workingHours, bookedAppointments);
    const now = new Date();

    return allSlots.filter((slot) => {
      const slotDateTime = new Date(`${date}T${slot}:00`);
      return !Number.isNaN(slotDateTime.getTime()) && slotDateTime > now;
    });
  }

  _getDayOfWeekCode(dateStr) {
    const date = new Date(dateStr);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()];
  }
}

module.exports = AppointmentService;
