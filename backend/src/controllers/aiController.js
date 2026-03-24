const AiSetting = require('../models/AiSetting');
const { AI_TIMEOUT_MS_MIN, AI_TIMEOUT_MS_MAX } = require('../config/aiDefaults');

// Guardrails for payload size and network timeouts to keep local models responsive.
const MAX_MESSAGE_LENGTH = 1500;
const MAX_HISTORY_ITEMS = 6;

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  return value.trim().replace(/\/+$/, '');
};

const getOrCreateSettings = async () => {
  let settings = await AiSetting.findOne();
  if (!settings) {
    settings = await AiSetting.create({});
  }
  return settings;
};

const getAiStatus = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ enabled: Boolean(settings.enabled) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAiSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateAiSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    const updates = {};
    const fields = [
      'enabled',
      'baseUrl',
      'model',
      'timeoutMs',
      'systemPromptGeneral',
      'systemPromptSupport'
    ];

    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    });

    if (updates.baseUrl !== undefined) {
      const trimmed = normalizeBaseUrl(String(updates.baseUrl || ''));
      if (trimmed && !/^https?:\/\//i.test(trimmed)) {
        return res.status(400).json({ message: 'baseUrl 必须以 http/https 开头' });
      }
      updates.baseUrl = trimmed;
    }
    if (updates.model !== undefined) {
      updates.model = String(updates.model || '').trim();
    }
    if (updates.systemPromptGeneral !== undefined) {
      updates.systemPromptGeneral = String(updates.systemPromptGeneral || '').trim();
    }
    if (updates.systemPromptSupport !== undefined) {
      updates.systemPromptSupport = String(updates.systemPromptSupport || '').trim();
    }
    if (updates.timeoutMs !== undefined) {
      const parsed = Number(updates.timeoutMs);
      if (Number.isNaN(parsed) || parsed < AI_TIMEOUT_MS_MIN || parsed > AI_TIMEOUT_MS_MAX) {
        return res
          .status(400)
          .json({
            message: `timeoutMs 需在 ${AI_TIMEOUT_MS_MIN}-${AI_TIMEOUT_MS_MAX} 范围内`
          });
      }
      updates.timeoutMs = parsed;
    }

    Object.assign(settings, updates, { updatedBy: req.user?._id });
    await settings.save();

    return res.status(200).json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item.content === 'string' && typeof item.role === 'string')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH)
    }))
    .filter((item) => item.content);
};

const chatWithAi = async (req, res) => {
  try {
    const { message, mode, history } = req.body || {};
    const content = typeof message === 'string' ? message.trim() : '';
    if (!content) {
      return res.status(400).json({ message: '请输入内容' });
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: '输入内容过长' });
    }

    const settings = await getOrCreateSettings();
    if (!settings.enabled) {
      return res.status(503).json({ message: 'AI 功能已由管理员关闭' });
    }

    const baseUrl = normalizeBaseUrl(settings.baseUrl);
    if (!baseUrl) {
      return res.status(500).json({ message: 'AI 服务地址未配置' });
    }

    const selectedMode = mode === 'support' ? 'support' : 'general';
    const prompt =
      selectedMode === 'support'
        ? settings.systemPromptSupport
        : settings.systemPromptGeneral;
    const trimmedHistory = normalizeHistory(history).slice(-MAX_HISTORY_ITEMS);

    const messages = [
      { role: 'system', content: prompt },
      ...trimmedHistory,
      { role: 'user', content }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);
    let response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model,
          messages,
          stream: false
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama error:', response.status, errorText);
      return res.status(502).json({ message: 'AI 服务暂不可用' });
    }

    const data = await response.json();
    // /api/chat returns { message: { content } }, /api/generate returns { response }
    const reply = data?.message?.content || data?.response;
    if (!reply) {
      return res.status(502).json({ message: 'AI 返回内容为空' });
    }

    return res.status(200).json({ reply, mode: selectedMode });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ message: 'AI 响应超时' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAiStatus, getAiSettings, updateAiSettings, chatWithAi };
