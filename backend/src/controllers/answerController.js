const mongoose = require('mongoose');
const Answer = require('../models/Answer');
const Question = require('../models/Question');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');

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

    const answer = new Answer({
      content: content.trim(),
      questionId,
      createdBy: req.user._id
    });
    await answer.save();

    await Question.findByIdAndUpdate(questionId, {
      $inc: { answerCount: 1 },
      answered: true
    });

    if (question.createdBy && question.createdBy.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: question.createdBy,
        message: `Your question "${question.title}" received a new answer.`,
        type: 'answer',
        relatedId: answer._id
      });
    }

    return res.status(201).json({ answer });
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
    const sort = req.query.sort || 'time';

    let sortOption = {};
    if (sort === 'likes') {
      sortOption = { isPinned: -1, likes: -1 };
    } else if (sort === 'comments') {
      sortOption = { isPinned: -1, commentCount: -1 };
    } else {
      sortOption = { isPinned: -1, createdAt: -1 };
    }

    const answers = await Answer.find({ questionId, isDeleted: false })
      .sort(sortOption)
      .populate('createdBy', 'username');

    const viewerId = req.user?._id?.toString();
    let favoriteSet = new Set();

    if (viewerId) {
      const favorites = req.user?.favorites;
      if (favorites?.length) {
        favoriteSet = new Set(favorites.map((fid) => fid.toString()));
      } else {
        const user = await User.findById(viewerId).select('favorites');
        if (user?.favorites?.length) {
          favoriteSet = new Set(user.favorites.map((fid) => fid.toString()));
        }
      }
    }

    const shaped = answers.map((a) => {
      const likedSet = new Set((a.likedBy || []).map((uid) => uid.toString()));
      const dislikedSet = new Set((a.dislikedBy || []).map((uid) => uid.toString()));
      const likedByMe = viewerId ? likedSet.has(viewerId) : false;
      const dislikedByMe = viewerId ? dislikedSet.has(viewerId) : false;
      const favoritedByMe = viewerId ? favoriteSet.has(a._id.toString()) : false;

      return {
        ...a.toObject(),
        likeCount: a.likes,
        dislikeCount: a.dislikes,
        likedByMe,
        dislikedByMe,
        favoritedByMe,
        authorName: a.createdBy?.username,
        authorId: a.createdBy?._id
      };
    });

    return res.status(200).json({ answers: shaped });
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
    if (!answer || answer.isDeleted) {
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
    if (!answer || answer.isDeleted) {
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
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id;
    const alreadyLiked = answer.likedBy.some((uid) => uid.toString() === userId.toString());
    const alreadyDisliked = answer.dislikedBy.some((uid) => uid.toString() === userId.toString());

    if (alreadyLiked) {
      answer.likedBy = answer.likedBy.filter((uid) => uid.toString() !== userId.toString());
      answer.likes = Math.max(0, answer.likes - 1);
    } else {
      if (alreadyDisliked) {
        answer.dislikedBy = answer.dislikedBy.filter((uid) => uid.toString() !== userId.toString());
        answer.dislikes = Math.max(0, answer.dislikes - 1);
      }
      answer.likedBy.push(userId);
      answer.likes += 1;
    }

    await answer.save();
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
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const userId = req.user._id;
    const alreadyDisliked = answer.dislikedBy.some((uid) => uid.toString() === userId.toString());
    const alreadyLiked = answer.likedBy.some((uid) => uid.toString() === userId.toString());

    if (alreadyDisliked) {
      answer.dislikedBy = answer.dislikedBy.filter((uid) => uid.toString() !== userId.toString());
      answer.dislikes = Math.max(0, answer.dislikes - 1);
    } else {
      if (alreadyLiked) {
        answer.likedBy = answer.likedBy.filter((uid) => uid.toString() !== userId.toString());
        answer.likes = Math.max(0, answer.likes - 1);
      }
      answer.dislikedBy.push(userId);
      answer.dislikes += 1;
    }

    await answer.save();
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
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const answer = await Answer.findById(id);
    if (!answer || answer.isDeleted) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const comment = new Comment({
      content: content.trim(),
      answerId: id,
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
      .populate('createdBy', 'username');

    return res.status(200).json({ comments });
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
  deleteComment, toggleFavorite
};
