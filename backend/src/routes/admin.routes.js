const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');

module.exports = function(adminController) {
  // Вход админа (публичный)
  router.post('/api/admin/login', validate(authSchemas.adminLogin), asyncHandler((req, res) => adminController.loginAdmin(req, res)));

  // Все маршруты защищены: auth + isAdmin
  router.get('/api/admin/dashboard', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.getDashboard(req, res)));

  // Врачи
  router.get('/api/admin/doctors', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.getDoctors(req, res)));
  router.post('/api/admin/doctors', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.createDoctor(req, res)));
  router.put('/api/admin/doctors/:id', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.updateDoctor(req, res)));
  router.delete('/api/admin/doctors/:id', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.deleteDoctor(req, res)));
  router.patch('/api/admin/doctors/:id/online', authMiddleware, isAdmin,
    asyncHandler((req, res) => adminController.toggleDoctorOnline(req, res)));

  return router;
};
