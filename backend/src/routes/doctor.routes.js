const express = require('express');
const router = express.Router();

module.exports = function(doctorService) {
  router.get('/api/doctors', (req, res) => {
    res.json(doctorService.getAll());
  });

  router.get('/api/doctors/:id', (req, res) => {
    const doctor = doctorService.getById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Врач не найден' });
    }
    res.json(doctor);
  });

  return router;
};
