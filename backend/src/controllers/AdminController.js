const bcrypt = require('bcryptjs');
const { roles } = require('../constants');

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
}

module.exports = AdminController;
