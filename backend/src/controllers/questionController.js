const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Comment = require('../models/Comment');

const createQuestion = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    if (!title || title.trim().length < 10) {
      return res.status(400).json({ message: 'Title must be at least 10 characters' });
    }
    if (!content || content.trim().length < 20) {
      return res.status(400).json({ message: 'Content must be at least 20 characters' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ message: 'Category is required' });
    }

    const question = new Question({
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      createdBy: req.user._id
    });
    await question.save();
    return res.status(201).json({ question });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
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
      sortOption = { createdAt: -1 };
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

    const shouldCountView = !['false', '0'].includes((req.query.countView || '').toString());

    const question = await Question.findById(id).populate('createdBy', 'username');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (shouldCountView) {
      const viewerId = req.user?._id?.toString();
      const alreadyViewed =
        viewerId && question.viewedBy?.some((uid) => uid.toString() === viewerId);

      if (!alreadyViewed) {
        if (viewerId) {
          question.viewedBy.push(req.user._id);
        }
        question.viewCount += 1;
        await question.save();
        await question.populate('createdBy', 'username');
      }
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
    return res.status(200).json({ categories });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createQuestion, getQuestions, getQuestion, updateQuestion, deleteQuestion, getCategories };
