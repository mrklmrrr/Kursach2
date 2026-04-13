const { roles } = require('../constants');

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    return res.status(403).json({ message: 'Доступ запрещён' });
  }
  next();
};

const isAdmin = requireRole(roles.ADMIN);
const isDoctor = requireRole(roles.DOCTOR);
const isPatient = requireRole(roles.PATIENT);
const isDoctorOrAdmin = requireRole(roles.DOCTOR, roles.ADMIN);

module.exports = {
  requireRole,
  isAdmin,
  isDoctor,
  isPatient,
  isDoctorOrAdmin
};
