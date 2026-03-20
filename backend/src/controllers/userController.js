const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Notification = require('../models/Notification');
const Appeal = require('../models/Appeal');
const User = require('../models/User');

const DEFAULT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const getProfile = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

const updateProfile = async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email && !username) {
      return res.status(400).json({ message: 'Email or username is required to update' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = normalizedEmail;
    }

    if (username) {
      const trimmed = username.trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Username cannot be empty' });
      }
      const existingUsername = await User.findOne({ username: trimmed, _id: { $ne: req.user._id } });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      user.username = trimmed;
    }

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ user: userObj });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    // Validate plain-text password strength (consistent with registration rules)
    if (newPassword.length < 6 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include letters and numbers' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: DEFAULT_EXPIRES_IN }
    );

    user.activeToken = token;
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ message: 'Password updated successfully', token, user: userObj });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
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
  getProfile,
  updateProfile,
  changePassword,
  getMyQuestions,
  getMyAnswers,
  getMyFavorites,
  getNotifications,
  markNotificationRead,
  createAppeal,
  getMyAppeals
};
