const { resolveViewerSide } = require('./chatAccess');
const { User } = require('../models');

const defaultUserLookup = (id) => User.findById(id).select('legacyId').lean();

/** Lazy import avoids circular dependency with config/socket.js */
function resolveIO() {
  const { getIO } = require('../config/socket');
  return typeof getIO === 'function' ? getIO() : null;
}

function getUnreadCounts(consultation) {
  return {
    doctor: Number(consultation?.unreadCounts?.doctor || 0),
    patient: Number(consultation?.unreadCounts?.patient || 0)
  };
}

/**
 * If the unread receiver is currently in the chat room, reset their unread counter.
 */
async function resetUnreadForReceiversInRoom(consultationRepository, consultation, receiverSide) {
  const io = resolveIO();
  if (!io || !consultation || (receiverSide !== 'doctor' && receiverSide !== 'patient')) {
    return false;
  }

  const chatId = String(consultation._id);
  const roomSockets = await io.in(`chat-${chatId}`).fetchSockets();

  for (const remoteSocket of roomSockets) {
    const userId = remoteSocket.data?.userId;
    const userRole = remoteSocket.data?.userRole;
    if (!userId) continue;

    const viewerSide = await resolveViewerSide(consultation, userId, userRole, defaultUserLookup);
    if (viewerSide === receiverSide) {
      await consultationRepository.resetUnreadForViewer(chatId, receiverSide);
      return true;
    }
  }

  return false;
}

async function markConsultationReadForUser(consultationRepository, consultation, userId, userRole) {
  const viewerSide = await resolveViewerSide(consultation, userId, userRole, defaultUserLookup);
  if (!viewerSide) return null;

  const updated = await consultationRepository.resetUnreadForViewer(String(consultation._id), viewerSide);
  return {
    viewerSide,
    unreadCounts: getUnreadCounts(updated)
  };
}

module.exports = {
  getUnreadCounts,
  resetUnreadForReceiversInRoom,
  markConsultationReadForUser
};
