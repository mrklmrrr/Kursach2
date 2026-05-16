const { RelativeInvite } = require('../models');

class RelativeInviteRepository {
  async create(data) {
    const doc = new RelativeInvite(data);
    const saved = await doc.save();
    return saved.toObject();
  }

  async findById(id) {
    const doc = await RelativeInvite.findById(id);
    return doc ? doc.toObject() : null;
  }

  async findPendingByToUserId(toUserId) {
    const docs = await RelativeInvite.find({ toUserId, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('fromUserId', 'firstName lastName username legacyId');
    return docs.map((d) => d.toObject());
  }

  async findBetween(fromUserId, toUserId) {
    const doc = await RelativeInvite.findOne({ fromUserId, toUserId });
    return doc ? doc.toObject() : null;
  }

  async updateStatus(id, status) {
    const doc = await RelativeInvite.findByIdAndUpdate(id, { status }, { new: true });
    return doc ? doc.toObject() : null;
  }

  async resetToPending(id, { relation, notes }) {
    const doc = await RelativeInvite.findByIdAndUpdate(
      id,
      { status: 'pending', relation, notes: notes || '' },
      { new: true }
    );
    return doc ? doc.toObject() : null;
  }
}

module.exports = RelativeInviteRepository;
