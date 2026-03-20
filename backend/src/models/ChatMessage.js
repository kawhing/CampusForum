const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  nickname: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

ChatMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
