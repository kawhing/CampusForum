const express = require('express');
const router = express.Router();
const {
  createQuestion, getQuestions, getQuestion,
  updateQuestion, deleteQuestion, getCategories
} = require('../controllers/questionController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.get('/', optionalAuth, getQuestions);
router.post('/', authenticate, createQuestion);
router.get('/categories', getCategories);
router.get('/:id', getQuestion);
router.put('/:id', authenticate, updateQuestion);
router.delete('/:id', authenticate, requireRole('admin'), deleteQuestion);

module.exports = router;
