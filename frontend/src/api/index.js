import axios from 'axios';

// Holds the Redux store reference, injected after store creation to avoid
// a circular dependency: api -> store -> authSlice -> api
let _store;
export const injectStore = (store) => { _store = store; };

let _isLoggingOut = false;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !_isLoggingOut) {
      _isLoggingOut = true;
      if (_store) {
        import('../store/slices/authSlice').then(({ logout }) => {
          _store.dispatch(logout());
          window.location.href = '/login';
        });
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logoutApi = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');

// Questions
export const getQuestions = (params) => api.get('/questions', { params });
export const getQuestion = (id, params) => api.get(`/questions/${id}`, { params });
export const createQuestion = (data) => api.post('/questions', data);
export const updateQuestion = (id, data) => api.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => api.delete(`/questions/${id}`);
export const getCategories = () => api.get('/questions/categories');

// Answers
export const getAnswers = (questionId, params) =>
  api.get(`/questions/${questionId}/answers`, { params });
export const createAnswer = (questionId, data) =>
  api.post(`/questions/${questionId}/answers`, data);
export const updateAnswer = (id, data) => api.put(`/answers/${id}`, data);
export const deleteAnswer = (id) => api.delete(`/answers/${id}`);
export const likeAnswer = (id) => api.post(`/answers/${id}/like`);
export const dislikeAnswer = (id) => api.post(`/answers/${id}/dislike`);
export const favoriteAnswer = (id) => api.post(`/answers/${id}/favorite`);
export const getComments = (answerId) => api.get(`/answers/${answerId}/comments`);
export const createComment = (answerId, data) =>
  api.post(`/answers/${answerId}/comments`, data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// Users
export const getProfile = () => api.get('/users/profile');
export const updateProfile = (data) => api.put('/users/profile', data);
export const changePassword = (data) => api.put('/users/password', data);
export const getMyQuestions = (params) => api.get('/users/questions', { params });
export const getMyAnswers = (params) => api.get('/users/answers', { params });
export const getMyFavorites = () => api.get('/users/favorites');
export const getNotifications = () => api.get('/users/notifications');
export const markNotificationRead = (id) => api.put(`/users/notifications/${id}/read`);
export const createAppeal = (data) => api.post('/users/appeals', data);
export const getMyAppeals = () => api.get('/users/appeals');

// Admin
export const archiveQuestion = (id, data) =>
  api.post(`/admin/questions/${id}/archive`, data);
export const unarchiveQuestion = (id, data) =>
  api.post(`/admin/questions/${id}/unarchive`, data);
export const adminDeleteQuestion = (id, data) =>
  api.delete(`/admin/questions/${id}`, { data });
export const adminDeleteAnswer = (id, data) =>
  api.delete(`/admin/answers/${id}`, { data });
export const pinAnswer = (id, data) => api.post(`/admin/answers/${id}/pin`, data);
export const banUser = (id, data) => api.post(`/admin/users/${id}/ban`, data);
export const unbanUser = (id, data) => api.post(`/admin/users/${id}/unban`, data);
export const changeCategory = (id, data) =>
  api.put(`/admin/questions/${id}/category`, data);
export const getOperationLogs = (params) => api.get('/admin/logs', { params });
export const getAppeals = () => api.get('/admin/appeals');
export const resolveAppeal = (id, data) => api.put(`/admin/appeals/${id}`, data);
export const getAdminStats = () => api.get('/admin/stats');

// Chat
export const listChatRooms = (params) => api.get('/chat/rooms', { params });
export const createChatRoom = (data) => api.post('/chat/rooms', data);
export const joinChatRoom = (id, data) => api.post(`/chat/rooms/${id}/join`, data);
export const leaveChatRoom = (id) => api.delete(`/chat/rooms/${id}/leave`);
export const getChatRoomMessages = (id, params) =>
  api.get(`/chat/rooms/${id}/messages`, { params });
export const sendChatRoomMessage = (id, data) => api.post(`/chat/rooms/${id}/messages`, data);
export const getChatRoomMembers = (id) => api.get(`/chat/rooms/${id}/members`);

export const requestFriend = (data) => api.post('/chat/friends/request', data);
export const respondFriend = (id, data) => api.post(`/chat/friends/${id}/respond`, data);
export const listFriends = () => api.get('/chat/friends');
export const getFriendMessages = (friendId, params) =>
  api.get(`/chat/friends/${friendId}/messages`, { params });
export const sendFriendMessage = (friendId, data) =>
  api.post(`/chat/friends/${friendId}/messages`, data);

export default api;
