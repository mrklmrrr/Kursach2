const { roles, consultationStatus } = require('../constants');

class DoctorPanelController {
  constructor(doctorService, consultationService) {
    this.doctorService = doctorService;
    this.consultationService = consultationService;
  }

  /** Профиль врача */
  async getProfile(req, res) {
    try {
      const doctor = await this.doctorService.getById(req.userId);
      if (!doctor) {
        return res.status(404).json({ message: 'Профиль не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Обновить профиль */
  async updateProfile(req, res) {
    try {
      const { specialty, price, experience, description } = req.body;
      const updates = {};
      if (specialty) updates.specialty = specialty;
      if (price !== undefined) updates.price = Number(price);
      if (experience !== undefined) updates.experience = Number(experience);
      if (description !== undefined) updates.description = description;

      const doctor = await this.doctorService.updateDoctor(req.userId, updates);
      if (!doctor) {
        return res.status(404).json({ message: 'Профиль не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Переключить онлайн-статус */
  async toggleOnline(req, res) {
    try {
      const { isOnline } = req.body;
      const doctor = await this.doctorService.toggleOnline(req.userId, isOnline);
      if (!doctor) {
        return res.status(404).json({ message: 'Профиль не найден' });
      }
      res.json(doctor);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Список всех консультаций врача */
  async getConsultations(req, res) {
    try {
      const consultations = await this.consultationService.getByDoctorId(req.userId);
      res.json(consultations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Заявки на консультацию (pending) */
  async getPendingConsultations(req, res) {
    try {
      const all = await this.consultationService.getByDoctorId(req.userId);
      const pending = all.filter(c => c.status === consultationStatus.PENDING);
      res.json(pending);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Ближайшие консультации (paid, active) */
  async getUpcomingConsultations(req, res) {
    try {
      const all = await this.consultationService.getByDoctorId(req.userId);
      const upcoming = all.filter(c =>
        c.status === consultationStatus.PAID || c.status === consultationStatus.ACTIVE
      );
      res.json(upcoming);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Принять заявку */
  async acceptConsultation(req, res) {
    try {
      const consultation = await this.consultationService.updateStatus(
        req.params.id,
        consultationStatus.ACTIVE
      );
      if (!consultation) {
        return res.status(404).json({ message: 'Консультация не найдена' });
      }
      res.json({ message: 'Заявка принята', consultation });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Отклонить заявку */
  async rejectConsultation(req, res) {
    try {
      const consultation = await this.consultationService.updateStatus(
        req.params.id,
        consultationStatus.CANCELLED
      );
      if (!consultation) {
        return res.status(404).json({ message: 'Консультация не найдена' });
      }
      res.json({ message: 'Заявка отклонена', consultation });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Завершить консультацию */
  async completeConsultation(req, res) {
    try {
      const consultation = await this.consultationService.updateStatus(
        req.params.id,
        consultationStatus.COMPLETED
      );
      if (!consultation) {
        return res.status(404).json({ message: 'Консультация не найдена' });
      }
      res.json({ message: 'Консультация завершена', consultation });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** Список пациентов */
  async getPatients(req, res) {
    try {
      const consultations = await this.consultationService.getByDoctorId(req.userId);
      const patientIds = [...new Set(consultations.map(c => c.patientId))];

      const { User } = require('../models');
      const users = await User.find({ legacyId: { $in: patientIds } });

      const patients = patientIds.map(id => {
        const user = users.find(u => u.legacyId === id);
        return user ? {
          id: user.legacyId,
          name: user.firstName + ' ' + user.lastName,
          phone: user.phone,
          consultationCount: consultations.filter(c => c.patientId === id).length
        } : null;
      }).filter(Boolean);

      res.json(patients);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = DoctorPanelController;
