import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Alert,
  Badge,
  Popconfirm,
  List,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  PushpinOutlined,
  DeleteOutlined,
  InboxOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  getAdminStats,
  getQuestions,
  archiveQuestion,
  unarchiveQuestion,
  adminDeleteQuestion,
  adminDeleteAnswer,
  pinAnswer,
  banUser,
  unbanUser,
  changeCategory,
  getOperationLogs,
  getAppeals,
  resolveAppeal,
  getAnswers,
} from '../../api';

const { Title, Text } = Typography;
const { TextArea } = Input;

function StatsOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAdminStats()
      .then((res) => setStats(res.data.stats || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats?.users || stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总问题数"
              value={stats?.questions || stats?.totalQuestions || 0}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总回答数"
              value={stats?.answers || stats?.totalAnswers || 0}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待处理申诉"
              value={stats?.pendingAppeals || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="24h首响率"
              value={((stats?.firstResponseRate || 0) * 100).toFixed(1) + '%'}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="违规率（24h）"
              value={((stats?.violationRate || 0) * 100).toFixed(1) + '%'}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="申诉通过率"
              value={((stats?.appealPassRate || 0) * 100).toFixed(1) + '%'}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均处理时长(小时)"
              value={(stats?.avgHandleHours || 0).toFixed(2)}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>
      {stats?.courseStats?.length > 0 && (
        <Card style={{ marginTop: 16 }} title="课程解决率">
          <List
            dataSource={stats.courseStats}
            renderItem={(c) => (
              <List.Item>
                <Space>
                  <Tag color="blue">{c.course || '未分类'}</Tag>
                  <Text>解决率 {(c.solveRate * 100).toFixed(1)}%</Text>
                  <Text>平均耗时 {(c.avgSolveHours || 0).toFixed(2)} h</Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
      {stats?.urgentQueue?.length > 0 && (
        <Card style={{ marginTop: 16 }} title="紧急求助优先队列">
          <List
            dataSource={stats.urgentQueue}
            renderItem={(q) => (
              <List.Item>
                <Space direction="vertical">
                  <Text strong>{q.title}</Text>
                  <Tag color="volcano">紧急</Tag>
                  <Text type="secondary">
                    {q.createdAt ? new Date(q.createdAt).toLocaleString('zh-CN') : ''}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      )}
    </Spin>
  );
}

function QuestionManagement() {
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [archiveModal, setArchiveModal] = useState({ visible: false, question: null });
  const [categoryModal, setCategoryModal] = useState({ visible: false, question: null });
  const [archiveForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    getQuestions({ page, pageSize: 10 })
      .then((res) => {
        setQuestions(res.data.questions || res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (values) => {
    const q = archiveModal.question;
    try {
      await archiveQuestion(q.id || q._id, { reason: values.reason });
      message.success('问题已归档');
      setArchiveModal({ visible: false, question: null });
      archiveForm.resetFields();
      load();
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleUnarchive = async (q) => {
    try {
      await unarchiveQuestion(q.id || q._id, {});
      message.success('问题已取消归档');
      load();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (q) => {
    try {
      await adminDeleteQuestion(q.id || q._id, { reason: '管理员删除' });
      message.success('问题已删除');
      load();
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handleChangeCategory = async (values) => {
    const q = categoryModal.question;
    try {
      await changeCategory(q.id || q._id, { category: values.category });
      message.success('分类已更新');
      setCategoryModal({ visible: false, question: null });
      categoryForm.resetFields();
      load();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: '35%' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (v) => v ? <Tag color="blue">{v}</Tag> : '-',
    },
    {
      title: '状态',
      key: 'status',
      render: (_, r) =>
        r.archived ? <Tag color="red">已归档</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: '回答数',
      dataIndex: 'answerCount',
      key: 'answerCount',
      render: (v) => v || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space size="small" wrap>
          {r.archived ? (
            <Button size="small" onClick={() => handleUnarchive(r)}>
              取消归档
            </Button>
          ) : (
            <Button
              size="small"
              icon={<InboxOutlined />}
              onClick={() => setArchiveModal({ visible: true, question: r })}
            >
              归档
            </Button>
          )}
          <Button
            size="small"
            onClick={() => {
              categoryForm.setFieldsValue({ category: r.category || '' });
              setCategoryModal({ visible: true, question: r });
            }}
          >
            改分类
          </Button>
          <Popconfirm
            title="确认删除该问题？"
            onConfirm={() => handleDelete(r)}
            okText="删除"
            okType="danger"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={questions}
        rowKey={(r) => r.id || r._id}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
        scroll={{ x: 700 }}
      />

      <Modal
        title="归档问题"
        open={archiveModal.visible}
        onCancel={() => { setArchiveModal({ visible: false, question: null }); archiveForm.resetFields(); }}
        footer={null}
      >
        <Form form={archiveForm} layout="vertical" onFinish={handleArchive}>
          <Form.Item
            name="reason"
            label="归档原因"
            rules={[{ required: true, message: '请输入归档原因' }]}
          >
            <TextArea placeholder="请输入归档原因..." autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认归档</Button>
              <Button onClick={() => { setArchiveModal({ visible: false, question: null }); archiveForm.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改分类"
        open={categoryModal.visible}
        onCancel={() => { setCategoryModal({ visible: false, question: null }); categoryForm.resetFields(); }}
        footer={null}
      >
        <Form form={categoryForm} layout="vertical" onFinish={handleChangeCategory}>
          <Form.Item
            name="category"
            label="新分类"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="输入新的分类名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认修改</Button>
              <Button onClick={() => { setCategoryModal({ visible: false, question: null }); categoryForm.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function AnswerManagement() {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, answer: null });
  const [deleteForm] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    // Fetch recent answers via questions approach
    getQuestions({ page: 1, pageSize: 5 })
      .then(async (res) => {
        const qs = res.data.questions || res.data.data || [];
        const allAnswers = [];
        await Promise.all(
          qs.slice(0, 3).map((q) =>
            getAnswers(q.id || q._id)
              .then((r) =>
                allAnswers.push(
                  ...(r.data.answers || r.data || []).map((a) => ({
                    ...a,
                    questionTitle: q.title,
                    questionId: q.id || q._id,
                  }))
                )
              )
              .catch(() => {})
          )
        );
        setAnswers(allAnswers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (values) => {
    const a = deleteModal.answer;
    try {
      await adminDeleteAnswer(a.id || a._id, { reason: values.reason });
      message.success('回答已删除');
      setDeleteModal({ visible: false, answer: null });
      deleteForm.resetFields();
      setAnswers((prev) => prev.filter((x) => (x.id || x._id) !== (a.id || a._id)));
    } catch (err) {
      message.error('删除失败');
    }
  };

  const handlePin = async (a) => {
    try {
      await pinAnswer(a.id || a._id, { pinned: !a.pinned });
      message.success(a.pinned ? '已取消置顶' : '已置顶');
      setAnswers((prev) =>
        prev.map((x) =>
          (x.id || x._id) === (a.id || a._id) ? { ...x, pinned: !x.pinned } : x
        )
      );
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '回答内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: '35%',
      render: (v) => <Text ellipsis>{v}</Text>,
    },
    {
      title: '所属问题',
      dataIndex: 'questionTitle',
      key: 'questionTitle',
      ellipsis: true,
    },
    {
      title: '作者',
      key: 'author',
      render: (_, r) => r.authorName || r.author?.username || '匿名',
    },
    {
      title: '状态',
      key: 'pinned',
      render: (_, r) => r.pinned ? <Tag color="blue">置顶</Tag> : <Tag>普通</Tag>,
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      render: (v) => v || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space size="small">
          <Button
            size="small"
            icon={<PushpinOutlined />}
            onClick={() => handlePin(r)}
          >
            {r.pinned ? '取消置顶' : '置顶'}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setDeleteModal({ visible: true, answer: r })}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={answers}
        rowKey={(r) => r.id || r._id}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
      />

      <Modal
        title="删除回答"
        open={deleteModal.visible}
        onCancel={() => { setDeleteModal({ visible: false, answer: null }); deleteForm.resetFields(); }}
        footer={null}
      >
        <Form form={deleteForm} layout="vertical" onFinish={handleDelete}>
          <Form.Item
            name="reason"
            label="删除原因"
            rules={[{ required: true, message: '请输入删除原因' }]}
          >
            <TextArea placeholder="请输入删除原因..." autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">确认删除</Button>
              <Button onClick={() => { setDeleteModal({ visible: false, answer: null }); deleteForm.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banModal, setBanModal] = useState({ visible: false, user: null });
  const [banForm] = Form.useForm();

  useEffect(() => {
    setLoading(true);
    // Try fetching users from admin stats endpoint as fallback
    import('../../api').then(({ default: api }) => {
      api.get('/admin/users')
        .then((res) => setUsers(res.data.users || res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  const handleBan = async (values) => {
    const u = banModal.user;
    try {
      await banUser(u.id || u._id, { reason: values.reason });
      message.success('用户已封禁');
      setBanModal({ visible: false, user: null });
      banForm.resetFields();
      setUsers((prev) =>
        prev.map((x) => (x.id || x._id) === (u.id || u._id) ? { ...x, banned: true } : x)
      );
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleUnban = async (u) => {
    try {
      await unbanUser(u.id || u._id, {});
      message.success('用户已解封');
      setUsers((prev) =>
        prev.map((x) => (x.id || x._id) === (u.id || u._id) ? { ...x, banned: false } : x)
      );
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (v) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{v}</Text>
        </Space>
      ),
    },
    { title: '邮箱', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (v) => {
        const map = { admin: 'red', moderator: 'orange', user: 'blue' };
        const label = { admin: '管理员', moderator: '版主', user: '用户' };
        return <Tag color={map[v] || 'blue'}>{label[v] || v}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      render: (_, r) =>
        r.banned ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) =>
        r.role !== 'admin' ? (
          r.banned ? (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleUnban(r)}>
              解封
            </Button>
          ) : (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => setBanModal({ visible: true, user: r })}
            >
              封禁
            </Button>
          )
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={users}
        rowKey={(r) => r.id || r._id}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      />

      <Modal
        title="封禁用户"
        open={banModal.visible}
        onCancel={() => { setBanModal({ visible: false, user: null }); banForm.resetFields(); }}
        footer={null}
      >
        <Form form={banForm} layout="vertical" onFinish={handleBan}>
          <Form.Item
            name="reason"
            label="封禁原因"
            rules={[{ required: true, message: '请输入封禁原因' }]}
          >
            <TextArea placeholder="请输入封禁原因..." autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">确认封禁</Button>
              <Button onClick={() => { setBanModal({ visible: false, user: null }); banForm.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function AppealManagement() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolveModal, setResolveModal] = useState({ visible: false, appeal: null, action: null });
  const [resolveForm] = Form.useForm();

  const load = useCallback(() => {
    setLoading(true);
    getAppeals()
      .then((res) => setAppeals(res.data.appeals || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleResolve = async (values) => {
    const a = resolveModal.appeal;
    try {
      await resolveAppeal(a.id || a._id, {
        status: resolveModal.action,
        response: values.response,
      });
      message.success('申诉已处理');
      setResolveModal({ visible: false, appeal: null, action: null });
      resolveForm.resetFields();
      load();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const STATUS_MAP = {
    pending: { label: '待处理', color: 'orange' },
    approved: { label: '已批准', color: 'green' },
    rejected: { label: '已拒绝', color: 'red' },
  };

  const columns = [
    {
      title: '申诉类型',
      dataIndex: 'type',
      key: 'type',
      render: (v) => v || '申诉',
    },
    {
      title: '申诉人',
      key: 'user',
      render: (_, r) => r.username || r.user?.username || '未知',
    },
    {
      title: '申诉原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const s = STATUS_MAP[v] || STATUS_MAP.pending;
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Space size="small">
            <Button
              size="small"
              type="primary"
              onClick={() => setResolveModal({ visible: true, appeal: r, action: 'approved' })}
            >
              批准
            </Button>
            <Button
              size="small"
              danger
              onClick={() => setResolveModal({ visible: true, appeal: r, action: 'rejected' })}
            >
              拒绝
            </Button>
          </Space>
        ) : (
          <Text type="secondary">已处理</Text>
        ),
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={appeals}
        rowKey={(r) => r.id || r._id}
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
      />

      <Modal
        title={resolveModal.action === 'approved' ? '批准申诉' : '拒绝申诉'}
        open={resolveModal.visible}
        onCancel={() => { setResolveModal({ visible: false, appeal: null, action: null }); resolveForm.resetFields(); }}
        footer={null}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="response"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea placeholder="请输入给申诉人的回复..." autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                danger={resolveModal.action === 'rejected'}
              >
                确认{resolveModal.action === 'approved' ? '批准' : '拒绝'}
              </Button>
              <Button onClick={() => { setResolveModal({ visible: false, appeal: null, action: null }); resolveForm.resetFields(); }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function OperationLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    getOperationLogs({ page, pageSize: 20 })
      .then((res) => {
        setLogs(res.data.logs || res.data.data || res.data || []);
        setTotal(res.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      title: '操作管理员',
      key: 'admin',
      render: (_, r) => r.adminName || r.admin?.username || '系统',
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (v) => <Tag>{v}</Tag>,
    },
    {
      title: '目标',
      dataIndex: 'target',
      key: 'target',
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) =>
        v ? new Date(v).toLocaleString('zh-CN') : '-',
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={logs}
      rowKey={(r) => r.id || r._id || Math.random()}
      loading={loading}
      pagination={{
        current: page,
        total,
        pageSize: 20,
        onChange: setPage,
        showTotal: (t) => `共 ${t} 条`,
      }}
      scroll={{ x: 700 }}
    />
  );
}

export default function AdminConsole() {
  const tabItems = [
    {
      key: 'stats',
      label: (
        <Space size={4}>
          <UnorderedListOutlined />
          统计概览
        </Space>
      ),
      children: <StatsOverview />,
    },
    {
      key: 'questions',
      label: (
        <Space size={4}>
          <QuestionCircleOutlined />
          问题管理
        </Space>
      ),
      children: <QuestionManagement />,
    },
    {
      key: 'answers',
      label: (
        <Space size={4}>
          <MessageOutlined />
          回答管理
        </Space>
      ),
      children: <AnswerManagement />,
    },
    {
      key: 'users',
      label: (
        <Space size={4}>
          <UserOutlined />
          用户管理
        </Space>
      ),
      children: <UserManagement />,
    },
    {
      key: 'appeals',
      label: (
        <Space size={4}>
          <ExclamationCircleOutlined />
          申诉管理
        </Space>
      ),
      children: <AppealManagement />,
    },
    {
      key: 'logs',
      label: (
        <Space size={4}>
          <UnorderedListOutlined />
          操作日志
        </Space>
      ),
      children: <OperationLogs />,
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        管理控制台
      </Title>
      <Tabs defaultActiveKey="stats" items={tabItems} />
    </div>
  );
}
