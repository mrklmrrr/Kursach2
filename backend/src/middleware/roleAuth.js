const { roles } = require('../constants');
const ApiError = require('../utils/ApiError');

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.userRole || !allowedRoles.includes(req.userRole)) {
    return next(ApiError.forbidden('Недостаточно прав для выполнения операции'));
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
