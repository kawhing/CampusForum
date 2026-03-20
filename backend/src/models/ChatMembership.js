const mongoose = require('mongoose');

const ChatMembershipSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, required: true, trim: true },
  joinedAt: { type: Date, default: Date.now }
});

ChatMembershipSchema.index({ room: 1, nickname: 1 }, { unique: true });
ChatMembershipSchema.index({ room: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ChatMembership', ChatMembershipSchema);
