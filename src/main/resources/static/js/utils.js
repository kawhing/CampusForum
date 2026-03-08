// utils.js - 实用工具函数

/**
 * 转义HTML特殊字符，防止XSS攻击
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * 格式化日期时间
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // 时间差（毫秒）
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
        return '刚刚';
    } else if (diff < hour) {
        return Math.floor(diff / minute) + '分钟前';
    } else if (diff < day) {
        return Math.floor(diff / hour) + '小时前';
    } else if (diff < 7 * day) {
        return Math.floor(diff / day) + '天前';
    } else {
        // 显示完整日期
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${dayOfMonth} ${hours}:${minutes}`;
    }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 保存到本地存储
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

/**
 * 从本地存储读取
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error('从本地存储读取失败:', error);
        return defaultValue;
    }
}

/**
 * 清除本地存储
 */
function clearLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('清除本地存储失败:', error);
    }
}

/**
 * 显示成功提示
 */
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.insertBefore(alert, document.body.firstChild);
    setTimeout(() => alert.remove(), 3000);
}

/**
 * 显示错误提示
 */
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show';
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.insertBefore(alert, document.body.firstChild);
    setTimeout(() => alert.remove(), 3000);
}

/**
 * 验证电子邮件地址
 */
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccess('已复制到剪贴板');
        }).catch(err => {
            console.error('复制失败:', err);
        });
    } else {
        // 备用方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showSuccess('已复制到剪贴板');
    }
}

/**
 * 打开/关闭加载指示器
 */
function showLoading(show = true) {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}

/**
 * 检查本地存储中是否有用户登录
 */
function isUserLoggedIn() {
    return !!localStorage.getItem('user') && !!localStorage.getItem('token');
}

/**
 * 获取当前登录用户
 */
function getCurrentUser() {
    return getFromLocalStorage('user', null);
}

/**
 * 获取认证令牌
 */
function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * 更新用户导航菜单
 */
function updateUserNav() {
    const navUserMenu = document.getElementById('nav-user-menu');
    const user = getCurrentUser();

    if (!navUserMenu) return;

    if (user) {
        navUserMenu.innerHTML = `
            <div class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    👤 ${user.username}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="/profile/${user.username}">个人资料</a></li>
                    <li><a class="dropdown-item" href="/post/edit/0">发布新帖</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" onclick="logout()">退出登录</a></li>
                </ul>
            </div>
        `;
    } else {
        navUserMenu.innerHTML = `
            <a class="nav-link" href="/login">登录</a>
        `;
    }
}

/**
 * 登出函数
 */
function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        location.reload();
    }
}
/**
 * 登录（处理首页模态框的登录）
 */
function handleLogin() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    if (!username || !password) {
        alert('用户名和密码不能为空');
        return;
    }

    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.code === 200) {
            localStorage.setItem('user', JSON.stringify(data.data.user));
            localStorage.setItem('token', data.data.token);
            
            // 关闭模态框
            const modalElement = document.getElementById('loginModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            
            // 重新加载页面以更新导航栏
            location.reload();
        } else {
            alert(data.message || '登录失败，请检查用户名和密码');
        }
    })
    .catch(error => {
        console.error('登录请求失败:', error);
        alert('登录请求失败，请重试');
    });
}