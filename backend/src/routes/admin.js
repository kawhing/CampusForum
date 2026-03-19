const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  archiveQuestion, unarchiveQuestion, deleteQuestion, deleteAnswer,
  pinAnswer, banUser, unbanUser, changeQuestionCategory,
  getOperationLogs, getAppeals, resolveAppeal, getStats
} = require('../controllers/adminController');

const adminAuth = [authenticate, requireRole('admin', 'moderator')];

router.post('/questions/:id/archive', ...adminAuth, archiveQuestion);
router.post('/questions/:id/unarchive', ...adminAuth, unarchiveQuestion);
router.delete('/questions/:id', ...adminAuth, deleteQuestion);
router.delete('/answers/:id', ...adminAuth, deleteAnswer);
router.post('/answers/:id/pin', ...adminAuth, pinAnswer);
router.post('/users/:id/ban', ...adminAuth, banUser);
router.post('/users/:id/unban', ...adminAuth, unbanUser);
router.put('/questions/:id/category', ...adminAuth, changeQuestionCategory);
router.get('/logs', ...adminAuth, getOperationLogs);
router.get('/appeals', ...adminAuth, getAppeals);
router.put('/appeals/:id', ...adminAuth, resolveAppeal);
router.get('/stats', ...adminAuth, getStats);

module.exports = router;
