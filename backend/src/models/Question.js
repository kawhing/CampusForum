const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  // 课程标签（课程维度问答必选）
  category: { type: String, required: true, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  answered: { type: Boolean, default: false },
  // 被采纳的最佳答案
  acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Answer' },
  solvedAt: { type: Date },
  // 风险识别
  isUrgent: { type: Boolean, default: false },
  urgentReason: { type: String },
  isArchived: { type: Boolean, default: false },
  archiveReason: { type: String },
  viewCount: { type: Number, default: 0 },
  viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  answerCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false }
});

module.exports = mongoose.model('Question', QuestionSchema);
