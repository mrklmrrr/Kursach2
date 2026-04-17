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

module.exports = { hasConsultationAccess };
