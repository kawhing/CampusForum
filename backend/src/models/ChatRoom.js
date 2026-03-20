const mongoose = require('mongoose');

const ChatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  tags: [{ type: String, trim: true }],
  isPublic: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

ChatRoomSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('ChatRoom', ChatRoomSchema);
