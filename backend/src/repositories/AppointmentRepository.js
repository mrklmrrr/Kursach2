const { Appointment } = require('../models');

class AppointmentRepository {
  async create(data) {
    const appointment = new Appointment(data);
    const saved = await appointment.save();
    return saved.toObject();
  }

  async findById(id) {
    const appointment = await Appointment.findById(id);
    return appointment ? appointment.toObject() : null;
  }

  async findByDoctorId(doctorId) {
    const appointments = await Appointment.find({ doctorId }).sort({ date: 1, time: 1 });
    return appointments.map(a => a.toObject());
  }

  async findByPatientId(patientId) {
    const appointments = await Appointment.find({ patientId }).sort({ date: 1, time: 1 });
    return appointments.map(a => a.toObject());
  }

  async findByDoctorIdAndDate(doctorId, date) {
    const appointments = await Appointment.find({ doctorId, date }).sort({ time: 1 });
    return appointments.map(a => a.toObject());
  }

  async updateStatus(id, status) {
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    return appointment ? appointment.toObject() : null;
  }

  async updateConsultationId(id, consultationId) {
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { consultationId },
      { new: true, runValidators: true }
    );
    return appointment ? appointment.toObject() : null;
  }

  async updateDoctorComment(id, doctorComment) {
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { doctorComment },
      { new: true, runValidators: true }
    );
    return appointment ? appointment.toObject() : null;
  }

  async delete(id) {
    const result = await Appointment.findByIdAndDelete(id);
    return result ? result.toObject() : null;
  }

  async findAvailableSlots(doctorId, date, workingHours, bookedAppointments) {
    const slots = [];
    const [startHour, startMin] = workingHours.start.split(':').map(Number);
    const [endHour, endMin] = workingHours.end.split(':').map(Number);

    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      const isBooked = bookedAppointments.some(a => a.time === timeStr && a.status !== 'cancelled');

      if (!isBooked) {
        slots.push(timeStr);
      }

      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    return slots;
  }
}

module.exports = AppointmentRepository;
