// main.js - 主要前端逻辑

/**
 * 页面初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户导航
    updateUserNav();
    
    // 检查用户登录状态
    if (isUserLoggedIn()) {
        // 用户已登录
    } else {
        // 用户未登录
    }
});

/**
 * 全局错误处理
 */
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
});

/**
 * 全局未捕获的Promise拒绝处理
 */
window.addEventListener('unhandledrejection', function(event) {
    console.error('未捕获的Promise拒绝:', event.reason);
});

/**
 * 禁用无意的页面离开
 */
window.addEventListener('beforeunload', function(event) {
    const formModified = sessionStorage.getItem('formModified');
    if (formModified === 'true') {
        event.preventDefault();
        event.returnValue = '';
        return '';
    }
});

/**
 * 页面可见性变化处理
 */
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面被隐藏
        console.log('页面被隐藏');
    } else {
        // 页面重新显示
        console.log('页面重新显示');
    }
});

/**
 * 导航到帖子详情页面
 */
function goToPost(postId) {
    window.location.href = `/post/${postId}`;
}

/**
 * 导航到用户资料页面
 */
function goToUserProfile(username) {
    window.location.href = `/profile/${username}`;
}

/**
 * 设置表单修改标志
 */
function markFormAsModified() {
    sessionStorage.setItem('formModified', 'true');
}

/**
 * 清除表单修改标志
 */
function clearFormModified() {
    sessionStorage.removeItem('formModified');
}

/**
 * 监听表单变化
 */
function attachFormChangeListener(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('change', markFormAsModified);
        form.addEventListener('input', markFormAsModified);
        form.addEventListener('submit', clearFormModified);
    }
}

/**
 * 获取URL参数
 */
function getUrlParameter(name) {
    const url = new URL(window.location);
    return url.searchParams.get(name);
}

/**
 * 验证用户是否有权限执行操作
 */
function checkPermission(userId) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert('请先登录');
        return false;
    }
    if (currentUser.id !== userId && currentUser.role !== 'ADMIN') {
        alert('您没有权限执行此操作');
        return false;
    }
    return true;
}

/**
 * 检查用户是否为管理员
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'ADMIN';
}

/**
 * 初始化页面提示
 */
function initializeTooltips() {
    // Bootstrap Tooltip 初始化
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * 初始化页面弹窗
 */
function initializePopovers() {
    // Bootstrap Popover 初始化
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

/**
 * 渲染帖子列表项
 */
function renderPostCard(post) {
    const div = document.createElement('div');
    div.className = 'col-md-6 mb-3';
    div.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">
                    <a href="/post/${post.id}" class="text-decoration-none">
                        ${escapeHtml(post.title)}
                    </a>
                </h5>
                <p class="card-text text-muted small text-truncate-3">
                    ${escapeHtml(post.content.substring(0, 100))}...
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <strong>${post.username || '未知用户'}</strong> · 
                        <span class="badge bg-info">${post.category}</span>
                    </small>
                    <span class="badge bg-secondary">${post.viewCount || 0} 浏览</span>
                </div>
                <small class="text-muted d-block mt-2">${formatDate(post.createdAt)}</small>
            </div>
            <div class="card-footer bg-light">
                <a href="/post/${post.id}" class="btn btn-sm btn-primary">查看</a>
            </div>
        </div>
    `;
    return div;
}

/**
 * 渲染评论项
 */
function renderCommentItem(comment) {
    const div = document.createElement('div');
    div.className = 'card mb-3';
    div.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between">
                <strong>${comment.username || '未知用户'}</strong>
                <small class="text-muted">${formatDate(comment.createdAt)}</small>
            </div>
            <p class="card-text mt-2">${escapeHtml(comment.content)}</p>
            <button class="btn btn-sm btn-outline-primary" onclick="replyToComment(${comment.id})">
                回复
            </button>
        </div>
    `;
    return div;
}

/**
 * 分页组件
 */
class Pagination {
    constructor(container, callback) {
        this.container = container;
        this.callback = callback;
        this.currentPage = 0;
        this.totalPages = 0;
    }

    render(totalPages) {
        this.totalPages = totalPages;
        this.container.innerHTML = '';

        if (totalPages <= 1) return;

        const nav = document.createElement('nav');
        nav.setAttribute('aria-label', 'Pagination');
        const ul = document.createElement('ul');
        ul.className = 'pagination justify-content-center';

        // 上一页
        if (this.currentPage > 0) {
            ul.appendChild(this.createPageItem('上一页', this.currentPage - 1));
        }

        // 分页按钮
        const startPage = Math.max(0, this.currentPage - 2);
        const endPage = Math.min(totalPages - 1, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            ul.appendChild(this.createPageItem(i + 1, i, i === this.currentPage));
        }

        // 下一页
        if (this.currentPage < totalPages - 1) {
            ul.appendChild(this.createPageItem('下一页', this.currentPage + 1));
        }

        nav.appendChild(ul);
        this.container.appendChild(nav);
    }

    createPageItem(text, page, isActive = false) {
        const li = document.createElement('li');
        li.className = 'page-item' + (isActive ? ' active' : '');
        const a = document.createElement('a');
        a.className = 'page-link';
        a.textContent = text;
        a.href = '#';
        a.onclick = (e) => {
            e.preventDefault();
            this.goToPage(page);
        };
        li.appendChild(a);
        return li;
    }

    goToPage(page) {
        this.currentPage = page;
        if (this.callback) {
            this.callback(page);
        }
    }
}

/**
 * 图像加载失败处理
 */
function handleImageLoadError(img) {
    img.src = 'https://via.placeholder.com/150?text=Avatar';
}

/**
 * 初始化搜索功能
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchKeyword');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                searchPosts();
            }
        });
    }
}

/**
 * 初始化实时通知
 */
function initializeNotifications() {
    // 可以集成WebSocket或Server-Sent Events进行实时通知
    console.log('实时通知已初始化');
}

/**
 * 显示加载骨架屏
 */
function showSkeleton(container, count = 3) {
    const skeleton = `
        <div class="card mb-3">
            <div class="card-body">
                <div class="placeholder-glow">
                    <span class="placeholder col-6"></span>
                    <br>
                    <span class="placeholder col-12"></span>
                    <span class="placeholder col-8"></span>
                </div>
            </div>
        </div>
    `;
    
    let html = '';
    for (let i = 0; i < count; i++) {
        html += skeleton;
    }
    
    const el = document.getElementById(container);
    if (el) {
        el.innerHTML = html;
    }
}

/**
 * 清除加载骨架屏
 */
function clearSkeleton(container) {
    const el = document.getElementById(container);
    if (el) {
        el.innerHTML = '';
    }
}

/**
 * 键盘快捷键支持
 */
document.addEventListener('keydown', function(e) {
    // Ctrl+/ 打开搜索
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('searchKeyword');
        if (searchInput) {
            searchInput.focus();
        }
    }

    // Escape 关闭模态框
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const instance = bootstrap.Modal.getInstance(modal);
            if (instance) {
                instance.hide();
            }
        });
    }
});

/**
 * 页面加载完成标志
 */
let pageLoadComplete = false;

window.addEventListener('load', function() {
    pageLoadComplete = true;
    // 隐藏加载指示器
    showLoading(false);
});

/**
 * 主题切换（深色/浅色）
 */
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
}

/**
 * 初始化主题
 */
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

// 初始化
initializeTheme();
initializeSearch();
initializeTooltips();
initializePopovers();
initializeNotifications();
