const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  getAiStatus,
  getAiSettings,
  updateAiSettings,
  chatWithAi
} = require('../controllers/aiController');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'AI 请求过于频繁，请稍后再试。' }
});

const adminAuth = [authenticate, requireRole('admin', 'moderator')];

router.get('/status', getAiStatus);
router.get('/settings', ...adminAuth, getAiSettings);
router.put('/settings', ...adminAuth, updateAiSettings);
router.post('/chat', optionalAuth, aiLimiter, chatWithAi);

module.exports = router;
