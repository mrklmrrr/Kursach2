const mongoose = require('mongoose');

const dependentSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  relation: { type: String, required: true }
}, { timestamps: true, autoIndex: false });

dependentSchema.index({ userId: 1 }, { name: 'userId_idx' });

module.exports = mongoose.model('Dependent', dependentSchema);
