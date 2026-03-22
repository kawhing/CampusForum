import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Divider,
  Alert,
  Spin,
  Modal,
  Form,
  message,
  Avatar,
  Tooltip,
  Row,
  Col,
  Collapse,
  Empty,
} from 'antd';
import {
  LikeOutlined,
  LikeFilled,
  DislikeOutlined,
  DislikeFilled,
  StarOutlined,
  StarFilled,
  MessageOutlined,
  PushpinFilled,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchQuestion } from '../store/slices/questionsSlice';
import {
  getAnswers,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  likeAnswer,
  dislikeAnswer,
  acceptAnswer,
  favoriteAnswer,
  getComments,
  createComment,
  deleteComment,
  createAppeal,
} from '../api';
import { ensureSupportPrompt } from '../utils/supportPrompt';
import { getAuthorDisplayName } from '../utils/questionOwner';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const MAX_VIEWED_QUESTIONS = 100;

const ANSWER_SORT_OPTIONS = [
  { value: 'time', label: '最新' },
  { value: 'likes', label: '点赞最多' },
  { value: 'comments', label: '评论最多' },
];

function CommentSection({ answerId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const viewerId = currentUser?.id || currentUser?._id;

  const getCommentDisplayName = useCallback(
    (comment) => {
      const authorId = comment?.authorId || comment?.author?.id || comment?.author?._id;
      if (viewerId && authorId && viewerId.toString() === authorId.toString()) {
        return '我';
      }
      return '匿名评论者';
    },
    [viewerId]
  );

  const { commentTree, commentMap } = useMemo(() => {
    const map = new Map();
    const roots = [];
    comments.forEach((comment) => {
      const id = comment.id || comment._id;
      if (!id) return;
      map.set(id.toString(), { ...comment, replies: [] });
    });
    comments.forEach((comment) => {
      const id = comment.id || comment._id;
      if (!id) return;
      const parentId = comment.parentCommentId;
      const node = map.get(id.toString());
      if (parentId && map.has(parentId.toString())) {
        map.get(parentId.toString()).replies.push(node);
      } else {
        roots.push(node);
      }
    });
    return { commentTree: roots, commentMap: map };
  }, [comments]);

  const loadComments = useCallback(() => {
    setLoading(true);
    getComments(answerId)
      .then((res) => setComments(res.data.comments || res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [answerId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const allowSubmit = await ensureSupportPrompt(newComment);
    if (!allowSubmit) return;
    setSubmitting(true);
    try {
      const payload = { content: newComment };
      if (replyTarget?.id || replyTarget?._id) {
        payload.parentCommentId = replyTarget.id || replyTarget._id;
      }
      await createComment(answerId, payload);
      setNewComment('');
      setReplyTarget(null);
      message.success('评论已发布');
      loadComments();
    } catch (err) {
      message.error(err.response?.data?.message || '发布评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (id) => {
    try {
      await deleteComment(id);
      message.success('评论已删除');
      loadComments();
    } catch (err) {
      message.error('删除评论失败');
    }
  };

  const handleReportComment = async () => {
    if (!reportReason.trim()) return message.warning('请填写举报原因');
    setReportSubmitting(true);
    try {
      const commentId = reportTarget?.id || reportTarget?._id;
      await createAppeal({ targetId: commentId, targetType: 'comment', reason: reportReason });
      message.success('举报已提交');
      setReportTarget(null);
      setReportReason('');
    } catch (err) {
      message.error(err.response?.data?.message || '举报失败');
    } finally {
      setReportSubmitting(false);
    }
  };

  const renderComment = (comment, depth = 0) => {
    const authorId = comment.authorId || comment.author?.id || comment.author?._id;
    const isOwner = viewerId && authorId && viewerId.toString() === authorId.toString();
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
    const parentComment = comment.parentCommentId
      ? commentMap.get(comment.parentCommentId.toString())
      : null;
    const parentName = parentComment ? getCommentDisplayName(parentComment) : null;

    return (
      <div
        key={comment.id || comment._id}
        style={{
          marginTop: depth === 0 ? 8 : 12,
          marginLeft: depth * 24,
          paddingLeft: depth ? 12 : 0,
          borderLeft: depth ? '1px solid #f0f0f0' : undefined,
        }}
      >
        <Space align="start">
          <Avatar size="small" icon={<UserOutlined />} />
          <div style={{ width: '100%' }}>
            <Space size="small" wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getCommentDisplayName(comment)}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                信誉 {comment.authorTrustScore ?? 0}
              </Text>
              {parentName && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  回复 {parentName}
                </Text>
              )}
              <Text type="secondary" style={{ fontSize: 11 }}>
                {comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString('zh-CN')
                  : ''}
              </Text>
            </Space>
            <div>
              <Text style={{ fontSize: 13 }}>{comment.content}</Text>
            </div>
            <Space size="small" style={{ marginTop: 4 }}>
              {currentUser && (
                <Button type="link" size="small" onClick={() => setReplyTarget(comment)}>
                  回复
                </Button>
              )}
              {currentUser && !isOwner && (
                <Button
                  type="link"
                  size="small"
                  icon={<FlagOutlined />}
                  onClick={() => { setReportTarget(comment); setReportReason(''); }}
                >
                  举报
                </Button>
              )}
              {(isOwner || isAdmin) && (
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => handleDeleteComment(comment.id || comment._id)}
                >
                  删除
                </Button>
              )}
            </Space>
          </div>
        </Space>
        {(comment.replies || []).map((reply) => renderComment(reply, depth + 1))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Modal
        title="举报评论"
        open={!!reportTarget}
        onOk={handleReportComment}
        onCancel={() => { setReportTarget(null); setReportReason(''); }}
        okText="提交举报"
        cancelText="取消"
        confirmLoading={reportSubmitting}
      >
        <TextArea
          placeholder="请描述举报原因（如：违规内容、骚扰等）"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          rows={3}
          maxLength={500}
        />
      </Modal>
      <Spin spinning={loading}>
        {commentTree.length === 0 ? (
          <Text type="secondary">暂无评论</Text>
        ) : (
          <div>{commentTree.map((comment) => renderComment(comment))}</div>
        )}
      </Spin>

      {currentUser && (
        <div style={{ marginTop: 8 }}>
          {replyTarget && (
            <Space size="small" style={{ marginBottom: 6 }}>
              <Text type="secondary">
                正在回复 {getCommentDisplayName(replyTarget)}
              </Text>
              <Button type="link" size="small" onClick={() => setReplyTarget(null)}>
                取消
              </Button>
            </Space>
          )}
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder={replyTarget ? '写下你的回复...' : '写下你的评论...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onPressEnter={handleAddComment}
              maxLength={200}
            />
            <Button type="primary" loading={submitting} onClick={handleAddComment}>
              发布
            </Button>
          </Space.Compact>
        </div>
      )}
    </div>
  );
}

function AnswerCard({ answer, currentUser, onRefresh, questionAuthorId, acceptedAnswerId, onAccept }) {
  const [liked, setLiked] = useState(answer.likedByMe || false);
  const [disliked, setDisliked] = useState(answer.dislikedByMe || false);
  const [favorited, setFavorited] = useState(answer.favoritedByMe || false);
  const [likeCount, setLikeCount] = useState(answer.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(answer.dislikeCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const answerId = answer.id || answer._id;
  const isOwner =
    currentUser &&
    (currentUser.id === (answer.authorId || answer.author?.id) ||
      currentUser._id === (answer.authorId || answer.author?._id));
  const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'moderator');
  const canAccept = currentUser && (currentUser.id === questionAuthorId || currentUser._id === questionAuthorId || isAdmin);
  const isAccepted = acceptedAnswerId && (acceptedAnswerId === answerId || acceptedAnswerId === answer._id?.toString());
  const displayName = isOwner ? '我的回答' : answer.anonymousLabel || '匿名回答者';

  const handleLike = async () => {
    if (!currentUser) return message.warning('请先登录');
    if (isOwner) return message.warning('不能给自己的回答点赞');
    try {
      await likeAnswer(answerId);
      setLiked((v) => !v);
      setLikeCount((c) => (liked ? c - 1 : c + 1));
      if (!liked && disliked) {
        setDisliked(false);
        setDislikeCount((c) => c - 1);
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleDislike = async () => {
    if (!currentUser) return message.warning('请先登录');
    if (isOwner) return message.warning('不能给自己的回答点踩');
    try {
      await dislikeAnswer(answerId);
      setDisliked((v) => !v);
      setDislikeCount((c) => (disliked ? c - 1 : c + 1));
      if (!disliked && liked) {
        setLiked(false);
        setLikeCount((c) => c - 1);
      }
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleFavorite = async () => {
    if (!currentUser) return message.warning('请先登录');
    try {
      await favoriteAnswer(answerId);
      setFavorited((v) => !v);
      message.success(favorited ? '已取消收藏' : '已收藏');
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    const allowSubmit = await ensureSupportPrompt(editContent);
    if (!allowSubmit) return;
    setEditSubmitting(true);
    try {
      await updateAnswer(answerId, { content: editContent });
      message.success('回答已更新');
      setEditing(false);
      onRefresh();
    } catch (err) {
      message.error(err.response?.data?.message || '更新失败');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条回答吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteAnswer(answerId);
          message.success('回答已删除');
          onRefresh();
        } catch (err) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return message.warning('请填写举报原因');
    setReportSubmitting(true);
    try {
      await createAppeal({ targetId: answerId, targetType: 'answer', reason: reportReason });
      message.success('举报已提交');
      setReportVisible(false);
      setReportReason('');
    } catch (err) {
      message.error(err.response?.data?.message || '举报失败');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <>
    <Modal
      title="举报回答"
      open={reportVisible}
      onOk={handleReport}
      onCancel={() => { setReportVisible(false); setReportReason(''); }}
      okText="提交举报"
      cancelText="取消"
      confirmLoading={reportSubmitting}
    >
      <TextArea
        placeholder="请描述举报原因（如：违规内容、骚扰等）"
        value={reportReason}
        onChange={(e) => setReportReason(e.target.value)}
        rows={3}
        maxLength={500}
      />
    </Modal>
    <Card
      style={{
        marginBottom: 16,
        border: isAccepted ? '2px solid #52c41a' : answer.pinned ? '2px solid #1890ff' : undefined,
      }}
    >
      {isAccepted && (
        <div style={{ marginBottom: 8 }}>
          <Tag color="green">已采纳</Tag>
        </div>
      )}
      {answer.pinned && (
        <div style={{ marginBottom: 8 }}>
          <Tag icon={<PushpinFilled />} color="blue">
            置顶回答
          </Tag>
        </div>
      )}

      <Row justify="space-between" align="top">
        <Col>
          <Space size="small">
            <Avatar size="small" icon={<UserOutlined />} />
            <Text strong>
              {displayName}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              信誉 {answer.authorTrustScore ?? 0}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined />{' '}
              {answer.createdAt
                ? new Date(answer.createdAt).toLocaleDateString('zh-CN')
                : ''}
            </Text>
          </Space>
        </Col>
        <Col>
          {(isOwner || isAdmin) && (
            <Space>
              {isOwner && (
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditing((v) => !v)}
                  />
                </Tooltip>
              )}
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                />
              </Tooltip>
            </Space>
          )}
          {canAccept && !isAccepted && (
            <Button type="primary" size="small" onClick={() => onAccept(answerId)}>
              采纳为最佳
            </Button>
          )}
        </Col>
      </Row>

      <div style={{ margin: '12px 0' }}>
        {editing ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              autoSize={{ minRows: 3 }}
            />
            <Space>
              <Button
                type="primary"
                size="small"
                loading={editSubmitting}
                onClick={handleEdit}
              >
                保存
              </Button>
              <Button size="small" onClick={() => setEditing(false)}>
                取消
              </Button>
            </Space>
          </Space>
        ) : (
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
            {answer.content}
          </Paragraph>
        )}
      </div>

      <Row justify="space-between" align="middle">
        <Col>
          <Space size="middle">
            <Tooltip title={isOwner ? '不能给自己的回答点赞' : ''}>
              <Button
                type="text"
                size="small"
                icon={liked ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
                onClick={handleLike}
                disabled={isOwner}
              >
                {likeCount}
              </Button>
            </Tooltip>
            <Tooltip title={isOwner ? '不能给自己的回答点踩' : ''}>
              <Button
                type="text"
                size="small"
                icon={
                  disliked ? (
                    <DislikeFilled style={{ color: '#ff4d4f' }} />
                  ) : (
                    <DislikeOutlined />
                  )
                }
                onClick={handleDislike}
                disabled={isOwner}
              >
                {dislikeCount}
              </Button>
            </Tooltip>
            <Button
              type="text"
              size="small"
              icon={
                favorited ? (
                  <StarFilled style={{ color: '#faad14' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={handleFavorite}
            >
              收藏
            </Button>
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => setShowComments((v) => !v)}
            >
              {answer.commentCount || 0} 评论
            </Button>
            {currentUser && !isOwner && (
              <Button
                type="text"
                size="small"
                icon={<FlagOutlined />}
                onClick={() => { setReportVisible(true); setReportReason(''); }}
              >
                举报
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {showComments && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <CommentSection answerId={answerId} currentUser={currentUser} />
        </>
      )}
    </Card>
    </>
  );
}

export default function QuestionDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentQuestion, loading, error } = useSelector(
    (state) => state.questions
  );
  const { user: currentUser, token } = useSelector((state) => state.auth);

  const [answers, setAnswers] = useState([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answerSort, setAnswerSort] = useState('time');
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [acceptedAnswerId, setAcceptedAnswerId] = useState(null);

  useEffect(() => {
    const viewedKey = 'viewed_questions';
    let viewed = [];
    try {
      viewed = JSON.parse(localStorage.getItem(viewedKey) || '[]');
    } catch (e) {
      viewed = [];
    }
    const hasViewed = viewed.includes(id);

    if (!hasViewed) {
      const trimmed = viewed.concat(id).slice(-MAX_VIEWED_QUESTIONS);
      localStorage.setItem(viewedKey, JSON.stringify(trimmed));
    }

    dispatch(fetchQuestion({ id, countView: !hasViewed }));
  }, [dispatch, id]);

  const loadAnswers = useCallback(() => {
    setAnswersLoading(true);
    getAnswers(id, { sort: answerSort })
      .then((res) => {
        setAnswers(res.data.answers || res.data || []);
        setAcceptedAnswerId(res.data.acceptedAnswerId || null);
      })
      .catch(() => {})
      .finally(() => setAnswersLoading(false));
  }, [id, answerSort]);

  useEffect(() => {
    loadAnswers();
  }, [loadAnswers]);

  const handleSubmitAnswer = async () => {
    if (!newAnswer.trim()) {
      message.warning('请输入回答内容');
      return;
    }
    const allowSubmit = await ensureSupportPrompt(newAnswer);
    if (!allowSubmit) return;
    setSubmitting(true);
    try {
      await createAnswer(id, { content: newAnswer });
      setNewAnswer('');
      message.success('回答已发布');
      loadAnswers();
      dispatch(fetchQuestion(id));
    } catch (err) {
      message.error(err.response?.data?.message || '发布回答失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await acceptAnswer(answerId);
      message.success('已采纳为最佳答案');
      loadAnswers();
      dispatch(fetchQuestion(id));
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  if (!currentQuestion) return null;

  const questionAuthorId =
    currentQuestion.authorId ||
    currentQuestion.createdBy?._id ||
    currentQuestion.createdBy?.id ||
    currentQuestion.author?._id ||
    currentQuestion.author?.id;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Space wrap>
            {currentQuestion.category && (
              <Tag color="blue">{currentQuestion.category}</Tag>
            )}
            {currentQuestion.archived && <Tag color="red">已归档</Tag>}
            {currentQuestion.acceptedAnswerId && <Tag color="green">已解决</Tag>}
            {currentQuestion.isUrgent && (
              <Tag color="volcano">紧急求助</Tag>
            )}
          </Space>

          <Title level={3} style={{ marginBottom: 0 }}>
            {currentQuestion.title}
          </Title>

          <Space size="large" style={{ color: '#999' }}>
            <Space size={4}>
              <UserOutlined />
              <Text type="secondary">
                {getAuthorDisplayName(currentQuestion, currentUser, '匿名用户')}
              </Text>
            </Space>
            <Space size={4}>
              <ClockCircleOutlined />
              <Text type="secondary">
                {currentQuestion.createdAt
                  ? new Date(currentQuestion.createdAt).toLocaleDateString(
                      'zh-CN'
                    )
                  : ''}
              </Text>
            </Space>
            <Space size={4}>
              <EyeOutlined />
              <Text type="secondary">{currentQuestion.viewCount || 0} 次浏览</Text>
            </Space>
          </Space>

          {currentQuestion.archived && currentQuestion.archiveReason && (
            <Alert
              message="该问题已被归档"
              description={`归档原因：${currentQuestion.archiveReason}`}
              type="warning"
              showIcon
            />
          )}
          {currentQuestion.isUrgent && (
            <Alert
              message="检测到可能的紧急求助"
              description="系统检测到可能的高风险内容，已提示校心理中心/辅导员联系方式，请管理员优先关注。"
              type="error"
              showIcon
            />
          )}

          <Divider style={{ margin: '8px 0' }} />

          <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 15 }}>
            {currentQuestion.content}
          </Paragraph>
        </Space>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {answers.length} 个回答
            </Title>
          </Col>
          <Col>
            <Select
              value={answerSort}
              onChange={setAnswerSort}
              options={ANSWER_SORT_OPTIONS}
              style={{ width: 130 }}
            />
          </Col>
        </Row>
      </div>

      <Spin spinning={answersLoading}>
        {answers.length === 0 ? (
          <Empty description="暂无回答，快来抢沙发！" />
        ) : (
          answers.map((a) => (
            <AnswerCard
              key={a.id || a._id}
              answer={a}
              currentUser={currentUser}
              onRefresh={loadAnswers}
              questionAuthorId={questionAuthorId}
              acceptedAnswerId={acceptedAnswerId}
              onAccept={handleAccept}
            />
          ))
        )}
      </Spin>

      <Card style={{ marginTop: 24 }}>
        <Title level={5}>发表回答</Title>
        {token ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <TextArea
              placeholder="写下你的回答..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              autoSize={{ minRows: 4, maxRows: 12 }}
              maxLength={5000}
              showCount
            />
            <Button
              type="primary"
              loading={submitting}
              onClick={handleSubmitAnswer}
              disabled={!newAnswer.trim()}
            >
              发布回答
            </Button>
          </Space>
        ) : (
          <Alert
            message={
              <span>
                请<Link to="/login">登录</Link>后回答问题
              </span>
            }
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
}
