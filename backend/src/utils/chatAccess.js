async function resolveViewerSide(consultation, userId, userRole, userLookup) {
  if (!consultation) return null;

  const userIdAsString = String(userId || '');
  if (userIdAsString && String(consultation.doctorId) === userIdAsString) {
    return 'doctor';
  }

  if (userIdAsString && String(consultation.patientId) === userIdAsString) {
    return 'patient';
  }

  if (typeof userLookup === 'function' && userIdAsString) {
    const currentUser = await userLookup(userId);
    if (currentUser?.legacyId != null && String(consultation.patientId) === String(currentUser.legacyId)) {
      return 'patient';
    }
  }

  if (userRole === 'doctor') return 'doctor';
  if (userRole === 'patient' || userRole === 'user') return 'patient';
  return null;
}

async function hasConsultationAccess(consultation, userId, userRole, userLookup) {
  if (!consultation) return false;
  if (userRole === 'admin') return true;

  const userIdAsString = String(userId);
  const isDoctor = String(consultation.doctorId) === userIdAsString;
  let isPatient = String(consultation.patientId) === userIdAsString;

  if (!isPatient && typeof userLookup === 'function') {
    const currentUser = await userLookup(userId);
    if (currentUser && currentUser.legacyId !== null && currentUser.legacyId !== undefined) {
      isPatient = String(consultation.patientId) === String(currentUser.legacyId);
    }
  }

  return isDoctor || isPatient;
}

module.exports = { hasConsultationAccess, resolveViewerSide };
