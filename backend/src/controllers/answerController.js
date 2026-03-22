const mongoose = require('mongoose');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { OFFENSIVE_CONTENT_PENALTY, containsBadWords, adjustUserTrust } = require('../utils/moderation');

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60 * 1000;
const LOW_TRUST_ANSWER_COOLDOWN_MINUTES = 24 * MINUTES_PER_HOUR; // 1 day
const VERY_LOW_TRUST_COOLDOWN_MINUTES = 48 * MINUTES_PER_HOUR; // 2 days
const LOW_TRUST_THRESHOLD = 60;
const VERY_LOW_TRUST_THRESHOLD = 50;
// Minimum trust required to publish answers or comments
const TRUST_BLOCK_THRESHOLD = 40;
const ANONYMOUS_LABEL_PREFIX = '匿名回答者';
const VOTE_TRUST_WEIGHT_DIVISOR = 20;
const MIN_VOTE_WEIGHT = 1;
const AUTO_ACCEPT_LIKE_THRESHOLD = 10;
const AUTO_ACCEPT_MESSAGE = '你的回答已因点赞数达到阈值被自动设为最佳答案';
// 达到该点赞数后，优质回答可以帮助低信誉用户逐步恢复信誉
const GOOD_ANSWER_LIKE_THRESHOLD = 3;
const TRUST_RECOVERY_REWARD = 1;
const MAX_TRUST_RECOVERY_VOTERS = 200;

/**
 * Normalize an id-like value (ObjectId, string, number) into a string id.
 * Returns null when no identifier exists to keep downstream comparisons predictable.
 */
const normalizeId = (id) => {
  if (!id) return null;
  return String(id);
};

const normalizeAuthorId = (createdBy) => {
  const rawAuthorId = createdBy?._id || createdBy?.id || createdBy;
  return normalizeId(rawAuthorId);
};

/**
 * Extract author reputation metrics from a populated user document.
 * Returns author reputation metrics with safe defaults for missing values,
 * matching the schema defaults (0) to avoid exposing whether the metric was missing.
 */
const extractAuthorStats = (createdBy) => ({
  authorHelpValue: createdBy?.helpValue ?? 0,
  authorTrustScore: createdBy?.trustScore ?? 0
});

/**
 * Build a minimal author metadata object containing normalized id and reputation stats.
 */
const buildAuthorMeta = (createdBy) => ({
  authorId: normalizeAuthorId(createdBy),
  ...extractAuthorStats(createdBy)
});

