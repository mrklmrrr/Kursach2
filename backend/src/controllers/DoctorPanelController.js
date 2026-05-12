const { consultationStatus } = require('../constants');
const ApiError = require('../utils/ApiError');

class DoctorPanelController {
  constructor(doctorService, consultationService, dependentService) {
    this.doctorService = doctorService;
    this.consultationService = consultationService;
    this.dependentService = dependentService;
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

  /** Ближайшие консультации (paid, active) */
  async getUpcomingConsultations(req, res) {
    const all = await this.consultationService.getByDoctorId(req.userId);
    const upcoming = all.filter(c =>
      c.status === consultationStatus.PAID || c.status === consultationStatus.ACTIVE
    );
    res.json(upcoming);
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
        legacyId: legacyId || null,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        age: user.age || null,
        consultationCount
      });
    }

    res.json(patients);
  }

  /** Родственники пациента (для врача) */
  async getPatientDependents(req, res) {
    const patientId = String(req.params.patientId || '').trim();
    if (!patientId) {
      throw ApiError.badRequest('Не указан идентификатор пациента');
    }

    const consultations = await this.consultationService.getByDoctorId(req.userId);
    const { UserRepository } = require('../repositories');
    const userRepo = new UserRepository();
    const patient = await userRepo.findById(patientId);
    if (!patient) {
      throw ApiError.notFound('Пациент не найден');
    }

    const objectId = String(patient.id || patient._id || '');
    const legacyId = patient.legacyId !== undefined && patient.legacyId !== null
      ? String(patient.legacyId)
      : null;

    const hasAccess = consultations.some((consultation) => {
      const consultationPatientId = String(consultation.patientId || '');
      return consultationPatientId === objectId || (legacyId && consultationPatientId === legacyId);
    });

    if (!hasAccess) {
      throw ApiError.forbidden('Нет доступа к родственникам этого пациента');
    }

    const dependents = await this.dependentService.getByUserId(objectId);
    res.json(Array.isArray(dependents) ? dependents : []);
  }
}

module.exports = DoctorPanelController;
