import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  List,
  Typography,
  Tag,
  Space,
  Button,
  Avatar,
  Spin,
  Alert,
  Pagination,
  Modal,
  Form,
  Input,
  Select,
  message,
  Badge,
  Divider,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getProfile,
  getMyQuestions,
  getMyAnswers,
  getMyFavorites,
  getMyAppeals,
  getNotifications,
  markNotificationRead,
  createAppeal,
  updateProfile,
  changePassword,
} from '../api';
import { setCredentials, setUser } from '../store/slices/authSlice';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const renderQuestionLink = (item, fallbackText) => {
  const question =
    item && typeof item.questionId === 'object' && item.questionId !== null
      ? item.questionId
      : null;
  const questionId = question?._id || item?.questionId;

  if (!questionId) {
    return <Text>{fallbackText}</Text>;
  }

  return (
    <Link to={`/questions/${questionId}`}>
      {item.questionTitle || question?.title || '查看问题'}
    </Link>
  );
};

const APPEAL_STATUS_MAP = {
  pending: { label: '待处理', color: 'orange', icon: <ClockCircleOutlined /> },
  approved: { label: '已批准', color: 'green', icon: <CheckCircleOutlined /> },
  rejected: { label: '已拒绝', color: 'red', icon: <CloseCircleOutlined /> },
};

const ROLE_MAP = {
  admin: { label: '管理员', color: 'red' },
  moderator: { label: '版主', color: 'orange' },
  user: { label: '普通用户', color: 'blue' },
};

const extractUserOrThrow = (data) => {
  const updatedUser = data?.user;
  if (!updatedUser) {
    throw new Error('MISSING_USER_DATA');
  }
  return updatedUser;
};

function UserInfoCard({ user }) {
  if (!user) return null;
  const roleInfo = ROLE_MAP[user.role] || ROLE_MAP.user;
  return (
    <Card style={{ marginBottom: 24 }}>
      <Space size="large">
        <Avatar size={72} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
        <Space direction="vertical" size={4}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {user.username}
            </Title>
            <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
          </Space>
          <Text type="secondary">{user.email}</Text>
          <Space size="middle">
            <Text type="secondary">信任分：</Text>
            <Tag color="blue">{user.trustScore ?? 0}</Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            注册时间：
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('zh-CN')
              : '未知'}
          </Text>
        </Space>
      </Space>
    </Card>
  );
}

