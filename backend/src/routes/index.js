const authRoutes = require('./auth.routes');
const doctorRoutes = require('./doctor.routes');
const consultationRoutes = require('./consultation.routes');
const paymentRoutes = require('./payment.routes');
const dependentRoutes = require('./dependent.routes');
const adminRoutes = require('./admin.routes');
const doctorPanelRoutes = require('./doctor-panel.routes');

module.exports = {
  authRoutes,
  doctorRoutes,
  consultationRoutes,
  paymentRoutes,
  dependentRoutes,
  adminRoutes,
  doctorPanelRoutes
};
