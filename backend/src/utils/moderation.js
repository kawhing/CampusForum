const User = require('../models/User');

const BAD_WORDS = [
  // 暴力、恐怖
  '杀人',
  '爆炸',
  '炸弹',
  '暴恐',
  '恐怖袭击',
  '绑架',
  '劫持',
  // 色情淫秽
  '淫秽',
  '卖淫',
  '嫖娼',
  '强奸',
  '猥亵',
  // 颠覆国家、分裂国家
  '颠覆国家',
  '分裂国家',
  '推翻政权',
  '武装叛乱',
  '煽动暴乱'
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
