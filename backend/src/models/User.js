const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  // 信任分，用于约束匿名发帖质量与频控
  trustScore: { type: Number, default: 50, min: 0 },
  // 互助值，回答被采纳后提升，用于优先展示
  helpValue: { type: Number, default: 0, min: 0 },
  isBlocked: { type: Boolean, default: false },
  blockReason: { type: String },
  mutedUntil: { type: Date },
  activeToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }]
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
