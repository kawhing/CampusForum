const express = require('express');
const {
  createAnswer, getAnswers, updateAnswer, deleteAnswer,
  likeAnswer, dislikeAnswer, createComment, getComments,
  deleteComment, toggleFavorite
} = require('../controllers/answerController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Router for /api/questions/:questionId/answers
const questionAnswersRouter = express.Router({ mergeParams: true });
questionAnswersRouter.get('/', optionalAuth, getAnswers);
questionAnswersRouter.post('/', authenticate, createAnswer);

// Router for /api/answers/:id and /api/comments/:id
const answerRouter = express.Router();
answerRouter.put('/answers/:id', authenticate, updateAnswer);
answerRouter.delete('/answers/:id', authenticate, deleteAnswer);
answerRouter.post('/answers/:id/like', authenticate, likeAnswer);
answerRouter.post('/answers/:id/dislike', authenticate, dislikeAnswer);
answerRouter.get('/answers/:id/comments', getComments);
answerRouter.post('/answers/:id/comments', authenticate, createComment);
answerRouter.delete('/comments/:id', authenticate, deleteComment);
answerRouter.post('/answers/:id/favorite', authenticate, toggleFavorite);

module.exports = { questionAnswersRouter, answerRouter };
