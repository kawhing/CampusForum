require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const { questionAnswersRouter, answerRouter } = require('./routes/answers');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

connectDB();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' }
});

app.use(globalLimiter);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/questions/:questionId/answers', questionAnswersRouter);
app.use('/api', answerRouter);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
