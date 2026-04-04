const mongoose = require('mongoose');
const {
  AI_TIMEOUT_MS_MIN,
  AI_TIMEOUT_MS_MAX,
  DEFAULT_OLLAMA_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  DEFAULT_API_TYPE,
  DEFAULT_SYSTEM_PROMPT_GENERAL,
  DEFAULT_SYSTEM_PROMPT_SUPPORT
} = require('../config/aiDefaults');

const AiSettingSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    apiType: {
      type: String,
      enum: ['ollama', 'openai'],
      default: () => DEFAULT_API_TYPE
    },
    baseUrl: {
      type: String,
      trim: true,
      default: () => DEFAULT_OLLAMA_BASE_URL
    },
    apiKey: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: () => DEFAULT_OLLAMA_MODEL },
    timeoutMs: {
      type: Number,
      min: AI_TIMEOUT_MS_MIN,
      max: AI_TIMEOUT_MS_MAX,
      default: () => DEFAULT_OLLAMA_TIMEOUT_MS
    },
    systemPromptGeneral: {
      type: String,
      default: DEFAULT_SYSTEM_PROMPT_GENERAL
    },
    systemPromptSupport: {
      type: String,
      default: DEFAULT_SYSTEM_PROMPT_SUPPORT
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AiSetting', AiSettingSchema);
