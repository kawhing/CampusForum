import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Space,
  Alert,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { createQuestion, getCategories } from '../api';

const { Title } = Typography;
const { TextArea } = Input;

export default function AskQuestion() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories || res.data || []))
      .catch(() => {});
  }, []);

  const categoryOptions = categories.map((c) => ({ value: c, label: c }));

  const onFinish = async (values) => {
    const category = Array.isArray(values.category)
      ? values.category[0]
      : values.category;

    setLoading(true);
    setError(null);
    try {
      const res = await createQuestion({
        title: values.title,
        category: category || '',
        content: values.content,
      });
      const newId =
        res.data.id || res.data._id || res.data.question?.id || res.data.question?._id;
      message.success('问题已发布！');
      navigate(`/questions/${newId}`);
    } catch (err) {
      setError(err.response?.data?.message || '发布问题失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>
          提问
        </Title>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="问题标题"
          rules={[
            { required: true, message: '请输入问题标题' },
            { min: 15, message: '问题标题至少需要15个字符' },
            { max: 200, message: '问题标题不能超过200个字符' },
          ]}
          >
            <Input
              placeholder="请用简洁的语言描述你的问题"
              showCount
              maxLength={200}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="问题分类"
            rules={[{ required: true, message: '请选择或输入问题分类' }]}
            extra="可从现有分类中选择，或直接输入自定义分类"
          >
            <Select
              mode="tags"
              placeholder="选择或输入分类"
              options={categoryOptions}
              maxCount={1}
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="问题内容"
          rules={[
            { required: true, message: '请输入问题内容' },
            { min: 50, message: '问题内容至少需要50个字符，明确描述你的问题和期望' },
            { max: 10000, message: '问题内容不能超过10000个字符' },
          ]}
          >
            <TextArea
              placeholder="详细描述你的问题，提供足够的背景信息有助于获得更好的回答..."
              autoSize={{ minRows: 6, maxRows: 20 }}
              showCount
              maxLength={10000}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
              >
                发布问题
              </Button>
              <Button size="large" onClick={() => navigate('/')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
