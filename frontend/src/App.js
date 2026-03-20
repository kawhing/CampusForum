import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
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
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}
