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
                alert('请选择登录类型');
                return;
            }
            
            let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
            const user = users.find(u => u.username === username && u.role === role);
            
            if (!user) {
                alert('用户不存在或角色不匹配');
                return;
            }
            
            if (user.password !== password) {
                alert('密码错误');
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
            alert('请填写完整信息');
            return;
        }
        
        // 防止注册管理员账号
        if (username.toLowerCase() === 'admin') {
            alert('admin为系统预留账号，请使用其他账号名');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }
        
        if (password.length < 6) {
            alert('密码长度至少6位');
            return;
        }
        
        let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        if (users.find(u => u.username === username && u.role === role)) {
            alert('该账号已存在');
            return;
        }
        
        users.push({ username, password, role });
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        alert('注册成功，请登录');
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
            alert('请填写完整信息');
            return;
        }
        
        // 防止重置管理员密码
        if (username.toLowerCase() === 'admin') {
            alert('管理员密码不允许重置');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('两次输入的新密码不一致');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('新密码长度至少6位');
            return;
        }
        
        if (oldPassword === newPassword) {
            alert('新密码不能与原密码相同');
            return;
        }
        
        // 验证用户
        let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        const userIndex = users.findIndex(u => u.username === username && u.role === role);
        
        if (userIndex === -1) {
            alert('用户不存在或角色不匹配');
            return;
        }
        
        if (users[userIndex].password !== oldPassword) {
            alert('原密码错误');
            return;
        }
        
        // 更新密码
        users[userIndex].password = newPassword;
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        
        alert('密码重置成功，请使用新密码登录');
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