const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

module.exports = function(consultationService, userModel) {
  router.post('/api/consultations', authMiddleware, (req, res) => {
    const { doctorId, doctorName, specialty, price, duration, type = 'video' } = req.body;

    const user = userModel.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    const consultation = consultationService.create({
      doctorId,
      doctorName,
      specialty,
      price,
      duration,
      patientId: user.id,
      patientName: `${user.firstName} ${user.lastName}`,
      type
    });

    res.json({ consultationId: consultation.id, ...consultation });
  });

  router.get('/api/consultations/:id', authMiddleware, (req, res) => {
    const consultation = consultationService.getById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ message: 'Консультация не найдена' });
    }
    res.json(consultation);
  });

  router.get('/api/consultations/patient/:patientId', authMiddleware, (req, res) => {
    const consultations = consultationService.getByPatientId(parseInt(req.params.patientId));
    res.json(consultations);
  });

  return router;
};
