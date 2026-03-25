const AI_TIMEOUT_MS_MIN = 1000;
const AI_TIMEOUT_MS_MAX = 120000;
const DEFAULT_OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const DEFAULT_OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS) || 20000;
const DEFAULT_SYSTEM_PROMPT_GENERAL =
  '你是校园匿名问答平台的 AI 助手，回答要简洁、友好、基于事实，避免编造。如果不确定请说明。';
const DEFAULT_SYSTEM_PROMPT_SUPPORT =
  '你是一名温暖、耐心的心理支持助手。请用安抚性的语气回应，鼓励寻求现实帮助；若有自伤风险，请提醒联系身边可信任的人或拨打心理援助热线。';

module.exports = {
  AI_TIMEOUT_MS_MIN,
  AI_TIMEOUT_MS_MAX,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  DEFAULT_SYSTEM_PROMPT_GENERAL,
  DEFAULT_SYSTEM_PROMPT_SUPPORT
};
