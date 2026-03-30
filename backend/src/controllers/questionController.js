const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { containsBadWords, OFFENSIVE_CONTENT_PENALTY, adjustUserTrust } = require('../utils/moderation');

const VIEWED_BY_LIMIT = 5000;
const RISK_KEYWORDS = [
  '自杀',
  '自残',
  '抑郁',
  '想死',
  '伤害自己',
  '暴力',
  '杀',
  '攻击',
  '跳楼',
  '绝望',
  '结束生命',
  '不想活了',
  '割腕',
  '上吊'
];
const MIN_TRUST_FOR_COOLDOWN = 20;
const LOW_TRUST_COOLDOWN_MINUTES = 10;
const HOURLY_QUESTION_LIMIT = 3;
const DEFAULT_CATEGORIES = ['计算机', '数学', '技术', '学习', '生活', '娱乐'];

const createQuestion = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || title.trim().length < 15) {
      return res.status(400).json({ message: 'Title must be at least 15 characters' });
    }
    if (!content || content.trim().length < 50) {
      return res.status(400).json({ message: 'Content must be at least 50 characters with clear description' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }

    // 课程维度问答池：必须选择课程标签
    const courseTag = category.trim();

    // 反骚扰频控：1小时最多3问
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await Question.countDocuments({
      createdBy: req.user._id,
      createdAt: { $gte: oneHourAgo }
    });
    if (recentCount >= HOURLY_QUESTION_LIMIT) {
      return res.status(429).json({ message: 'Posting limit reached: max 3 questions per hour' });
    }

    // 低信任度冷却
    const creator = await User.findById(req.user._id);
    if (creator && creator.mutedUntil && creator.mutedUntil > new Date()) {
      const until = creator.mutedUntil.toLocaleDateString('zh-CN');
      return res.status(403).json({ message: `您已被禁言至 ${until}，期间无法发帖。` });
    }
    if (creator && creator.trustScore < MIN_TRUST_FOR_COOLDOWN) {
      const lastQuestion = await Question.findOne({ createdBy: req.user._id }).sort({ createdAt: -1 });
      if (lastQuestion && Date.now() - lastQuestion.createdAt.getTime() < LOW_TRUST_COOLDOWN_MINUTES * 60 * 1000) {
        return res.status(429).json({ message: `Low trust score cooldown: please wait ${LOW_TRUST_COOLDOWN_MINUTES} minutes between posts` });
      }
    }

    const combinedRawText = `${title} ${content}`;
    if (containsBadWords(combinedRawText)) {
      await adjustUserTrust(req.user._id, -OFFENSIVE_CONTENT_PENALTY);
      return res
        .status(400)
        .json({ message: '内容包含不当用语，已扣除信誉分并阻止发布，请文明提问。' });
    }

    // 风险内容识别
    const combinedText = combinedRawText.toLowerCase();
    const matchedRisk = RISK_KEYWORDS.find((kw) => combinedText.includes(kw.toLowerCase()));
    const isUrgent = Boolean(matchedRisk);

    const question = new Question({
      title: title.trim(),
      content: content.trim(),
      category: courseTag,
      isUrgent,
      urgentReason: matchedRisk ? `命中高风险关键词：${matchedRisk}` : undefined,
      createdBy: req.user._id
    });
    await question.save();
    const contact = process.env.SCHOOL_HELP_CONTACT || '请联系学校心理中心或辅导员';
    const payload = { question };
    if (isUrgent) {
      payload.urgent = { contact, reason: question.urgentReason };
    }
    return res.status(201).json(payload);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limitParam = req.query.limit ?? req.query.pageSize;
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 10));
    const sort = req.query.sort || 'time';
    const { category, search } = req.query;

    const filter = {};

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'moderator');
    if (!isAdmin) {
      filter.isArchived = false;
    }

    if (category) {
      filter.category = category.trim();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }

    let sortOption = {};
    if (sort === 'hot') {
      sortOption = { viewCount: -1 };
    } else if (sort === 'likes') {
      sortOption = { answerCount: -1 };
    } else {
      // 默认优先曝光待解决问题（answered: 0 未解决在前，1 已解决在后）
      sortOption = { answered: 1, createdAt: -1 };
    }

    const total = await Question.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const questions = await Question.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username');

    return res.status(200).json({ questions, total, page, pages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const countViewFlag = (req.query.countView || '').toString();
    const shouldCountView = countViewFlag !== 'false' && countViewFlag !== '0';

    let question;

    if (shouldCountView) {
      const viewerObjectId = req.user?._id;
      const viewerId = viewerObjectId?.toString();

      if (viewerId) {
        question = await Question.findOneAndUpdate(
          { _id: id, viewedBy: { $ne: viewerObjectId } },
          { $addToSet: { viewedBy: viewerObjectId }, $inc: { viewCount: 1 } },
          { new: true }
        ).populate('createdBy', 'username');
      } else {
        question = await Question.findByIdAndUpdate(
          id,
          { $inc: { viewCount: 1 } },
          { new: true }
        ).populate('createdBy', 'username');
      }
    }

    if (!question) {
      question = await Question.findById(id).populate('createdBy', 'username');
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (shouldCountView && question.viewedBy?.length > VIEWED_BY_LIMIT) {
      question.viewedBy = question.viewedBy.slice(-VIEWED_BY_LIMIT);
      await question.save();
    }

    return res.status(200).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isOwner = question.createdBy && question.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { title, content, category } = req.body;
    if (title !== undefined) {
      if (title.trim().length < 10) {
        return res.status(400).json({ message: 'Title must be at least 10 characters' });
      }
      question.title = title.trim();
    }
    if (content !== undefined) {
      if (content.trim().length < 20) {
        return res.status(400).json({ message: 'Content must be at least 20 characters' });
      }
      question.content = content.trim();
    }
    if (category !== undefined) {
      question.category = category.trim();
    }

    await question.save();
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

    const answers = await Answer.find({ questionId: id });
    const answerIds = answers.map((a) => a._id);
    await Comment.deleteMany({ answerId: { $in: answerIds } });
    await Answer.deleteMany({ questionId: id });
    await Question.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Question.distinct('category');
    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...categories]));
    return res.status(200).json({ categories: merged });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createQuestion, getQuestions, getQuestion, updateQuestion, deleteQuestion, getCategories };
