import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Typography,
  Space,
  Button,
  Input,
  Tag,
  Alert,
  Divider,
  message
} from 'antd';
import { RobotOutlined, SmileTwoTone, ThunderboltTwoTone, HeartTwoTone } from '@ant-design/icons';
import { chatWithAi, getAiStatus } from '../api';
import { findSensitiveKeyword } from '../utils/supportPrompt';
import { buildAiHistory } from '../utils/aiHistory';

const { Title, Paragraph, Text } = Typography;

const SUPPORT_CONTACTS = [
  { label: '校心理中心 / 辅导员', value: '请联系学校心理咨询中心或辅导员获取及时帮助。' },
  { label: '24 小时心理援助热线', value: '12320（心理援助专线）、400-161-9995' },
  { label: '紧急情况', value: '请立即联系身边可信任的人或当地紧急救援电话。' }
];

const AI_FALLBACK_REPLY = 'AI 服务暂不可用，请稍后再试。';

export default function AiAssistant() {
  const [messages, setMessages] = useState([
    {
      from: 'assistant',
      text: '你好，我是 AI 问答助手。有什么疑问都可以告诉我，我会尽量给出清晰的解答。'
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('general');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [supportKeyword, setSupportKeyword] = useState('');

  const isSupportMode = mode === 'support';

  const headerStyle = useMemo(
    () => ({
      background: isSupportMode
        ? 'linear-gradient(135deg, #6b233b 0%, #b83280 50%, #7c1d3f 100%)'
        : 'linear-gradient(135deg, #0f3f7a 0%, #1e3a8a 50%, #0b1533 100%)',
      color: '#fff',
      boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
      borderRadius: 16
    }),
    [isSupportMode]
  );

  useEffect(() => {
    getAiStatus()
      .then((res) => setAiEnabled(res.data?.enabled !== false))
      .catch(() => {});
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    if (!aiEnabled) {
      message.warning('AI 服务当前不可用，请稍后再试。');
      return;
    }
    const userText = input.trim();
    const keyword = findSensitiveKeyword(userText);
    const nextMode = keyword ? 'support' : 'general';
    setMode(nextMode);
    setSupportKeyword(keyword || '');

    const priorHistory = buildAiHistory(messages);
    setSending(true);
    setMessages((prev) => [...prev, { from: 'user', text: userText }]);
    setInput('');

    try {
      const res = await chatWithAi({ message: userText, mode: nextMode, history: priorHistory });
      const reply = res.data?.reply || AI_FALLBACK_REPLY;
      setMessages((prev) => [...prev, { from: 'assistant', text: reply }]);
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        setAiEnabled(false);
      }
      message.error(err.response?.data?.message || 'AI 服务暂不可用');
      setMessages((prev) => [
        ...prev,
        { from: 'assistant', text: AI_FALLBACK_REPLY }
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 16px 32px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card bordered={false} style={headerStyle}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space size="middle" align="center">
              {isSupportMode ? (
                <HeartTwoTone twoToneColor="#f97316" style={{ fontSize: 28 }} />
              ) : (
                <RobotOutlined style={{ fontSize: 24, color: '#93c5fd' }} />
              )}
              <Title level={3} style={{ color: '#fff', margin: 0 }}>
                {isSupportMode ? '心理支持 AI 助手' : '校园 AI 问答助手'}
              </Title>
              <Tag color={isSupportMode ? 'volcano' : 'geekblue'} style={{ marginLeft: 'auto' }}>
                {isSupportMode ? '情绪支持' : '正常问答'}
              </Tag>
            </Space>
            <Paragraph style={{ color: '#e2e8f0', marginBottom: 0 }}>
              {isSupportMode
                ? '检测到可能的心理压力需求，我们将以更温和的语气陪伴你，并提示必要的求助资源。'
                : '有什么疑问都可以问我，我会尽量给出清晰、可靠的解答。'}
            </Paragraph>
          </Space>
        </Card>

        {!aiEnabled && (
          <Alert
            type="warning"
            showIcon
            message="AI 服务当前已关闭或不可用"
            description="请稍后再试，或联系管理员确认本地 Ollama 服务是否正常运行。"
          />
        )}

        {isSupportMode && (
          <Alert
            type="warning"
            showIcon
            message="心理支持提示"
            description={
              supportKeyword
                ? `检测到关键词「${supportKeyword}」。如果你有强烈的轻生或自伤念头，请立即联系身边可信任的人或心理援助热线。`
                : '如果你有强烈的轻生或自伤念头，请立即联系身边可信任的人或心理援助热线。'
            }
          />
        )}

        <Card
          title={isSupportMode ? '即时情绪支持（AI）' : 'AI 对话'}
          extra={<RobotOutlined />}
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
              placeholder={isSupportMode ? '写下你的感受，我们会温柔回应。' : '请输入你的问题'}
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={!aiEnabled}
            />
            <Button type="primary" loading={sending} onClick={sendMessage} disabled={!aiEnabled}>
              发送
            </Button>
          </div>
        </Card>

        {isSupportMode && (
          <Card title="校内外援助联系方式" extra={<HeartTwoTone twoToneColor="#ef4444" />}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {SUPPORT_CONTACTS.map((item) => (
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
        )}
      </Space>
    </div>
  );
}
