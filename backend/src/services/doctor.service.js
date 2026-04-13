class DoctorService {
  constructor(doctorModel) {
    this.doctorModel = doctorModel;
  }

  getAll() {
    return this.doctorModel.findAll();
  }

  getById(id) {
    return this.doctorModel.findById(id);
  }
}

module.exports = DoctorService;
