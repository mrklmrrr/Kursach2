const mongoose = require('mongoose');

const dependentSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  relation: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Dependent', dependentSchema);
