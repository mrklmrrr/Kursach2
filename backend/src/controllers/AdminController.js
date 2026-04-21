const bcrypt = require('bcryptjs');
const { roles } = require('../constants');
const { logAudit } = require('../utils/auditHelper');

class AdminController {
  constructor(doctorService, consultationService, authService) {
    this.doctorService = doctorService;
    this.consultationService = consultationService;
    this.authService = authService;
  }

  /* ---------- Вход админа ---------- */

  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginAdmin(email, password);
      await logAudit({
        actorId: result.user?.id,
        actorRole: 'admin',
        action: 'auth.login',
        resource: 'AdminPanel',
        details: String(email || '')
      });
      res.json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  }

  /* ---------- Врачи ---------- */

  async getDoctors(req, res) {
    try {
      const doctors = await this.doctorService.getAll();
      res.json(doctors);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async createDoctor(req, res) {
    try {
      const {
        firstName, lastName, email, phone,
        specialty, price, experience, description, password
      } = req.body;

      if (!firstName || !lastName || !specialty || !price) {
        return res.status(400).json({ message: 'Заполните обязательные поля' });
      }

      const hashedPassword = password
        ? await bcrypt.hash(password, 10)
        : await bcrypt.hash('doctor123', 10);

      const doctor = await this.doctorService.createDoctor({
        firstName,
        lastName,
        email,
        phone,
        specialty,
        price: Number(price),
        experience: experience ? Number(experience) : undefined,
        description,
        password: hashedPassword
      });

      await logAudit({
        actorId: req.userId,
        actorRole: 'admin',
        action: 'doctor.create',
        resource: `User:${doctor.id || doctor._id}`,
        details: `${firstName} ${lastName}`
      });
      res.status(201).json({ message: 'Врач создан', doctor });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async updateDoctor(req, res) {
    try {
      const { firstName, lastName, specialty, price, experience, description } = req.body;
      const updates = {};

      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (specialty) updates.specialty = specialty;
      if (price !== undefined) updates.price = Number(price);
      if (experience !== undefined) updates.experience = Number(experience);
      if (description !== undefined) updates.description = description;

      const doctor = await this.doctorService.updateDoctor(req.params.id, updates);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async deleteDoctor(req, res) {
    try {
      const doctor = await this.doctorService.deleteDoctor(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json({ message: 'Врач удалён' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async toggleDoctorOnline(req, res) {
    try {
      const { isOnline } = req.body;
      const doctor = await this.doctorService.toggleOnline(req.params.id, isOnline);
      if (!doctor) {
        return res.status(404).json({ message: 'Врач не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /* ---------- Статистика ---------- */

  async getDashboard(req, res) {
    try {
      const { User } = require('../models');
      const totalPatients = await User.countDocuments({ role: roles.PATIENT });
      const totalDoctors = await User.countDocuments({ role: roles.DOCTOR });
      const totalConsultations = await this.consultationService.countAll();
      const pendingConsultations = await this.consultationService.countByStatus('pending');

      res.json({
        totalPatients,
        totalDoctors,
        totalConsultations,
        pendingConsultations
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getB2BMetrics(req, res) {
    try {
      const { Appointment, User, Prescription } = require('../models');

      const totalAppointments = await Appointment.countDocuments();
      const paidAppointments = await Appointment.countDocuments({ paymentStatus: 'paid' });
      const scheduled = await Appointment.countDocuments({ status: { $in: ['scheduled', 'confirmed'] } });
      const conversionBookingToPaymentPercent = totalAppointments > 0
        ? Math.round((paidAppointments / totalAppointments) * 1000) / 10
        : 0;

      const repeatPatients = await Appointment.aggregate([
        { $group: { _id: '$patientId', c: { $sum: 1 } } },
        { $match: { c: { $gt: 1 } } }
      ]);
      const distinctPatients = await Appointment.distinct('patientId');
      const repeatVisitPercent = distinctPatients.length > 0
        ? Math.round((repeatPatients.length / distinctPatients.length) * 1000) / 10
        : 0;

      const doctorsCount = await User.countDocuments({ role: roles.DOCTOR });
      const appointmentsPerDoctor = doctorsCount > 0
        ? Math.round((totalAppointments / doctorsCount) * 10) / 10
        : 0;

      const ePrescriptionsTotal = await Prescription.countDocuments();

      res.json({
        totalAppointments,
        paidAppointments,
        scheduledFuture: scheduled,
        conversionBookingToPaymentPercent,
        repeatVisitPercent,
        appointmentsPerDoctor,
        slaFirstResponseMin: 12,
        ePrescriptionsTotal,
        reminderQueueHint:
          'Напоминания: cron каждые 10 мин, SMTP + Telegram Bot (см. .env и DEMO.md §5)'
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  async getAuditLog(req, res) {
    try {
      const { AuditLog } = require('../models');
      const entries = await AuditLog.find().sort({ createdAt: -1 }).limit(200).lean();
      res.json(entries);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AdminController;
