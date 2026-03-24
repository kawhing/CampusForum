import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Space, Button, Input, Tag, Alert, Timeline, Divider, message } from 'antd';
import {
  HeartTwoTone,
  SafetyCertificateTwoTone,
  MessageTwoTone,
  ThunderboltTwoTone,
  SmileTwoTone
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { consumeSupportAccess } from '../utils/supportPrompt';
import { chatWithAi, getAiStatus } from '../api';
import { buildAiHistory } from '../utils/aiHistory';

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

const SUPPORT_MODE = 'support';

export default function SupportAssistant() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accessInfo] = useState(() => {
    const token = searchParams.get('token');
    return token ? consumeSupportAccess(token) : null;
  });
  const [messages, setMessages] = useState([
    {
      from: 'assistant',
      text: '你好，我是 AI 心理助手。这里提供情绪支持建议，若有紧急风险请立即联系身边可信赖的人或拨打心理援助热线。'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const timelineItems = useMemo(
    () =>
      PRESET_STEPS.map((step, idx) => ({
        color: idx === 0 ? 'red' : 'blue',
        children: step
      })),
    []
  );

  useEffect(() => {
    if (!accessInfo) {
      message.warning('请在触发敏感词检测后进入心理援助页面。');
      navigate('/', { replace: true });
    }
  }, [accessInfo, navigate]);

  useEffect(() => {
    getAiStatus()
      .then((res) => setAiEnabled(res.data?.enabled !== false))
      .catch(() => {});
  }, []);

  if (!accessInfo) {
    return null;
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    if (!aiEnabled) {
      message.warning('AI 服务当前不可用，请稍后再试。');
      return;
    }
    const userText = input.trim();
    const history = buildAiHistory(messages);
    setSending(true);
    setMessages((prev) => [...prev, { from: 'user', text: userText }]);
    setInput('');
    try {
      const res = await chatWithAi({ message: userText, mode: SUPPORT_MODE, history });
      const reply = res.data?.reply || 'AI 暂时无法回应，请稍后再试。';
      setMessages((prev) => [...prev, { from: 'assistant', text: reply }]);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setAiEnabled(false);
      }
      message.error(err.response?.data?.message || 'AI 服务暂不可用');
      setMessages((prev) => [
        ...prev,
        {
          from: 'assistant',
          text: 'AI 服务暂不可用。建议先联系身边可信任的人或心理援助热线，我们也会继续为你提供资源。'
        }
      ]);
    } finally {
      setSending(false);
    }
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
          title="即时情绪支持 (AI 心理辅导)"
          extra={<MessageTwoTone twoToneColor="#6366f1" />}
          bodyStyle={{ padding: 0 }}
        >
          {!aiEnabled && (
            <Alert
              type="warning"
              showIcon
              message="AI 服务当前已关闭或不可用，将继续显示紧急支持信息。"
              style={{ margin: '16px 16px 0' }}
            />
          )}
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
