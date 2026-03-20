/**
 * Return the display name for a question author.
 * If the current viewer is the author, returns "我发布的提问".
 * Otherwise returns the known author name or the provided fallback.
 */
export const getAuthorDisplayName = (question, currentUser, fallback = '匿名用户') => {
  if (!question) return fallback;

  const authorId =
    question.authorId ||
    question.createdBy?._id ||
    question.createdBy?.id ||
    question.createdBy ||
    question.author?._id ||
    question.author?.id;
  const viewerId = currentUser?._id || currentUser?.id;
  const normalizedAuthorId = authorId ? authorId.toString() : null;
  const normalizedViewerId = viewerId ? viewerId.toString() : null;

  if (normalizedViewerId && normalizedAuthorId && normalizedViewerId === normalizedAuthorId) {
    return '我发布的提问';
  }

  return question.authorName || question.author?.username || fallback;
};
