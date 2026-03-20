const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listRooms,
  createRoom,
  joinRoom,
  leaveRoom,
  listMembers,
  getRoomMessages,
  sendRoomMessage,
  requestFriend,
  respondFriend,
  listFriends,
  getFriendMessages,
  sendFriendMessage
} = require('../controllers/chatController');

router.use(authenticate);

router.get('/rooms', listRooms);
router.post('/rooms', createRoom);
router.post('/rooms/:id/join', joinRoom);
router.delete('/rooms/:id/leave', leaveRoom);
router.get('/rooms/:id/members', listMembers);
router.get('/rooms/:id/messages', getRoomMessages);
router.post('/rooms/:id/messages', sendRoomMessage);

router.post('/friends/request', requestFriend);
router.post('/friends/:id/respond', respondFriend);
router.get('/friends', listFriends);
router.get('/friends/:friendId/messages', getFriendMessages);
router.post('/friends/:friendId/messages', sendFriendMessage);

module.exports = router;
