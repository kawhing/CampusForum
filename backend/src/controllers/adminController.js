const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');
const User = require('../models/User');
const OperationLog = require('../models/OperationLog');
const Appeal = require('../models/Appeal');
const Notification = require('../models/Notification');

const archiveQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    question.isArchived = true;
    question.archiveReason = reason;
    await question.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'archive',
      targetId: question._id,
      targetType: 'question',
      reason
    });

    if (question.createdBy) {
      await Notification.create({
        userId: question.createdBy,
        message: `Your question "${question.title}" has been archived. Reason: ${reason}`,
        type: 'archive',
        relatedId: question._id
      });
    }

    return res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const unarchiveQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    question.isArchived = false;
    question.archiveReason = undefined;
    await question.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'unarchive',
      targetId: question._id,
      targetType: 'question',
      reason
    });

    return res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const reason = req.body.reason || 'No reason provided';

    const answers = await Answer.find({ questionId: id });
    const answerIds = answers.map((a) => a._id);
    await Comment.deleteMany({ answerId: { $in: answerIds } });
    await Answer.deleteMany({ questionId: id });
    await Question.findByIdAndDelete(id);

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'delete',
      targetId: question._id,
      targetType: 'question',
      reason
    });

    return res.status(200).json({ message: 'Question and related content deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    answer.isDeleted = true;
    await answer.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'delete',
      targetId: answer._id,
      targetType: 'answer',
      reason
    });

    return res.status(200).json({ message: 'Answer deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const pinAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    const wasPinned = answer.isPinned;
    answer.isPinned = !wasPinned;
    await answer.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: wasPinned ? 'unpin' : 'pin',
      targetId: answer._id,
      targetType: 'answer',
      reason
    });

    return res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    user.isBlocked = true;
    user.blockReason = reason;
    user.activeToken = null;
    await user.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'ban_user',
      targetId: user._id,
      targetType: 'user',
      reason
    });

    await Notification.create({
      userId: user._id,
      message: `Your account has been banned. Reason: ${reason}`,
      type: 'ban',
      relatedId: user._id
    });

    return res.status(200).json({ message: 'User banned' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reason = req.body.reason || 'No reason provided';
    user.isBlocked = false;
    user.blockReason = undefined;
    await user.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'unban_user',
      targetId: user._id,
      targetType: 'user',
      reason
    });

    await Notification.create({
      userId: user._id,
      message: 'Your account ban has been lifted.',
      type: 'unban',
      relatedId: user._id
    });

    return res.status(200).json({ message: 'User unbanned' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const changeQuestionCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const reason = req.body.reason || `Category changed to ${category}`;
    question.category = category.trim();
    await question.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: 'change_category',
      targetId: question._id,
      targetType: 'question',
      reason
    });

    return res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getOperationLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const total = await OperationLog.countDocuments();
    const pages = Math.ceil(total / limit);
    const logs = await OperationLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('adminId', 'username email');

    return res.status(200).json({ logs, total, page, pages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('userId', 'username email');
    return res.status(200).json({ appeals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const resolveAppeal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appeal ID' });
    }
    const { status, adminResponse, evidenceText, evidenceUrls } = req.body;
    const reason = (req.body.reason || '').trim();
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }
    if (!reason) {
      return res.status(400).json({ message: 'Field "reason" is required when resolving appeals' });
    }

    const appeal = await Appeal.findById(id);
    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    appeal.status = status;
    appeal.adminResponse = adminResponse || reason;
    if (evidenceText) appeal.evidenceText = evidenceText;
    if (Array.isArray(evidenceUrls)) appeal.evidenceUrls = evidenceUrls;
    await appeal.save();

    await OperationLog.create({
      adminId: req.user._id,
      actionType: status === 'approved' ? 'approve_appeal' : 'reject_appeal',
      targetId: appeal._id,
      targetType: 'appeal',
      reason
    });

    await Notification.create({
      userId: appeal.userId,
      message: `Your appeal has been ${status}. ${adminResponse || ''}`.trim(),
      type: 'appeal_result',
      relatedId: appeal._id
    });

    return res.status(200).json({ appeal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getStats = async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [users, questions, answers, pendingAppeals] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      Answer.countDocuments({ isDeleted: false }),
      Appeal.countDocuments({ status: 'pending' })
    ]);

    const recentQuestions = await Question.find({ createdAt: { $gte: twentyFourHoursAgo } });
    const firstResponseCount = recentQuestions.filter((q) => q.answerCount > 0).length;
    const firstResponseRate = recentQuestions.length ? firstResponseCount / recentQuestions.length : 0;

    const recentArchives = await Question.countDocuments({ isArchived: true, createdAt: { $gte: twentyFourHoursAgo } });
    const violationRate = recentQuestions.length ? recentArchives / recentQuestions.length : 0;

    const appealWindowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const appealTotal = await Appeal.countDocuments({ createdAt: { $gte: appealWindowStart } });
    const appealApproved = await Appeal.countDocuments({ createdAt: { $gte: appealWindowStart }, status: 'approved' });
    const appealPassRate = appealTotal ? appealApproved / appealTotal : 0;

    const resolvedAppeals = await Appeal.find({ status: { $in: ['approved', 'rejected'] }, createdAt: { $gte: appealWindowStart } });
    const resolvedWithTimestamps = resolvedAppeals.filter((a) => a.updatedAt);
    const avgHandleMs = resolvedWithTimestamps.length
      ? resolvedWithTimestamps.reduce((sum, a) => sum + (a.updatedAt.getTime() - a.createdAt.getTime()), 0) /
        resolvedWithTimestamps.length
      : 0;

    // 按课程聚合解决率
    const courseAgg = await Question.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          solved: { $sum: { $cond: [{ $ifNull: ['$acceptedAnswerId', false] }, 1, 0] } },
          avgSolveHours: {
            $avg: {
              $cond: [
                { $and: ['$solvedAt', '$createdAt'] },
                { $divide: [{ $subtract: ['$solvedAt', '$createdAt'] }, 1000 * 60 * 60] },
                null
              ]
            }
          }
        }
      }
    ]);

    const urgentQueue = await Question.find({ isUrgent: true, isArchived: false }).sort({ createdAt: -1 }).limit(20);

    return res.status(200).json({
      users,
      questions,
      answers,
      pendingAppeals,
      firstResponseRate,
      violationRate,
      appealPassRate,
      avgHandleHours: avgHandleMs / (1000 * 60 * 60),
      courseStats: courseAgg.map((c) => ({
        course: c._id,
        total: c.total,
        solved: c.solved,
        solveRate: c.total ? c.solved / c.total : 0,
        avgSolveHours: c.avgSolveHours || 0
      })),
      urgentQueue
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  archiveQuestion, unarchiveQuestion, deleteQuestion, deleteAnswer,
  pinAnswer, banUser, unbanUser, changeQuestionCategory,
  getOperationLogs, getAppeals, resolveAppeal, getStats
};
