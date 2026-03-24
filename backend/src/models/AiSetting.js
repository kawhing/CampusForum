const mongoose = require('mongoose');

const AiSettingSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    baseUrl: {
      type: String,
      trim: true,
      default: () => process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    },
    model: { type: String, trim: true, default: () => process.env.OLLAMA_MODEL || 'llama3' },
    timeoutMs: {
      type: Number,
      min: 1000,
      max: 120000,
      default: () => Number(process.env.OLLAMA_TIMEOUT_MS) || 20000
    },
    systemPromptGeneral: {
      type: String,
      default:
        '你是校园匿名问答平台的 AI 助手，回答要简洁、友好、基于事实，避免编造。如果不确定请说明。'
    },
    systemPromptSupport: {
      type: String,
      default:
        '你是一名温暖、耐心的心理支持助手。请用安抚性的语气回应，鼓励寻求现实帮助；若有自伤风险，请提醒联系身边可信任的人或拨打心理援助热线。'
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiSetting', AiSettingSchema);
