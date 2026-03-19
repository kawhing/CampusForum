const mongoose = require('mongoose');

const AppealSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['question', 'answer', 'account'], required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminResponse: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appeal', AppealSchema);
