// 美观的通知提示函数
function showNotification(message, type = 'info') {
    // 创建通知容器（如果不存在）
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        margin-bottom: 10px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(400px);
        transition: all 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
        max-width: 350px;
        word-wrap: break-word;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // 根据类型设置颜色和图标
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = '#27ae60';
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            bgColor = '#e74c3c';
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            bgColor = '#f39c12';
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            bgColor = '#3498db';
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.style.backgroundColor = bgColor;
    notification.innerHTML = `${icon}<span>${message}</span>`;
    
    // 添加到容器
    container.appendChild(notification);
    
    // 延迟显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, type === 'error' ? 5000 : 3000);
}

// 初始化管理员账号函数
function initializeAdminAccount() {
    let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
    
    // 检查是否已存在管理员账号
    const adminExists = users.find(u => u.username === 'admin' && u.role === 'admin');
    
    if (!adminExists) {
        // 添加预设管理员账号
        users.push({
            username: 'admin',
            password: 'admin',
            role: 'admin'
        });
        localStorage.setItem('smartedu_users', JSON.stringify(users));
    }
}

// 登录事件绑定函数
function bindLoginEvent() {
    const currentLoginForm = document.getElementById('login-form');
    if (currentLoginForm) {
        currentLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const role = document.getElementById('login-role').value;
            
            if (!role) {
                showNotification('请选择登录类型', 'warning');
                return;
            }
            
            let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
            const user = users.find(u => u.username === username && u.role === role);
            
            if (!user) {
                showNotification('用户不存在或角色不匹配', 'error');
                return;
            }
            
            if (user.password !== password) {
                showNotification('密码错误', 'error');
                return;
            }
            
            // 登录成功，保存当前用户
            localStorage.setItem('smartedu_current_user', JSON.stringify(user));
            
            // 根据角色跳转到对应页面
            if (role === 'teacher') {
                window.location.href = 'teacher.html';
            } else if (role === 'student') {
                window.location.href = 'student.html';
            } else if (role === 'admin') {
                window.location.href = 'admin.html';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化预设管理员账号
    initializeAdminAccount();
    
    // 返回主页按钮
    const backHomeBtn = document.getElementById('back-home-btn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function() {
            window.location.href = 'SmartEdu.html';
        });
    }
    

    
    // 注册相关
    const showRegisterBtn = document.getElementById('show-register');
    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const cancelRegisterBtn = document.getElementById('cancel-register');

    // 重置密码相关
    const showResetBtn = document.getElementById('show-reset');
    const resetModal = document.getElementById('reset-modal');
    const resetForm = document.getElementById('reset-form');
    const cancelResetBtn = document.getElementById('cancel-reset');

    showRegisterBtn.addEventListener('click', function() {
        registerModal.style.display = 'flex';
    });

    cancelRegisterBtn.addEventListener('click', function() {
        registerModal.style.display = 'none';
        registerForm.reset();
    });

    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const role = document.getElementById('register-role').value;
        
        // 验证输入
        if (!username || !password || !confirmPassword || !role) {
            showNotification('请填写完整信息', 'warning');
            return;
        }
        
        // 防止注册管理员账号
        if (username.toLowerCase() === 'admin') {
            showNotification('admin为系统预留账号，请使用其他账号名', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('两次输入的密码不一致', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showNotification('密码长度至少6位', 'warning');
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        if (users.find(u => u.username === username && u.role === role)) {
            showNotification('该账号已存在', 'warning');
            return;
        }
        
        users.push({ username, password, role });
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        showNotification('注册成功，请登录', 'success');
        registerModal.style.display = 'none';
        registerForm.reset();
    });

    // 重置密码事件
    showResetBtn.addEventListener('click', function() {
        resetModal.style.display = 'flex';
    });

    cancelResetBtn.addEventListener('click', function() {
        resetModal.style.display = 'none';
        resetForm.reset();
    });

    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('reset-username').value.trim();
        const oldPassword = document.getElementById('reset-old-password').value;
        const newPassword = document.getElementById('reset-new-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        const role = document.getElementById('reset-role').value;
        
        // 验证输入
        if (!username || !oldPassword || !newPassword || !confirmPassword || !role) {
            showNotification('请填写完整信息', 'warning');
            return;
        }
        
        // 防止重置管理员密码
        if (username.toLowerCase() === 'admin') {
            showNotification('管理员密码不允许重置', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('两次输入的新密码不一致', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('新密码长度至少6位', 'warning');
            return;
        }
        
        if (oldPassword === newPassword) {
            showNotification('新密码不能与原密码相同', 'warning');
            return;
        }
        
        // 验证用户
        let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        const userIndex = users.findIndex(u => u.username === username && u.role === role);
        
        if (userIndex === -1) {
            showNotification('用户不存在或角色不匹配', 'error');
            return;
        }
        
        if (users[userIndex].password !== oldPassword) {
            showNotification('原密码错误', 'error');
            return;
        }
        
        // 更新密码
        users[userIndex].password = newPassword;
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        
        showNotification('密码重置成功，请使用新密码登录', 'success');
        resetModal.style.display = 'none';
        resetForm.reset();
    });

    // 初始化时绑定登录事件
    bindLoginEvent();

    // 按钮点击效果
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}); 