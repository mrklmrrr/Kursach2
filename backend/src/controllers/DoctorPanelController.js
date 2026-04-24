const { consultationStatus } = require('../constants');
const ApiError = require('../utils/ApiError');

class DoctorPanelController {
  constructor(doctorService, consultationService) {
    this.doctorService = doctorService;
    this.consultationService = consultationService;
  }

  /** Профиль врача */
  async getProfile(req, res) {
    const doctor = await this.doctorService.getById(req.userId);
    if (!doctor) {
      throw ApiError.notFound('Профиль не найден');
    }
    res.json(doctor);
  }

  /** Обновить профиль */
  async updateProfile(req, res) {
    const { specialty, price, experience, description } = req.body;
    const updates = {};
    if (specialty) updates.specialty = specialty;
    if (price !== undefined) updates.price = Number(price);
    if (experience !== undefined) updates.experience = Number(experience);
    if (description !== undefined) updates.description = description;

    const doctor = await this.doctorService.updateDoctor(req.userId, updates);
    if (!doctor) {
      throw ApiError.notFound('Профиль не найден');
    }
    res.json(doctor);
  }

  /** Переключить онлайн-статус */
  async toggleOnline(req, res) {
    const { isOnline } = req.body;
    const doctor = await this.doctorService.toggleOnline(req.userId, isOnline);
    if (!doctor) {
      throw ApiError.notFound('Профиль не найден');
    }
    res.json(doctor);
  }

  /** Список всех консультаций врача */
  async getConsultations(req, res) {
    const consultations = await this.consultationService.getByDoctorId(req.userId);
    res.json(consultations);
  }

  /** Заявки на консультацию (pending) */
  async getPendingConsultations(req, res) {
    const all = await this.consultationService.getByDoctorId(req.userId);
    const pending = all.filter(c => c.status === consultationStatus.PENDING);
    res.json(pending);
  }

  /** Ближайшие консультации (paid, active) */
  async getUpcomingConsultations(req, res) {
    const all = await this.consultationService.getByDoctorId(req.userId);
    const upcoming = all.filter(c =>
      c.status === consultationStatus.PAID || c.status === consultationStatus.ACTIVE
    );
    res.json(upcoming);
  }

  /** Принять заявку */
  async acceptConsultation(req, res) {
    const consultation = await this.consultationService.updateStatusByDoctor(
      req.params.id,
      req.userId,
      consultationStatus.ACTIVE
    );
    if (!consultation) {
      throw ApiError.notFound('Консультация не найдена');
    }
    res.json({ message: 'Заявка принята', consultation });
  }

  /** Отклонить заявку */
  async rejectConsultation(req, res) {
    const consultation = await this.consultationService.updateStatusByDoctor(
      req.params.id,
      req.userId,
      consultationStatus.CANCELLED
    );
    if (!consultation) {
      throw ApiError.notFound('Консультация не найдена');
    }
    res.json({ message: 'Заявка отклонена', consultation });
  }

  /** Завершить консультацию */
  async completeConsultation(req, res) {
    const consultation = await this.consultationService.updateStatusByDoctor(
      req.params.id,
      req.userId,
      consultationStatus.COMPLETED
    );
    if (!consultation) {
      throw ApiError.notFound('Консультация не найдена');
    }
    res.json({ message: 'Консультация завершена', consultation });
  }

  /** Список пациентов */
  async getPatients(req, res) {
    const consultations = await this.consultationService.getByDoctorId(req.userId);
    const patientIds = [...new Set(consultations.map(c => String(c.patientId)))].filter(Boolean);

    const { UserRepository } = require('../repositories');
    const userRepo = new UserRepository();

    const patients = [];
    for (const id of patientIds) {
      const user = await userRepo.findById(id);
      if (!user) continue;

      const objectId = String(user.id || user._id || '');
      const legacyId = user.legacyId !== undefined && user.legacyId !== null
        ? String(user.legacyId)
        : null;

      const consultationCount = consultations.filter((c) => {
        const consultationPatientId = String(c.patientId);
        return consultationPatientId === objectId || (legacyId && consultationPatientId === legacyId);
      }).length;

      patients.push({
        id: objectId || id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        age: user.age || null,
        consultationCount
      });
    }

    res.json(patients);
  }
}

module.exports = DoctorPanelController;
