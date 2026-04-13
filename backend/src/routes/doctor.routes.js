const express = require('express');
const router = express.Router();

module.exports = function(doctorController) {
  router.get('/api/doctors', (req, res) => doctorController.getAll(req, res));
  router.get('/api/doctors/:id', (req, res) => doctorController.getById(req, res));

  return router;
};
