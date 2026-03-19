import React, { useEffect, useState } from 'react';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Badge,
  Space,
  Typography,
  Grid,
} from 'antd';
import {
  HomeOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  BellOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../store/slices/authSlice';
import { logoutApi, getMe, getNotifications } from '../api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const { user, token } = useSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [siderCollapsed, setSiderCollapsed] = useState(false);

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then((res) => dispatch(setUser(res.data.user || res.data)))
        .catch(() => {});
    }
  }, [token, user, dispatch]);

  useEffect(() => {
    if (token) {
      getNotifications()
        .then((res) => {
          const notifications = res.data.notifications || res.data || [];
          const unread = notifications.filter((n) => !n.read).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (_) {
      // ignore API errors on logout
    }
    dispatch(logout());
    navigate('/login');
  };

  const selectedKey = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname.startsWith('/ask')) return 'ask';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/admin')) return 'admin';
    return 'home';
  };

  const siderMenuItems = [
    { key: 'home', icon: <HomeOutlined />, label: '首页', onClick: () => navigate('/') },
    {
      key: 'ask',
      icon: <QuestionCircleOutlined />,
      label: '提问',
      onClick: () => navigate('/ask'),
    },
    ...(user
      ? [
          {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人中心',
            onClick: () => navigate('/profile'),
          },
        ]
      : []),
    ...(user && (user.role === 'admin' || user.role === 'moderator')
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '管理控制台',
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    ...(user && (user.role === 'admin' || user.role === 'moderator')
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '管理控制台',
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ];

  const isMobile = !screens.md;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#001529',
        }}
      >
        <Space size="large">
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: '#fff' }} />}
              onClick={() => setSiderCollapsed((v) => !v)}
            />
          )}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Text
              strong
              style={{ color: '#fff', fontSize: 18, cursor: 'pointer' }}
            >
              匿名问答平台
            </Text>
          </Link>
          {!isMobile && (
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[selectedKey()]}
              style={{ background: 'transparent', border: 'none', minWidth: 200 }}
              items={[
                { key: 'home', label: '首页', onClick: () => navigate('/') },
                { key: 'ask', label: '提问', onClick: () => navigate('/ask') },
              ]}
            />
          )}
        </Space>

        <Space size="middle">
          {token && (
            <Badge count={unreadCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ color: '#fff', fontSize: 18 }} />}
                onClick={() => navigate('/profile')}
              />
            </Badge>
          )}
          {token && user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                {!isMobile && (
                  <Text style={{ color: '#fff' }}>{user.username}</Text>
                )}
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button type="text" style={{ color: '#fff' }} onClick={() => navigate('/login')}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')}>
                注册
              </Button>
            </Space>
          )}
        </Space>
      </Header>

      <Layout>
        {!isMobile && (
          <Sider
            width={200}
            collapsible
            collapsed={siderCollapsed}
            onCollapse={setSiderCollapsed}
            style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey()]}
              style={{ height: '100%', borderRight: 0 }}
              items={siderMenuItems}
            />
          </Sider>
        )}

        {isMobile && !siderCollapsed && (
          <Sider
            width={200}
            style={{
              background: '#fff',
              borderRight: '1px solid #f0f0f0',
              position: 'fixed',
              left: 0,
              top: 64,
              bottom: 0,
              zIndex: 999,
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedKey()]}
              style={{ height: '100%', borderRight: 0 }}
              items={siderMenuItems}
              onClick={() => setSiderCollapsed(true)}
            />
          </Sider>
        )}

        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: 8,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
