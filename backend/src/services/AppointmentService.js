class AppointmentService {
  constructor(appointmentRepository, userRepository) {
    this.appointmentRepository = appointmentRepository;
    this.userRepository = userRepository;
  }

  async create(doctorId, patientId, data) {
    const doctor = await this.userRepository.findById(doctorId);
    const patient = await this.userRepository.findById(patientId);

    if (!doctor) throw new Error('Врач не найден');
    if (!patient) throw new Error('Пациент не найден');

    // Проверка, что время в пределах рабочего дня врача
    const dayOfWeek = this._getDayOfWeekCode(data.date);
    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      throw new Error('Врач не работает в этот день');
    }

    const [timeHour, timeMin] = data.time.split(':').map(Number);
    const [startHour, startMin] = doctor.workingHours.start.split(':').map(Number);
    const [endHour, endMin] = doctor.workingHours.end.split(':').map(Number);

    const timeInMinutes = timeHour * 60 + timeMin;
    const startInMinutes = startHour * 60 + startMin;
    const endInMinutes = endHour * 60 + endMin;

    if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
      throw new Error('Время выходит за рамки рабочего дня врача');
    }

    // Проверка, что слот не занят
    const bookedAppointments = await this.appointmentRepository.findByDoctorIdAndDate(doctorId, data.date);
    const isBooked = bookedAppointments.some(a => a.time === data.time && a.status !== 'cancelled');
    if (isBooked) {
      throw new Error('Этот временной слот уже занят');
    }

    return this.appointmentRepository.create({
      doctorId,
      patientId,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      patientName: `${patient.firstName} ${patient.lastName}`,
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

  async updateConsultationId(id, consultationId) {
    return this.appointmentRepository.updateConsultationId(id, consultationId);
  }

  async updateDoctorComment(id, doctorComment) {
    return this.appointmentRepository.updateDoctorComment(id, doctorComment);
  }

  async delete(id) {
    return this.appointmentRepository.delete(id);
  }

  async getAvailableSlots(doctorId, date) {
    const doctor = await this.userRepository.findById(doctorId);
    if (!doctor) throw new Error('Врач не найден');

    const dayOfWeek = this._getDayOfWeekCode(date);
    if (!doctor.workingDays || !doctor.workingDays.includes(dayOfWeek)) {
      return [];
    }

    const bookedAppointments = await this.appointmentRepository.findByDoctorIdAndDate(doctorId, date);
    return this.appointmentRepository.findAvailableSlots(doctorId, date, doctor.workingHours, bookedAppointments);
  }

  _getDayOfWeekCode(dateStr) {
    const date = new Date(dateStr);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[date.getDay()];
  }
}

module.exports = AppointmentService;
