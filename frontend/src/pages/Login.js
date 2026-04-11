import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Checkbox,
  Typography,
  Alert,
  Divider,
} from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import {
  GRADIENT_AUTH_BG,
  GRADIENT_PRIMARY,
  SHADOW_AUTH_CARD,
  SHADOW_LOGO,
} from '../constants/theme';

const { Title, Text } = Typography;

export default function Login() {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && user) navigate('/');
    return () => { dispatch(clearError()); };
  }, [token, user, navigate, dispatch]);

  const onFinish = async (values) => {
    const result = await dispatch(loginUser(values));
    if (loginUser.fulfilled.match(result)) {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: GRADIENT_AUTH_BG,
      }}
    >
      <Card
        style={{
          width: 420,
          boxShadow: SHADOW_AUTH_CARD,
          border: 'none',
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: GRADIENT_PRIMARY,
              marginBottom: 16,
              boxShadow: SHADOW_LOGO,
            }}
          >
            <span style={{ fontSize: 26 }}>🎓</span>
          </div>
          <Title level={2} style={{ marginBottom: 4, color: '#1e1b4b' }}>
            匿名问答平台
          </Title>
          <Text type="secondary">登录您的账号</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            name="email"
            label="邮箱或用户名"
            rules={[{ required: true, message: '请输入邮箱或用户名' }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱或用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>

          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">还没有账号？</Text>
        </Divider>
        <div style={{ textAlign: 'center' }}>
          <Link to="/register">去注册</Link>
        </div>
      </Card>
    </div>
  );
}