function MyQuestions() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getMyQuestions({ page, pageSize: 10 })
      .then((res) => {
        setData(res.data.questions || res.data.data || res.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Spin spinning={loading}>
      <List
        dataSource={data}
        locale={{ emptyText: <Empty description="暂无提问记录" /> }}
        renderItem={(q) => (
          <List.Item key={q.id || q._id}>
            <List.Item.Meta
              avatar={<QuestionCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
              title={
                <Link to={`/questions/${q.id || q._id}`}>{q.title}</Link>
              }
              description={
                <Space size="small">
                  {q.category && <Tag color="blue">{q.category}</Tag>}
                  {q.isArchived && <Tag color="red">已归档</Tag>}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {q.createdAt
                      ? new Date(q.createdAt).toLocaleDateString('zh-CN')
                      : ''}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {q.answerCount || 0} 个回答
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
      {total > 10 && (
        <Pagination
          current={page}
          total={total}
          pageSize={10}
          onChange={setPage}
          style={{ marginTop: 16, textAlign: 'center' }}
        />
      )}
    </Spin>
  );
}

function MyAnswers() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getMyAnswers({ page, pageSize: 10 })
      .then((res) => {
        setData(res.data.answers || res.data.data || res.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <Spin spinning={loading}>
      <List
        dataSource={data}
        locale={{ emptyText: <Empty description="暂无回答记录" /> }}
        renderItem={(a) => (
          <List.Item key={a.id || a._id}>
            <List.Item.Meta
              avatar={<MessageOutlined style={{ fontSize: 20, color: '#52c41a' }} />}
              title={renderQuestionLink(a, '匿名问题')}
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                    {a.content}
                  </Paragraph>
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {a.createdAt
                        ? new Date(a.createdAt).toLocaleDateString('zh-CN')
                        : ''}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      👍 {a.likeCount || 0}
                    </Text>
                  </Space>
                </Space>
              }
            />
          </List.Item>
        )}
      />
      {total > 10 && (
        <Pagination
          current={page}
          total={total}
          pageSize={10}
          onChange={setPage}
          style={{ marginTop: 16, textAlign: 'center' }}
        />
      )}
    </Spin>
  );
}

function MyFavorites() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMyFavorites()
      .then((res) => setData(res.data.favorites || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <List
        dataSource={data}
        locale={{ emptyText: <Empty description="暂无收藏记录" /> }}
        renderItem={(a) => (
          <List.Item key={a.id || a._id}>
            <List.Item.Meta
              avatar={<StarOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              title={renderQuestionLink(a, '已删除的问题')}
              description={
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                    {a.content}
                  </Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    收藏于{' '}
                    {a.favoritedAt
                      ? new Date(a.favoritedAt).toLocaleDateString('zh-CN')
                      : ''}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Spin>
  );
}

function MyAppeals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    getMyAppeals()
      .then((res) => setData(res.data.appeals || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await createAppeal(values);
      message.success('申诉已提交');
      form.resetFields();
      setModalVisible(false);
      load();
    } catch (err) {
      message.error(err.response?.data?.message || '提交申诉失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<ExclamationCircleOutlined />} onClick={() => setModalVisible(true)}>
          提交申诉
        </Button>
      </div>

      <Spin spinning={loading}>
        <List
          dataSource={data}
          locale={{ emptyText: <Empty description="暂无申诉记录" /> }}
          renderItem={(appeal) => {
            const statusInfo = APPEAL_STATUS_MAP[appeal.status] || APPEAL_STATUS_MAP.pending;
            return (
              <List.Item key={appeal.id || appeal._id}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{appeal.type || '申诉'}</Text>
                      <Tag color={statusInfo.color} icon={statusInfo.icon}>
                        {statusInfo.label}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>{appeal.reason}</Text>
                      {appeal.response && (
                        <Text type="secondary">管理员回复：{appeal.response}</Text>
                      )}
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        提交于{' '}
                        {appeal.createdAt
                          ? new Date(appeal.createdAt).toLocaleDateString('zh-CN')
                          : ''}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Spin>

      <Modal
        title="提交申诉"
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="type"
            label="申诉类型"
            rules={[{ required: true, message: '请选择申诉类型' }]}
          >
            <Select
              placeholder="选择申诉类型"
              options={[
                { value: 'ban', label: '账号封禁申诉' },
                { value: 'content', label: '内容删除申诉' },
                { value: 'other', label: '其他问题' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="申诉原因"
            rules={[
              { required: true, message: '请输入申诉原因' },
              { min: 10, message: '申诉原因至少需要10个字符' },
            ]}
          >
            <TextArea placeholder="请详细描述申诉原因..." autoSize={{ minRows: 4 }} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>提交</Button>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function AccountSettings({ user, onProfileUpdated }) {
  const dispatch = useDispatch();
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    }
  }, [user, profileForm]);

  const handleProfileSubmit = async (values) => {
    setSavingProfile(true);
    try {
      const res = await updateProfile(values);
      const updatedUser = extractUserOrThrow(res.data);
      dispatch(setUser(updatedUser));
      onProfileUpdated?.(updatedUser);
      message.success('个人信息已更新');
    } catch (err) {
      if (err?.message === 'MISSING_USER_DATA') {
        console.error('Profile update missing user data', err);
        message.error('更新失败，请刷新页面重试');
      } else {
        message.error(err.response?.data?.message || '更新失败，请稍后重试');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async ({ currentPassword, newPassword }) => {
    setSavingPassword(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      const updatedUser = extractUserOrThrow(res.data);
      if (res.data.token) {
        dispatch(setCredentials({ user: updatedUser, token: res.data.token }));
      } else {
        dispatch(setUser(updatedUser));
      }
      onProfileUpdated?.(updatedUser);
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (err) {
      if (err?.message === 'MISSING_USER_DATA') {
        console.error('Password change missing user data', err);
        message.error('更新失败，请刷新页面重试');
      } else {
        message.error(err.response?.data?.message || '密码修改失败，请稍后重试');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card title="基本信息" bordered>
          <Form layout="vertical" form={profileForm} onFinish={handleProfileSubmit}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入新的用户名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input placeholder="请输入新的邮箱地址" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={savingProfile}>
                  保存修改
                </Button>
                <Button onClick={() => profileForm.resetFields()}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="修改密码" bordered>
          <Form layout="vertical" form={passwordForm} onFinish={handlePasswordSubmit}>
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={savingPassword}>
                  更新密码
                </Button>
                <Button onClick={() => passwordForm.resetFields()}>清空</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}

function Notifications() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    getNotifications()
      .then((res) => setData(res.data.notifications || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setData((prev) =>
        prev.map((n) => (n.id === id || n._id === id ? { ...n, read: true } : n))
      );
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    const unread = data.filter((n) => !n.read);
    await Promise.all(unread.map((n) => markNotificationRead(n.id || n._id).catch(() => {})));
    setData((prev) => prev.map((n) => ({ ...n, read: true })));
    message.success('已全部标为已读');
  };

  const unreadCount = data.filter((n) => !n.read).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div style={{ marginBottom: 12, textAlign: 'right' }}>
          <Button size="small" onClick={handleMarkAllRead}>
            全部标为已读
          </Button>
        </div>
      )}
      <Spin spinning={loading}>
        <List
          dataSource={data}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={(n) => (
            <List.Item
              key={n.id || n._id}
              style={{
                background: n.read ? 'transparent' : '#e6f7ff',
                padding: '12px 16px',
                borderRadius: 6,
                marginBottom: 8,
              }}
              actions={
                !n.read
                  ? [
                      <Button
                        type="link"
                        size="small"
                        onClick={() => handleMarkRead(n.id || n._id)}
                      >
                        标为已读
                      </Button>,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!n.read}>
                    <BellOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  </Badge>
                }
                title={n.title || n.message}
                description={
                  <Space size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString('zh-CN')
                        : ''}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Spin>
    </div>
  );
}

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setProfileLoading(true);
    getProfile()
      .then((res) => setProfileData(res.data.user || res.data))
      .catch(() => setProfileData(user))
      .finally(() => setProfileLoading(false));
  }, [user]);

  const displayUser = profileData || user;

  const tabItems = [
    { key: 'questions', label: '我的提问', icon: <QuestionCircleOutlined />, children: <MyQuestions /> },
    { key: 'answers', label: '我的回答', icon: <MessageOutlined />, children: <MyAnswers /> },
    { key: 'favorites', label: '我的收藏', icon: <StarOutlined />, children: <MyFavorites /> },
    {
      key: 'settings',
      label: '账号设置',
      icon: <SettingOutlined />,
      children: <AccountSettings user={displayUser} onProfileUpdated={setProfileData} />,
    },
    { key: 'appeals', label: '我的申诉', icon: <ExclamationCircleOutlined />, children: <MyAppeals /> },
    { key: 'notifications', label: '通知', icon: <BellOutlined />, children: <Notifications /> },
  ];

  return (
    <div>
      <Spin spinning={profileLoading}>
        <UserInfoCard user={displayUser} />
      </Spin>
      <Tabs
        defaultActiveKey="questions"
        items={tabItems.map((t) => ({
          key: t.key,
          label: (
            <Space size={4}>
              {t.icon}
              {t.label}
            </Space>
          ),
          children: t.children,
        }))}
      />
    </div>
  );
}
