const { roles } = require('../constants');

/**
 * Эффективный онлайн-статус для отображения в UI:
 * - врач: доступен (isOnline в БД) И подключён по socket;
 * - пациент / админ: подключён по socket.
 */
function getPresenceForUser(user, isUserConnected) {
  if (!user || typeof isUserConnected !== 'function') return false;

  const userId = user._id || user.id;
  const connected = Boolean(userId && isUserConnected(userId));

  if (user.role === roles.DOCTOR) {
    return Boolean(user.isOnline) && connected;
  }

  return connected;
}

function mapDoctorPresence(doctor, isUserConnected) {
  if (!doctor) return doctor;
  return {
    ...doctor,
    isOnline: getPresenceForUser(doctor, isUserConnected)
  };
}

module.exports = {
  getPresenceForUser,
  mapDoctorPresence
};
