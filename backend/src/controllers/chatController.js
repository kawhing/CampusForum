const mongoose = require('mongoose');
const ChatRoom = require('../models/ChatRoom');
const ChatMembership = require('../models/ChatMembership');
const ChatMessage = require('../models/ChatMessage');
const Friendship = require('../models/Friendship');
const PrivateMessage = require('../models/PrivateMessage');
const User = require('../models/User');

const MAX_PAGE_SIZE = 50;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listRooms = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search && req.query.search.trim();

    const filter = { isPublic: true };
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: new RegExp(safe, 'i') },
        { description: new RegExp(safe, 'i') },
        { tags: search }
      ];
    }

    const total = await ChatRoom.countDocuments(filter);
    const rooms = await ChatRoom.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ rooms, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createRoom = async (req, res) => {
  try {
    const { name, description, tags } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '房间名称不能为空' });
    }

    const existing = await ChatRoom.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ message: '房间名称已存在' });
    }

    const room = await ChatRoom.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      tags: Array.isArray(tags) ? tags.map((t) => (t || '').trim()).filter(Boolean) : [],
      createdBy: req.user._id
    });

    return res.status(201).json({ room });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const joinRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname } = req.body;
    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ message: '昵称不能为空' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const room = await ChatRoom.findById(id);
    if (!room || !room.isPublic) {
      return res.status(404).json({ message: '房间不存在或不可加入' });
    }

    const trimmedNickname = nickname.trim();

    const existingNickname = await ChatMembership.findOne({
      room: id,
      nickname: trimmedNickname,
      user: { $ne: req.user._id }
    });
    if (existingNickname) {
      return res.status(400).json({ message: '该昵称已被占用，请更换' });
    }

    let membership = await ChatMembership.findOne({ room: id, user: req.user._id });
    if (membership) {
      membership.nickname = trimmedNickname;
      membership.joinedAt = new Date();
      await membership.save();
    } else {
      membership = await ChatMembership.create({
        room: id,
        user: req.user._id,
        nickname: trimmedNickname
      });
    }

    return res.status(200).json({ membership });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: '该昵称已被占用，请更换' });
    }
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const leaveRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    await ChatMembership.deleteOne({ room: id, user: req.user._id });
    return res.status(200).json({ message: '已退出房间' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const listMembers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    const members = await ChatMembership.find({ room: id })
      .sort({ joinedAt: -1 })
      .populate('user', 'username email');
    return res.status(200).json({ members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getRoomMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || 30));
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }

    const membership = await ChatMembership.findOne({ room: id, user: req.user._id });
    if (!membership) {
      return res.status(403).json({ message: '无权查看此房间消息，请先加入并设置昵称' });
    }

    const messages = await ChatMessage.find({ room: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'username email')
      .lean();

    return res.status(200).json({ messages: messages.reverse() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const sendRoomMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid room ID' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }
    const membership = await ChatMembership.findOne({ room: id, user: req.user._id });
    if (!membership) {
      return res.status(403).json({ message: '你必须先加入房间才能发送消息' });
    }

    const message = await ChatMessage.create({
      room: id,
      user: req.user._id,
      nickname: membership.nickname,
      content: content.trim()
    });

    return res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const requestFriend = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: '不能添加自己为好友' });
    }

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(200).json({ friendship: existing, message: '你们已经是好友了' });
      }
      if (existing.recipient.toString() === req.user._id.toString() && existing.status === 'pending') {
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        await existing.save();
        return res.status(200).json({ friendship: existing, message: '已接受对方的好友请求' });
      }
      return res.status(200).json({ friendship: existing, message: '好友请求已发送' });
    }

    const friendship = await Friendship.create({
      requester: req.user._id,
      recipient: userId
    });
    return res.status(201).json({ friendship });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const respondFriend = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const friendship = await Friendship.findById(id);
    if (!friendship || friendship.recipient.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: '请求不存在' });
    }

    friendship.status = action === 'accept' ? 'accepted' : 'rejected';
    friendship.respondedAt = new Date();
    await friendship.save();
    return res.status(200).json({ friendship });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const listFriends = async (req, res) => {
  try {
    const pending = await Friendship.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'username email');

    const accepted = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    })
      .populate('requester', 'username email')
      .populate('recipient', 'username email');

    return res.status(200).json({ pending, friends: accepted });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getFriendMessages = async (req, res) => {
  try {
    const { friendId } = req.params;
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.limit) || 30));
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const friendship = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: req.user._id, recipient: friendId },
        { requester: friendId, recipient: req.user._id }
      ]
    });
    if (!friendship) {
      return res.status(403).json({ message: '无权访问此聊天记录' });
    }

    const messages = await PrivateMessage.find({
      $or: [
        { from: req.user._id, to: friendId },
        { from: friendId, to: req.user._id }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('from', 'username email')
      .populate('to', 'username email')
      .lean();

    return res.status(200).json({ messages: messages.reverse() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const sendFriendMessage = async (req, res) => {
  try {
    const { friendId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    const friendship = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: req.user._id, recipient: friendId },
        { requester: friendId, recipient: req.user._id }
      ]
    });
    if (!friendship) {
      return res.status(403).json({ message: '无权发送私聊消息' });
    }

    const message = await PrivateMessage.create({
      from: req.user._id,
      to: friendId,
      content: content.trim()
    });

    return res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};
