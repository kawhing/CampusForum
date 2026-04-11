import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import AppLayout from './components/AppLayout';
import PrivateRoute from './components/PrivateRoute';
import QuestionList from './pages/QuestionList';
import QuestionDetail from './pages/QuestionDetail';
import AskQuestion from './pages/AskQuestion';
import Profile from './pages/Profile';
import AdminConsole from './pages/admin/AdminConsole';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import SupportAssistant from './pages/SupportAssistant';
import AiAssistant from './pages/AiAssistant';

const APP_THEME = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#4f46e5',
    colorLink: '#4f46e5',
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
    boxShadow:
      '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    boxShadowSecondary:
      '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 38,
      controlHeightLG: 44,
    },
    Card: {
      borderRadiusLG: 14,
      boxShadow:
        '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 38,
      controlHeightLG: 44,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 38,
    },
    Menu: {
      borderRadius: 8,
      itemBorderRadius: 8,
    },
    Tag: {
      borderRadius: 6,
    },
    Table: {
      borderRadius: 14,
    },
    Modal: {
      borderRadiusLG: 16,
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={APP_THEME}>
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<QuestionList />} />
        <Route path="questions/:id" element={<QuestionDetail />} />
        <Route
          path="ask"
          element={
            <PrivateRoute>
              <AskQuestion />
            </PrivateRoute>
          }
        />
        <Route
          path="profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="admin"
          element={
            <PrivateRoute roles={['admin', 'moderator']}>
              <AdminConsole />
            </PrivateRoute>
          }
        />
        <Route
          path="chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route path="ai" element={<AiAssistant />} />
        <Route path="support" element={<SupportAssistant />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
    </ConfigProvider>
  );
}
