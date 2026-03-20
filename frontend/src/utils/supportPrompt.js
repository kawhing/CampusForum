import { Modal, Typography } from 'antd';

const { Paragraph, Text } = Typography;

const SENSITIVE_KEYWORDS = ['心灰意冷', '自杀', '轻生', '暴力', '想死', '自残', '抑郁', '伤害自己'];

export const findSensitiveKeyword = (text = '') => {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.find((kw) => lower.includes(kw.toLowerCase()));
};

export const ensureSupportPrompt = (text = '') =>
  new Promise((resolve) => {
    const matched = findSensitiveKeyword(text);
    if (!matched) {
      resolve(true);
      return;
    }

    Modal.confirm({
      title: '我们在这里支持你',
      okText: '继续发布',
      cancelText: '我暂时不需要',
      width: 560,
      content: (
        <div>
          <Paragraph>
            系统检测到内容包含敏感词「{matched}」。如果你正经历情绪波动或需要帮助，请考虑联系以下渠道获取支持：
          </Paragraph>
          <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
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
            如果你愿意继续发布，我们也会尽力为你提供资源和帮助。
          </Paragraph>
        </div>
      ),
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
