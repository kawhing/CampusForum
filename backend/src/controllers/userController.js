const mongoose = require('mongoose');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const Appeal = require('../models/Appeal');
const User = require('../models/User');

const getProfile = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

const getMyQuestions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const total = await Question.countDocuments({ createdBy: req.user._id });
    const pages = Math.ceil(total / limit);
    const questions = await Question.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ questions, total, page, pages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyAnswers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const filter = { createdBy: req.user._id, isDeleted: false };
    const total = await Answer.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const answers = await Answer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('questionId', 'title');

    return res.status(200).json({ answers, total, page, pages });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      match: { isDeleted: false },
      populate: { path: 'questionId', select: 'title' }
    });
    return res.status(200).json({ favorites: user.favorites });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ notifications });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ notification });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createAppeal = async (req, res) => {
  try {
    const { targetId, targetType, reason } = req.body;
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: 'Valid targetId is required' });
    }
    if (!targetType || !['question', 'answer', 'account'].includes(targetType)) {
      return res.status(400).json({ message: 'Valid targetType is required (question, answer, account)' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const appeal = new Appeal({
      userId: req.user._id,
      targetId,
      targetType,
      reason: reason.trim()
    });
    await appeal.save();
    return res.status(201).json({ appeal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getMyAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json({ appeals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile, getMyQuestions, getMyAnswers, getMyFavorites,
  getNotifications, markNotificationRead, createAppeal, getMyAppeals
};
