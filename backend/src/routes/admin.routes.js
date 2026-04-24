const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleAuth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { authSchemas } = require('../validation/schemas');

module.exports = function(adminController) {
  // Вход админа (публичный)
  router.post('/api/admin/login', validate(authSchemas.adminLogin), asyncHandler((...args) => adminController.loginAdmin(...args)));

  // Все маршруты защищены: auth + isAdmin
  router.get('/api/admin/dashboard', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.getDashboard(...args)));

  // Врачи
  router.get('/api/admin/doctors', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.getDoctors(...args)));
  router.post('/api/admin/doctors', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.createDoctor(...args)));
  router.put('/api/admin/doctors/:id', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.updateDoctor(...args)));
  router.delete('/api/admin/doctors/:id', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.deleteDoctor(...args)));
  router.patch('/api/admin/doctors/:id/online', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.toggleDoctorOnline(...args)));

  router.get('/api/admin/b2b-metrics', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.getB2BMetrics(...args)));
  router.get('/api/admin/audit-log', authMiddleware, isAdmin,
    asyncHandler((...args) => adminController.getAuditLog(...args)));

  return router;
};
