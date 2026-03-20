const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.get('/questions', authenticate, getMyQuestions);
router.get('/answers', authenticate, getMyAnswers);
router.get('/favorites', authenticate, getMyFavorites);
router.get('/notifications', authenticate, getNotifications);
router.put('/notifications/:id/read', authenticate, markNotificationRead);
router.post('/appeals', authenticate, createAppeal);
router.get('/appeals', authenticate, getMyAppeals);

module.exports = router;
