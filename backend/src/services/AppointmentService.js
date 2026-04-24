const ApiError = require('../utils/ApiError');

class AppointmentService {
  constructor(appointmentRepository, userRepository) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
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

    return this.appointmentRepository.create({
      doctorId,
      patientId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
      paymentAmount: Number(doctor.price) || 0,
      paymentStatus: 'unpaid',
      ...data
    });
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
      return appointment;
    }

    const amount = Number(appointment.paymentAmount) || 0;
    return this.appointmentRepository.markAsPaid(appointmentId, amount);
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
