import { Modal, Typography, Button, Space, Tag } from 'antd';

const { Paragraph, Text } = Typography;

const SENSITIVE_KEYWORDS = [
  '心灰意冷',
  '自杀',
  '轻生',
  '暴力',
  '想死',
  '自残',
  '抑郁',
  '伤害自己',
  '跳楼',
  '绝望',
  '结束生命',
  '不想活了',
  '割腕',
  '上吊'
];

const SUPPORT_ACCESS_STORAGE_KEY = 'support-access';
const SUPPORT_ACCESS_TTL_MS = 5 * 60 * 1000;

export const findSensitiveKeyword = (text = '') => {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.find((kw) => lower.includes(kw.toLowerCase()));
};

const createSupportAccess = (keyword) => {
  if (typeof window === 'undefined') return null;
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const payload = { token, keyword, issuedAt: Date.now() };
  try {
    window.localStorage.setItem(SUPPORT_ACCESS_STORAGE_KEY, JSON.stringify(payload));
  } catch (_) {
    return null;
  }
  return payload;
};

export const consumeSupportAccess = (token) => {
  if (!token || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SUPPORT_ACCESS_STORAGE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    window.localStorage.removeItem(SUPPORT_ACCESS_STORAGE_KEY);
    if (!payload || payload.token !== token) return null;
    if (!payload.issuedAt || Date.now() - payload.issuedAt > SUPPORT_ACCESS_TTL_MS) {
      return null;
    }
    return payload;
  } catch (_) {
    window.localStorage.removeItem(SUPPORT_ACCESS_STORAGE_KEY);
    return null;
  }
};

export const ensureSupportPrompt = (text = '') =>
  new Promise((resolve) => {
    const matched = findSensitiveKeyword(text);
    if (!matched) {
      resolve(true);
      return;
    }

    let instance = null;
    const openSupport = () => {
      const payload = createSupportAccess(matched);
      const token = payload?.token;
      const url = token ? `/support?token=${encodeURIComponent(token)}` : '/support';
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    instance = Modal.confirm({
      title: '我们在这里支持你',
      okButtonProps: { style: { display: 'none' } },
      cancelButtonProps: { style: { display: 'none' } },
      closable: true,
      width: 620,
      onCancel: () => {
        instance?.destroy?.();
        resolve(false);
      },
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            系统检测到内容包含敏感词「{matched}」。如果你正经历情绪波动或需要帮助，请考虑联系以下渠道获取支持：
          </Paragraph>
          <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
            <li>
              <Text strong>校园心理中心 / 辅导员：</Text>
              <Text> 联系学校心理咨询中心或辅导员获取及时帮助。</Text>
            </li>
            <li>
              <Text strong>24小时心理援助热线：</Text>
              <Text> 12320（心理援助专线）、400-161-9995。</Text>
            </li>
            <li>
              <Text strong>紧急情况：</Text>
              <Text> 请立即联系身边可信任的人或当地紧急救援电话。</Text>
            </li>
          </ul>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            如果你愿意继续发布，我们也会尽力为你提供资源和帮助。你也可以点击「接受援助」进入 AI 心理辅导页面，获得即时的情绪疏导建议。
          </Paragraph>
          <Space style={{ justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
            <Tag color="volcano" style={{ marginRight: 'auto' }}>
              情绪支持
            </Tag>
            <Button
              onClick={() => {
                instance?.destroy?.();
                resolve(false);
              }}
            >
              我暂时不需要
            </Button>
            <Button
              type="primary"
              ghost
              onClick={() => {
                instance?.destroy?.();
                openSupport();
                resolve(false);
              }}
            >
              接受援助
            </Button>
            <Button
              type="primary"
              onClick={() => {
                instance?.destroy?.();
                resolve(true);
              }}
            >
              继续发布
            </Button>
          </Space>
        </Space>
      )
    });
  });
