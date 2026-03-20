const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password and username are required' });
    }
    if (password.length < 6 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters and include letters and numbers' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = new User({ email, password, username });
    await user.save();

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

    await User.findByIdAndUpdate(user._id, { activeToken: token });

    return res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked', reason: user.blockReason });
    }

    const expiresIn = rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '7d');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

    await User.findByIdAndUpdate(user._id, { activeToken: token });

    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { activeToken: null });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const me = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

module.exports = { register, login, logout, me };
