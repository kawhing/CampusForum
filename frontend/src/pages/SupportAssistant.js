import React, { useMemo, useState } from 'react';
import { Card, Typography, Space, Button, Input, Tag, Alert, Timeline, Divider } from 'antd';
import {
  HeartTwoTone,
  SafetyCertificateTwoTone,
  MessageTwoTone,
  ThunderboltTwoTone,
  SmileTwoTone
} from '@ant-design/icons';
import { findSensitiveKeyword } from '../utils/supportPrompt';

const { Title, Paragraph, Text } = Typography;

const PRESET_STEPS = [
  '深呼吸 3 次，放慢节奏。',
  '记录此刻的感受，并尝试用一句话描述它。',
  '联系一位可信赖的朋友、辅导员或家人，简单说出“我需要一点陪伴”。',
  '离开高处或锋利物品所在的环境，确保身边安全。',
  '喝一杯温水，让身体平静下来。'
];

const CONTACTS = [
  { label: '校心理中心 / 辅导员', value: '请联系学校心理咨询中心或辅导员获取及时帮助。' },
  { label: '24 小时心理援助热线', value: '12320（心理援助专线）、400-161-9995' },
  { label: '紧急情况', value: '请立即联系身边可信任的人或当地紧急救援电话。' }
];

const SIMULATED_RESPONSE_DELAY_MS = 150; // 模拟思考/打字延迟，避免瞬时刷屏

const supportiveReply = (text) => {
  const keyword = findSensitiveKeyword(text);
  if (!text.trim()) {
    return '我在这里倾听你。写下此刻的感受，有助于我们一起找到舒缓的方法。';
  }
  if (keyword) {
    return `我感受到你提到了「${keyword}」，这听起来很沉重。你可以先确保自己处于安全的环境，并尝试联系可信任的人。若方便，请考虑拨打 12320 或学校心理中心，我们也会继续陪伴你。`;
  }
  if (text.length > 120) {
    return '谢谢你愿意详细分享。长文表达很不容易，先深呼吸几次，让自己有一点缓冲。我们可以一起拆分问题，找到当下最需要的一个小行动。';
  }
  if (text.includes('压力') || text.includes('焦虑')) {
    return '听起来压力让你很难受。把任务分解成最小的一步，完成它并给自己一个肯定，也可以试着离开座位散步 5 分钟。';
  }
  return '收到你的信息了，我会一直在线。试着把你此刻最需要的支持写下来，我们可以一起排个优先级。';
};

export default function SupportAssistant() {
  const [messages, setMessages] = useState([
    {
      from: 'assistant',
      text: '你好，我是 AI 心理助手。这里提供情绪支持建议，若有紧急风险请立即联系身边可信赖的人或拨打心理援助热线。'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const timelineItems = useMemo(
    () =>
      PRESET_STEPS.map((step, idx) => ({
        color: idx === 0 ? 'red' : 'blue',
        children: step
      })),
    []
  );

  const sendMessage = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setSending(true);
    setMessages((prev) => [...prev, { from: 'user', text: userText }]);

    const reply = supportiveReply(userText);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'assistant', text: reply }]);
      setSending(false);
    }, SIMULATED_RESPONSE_DELAY_MS);
    setInput('');
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 32px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          bordered={false}
          style={{
            background: 'linear-gradient(135deg, #1f3b73 0%, #2c5282 50%, #1a365d 100%)',
            color: '#fff',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
            borderRadius: 16
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size="middle" align="center">
              <HeartTwoTone twoToneColor="#f97316" style={{ fontSize: 28 }} />
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                心理援助与自助支持
              </Title>
              <Tag color="gold" style={{ marginLeft: 'auto' }}>
                情绪支持
              </Tag>
            </Space>
            <Paragraph style={{ color: '#e2e8f0', marginBottom: 0 }}>
              这里提供即时的情绪疏导建议。若存在生命危险或强烈轻生念头，请立即联系紧急援助。
            </Paragraph>
          </Space>
        </Card>

        <Card title="快速自救步骤" extra={<SafetyCertificateTwoTone twoToneColor="#10b981" />}>
          <Timeline items={timelineItems} />
        </Card>

        <Card
          title="即时情绪支持 (AI 心理辅导体验版)"
          extra={<MessageTwoTone twoToneColor="#6366f1" />}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: 16, background: '#fafafa' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Card
                    size="small"
                    style={{
                      maxWidth: '78%',
                      background: msg.from === 'user' ? '#e0f2fe' : '#fff',
                      borderColor: msg.from === 'user' ? '#bae6fd' : '#f4f4f5'
                    }}
                  >
                    <Space align="start">
                      {msg.from === 'assistant' ? (
                        <SmileTwoTone twoToneColor="#22c55e" />
                      ) : (
                        <ThunderboltTwoTone twoToneColor="#3b82f6" />
                      )}
                      <Text>{msg.text}</Text>
                    </Space>
                  </Card>
                </div>
              ))}
            </Space>
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
            <Input.TextArea
              placeholder="写下你此刻的感受，我们会即时给予安抚建议。"
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button type="primary" loading={sending} onClick={sendMessage}>
              发送
            </Button>
          </div>
        </Card>

        <Card title="校内外援助联系方式" extra={<HeartTwoTone twoToneColor="#ef4444" />}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="warning"
              message="紧急风险提示"
              description="如果你有强烈的轻生或伤害自己/他人的想法，请立即拨打 12320 心理援助热线，或联系身边可信赖的人陪伴。"
              showIcon
            />
            {CONTACTS.map((item) => (
              <div
                key={item.label}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  background: '#f8fafc'
                }}
              >
                <Space>
                  <Tag color="processing">{item.label}</Tag>
                  <Text>{item.value}</Text>
                </Space>
              </div>
            ))}
          </Space>
        </Card>
      </Space>
    </div>
  );
}
