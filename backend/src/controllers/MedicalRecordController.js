class MedicalRecordController {
  constructor(medicalRecordService, userRepository) {
    this.medicalRecordService = medicalRecordService;
    this.userRepository = userRepository;
  }

  async getMyRecord(req, res) {
    const patient = await this.userRepository.findById(req.userId);
    if (!patient) {
      return res.status(404).json({ message: 'Пациент не найден' });
    }

    const record = await this.medicalRecordService.getByPatientId(req.userId);
    res.json({
      patient: this._toPatientProfile(patient),
      ...this._toResponseRecord(record)
    });
  }

  async getPatientRecord(req, res) {
    const patient = await this.userRepository.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Пациент не найден' });
    }

    const record = await this.medicalRecordService.getByPatientId(req.params.patientId);
    res.json({
      patient: this._toPatientProfile(patient),
      ...this._toResponseRecord(record)
    });
  }

  async updatePatientSection(req, res) {
    const record = await this.medicalRecordService.updateSection(
      req.params.patientId,
      req.params.sectionKey,
      req.body,
      req.userId
    );
    res.json(this._toResponseRecord(record));
  }

  async createPatientSickLeave(req, res) {
    const record = await this.medicalRecordService.createSickLeave(
      req.params.patientId,
      req.body,
      req.userId
    );
    res.json(this._toResponseRecord(record));
  }

  async updatePatientSickLeave(req, res) {
    const record = await this.medicalRecordService.updateSickLeave(
      req.params.patientId,
      req.params.sickLeaveId,
      req.body,
      req.userId
    );
    res.json(this._toResponseRecord(record));
  }

  _toPatientProfile(patient) {
    const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim();
    return {
      id: patient._id,
      name: fullName || 'Пациент',
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      phone: patient.phone || '',
      birthDate: patient.birthDate || '',
      age: patient.age || null
    };
  }

  _toResponseRecord(record) {
    return {
      id: record._id,
      patientId: record.patientId,
      systems: record.systems || [],
      changeLogs: (record.changeLogs || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      sickLeaves: (record.sickLeaves || []).slice().sort((a, b) => new Date(b.issueDate || b.createdAt || 0) - new Date(a.issueDate || a.createdAt || 0))
    };
  }
}

module.exports = MedicalRecordController;
