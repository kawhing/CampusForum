import React, { useEffect, useState, useCallback } from 'react';
import {
  List,
  Card,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Button,
  Pagination,
  Spin,
  Alert,
  Row,
  Col,
  FloatButton,
} from 'antd';
import {
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuestions } from '../store/slices/questionsSlice';
import { getCategories } from '../api';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { getAuthorDisplayName } from '../utils/questionOwner';
import { GRADIENT_PRIMARY, SHADOW_PRIMARY_BUTTON, BORDER_RADIUS_SM } from '../constants/theme';

const { Title, Text } = Typography;
const { Search } = Input;

const SORT_OPTIONS = [
  { value: 'time', label: '最新' },
  { value: 'hot', label: '热门' },
  { value: 'likes', label: '最多回答' },
];

const CATEGORY_COLORS = {
  技术: 'blue',
  生活: 'green',
  学习: 'purple',
  娱乐: 'orange',
  其他: 'default',
};

export default function QuestionList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { questions, total, loading, error } = useSelector((state) => state.questions);
  const { token, user: currentUser } = useSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('time');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  const loadQuestions = useCallback(() => {
    dispatch(
      fetchQuestions({
        page,
        pageSize,
        search: search || undefined,
        category: category || undefined,
        sort,
      })
    );
  }, [dispatch, page, pageSize, search, category, sort]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    getCategories()
      .then((res) => {
        const received = res.data.categories || res.data || [];
        const merged = Array.from(new Set([...received, ...DEFAULT_CATEGORIES]));
        setCategories(merged);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const categoryOptions = [
    { value: '', label: '全部分类' },
    ...categories.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={3} style={{ margin: 0, color: '#1e1b4b', fontWeight: 700 }}>
            问题列表
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ask')}
            size="large"
            style={{
              background: GRADIENT_PRIMARY,
              border: 'none',
              boxShadow: SHADOW_PRIMARY_BUTTON,
              fontWeight: 600,
            }}
          >
            提问
          </Button>
        </Col>
      </Row>

      <Card
        style={{
          marginBottom: 20,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={10}>
            <Search
              placeholder="搜索问题..."
              allowClear
              onSearch={handleSearch}
              enterButton
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              value={category}
              onChange={handleCategoryChange}
              options={categoryOptions}
            />
          </Col>
          <Col xs={12} sm={7}>
            <Select
              style={{ width: '100%' }}
              value={sort}
              onChange={handleSortChange}
              options={SORT_OPTIONS}
            />
          </Col>
        </Row>
      </Card>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        <List
          dataSource={questions}
          locale={{ emptyText: '暂无问题，快来提第一个问题吧！' }}
          renderItem={(q) => (
            <List.Item key={q.id || q._id} style={{ padding: 0, marginBottom: 12 }}>
              <Card
                hoverable
                style={{
                  width: '100%',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                }}
                styles={{
                  body: { padding: '20px 24px' },
                }}
                onClick={() => navigate(`/questions/${q.id || q._id}`)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size={10}>
                  <Space wrap>
                    {q.category && (
                      <Tag
                        color={CATEGORY_COLORS[q.category] || 'blue'}
                        style={{ borderRadius: BORDER_RADIUS_SM, fontWeight: 500, fontSize: 12 }}
                      >
                        {q.category}
                      </Tag>
                    )}
                    {q.isArchived && (
                      <Tag color="red" style={{ borderRadius: BORDER_RADIUS_SM }}>已归档</Tag>
                    )}
                  </Space>

                  <Text
                    strong
                    style={{ fontSize: 16, cursor: 'pointer', color: '#1e1b4b', lineHeight: 1.5 }}
                  >
                    {q.title}
                  </Text>

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {getAuthorDisplayName(q, currentUser, '匿名用户')}
                        </Text>
                        <Text type="secondary">·</Text>
                        <ClockCircleOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {q.createdAt
                            ? new Date(q.createdAt).toLocaleDateString('zh-CN')
                            : ''}
                        </Text>
                      </Space>
                    </Col>
                    <Col>
                      <Space size="large">
                        <Space size={4}>
                          <EyeOutlined style={{ color: '#6b7280', fontSize: 13 }} />
                          <Text type="secondary" style={{ fontSize: 13 }}>{q.viewCount || 0}</Text>
                        </Space>
                        <Space size={4}>
                          <MessageOutlined style={{ color: '#6b7280', fontSize: 13 }} />
                          <Text type="secondary" style={{ fontSize: 13 }}>{q.answerCount || 0}</Text>
                        </Space>
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      </Spin>

      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
            showTotal={(t) => `共 ${t} 个问题`}
          />
        </div>
      )}

      {token && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          tooltip="提问"
          onClick={() => navigate('/ask')}
        />
      )}
    </div>
  );
}
