import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  List,
  Typography,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Tabs,
  message as antMessage,
  Tag,
  Divider,
  Row,
  Col,
  Avatar,
  Badge,
} from 'antd';
import {
  CommentOutlined,
  PlusOutlined,
  SendOutlined,
  TeamOutlined,
  MessageOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  listChatRooms,
  createChatRoom,
  joinChatRoom,
  leaveChatRoom,
  getChatRoomMessages,
  sendChatRoomMessage,
  getChatRoomMembers,
  requestFriend,
  respondFriend,
  listFriends,
  getFriendMessages,
  sendFriendMessage,
} from '../api';
import { useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;

const useInterval = (callback, delay) => {
  useEffect(() => {
    if (delay === null) return undefined;
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
};

export default function Chat() {
  const { user } = useSelector((state) => state.auth);

  const [rooms, setRooms] = useState([]);
  const [roomsTotal, setRoomsTotal] = useState(0);
  const [roomSearch, setRoomSearch] = useState('');
  const [roomLoading, setRoomLoading] = useState(false);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [createRoomForm] = Form.useForm();

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [nicknameForm] = Form.useForm();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [membership, setMembership] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [friendMessages, setFriendMessages] = useState([]);
  const [friendMessageInput, setFriendMessageInput] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendSending, setFriendSending] = useState(false);

  const loadRooms = useCallback(async (searchTerm = '') => {
    setRoomLoading(true);
    try {
      const res = await listChatRooms({ search: searchTerm });
      setRooms(res.data.rooms || []);
      setRoomsTotal(res.data.total || 0);
    } catch (err) {
      antMessage.error(err.response?.data?.message || '加载房间失败');
    } finally {
      setRoomLoading(false);
    }
  }, []);

  const loadMembers = useCallback(async (roomId) => {
    if (!roomId) return;
    try {
      const res = await getChatRoomMembers(roomId);
      setMembers(res.data.members || []);
    } catch (_) {
      setMembers([]);
    }
  }, []);

  const loadMessages = useCallback(async (roomId) => {
    if (!roomId) return;
    setMessageLoading(true);
    try {
      const res = await getChatRoomMessages(roomId, { limit: 50 });
      setMessages(res.data.messages || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setMembership(null);
      }
    } finally {
      setMessageLoading(false);
    }
  }, []);

  const loadFriends = useCallback(async () => {
    try {
      const res = await listFriends();
      setPendingRequests(res.data.pending || []);
      setFriends(res.data.friends || []);
    } catch (err) {
      antMessage.error(err.response?.data?.message || '加载好友信息失败');
    }
  }, []);

  const loadFriendMessages = useCallback(async (friendId) => {
    if (!friendId) return;
    setFriendLoading(true);
    try {
      const res = await getFriendMessages(friendId, { limit: 50 });
      setFriendMessages(res.data.messages || []);
    } catch (err) {
      antMessage.error(err.response?.data?.message || '加载私聊消息失败');
    } finally {
      setFriendLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms('');
    loadFriends();
  }, [loadRooms, loadFriends]);

  useEffect(() => {
    if (selectedRoom) {
      loadMembers(selectedRoom._id);
    }
  }, [selectedRoom, loadMembers]);

  useInterval(() => {
    if (selectedRoom && membership) {
      loadMessages(selectedRoom._id);
      loadMembers(selectedRoom._id);
    }
  }, membership ? 10000 : null);

  useInterval(() => {
    if (selectedFriendId) {
      loadFriendMessages(selectedFriendId);
    }
  }, selectedFriendId ? 10000 : null);

  const handleCreateRoom = async () => {
    try {
      const values = await createRoomForm.validateFields();
      const payload = {
        ...values,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      await createChatRoom(payload);
      antMessage.success('房间已创建');
      setRoomModalVisible(false);
      createRoomForm.resetFields();
      loadRooms();
    } catch (err) {
      if (err?.errorFields) return;
      antMessage.error(err.response?.data?.message || '创建失败');
    }
  };

  const openRoom = (room) => {
    setSelectedRoom(room);
    setMembership(null);
    setMessages([]);
    setJoinModalVisible(true);
  };

  const handleJoinRoom = async () => {
    try {
      const values = await nicknameForm.validateFields();
      const res = await joinChatRoom(selectedRoom._id, values);
      setMembership(res.data.membership);
      setJoinModalVisible(false);
      nicknameForm.resetFields();
      await loadMessages(selectedRoom._id);
      await loadMembers(selectedRoom._id);
    } catch (err) {
      if (err?.errorFields) return;
      antMessage.error(err.response?.data?.message || '加入房间失败');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return;
    setSending(true);
    try {
      await sendChatRoomMessage(selectedRoom._id, { content: messageInput });
      setMessageInput('');
      await loadMessages(selectedRoom._id);
    } catch (err) {
      antMessage.error(err.response?.data?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;
    try {
      await leaveChatRoom(selectedRoom._id);
    } catch (_) {
      // ignore leave errors to avoid blocking UI
    }
    setSelectedRoom(null);
    setMembership(null);
    setMessages([]);
    setMembers([]);
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      await requestFriend({ userId: targetUserId });
      antMessage.success('好友请求已发送或已接受');
      loadFriends();
    } catch (err) {
      antMessage.error(err.response?.data?.message || '发送好友请求失败');
    }
  };

  const handleRespondFriend = async (id, action) => {
    try {
      await respondFriend(id, { action });
      antMessage.success(action === 'accept' ? '已接受请求' : '已拒绝请求');
      loadFriends();
    } catch (err) {
      antMessage.error(err.response?.data?.message || '操作失败');
    }
  };

  const handleSelectFriend = (friend) => {
    if (!user) return;
    const friendId = friend.requester._id === user._id ? friend.recipient._id : friend.requester._id;
    setSelectedFriendId(friendId);
    loadFriendMessages(friendId);
  };

  const renderMemberAvatar = (member) => {
    const memberUserId = member.user?._id ?? null;
    const canAddFriend = memberUserId !== null && memberUserId !== user._id;
    const displayName = member.nickname || member.user?.username || 'User';
    const ariaLabel = canAddFriend ? 'Add friend' : `Room member ${displayName}`;
    return (
      <Avatar
        style={canAddFriend ? { cursor: 'pointer' } : undefined}
        tabIndex={canAddFriend ? 0 : undefined}
        onClick={canAddFriend ? () => handleAddFriend(memberUserId) : undefined}
        onKeyDown={
          canAddFriend
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
                  e.preventDefault();
                  handleAddFriend(memberUserId);
                }
              }
            : undefined
        }
        aria-label={ariaLabel}
        role={canAddFriend ? 'button' : undefined}
      >
        {(member.nickname?.[0] || '?').toUpperCase()}
      </Avatar>
    );
  };

  const handleSendFriendMessage = async () => {
    if (!selectedFriendId || !friendMessageInput.trim()) return;
    setFriendSending(true);
    try {
      await sendFriendMessage(selectedFriendId, { content: friendMessageInput });
      setFriendMessageInput('');
      await loadFriendMessages(selectedFriendId);
    } catch (err) {
      antMessage.error(err.response?.data?.message || '发送失败');
    } finally {
      setFriendSending(false);
    }
  };

  const activeFriendProfile = useMemo(() => {
    if (!selectedFriendId) return null;
    const match = friends.find(
      (f) => f.requester._id === selectedFriendId || f.recipient._id === selectedFriendId
    );
    if (!match) return null;
    return match.requester._id === selectedFriendId ? match.requester : match.recipient;
  }, [friends, selectedFriendId]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={3}>公开聊天室</Title>
      <Tabs
        defaultActiveKey="rooms"
        items={[
          {
            key: 'rooms',
            label: '群聊',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={10}>
                  <Card
                    title={
                      <Space>
                        <CommentOutlined />
                        <span>公开房间</span>
                        <Tag color="blue">共 {roomsTotal} 个</Tag>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Input.Search
                          placeholder="搜索房间"
                          onSearch={(v) => {
                            setRoomSearch(v);
                            loadRooms(v);
                          }}
                          value={roomSearch}
                          onChange={(e) => setRoomSearch(e.target.value)}
                          allowClear
                          style={{ width: 180 }}
                        />
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => setRoomModalVisible(true)}
                        >
                          新建
                        </Button>
                      </Space>
                    }
                    loading={roomLoading}
                  >
                    <List
                      rowKey="_id"
                      dataSource={rooms}
                      locale={{ emptyText: '暂无房间，创建一个吧' }}
                      renderItem={(room) => (
                        <List.Item
                          actions={[
                            <Button
                              key="join"
                              type="link"
                              onClick={() => openRoom(room)}
                            >
                              加入
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<TeamOutlined />} />}
                            title={room.name}
                            description={
                              <Paragraph ellipsis={{ rows: 2 }}>
                                {room.description || '暂无描述'}
                              </Paragraph>
                            }
                          />
                          <Space wrap>
                            {(room.tags || []).map((tag) => (
                              <Tag key={tag}>{tag}</Tag>
                            ))}
                          </Space>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={14}>
                  <Card
                    title={
                      <Space>
                        <MessageOutlined />
                        <span>{selectedRoom ? selectedRoom.name : '请选择一个房间'}</span>
                      </Space>
                    }
                    extra={
                      selectedRoom && (
                        <Space>
                          <Button type="text" onClick={handleLeaveRoom}>
                            离开
                          </Button>
                        </Space>
                      )
                    }
                  >
                    {selectedRoom && membership ? (
                      <>
                        <List
                          size="small"
                          loading={messageLoading}
                          rowKey="_id"
                          dataSource={messages}
                          style={{ maxHeight: 480, minHeight: 320, overflowY: 'auto' }}
                          locale={{ emptyText: '还没有人发言' }}
                          renderItem={(item) => (
                            <List.Item>
                              <List.Item.Meta
                                title={
                                  <Space>
                                    <Text strong>{item.nickname}</Text>
                                    <Tag>{item.user?.username || '已注销'}</Tag>
                                    <Text type="secondary">
                                      {new Date(item.createdAt).toLocaleTimeString()}
                                    </Text>
                                  </Space>
                                }
                                description={item.content}
                              />
                            </List.Item>
                          )}
                        />
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input.TextArea
                            rows={2}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="输入消息内容..."
                          />
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text type="secondary">我的昵称：{membership.nickname}</Text>
                            <Button
                              type="primary"
                              icon={<SendOutlined />}
                              loading={sending}
                              onClick={handleSendMessage}
                            >
                              发送
                            </Button>
                          </Space>
                        </Space>
                      </>
                    ) : (
                      <Paragraph type="secondary">选择一个房间并设置昵称即可开始聊天。</Paragraph>
                    )}
                  </Card>
                  {selectedRoom && (
                    <Card
                      title={
                        <Space>
                          <TeamOutlined />
                          <span>房间成员</span>
                        </Space>
                      }
                      style={{ marginTop: 16 }}
                    >
                      <List
                        rowKey="_id"
                        dataSource={members}
                        locale={{ emptyText: '暂无成员' }}
                        renderItem={(member) => (
                          <List.Item
                            actions={
                              member.user?._id !== user._id
                                ? [
                                    <Button
                                      key="add"
                                      type="link"
                                      icon={<UserAddOutlined />}
                                      onClick={() => handleAddFriend(member.user?._id)}
                                    >
                                      加好友
                                    </Button>,
                                  ]
                                : []
                            }
                          >
                            <List.Item.Meta
                              avatar={renderMemberAvatar(member)}
                              title={
                                <Space>
                                  <Text strong>{member.nickname}</Text>
                                  {member.user?.username && <Tag>{member.user.username}</Tag>}
                                </Space>
                              }
                              description={`加入于 ${new Date(member.joinedAt).toLocaleString()}`}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  )}
                </Col>
              </Row>
            ),
          },
          {
            key: 'friends',
            label: '好友与私聊',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={10}>
                  <Card title="好友请求">
                    <List
                      rowKey="_id"
                      dataSource={pendingRequests}
                      locale={{ emptyText: '暂无新的请求' }}
                      renderItem={(req) => (
                        <List.Item
                          actions={[
                            <Button type="link" onClick={() => handleRespondFriend(req._id, 'accept')}>
                              接受
                            </Button>,
                            <Button type="link" danger onClick={() => handleRespondFriend(req._id, 'reject')}>
                              拒绝
                            </Button>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<Avatar icon={<UserAddOutlined />} />}
                            title={req.requester?.username || '用户'}
                            description={req.requester?.email}
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                  <Card title="我的好友" style={{ marginTop: 16 }}>
                    <List
                      rowKey={(item) => item._id}
                      dataSource={friends}
                      locale={{ emptyText: '还没有好友，去房间添加吧' }}
                      renderItem={(friend) => {
                        const profile =
                          friend.requester._id === user._id ? friend.recipient : friend.requester;
                        return (
                          <List.Item
                            onClick={() => handleSelectFriend(friend)}
                            style={{
                              cursor: 'pointer',
                              background:
                                selectedFriendId === profile._id ? 'rgba(0,0,0,0.02)' : 'transparent',
                            }}
                          >
                            <List.Item.Meta
                              avatar={
                                <Avatar>
                                  {(profile.username?.[0] || '?').toUpperCase()}
                                </Avatar>
                              }
                              title={profile.username}
                              description={profile.email}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={14}>
                  <Card
                    title={
                      <Space>
                        <MessageOutlined />
                        <span>{activeFriendProfile ? activeFriendProfile.username : '选择一个好友开始聊天'}</span>
                      </Space>
                    }
                  >
                    {selectedFriendId ? (
                        <>
                          <List
                            rowKey="_id"
                            loading={friendLoading}
                            dataSource={friendMessages}
                          style={{ maxHeight: 480, minHeight: 320, overflowY: 'auto' }}
                          locale={{ emptyText: '暂时没有聊天记录' }}
                            renderItem={(item) => (
                              <List.Item>
                                <List.Item.Meta
                                  title={
                                  <Space>
                                    <Text strong>{item.from?.username || '用户'}</Text>
                                    <Badge status={item.from?._id === user._id ? 'processing' : 'default'} />
                                    <Text type="secondary">
                                      {new Date(item.createdAt).toLocaleTimeString()}
                                    </Text>
                                  </Space>
                                }
                                description={item.content}
                              />
                            </List.Item>
                          )}
                        />
                        <Divider />
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Input.TextArea
                            rows={3}
                            value={friendMessageInput}
                            onChange={(e) => setFriendMessageInput(e.target.value)}
                            placeholder="对好友说点什么..."
                          />
                          <Button
                            type="primary"
                            icon={<SendOutlined />}
                            loading={friendSending}
                            onClick={handleSendFriendMessage}
                          >
                            发送
                          </Button>
                        </Space>
                      </>
                    ) : (
                      <Paragraph type="secondary">点击左侧好友即可开始私聊</Paragraph>
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />

      <Modal
        title="创建房间"
        open={roomModalVisible}
        onCancel={() => setRoomModalVisible(false)}
        onOk={handleCreateRoom}
        okText="创建"
        destroyOnClose
      >
        <Form layout="vertical" form={createRoomForm}>
          <Form.Item
            label="房间名称"
            name="name"
            rules={[{ required: true, message: '请输入房间名称' }]}
          >
            <Input placeholder="例如：校园大本营" />
          </Form.Item>
          <Form.Item label="简介" name="description">
            <Input.TextArea rows={3} placeholder="简要介绍房间" />
          </Form.Item>
          <Form.Item label="标签（用逗号分隔）" name="tags">
            <Input placeholder="聊天, 学习, 游戏" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="加入房间"
        open={joinModalVisible}
        onCancel={() => setJoinModalVisible(false)}
        onOk={handleJoinRoom}
        okText="确认昵称"
        destroyOnClose
      >
        <Text type="secondary">进入公开群聊前，请为自己取一个唯一昵称。</Text>
        <Form layout="vertical" form={nicknameForm} style={{ marginTop: 12 }}>
          <Form.Item
            label="昵称"
            name="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { min: 2, max: 20, message: '长度 2-20 字' },
            ]}
          >
            <Input placeholder="昵称需在房间内唯一" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
