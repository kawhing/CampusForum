const mongoose = require('mongoose');

const PrivateMessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

PrivateMessageSchema.index({ from: 1, to: 1, createdAt: -1 });
PrivateMessageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports = mongoose.model('PrivateMessage', PrivateMessageSchema);