const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.isArchived) {
      return res.status(400).json({ message: 'Cannot answer an archived question' });
    }

    const responder = await User.findById(req.user._id);
    if (!responder) {
      return res.status(401).json({ message: 'User not found' });
    }

    const responderTrust = typeof responder.trustScore === 'number' ? responder.trustScore : 0;
    if (responderTrust < TRUST_BLOCK_THRESHOLD) {
      return res.status(403).json({
        message: `信誉分低于${TRUST_BLOCK_THRESHOLD}，暂时无法发表回答。请先浏览并点赞优质回答以逐步恢复信誉分。`
      });
    }

    if (responder.mutedUntil && responder.mutedUntil > new Date()) {
      const until = responder.mutedUntil.toLocaleDateString('zh-CN');
      return res.status(403).json({ message: `您已被禁言至 ${until}，期间无法发表回答。` });
    }

    const latestAnswer = await Answer.findOne({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .select('createdAt');

    if (latestAnswer && latestAnswer.createdAt && !Number.isNaN(new Date(latestAnswer.createdAt).getTime())) {
      const minutesSinceLastAnswer = (Date.now() - new Date(latestAnswer.createdAt).getTime()) / MS_PER_MINUTE;
      let cooldownMinutes = 0;
      if (responderTrust < VERY_LOW_TRUST_THRESHOLD) {
        cooldownMinutes = VERY_LOW_TRUST_COOLDOWN_MINUTES;
      } else if (responderTrust < LOW_TRUST_THRESHOLD) {
        cooldownMinutes = LOW_TRUST_ANSWER_COOLDOWN_MINUTES;
      }
      if (cooldownMinutes > 0 && minutesSinceLastAnswer < cooldownMinutes) {
        const remainingMinutes = Math.ceil(cooldownMinutes - minutesSinceLastAnswer);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = remainingMinutes % 60;
        return res.status(429).json({
          message: `Low trust cooldown: please wait ${remainingHours}h ${remainingMins}m before answering again`
        });
      }
    }

    const shouldHide = containsBadWords(content);

    const answer = new Answer({
      content: content.trim(),
      questionId,
      createdBy: req.user._id,
      isHidden: shouldHide
    });
    await answer.save();

    if (!shouldHide) {
      await Question.findByIdAndUpdate(questionId, {
        $inc: { answerCount: 1 },
        answered: true
      });
    }

    if (shouldHide) {
      await adjustUserTrust(responder._id, -OFFENSIVE_CONTENT_PENALTY);
    }

    if (!shouldHide && question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: question.createdBy,
        message: `Your question "${question.title}" received a new answer.`,
        type: 'answer',
        relatedId: answer._id
      });
    }

    return res.status(201).json({ answer, hidden: shouldHide });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const acceptAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id).populate('createdBy', 'username');
    if (!answer || answer.isDeleted || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    const question = await Question.findById(answer.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found for this answer' });
    }
    const isOwner = question.createdBy && question.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Only question owner or admin can accept an answer' });
    }

    const previousAccepted = question.acceptedAnswerId;
    question.acceptedAnswerId = answer._id;
    question.answered = true;
    question.solvedAt = new Date();
    await question.save();

    // 奖励答主互助值与信任分
    if (answer.createdBy) {
      await User.findByIdAndUpdate(answer.createdBy._id || answer.createdBy, {
        $inc: { trustScore: 1, helpValue: 1 }
      });
      await Notification.create({
        userId: answer.createdBy._id || answer.createdBy,
        message: `你的回答被采纳为最佳答案：${question.title}`,
        type: 'accept',
        relatedId: answer._id
      });
    }

    return res.status(200).json({ acceptedAnswerId: question.acceptedAnswerId, replaced: !!previousAccepted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    const sortMode = req.query.sort || 'time';

    let sortOption = {};
    if (sortMode === 'likes') {
      sortOption = { isPinned: -1, likes: -1 };
    } else if (sortMode === 'comments') {
      sortOption = { isPinned: -1, commentCount: -1 };
    } else {
      sortOption = { isPinned: -1, createdAt: -1 };
    }

    const answers = await Answer.find({ questionId, isDeleted: false, isHidden: false })
      .sort(sortOption)
      // Intentionally omit username to preserve anonymity in the response payload
      .populate('createdBy', 'helpValue trustScore');

    const viewerId = req.user?._id?.toString();
    let favoriteSet = new Set();

    if (viewerId && req.user?.favorites) {
      favoriteSet = new Set(req.user.favorites.map((fid) => fid.toString()));
    }

    const createdOrder = [...answers].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const aliasMap = new Map(createdOrder.map((a, idx) => [a._id?.toString(), idx + 1]));

    const shaped = answers.map((a, idx) => {
      const aliasIndex = aliasMap.get(a._id?.toString()) || idx + 1;
      const likedSet = new Set((a.likedBy || []).map((uid) => uid.toString()));
      const dislikedSet = new Set((a.dislikedBy || []).map((uid) => uid.toString()));
      const likedByMe = viewerId ? likedSet.has(viewerId) : false;
      const dislikedByMe = viewerId ? dislikedSet.has(viewerId) : false;
      const favoritedByMe = viewerId ? favoriteSet.has(a._id.toString()) : false;
      const { createdBy, ...rest } = a.toObject();
      // Whitelist public fields to avoid leaking identity or internal metadata.
      // Update intentionally if new public-facing fields are added to the schema.
      const publicAnswer = {
        // Keep both _id and id for backward compatibility with existing clients
        _id: rest._id,
        id: normalizeId(rest._id),
        content: rest.content,
        questionId: rest.questionId,
        createdAt: rest.createdAt,
        likes: rest.likes,
        dislikes: rest.dislikes,
        isPinned: rest.isPinned,
        // keep both keys for backward compatibility with existing clients
        pinned: rest.isPinned,
        isDeleted: rest.isDeleted,
        isHidden: rest.isHidden,
        commentCount: rest.commentCount
      };
      const authorMeta = buildAuthorMeta(createdBy);

      return {
        ...publicAnswer,
        likeCount: a.likes,
        dislikeCount: a.dislikes,
        likedByMe,
        dislikedByMe,
        favoritedByMe,
        anonymousLabel: `${ANONYMOUS_LABEL_PREFIX} #${aliasIndex}`,
        ...authorMeta,
        orderIndex: idx
      };
    });

    // 采纳的答案置顶
    const acceptedId = (await Question.findById(questionId))?.acceptedAnswerId?.toString();
    const sorted = shaped.sort((a, b) => {
      if (acceptedId && (a._id?.toString() === acceptedId || a.id === acceptedId)) return -1;
      if (acceptedId && (b._id?.toString() === acceptedId || b.id === acceptedId)) return 1;
      if (a.pinned && !b.pinned) return -1;
      if (b.pinned && !a.pinned) return 1;
      if (sortMode === 'likes') {
        const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
        if (likeDiff !== 0) return likeDiff;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      } else if (sortMode === 'comments') {
        const commentDiff = (b.commentCount || 0) - (a.commentCount || 0);
        if (commentDiff !== 0) return commentDiff;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      } else if (sortMode === 'time') {
        const helpA = a.authorHelpValue || 0;
        const helpB = b.authorHelpValue || 0;
        if (helpA !== helpB) return helpB - helpA;
      }
      // Preserve original DB sort order as final tiebreaker
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });

    return res.status(200).json({ answers: sorted, acceptedAnswerId: acceptedId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const isOwner = answer.createdBy && answer.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }
    answer.content = content.trim();
    await answer.save();
    return res.status(200).json({ answer });
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
    if (!answer || answer.isDeleted || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const isOwner = answer.createdBy && answer.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    answer.isDeleted = true;
    await answer.save();
    return res.status(200).json({ message: 'Answer deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const likeAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id;
    if (answer.createdBy && answer.createdBy.toString() === userId.toString()) {
      return res.status(403).json({ message: '不能给自己的回答点赞' });
    }

    const voter = await User.findById(userId).select('trustScore');
    const voterTrust = voter?.trustScore || 0;
    const voteWeight = Math.max(MIN_VOTE_WEIGHT, Math.floor(voterTrust / VOTE_TRUST_WEIGHT_DIVISOR));

    const alreadyLiked = answer.likedBy.some((uid) => uid.toString() === userId.toString());
    const alreadyDisliked = answer.dislikedBy.some((uid) => uid.toString() === userId.toString());
    let trustDelta = 0;

    const isNewLike = !alreadyLiked;

    if (alreadyLiked) {
      answer.likedBy = answer.likedBy.filter((uid) => uid.toString() !== userId.toString());
      answer.likes = Math.max(0, answer.likes - 1);
      trustDelta -= voteWeight;
    } else {
      if (alreadyDisliked) {
        answer.dislikedBy = answer.dislikedBy.filter((uid) => uid.toString() !== userId.toString());
        answer.dislikes = Math.max(0, answer.dislikes - 1);
        trustDelta += voteWeight; // remove previous penalty
      }
      answer.likedBy.push(userId);
      answer.likes += 1;
      trustDelta += voteWeight;
    }

    const recoveryList = answer.trustRecoveryVoters || [];
    const recoveryAlreadyGranted = recoveryList.some((uid) => uid.toString() === userId.toString());
    const qualifiesForRecovery =
      isNewLike &&
      voterTrust < TRUST_BLOCK_THRESHOLD &&
      (answer.likes || 0) >= GOOD_ANSWER_LIKE_THRESHOLD &&
      answer.createdBy &&
      answer.createdBy.toString() !== userId.toString() &&
      !recoveryAlreadyGranted;

    if (qualifiesForRecovery) {
      await adjustUserTrust(userId, TRUST_RECOVERY_REWARD);
      const updated = [...recoveryList, userId];
      if (updated.length > MAX_TRUST_RECOVERY_VOTERS) {
        // 防止无限增长，保留最新 MAX_TRUST_RECOVERY_VOTERS 个
        answer.trustRecoveryVoters = updated.slice(-MAX_TRUST_RECOVERY_VOTERS);
      } else {
        answer.trustRecoveryVoters = updated;
      }
    }

    await answer.save();
    if (answer.createdBy && trustDelta !== 0) {
      await adjustUserTrust(answer.createdBy, trustDelta);
    }

    // Auto-accept when likes reach threshold and no accepted answer yet
    const question = await Question.findById(answer.questionId);
    if (question && answer.likes >= AUTO_ACCEPT_LIKE_THRESHOLD) {
      const updateResult = await Question.updateOne(
        { _id: question._id, acceptedAnswerId: null },
        { $set: { acceptedAnswerId: answer._id, answered: true, solvedAt: new Date() } }
      );
      if (updateResult.modifiedCount > 0 && answer.createdBy) {
        await User.findByIdAndUpdate(answer.createdBy, { $inc: { helpValue: 1, trustScore: 1 } });
        const autoAcceptMessage = question.title ? `${AUTO_ACCEPT_MESSAGE}: ${question.title}` : AUTO_ACCEPT_MESSAGE;
        await Notification.create({
          userId: answer.createdBy,
          message: autoAcceptMessage,
          type: 'accept',
          relatedId: answer._id
        });
      }
    }

    return res.status(200).json({
      likes: answer.likes,
      dislikes: answer.dislikes,
      liked: !alreadyLiked,
      disliked: false
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const dislikeAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted || answer.isHidden) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id;
    if (answer.createdBy && answer.createdBy.toString() === userId.toString()) {
      return res.status(403).json({ message: '不能给自己的回答点踩' });
    }

    const voter = await User.findById(userId).select('trustScore');
    const voterTrust = voter?.trustScore || 0;
    const voteWeight = Math.max(MIN_VOTE_WEIGHT, Math.floor(voterTrust / VOTE_TRUST_WEIGHT_DIVISOR));

    const alreadyDisliked = answer.dislikedBy.some((uid) => uid.toString() === userId.toString());
    const alreadyLiked = answer.likedBy.some((uid) => uid.toString() === userId.toString());
    let trustDelta = 0;

    if (alreadyDisliked) {
      answer.dislikedBy = answer.dislikedBy.filter((uid) => uid.toString() !== userId.toString());
      answer.dislikes = Math.max(0, answer.dislikes - 1);
      trustDelta += voteWeight; // remove previous penalty
    } else {
      if (alreadyLiked) {
        answer.likedBy = answer.likedBy.filter((uid) => uid.toString() !== userId.toString());
        answer.likes = Math.max(0, answer.likes - 1);
        trustDelta -= voteWeight; // remove previous reward
      }
      answer.dislikedBy.push(userId);
      answer.dislikes += 1;
      trustDelta -= voteWeight;
    }

    await answer.save();
    if (answer.createdBy && trustDelta !== 0) {
      await adjustUserTrust(answer.createdBy, trustDelta);
    }

    return res.status(200).json({
      likes: answer.likes,
      dislikes: answer.dislikes,
      liked: false,
      disliked: !alreadyDisliked
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }
    const { content, parentCommentId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const commenterTrust = Number(req.user.trustScore);
    if (!Number.isFinite(commenterTrust)) {
      return res
        .status(500)
        .json({ message: '用户信任分数不可用（缺失或异常），请联系管理员' });
    }
    if (commenterTrust < TRUST_BLOCK_THRESHOLD) {
      return res.status(403).json({
        message: `信任分数低于${TRUST_BLOCK_THRESHOLD}，暂时无法发表评论。请先浏览并点赞优质回答以逐步提升信任分数。`
      });
    }

    if (req.user.mutedUntil && req.user.mutedUntil > new Date()) {
      const until = req.user.mutedUntil.toLocaleDateString('zh-CN');
      return res.status(403).json({ message: `您已被禁言至 ${until}，期间无法发表评论。` });
    }

    if (containsBadWords(content)) {
      await adjustUserTrust(req.user._id, -OFFENSIVE_CONTENT_PENALTY);
      return res.status(400).json({ message: '评论内容包含不当用语，已扣除信誉分并阻止发布' });
    }

    let parentComment = null;
    if (parentCommentId) {
      if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
        return res.status(400).json({ message: 'Invalid parent comment ID' });
      }
      parentComment = await Comment.findOne({
        _id: parentCommentId,
        answerId: id,
        isDeleted: false
      });
      if (!parentComment) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
    }

    const comment = new Comment({
      content: content.trim(),
      answerId: id,
      parentCommentId: parentComment ? parentComment._id : null,
      createdBy: req.user._id
    });
    await comment.save();

    await Answer.findByIdAndUpdate(id, { $inc: { commentCount: 1 } });

    if (answer.createdBy && answer.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: answer.createdBy,
        message: 'Someone commented on your answer.',
        type: 'comment',
        relatedId: comment._id
      });
    }

    return res.status(201).json({ comment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }

    const comments = await Comment.find({ answerId: id, isDeleted: false })
      .sort({ createdAt: 1 })
      .populate('createdBy', 'helpValue trustScore');

    const normalizedComments = comments.map((c) => {
      const { createdBy, ...rest } = c.toObject();
      // Whitelist public fields to avoid leaking identity or internal metadata.
      // Update intentionally if new public-facing fields are added to the schema.
      const publicComment = {
        // Keep both _id and id for backward compatibility with existing clients
        _id: rest._id,
        id: normalizeId(rest._id),
        content: rest.content,
        answerId: rest.answerId,
        parentCommentId: normalizeId(rest.parentCommentId),
        createdAt: rest.createdAt,
        isDeleted: rest.isDeleted
      };
      return {
        ...publicComment,
        ...buildAuthorMeta(createdBy)
      };
    });

    return res.status(200).json({ comments: normalizedComments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isOwner = comment.createdBy && comment.createdBy.toString() === req.user._id.toString();
    const isPrivileged = req.user.role === 'admin' || req.user.role === 'moderator';
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    comment.isDeleted = true;
    await comment.save();

    await Answer.findOneAndUpdate(
      { _id: comment.answerId, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } }
    );

    return res.status(200).json({ message: 'Comment deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid answer ID' });
    }

    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const user = await User.findById(req.user._id);
    const isFavorited = user.favorites.some((fid) => fid.toString() === id.toString());

    if (isFavorited) {
      user.favorites = user.favorites.filter((fid) => fid.toString() !== id.toString());
    } else {
      user.favorites.push(id);
    }

    await user.save();
    return res.status(200).json({ favorited: !isFavorited, favorites: user.favorites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAnswer, getAnswers, updateAnswer, deleteAnswer,
  likeAnswer, dislikeAnswer, createComment, getComments,
  deleteComment, toggleFavorite, acceptAnswer
};
