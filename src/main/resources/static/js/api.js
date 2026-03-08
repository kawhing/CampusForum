// api.js - API 请求函数

/**
 * 发送API请求的通用函数
 */
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 如果有认证令牌，添加到请求头
    const token = getAuthToken();
    if (token) {
        defaultOptions.headers['Authorization'] = token;
    }

    const finalOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// ============= 用户相关 API =============

/**
 * 用户注册
 */
async function registerUser(username, email, password, realname = '') {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    if (realname) {
        formData.append('realname', realname);
    }

    return apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 用户登录
 */
async function loginUser(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 获取用户信息
 */
async function getUserInfo(userId) {
    return apiRequest(`/api/users/${userId}`);
}

/**
 * 通过用户名获取用户
 */
async function getUserByUsername(username) {
    return apiRequest(`/api/users/profile/${username}`);
}

/**
 * 更新用户信息
 */
async function updateUser(userId, updates) {
    const formData = new URLSearchParams();
    Object.keys(updates).forEach(key => {
        if (updates[key]) {
            formData.append(key, updates[key]);
        }
    });

    return apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 删除用户
 */
async function deleteUser(userId) {
    return apiRequest(`/api/users/${userId}`, {
        method: 'DELETE'
    });
}

// ============= 帖子相关 API =============

/**
 * 创建帖子
 */
async function createPost(userId, title, content, category = 'DISCUSS') {
    const formData = new URLSearchParams();
    formData.append('userId', userId);
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);

    return apiRequest('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 获取帖子详情
 */
async function getPost(postId) {
    return apiRequest(`/api/posts/${postId}`);
}

/**
 * 获取所有帖子（带分页）
 */
async function getAllPosts(page = 0, size = 10) {
    return apiRequest(`/api/posts?page=${page}&size=${size}`);
}

/**
 * 按分类获取帖子
 */
async function getPostsByCategory(category, page = 0, size = 10) {
    return apiRequest(`/api/posts/category/${category}?page=${page}&size=${size}`);
}

/**
 * 获取用户的帖子
 */
async function getUserPosts(userId, page = 0, size = 10) {
    return apiRequest(`/api/posts/user/${userId}?page=${page}&size=${size}`);
}

/**
 * 搜索帖子
 */
async function searchPosts(keyword, page = 0, size = 10) {
    return apiRequest(`/api/posts/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
}

/**
 * 更新帖子
 */
async function updatePost(postId, title, content, category) {
    const formData = new URLSearchParams();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);

    return apiRequest(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 删除帖子
 */
async function deletePost(postId) {
    return apiRequest(`/api/posts/${postId}`, {
        method: 'DELETE'
    });
}

/**
 * 置顶帖子
 */
async function pinPost(postId, pin = true) {
    return apiRequest(`/api/posts/${postId}/pin?pin=${pin}`, {
        method: 'POST'
    });
}

/**
 * 锁定帖子
 */
async function lockPost(postId, lock = true) {
    return apiRequest(`/api/posts/${postId}/lock?lock=${lock}`, {
        method: 'POST'
    });
}

// ============= 评论相关 API =============

/**
 * 创建评论
 */
async function createComment(postId, userId, content, parentCommentId = null) {
    const formData = new URLSearchParams();
    formData.append('postId', postId);
    formData.append('userId', userId);
    formData.append('content', content);
    if (parentCommentId) {
        formData.append('parentCommentId', parentCommentId);
    }

    return apiRequest('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 获取评论
 */
async function getComment(commentId) {
    return apiRequest(`/api/comments/${commentId}`);
}

/**
 * 获取帖子的评论
 */
async function getPostComments(postId, page = 0, size = 10) {
    return apiRequest(`/api/comments/post/${postId}?page=${page}&size=${size}`);
}

/**
 * 获取评论的回复
 */
async function getCommentReplies(parentCommentId) {
    return apiRequest(`/api/comments/parent/${parentCommentId}`);
}

/**
 * 获取用户的评论
 */
async function getUserComments(userId, page = 0, size = 10) {
    return apiRequest(`/api/comments/user/${userId}?page=${page}&size=${size}`);
}

/**
 * 更新评论
 */
async function updateComment(commentId, content) {
    const formData = new URLSearchParams();
    formData.append('content', content);

    return apiRequest(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
}

/**
 * 删除评论
 */
async function deleteComment(commentId) {
    return apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE'
    });
}

// ============= 文件资源相关 API =============

/**
 * 上传文件
 */
async function uploadFile(postId, userId, file) {
    const formData = new FormData();
    formData.append('postId', postId);
    formData.append('userId', userId);
    formData.append('file', file);

    return apiRequest('/api/resources/upload', {
        method: 'POST',
        body: formData,
        headers: {} // FormData会自动设置Content-Type
    });
}

/**
 * 获取资源
 */
async function getResource(resourceId) {
    return apiRequest(`/api/resources/${resourceId}`);
}

/**
 * 获取帖子的资源
 */
async function getPostResources(postId, page = 0, size = 10) {
    return apiRequest(`/api/resources/post/${postId}?page=${page}&size=${size}`);
}

/**
 * 获取帖子的资源列表（不分页）
 */
async function getPostResourcesList(postId) {
    return apiRequest(`/api/resources/post-list/${postId}`);
}

/**
 * 获取用户的资源
 */
async function getUserResources(userId, page = 0, size = 10) {
    return apiRequest(`/api/resources/user/${userId}?page=${page}&size=${size}`);
}

/**
 * 删除资源
 */
async function deleteResource(resourceId) {
    return apiRequest(`/api/resources/${resourceId}`, {
        method: 'DELETE'
    });
}

/**
 * 获取资源下载链接
 */
function getDownloadLink(resourceId) {
    return `/api/resources/download/${resourceId}`;
}

// ============= 验证相关 API =============

/**
 * 检查用户名是否存在
 */
async function checkUsernameExists(username) {
    return apiRequest(`/api/auth/check-username/${username}`);
}

/**
 * 检查邮箱是否存在
 */
async function checkEmailExists(email) {
    return apiRequest(`/api/auth/check-email/${email}`);
}
