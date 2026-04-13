class ConsultationService {
  constructor(consultationModel) {
    this.consultationModel = consultationModel;
  }

  create(data) {
    return this.consultationModel.create(data);
  }

  getById(id) {
    return this.consultationModel.findById(id);
  }

  getByPatientId(patientId) {
    return this.consultationModel.findByPatientId(patientId);
  }
}

module.exports = ConsultationService;
