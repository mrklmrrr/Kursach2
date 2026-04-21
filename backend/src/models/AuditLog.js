const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actorRole: { type: String, default: '' },
  action: { type: String, required: true },
  resource: { type: String, default: '' },
  details: { type: String, default: '' }
}, { timestamps: true, autoIndex: false });

auditLogSchema.index({ createdAt: -1 }, { name: 'audit_created_idx' });

module.exports = mongoose.model('AuditLog', auditLogSchema);
