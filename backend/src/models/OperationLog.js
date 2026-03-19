const mongoose = require('mongoose');

const OperationLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionType: {
    type: String,
    required: true,
    enum: ['archive', 'unarchive', 'delete', 'pin', 'unpin', 'ban_user', 'unban_user', 'change_category', 'approve_appeal', 'reject_appeal']
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, required: true, enum: ['question', 'answer', 'user', 'appeal'] },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OperationLog', OperationLogSchema);
