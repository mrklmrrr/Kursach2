const mongoose = require('mongoose');

const relativeInviteSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relation: { type: String, required: true },
  notes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true, autoIndex: false });

relativeInviteSchema.index({ toUserId: 1, status: 1 }, { name: 'toUser_status_idx' });
relativeInviteSchema.index(
  { fromUserId: 1, toUserId: 1 },
  { unique: true, name: 'from_to_unique_idx' }
);

module.exports = mongoose.model('RelativeInvite', relativeInviteSchema);
