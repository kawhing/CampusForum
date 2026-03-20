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
  MessageOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setUser } from '../store/slices/authSlice';
import { logoutApi, getMe, getNotifications } from '../api';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const BRAND_PRIMARY_DARK = '#0b1533';
const BRAND_SECONDARY_DARK = '#0c213f';
const BRAND_ACCENT_DARK = '#123a63';
const BRAND_NAVY = '#0f3f7a';
const APP_LAYOUT_GRADIENT = `linear-gradient(135deg, ${BRAND_PRIMARY_DARK} 0%, ${BRAND_SECONDARY_DARK} 40%, ${BRAND_ACCENT_DARK} 100%)`;
const HEADER_GRADIENT = `linear-gradient(120deg, ${BRAND_PRIMARY_DARK} 0%, ${BRAND_NAVY} 45%, ${BRAND_PRIMARY_DARK} 100%)`;
const CONTENT_GRADIENT = 'linear-gradient(145deg, #ffffff 0%, #f5f7fb 100%)';
const HEADER_SHADOW = '0 12px 40px rgba(0, 0, 0, 0.35)';
const PANEL_SHADOW = '0 18px 48px rgba(15, 23, 42, 0.12)';
const CONTENT_SHADOW = '0 24px 60px rgba(15, 23, 42, 0.14)';
const GLASS_PANEL_STYLE = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  boxShadow: PANEL_SHADOW,
};
// Header keeps tighter horizontal padding than content to keep navigation compact.
const HEADER_PADDING_MOBILE = '0 16px';
const HEADER_PADDING_DESKTOP = '0 32px';
// Font sizes are pixel values chosen to keep the masthead readable on all devices.
const TITLE_FONT_SIZE_MOBILE = '16px';
const TITLE_FONT_SIZE_DESKTOP = '18px';
const OUTER_LAYOUT_PADDING_MOBILE = '16px';
const OUTER_LAYOUT_PADDING_DESKTOP = '32px 40px';
const PANEL_BORDER_RADIUS = '16px';
// Content uses slightly softer padding to give cards breathing room on all devices.
const CONTENT_PADDING_MOBILE = '20px';
const CONTENT_PADDING_DESKTOP = '28px';

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
    if (location.pathname.startsWith('/chat')) return 'chat';
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
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: '聊天室',
      onClick: () => navigate('/chat'),
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
    <Layout style={{ minHeight: '100vh', background: APP_LAYOUT_GRADIENT }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? HEADER_PADDING_MOBILE : HEADER_PADDING_DESKTOP,
          background: HEADER_GRADIENT,
          boxShadow: HEADER_SHADOW,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
              style={{
                color: '#f8fafc',
                fontSize: isMobile ? TITLE_FONT_SIZE_MOBILE : TITLE_FONT_SIZE_DESKTOP,
                cursor: 'pointer',
              }}
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
                { key: 'chat', label: '聊天室', onClick: () => navigate('/chat') },
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
            style={{
              ...GLASS_PANEL_STYLE,
              borderRadius: PANEL_BORDER_RADIUS,
              overflow: 'hidden',
            }}
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
              ...GLASS_PANEL_STYLE,
              borderRadius: PANEL_BORDER_RADIUS,
              overflow: 'hidden',
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

        <Layout
          style={{ padding: isMobile ? OUTER_LAYOUT_PADDING_MOBILE : OUTER_LAYOUT_PADDING_DESKTOP }}
        >
          <Content
            style={{
              background: CONTENT_GRADIENT,
              padding: isMobile ? CONTENT_PADDING_MOBILE : CONTENT_PADDING_DESKTOP,
              margin: 0,
              minHeight: 280,
              borderRadius: PANEL_BORDER_RADIUS,
              boxShadow: CONTENT_SHADOW,
              border: '1px solid #e5e7eb',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
