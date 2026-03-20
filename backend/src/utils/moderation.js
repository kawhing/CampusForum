const User = require('../models/User');

const BAD_WORDS = [
  '傻逼',
  '去死',
  'fuck',
  'shit',
  '滚',
  '垃圾',
  '操你',
  'nt',
  '死妈',
  'sb',
  'cnm',
  '狗屎',
  '废物',
  '妈的',
  '脑残'
].map((w) => w.toLowerCase());

const OFFENSIVE_CONTENT_PENALTY = 5;

const containsBadWords = (text = '') => {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
};

const adjustUserTrust = async (userId, delta) => {
  if (!userId || delta === undefined) return;
  const user = await User.findById(userId).select('trustScore');
  if (!user) return;
  const current = typeof user.trustScore === 'number' ? user.trustScore : 0;
  user.trustScore = Math.max(0, current + delta);
  await user.save();
};

module.exports = {
  BAD_WORDS,
  OFFENSIVE_CONTENT_PENALTY,
  containsBadWords,
  adjustUserTrust
};
