const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  content: { type: String, required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPinned: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  commentCount: { type: Number, default: 0 },
  // 记录因点赞优质回答而获得信誉恢复的用户，避免重复刷分
  trustRecoveryVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Answer', AnswerSchema);
