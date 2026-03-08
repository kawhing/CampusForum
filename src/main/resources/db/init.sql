-- 创建数据库
CREATE DATABASE IF NOT EXISTS campus_forum DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE campus_forum;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    realname VARCHAR(100) COMMENT '真实姓名',
    avatar VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人介绍',
    is_active BOOLEAN DEFAULT TRUE COMMENT '是否激活',
    role VARCHAR(20) DEFAULT 'USER' COMMENT '角色：USER,ADMIN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '帖子ID',
    user_id BIGINT NOT NULL COMMENT '发布者ID',
    title VARCHAR(255) NOT NULL COMMENT '帖子标题',
    content LONGTEXT NOT NULL COMMENT '帖子内容',
    category VARCHAR(50) DEFAULT 'DISCUSS' COMMENT '分类：DISCUSS（讨论）,HELP（求助）,SHARE（分享）,NEWS（news）',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    reply_count INT DEFAULT 0 COMMENT '回复次数',
    is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
    is_locked BOOLEAN DEFAULT FALSE COMMENT '是否锁定',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_is_pinned (is_pinned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    post_id BIGINT NOT NULL COMMENT '帖子ID',
    user_id BIGINT NOT NULL COMMENT '评论者ID',
    content TEXT NOT NULL COMMENT '评论内容',
    parent_comment_id BIGINT COMMENT '父评论ID（用于回复评论）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_comment_id (parent_comment_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 资源（文件）表
CREATE TABLE IF NOT EXISTS resources (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '资源ID',
    post_id BIGINT COMMENT '关联的帖子ID',
    user_id BIGINT NOT NULL COMMENT '上传者ID',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    stored_file_name VARCHAR(255) NOT NULL COMMENT '存储的文件名',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_type VARCHAR(100) COMMENT '文件类型（MIME type）',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资源表';

-- 用户表会通过应用代码自动初始化测试用户
SELECT 1;

-- 创建索引优化查询性能
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);
CREATE INDEX idx_resources_user_created ON resources(user_id, created_at);
