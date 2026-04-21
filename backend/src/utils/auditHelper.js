const { AuditLog } = require('../models');

async function logAudit({ actorId = null, actorRole = '', action, resource = '', details = '' }) {
  try {
    await AuditLog.create({ actorId, actorRole, action, resource, details });
  } catch (e) {
    console.warn('audit log failed', e.message);
  }
}

module.exports = { logAudit };
