// 登录页面JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // API基础地址
    const API_BASE = 'http://localhost:8080/api';
    
    // 获取DOM元素
    const loginForm = document.getElementById('login-form');
    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const resetModal = document.getElementById('reset-modal');
    const resetForm = document.getElementById('reset-form');
    
    const showRegisterBtn = document.getElementById('show-register');
    const showResetBtn = document.getElementById('show-reset');
    const cancelRegisterBtn = document.getElementById('cancel-register');
    const cancelResetBtn = document.getElementById('cancel-reset');
    const backHomeBtn = document.getElementById('back-home-btn');
    
    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 创建消息框
        const messageBox = document.createElement('div');
        messageBox.className = `message-box message-${type}`;
        messageBox.innerHTML = `
            <div class="message-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                               type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 添加样式
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            color: white;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
            min-width: 300px;
            max-width: 500px;
            word-wrap: break-word;
            background: ${type === 'success' ? 'linear-gradient(135deg, #48bb78, #38a169)' :
                       type === 'error' ? 'linear-gradient(135deg, #f56565, #e53e3e)' :
                       'linear-gradient(135deg, #4299e1, #3182ce)'};
        `;
        
        document.body.appendChild(messageBox);
        
        // 3秒后自动移除
        setTimeout(() => {
            messageBox.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        }, 3000);
        
        // 点击移除
        messageBox.addEventListener('click', () => {
            messageBox.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageBox.parentNode) {
                    messageBox.parentNode.removeChild(messageBox);
                }
            }, 300);
        });
    }
    
    // 添加消息框动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .message-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .message-content i {
            font-size: 18px;
            flex-shrink: 0;
        }
    `;
    document.head.appendChild(style);
    
    // 登录表单提交
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            const role = document.getElementById('login-role').value;
            
            // 前端验证
            if (!validateLoginForm(username, password, role)) {
                return;
            }
            
            // 显示加载状态
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '登录中...';
            submitBtn.disabled = true;
            
            try {
                // 调用登录API
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // 重要：包含cookie以维持session
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: role
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('登录成功！正在跳转...', 'success');
                    
                    // 不再使用localStorage，完全依赖服务器端session验证
                    // 登录成功后服务器已经设置了session cookie
                    
                    // 根据角色跳转到对应页面
                    setTimeout(() => {
                        switch(role) {
                            case 'teacher':
                                window.location.href = 'teacher.html';
                                break;
                            case 'student':
                                window.location.href = 'student.html';
                                break;
                            case 'admin':
                                window.location.href = 'admin.html';
                                break;
                            default:
                                window.location.href = 'SmartEdu.html';
                        }
                    }, 1000);
                    
                } else {
                    showMessage(result.message || '登录失败', 'error');
                }
                
            } catch (error) {
                console.error('登录错误:', error);
                showMessage('网络连接错误，请检查服务器状态', 'error');
            } finally {
                // 恢复按钮状态
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // 显示注册弹窗
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            registerModal.style.display = 'flex';
        });
    }
    
    // 取消注册
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
            registerForm.reset();
        });
    }
    
    // 点击弹窗外部关闭
    if (registerModal) {
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
                registerForm.reset();
            }
        });
    }
    
    // 注册表单提交
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const confirmPassword = document.getElementById('register-confirm-password').value.trim();
            const role = document.getElementById('register-role').value;
            
            // 前端验证
            if (!validateRegisterForm(username, password, confirmPassword, role)) {
                return;
            }
            
            // 显示加载状态
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '注册中...';
            submitBtn.disabled = true;
            
            try {
                // 准备注册数据
                const registerData = {
                    username: username,
                    password: password,
                    role: role
                };
                
                // 根据角色添加额外字段
                if (role === 'teacher') {
                    // 教师注册需要额外信息，这里先使用默认值
                    registerData.realName = `${username}教师`;
                    registerData.teacherCode = `T${Date.now().toString().slice(-6)}`;
                    registerData.department = '未设置';
                    registerData.title = '讲师';
                } else if (role === 'student') {
                    // 学生注册需要额外信息
                    registerData.realName = `${username}同学`;
                    registerData.studentId = `S${Date.now().toString().slice(-6)}`;
                    registerData.className = '未设置';
                    registerData.major = '未设置';
                }
                
                // 调用注册API
                const endpoint = role === 'teacher' ? 'register/teacher' : 'register/student';
                const response = await fetch(`${API_BASE}/auth/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // 支持session
                    body: JSON.stringify(registerData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('注册成功！请登录', 'success');
                    registerModal.style.display = 'none';
                    registerForm.reset();
                    
                    // 自动填充登录表单
                    document.getElementById('login-username').value = username;
                    document.getElementById('login-role').value = role;
                    
                } else {
                    showMessage(result.message || '注册失败', 'error');
                }
                
            } catch (error) {
                console.error('注册错误:', error);
                showMessage('网络连接错误，请检查服务器状态', 'error');
            } finally {
                // 恢复按钮状态
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // 显示重置密码弹窗
    if (showResetBtn) {
        showResetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetModal.style.display = 'flex';
        });
    }
    
    // 取消重置密码
    if (cancelResetBtn) {
        cancelResetBtn.addEventListener('click', function() {
            resetModal.style.display = 'none';
            resetForm.reset();
        });
    }
    
    // 点击弹窗外部关闭
    if (resetModal) {
        resetModal.addEventListener('click', function(e) {
            if (e.target === resetModal) {
                resetModal.style.display = 'none';
                resetForm.reset();
            }
        });
    }
    
    // 重置密码表单提交
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            showMessage('密码重置功能正在开发中，请联系管理员', 'info');
            resetModal.style.display = 'none';
            resetForm.reset();
        });
    }
    
    // 返回主页按钮
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function() {
            window.location.href = 'SmartEdu.html';
        });
    }
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (registerModal && registerModal.style.display === 'flex') {
                registerModal.style.display = 'none';
                registerForm.reset();
            }
            if (resetModal && resetModal.style.display === 'flex') {
                resetModal.style.display = 'none';
                resetForm.reset();
            }
        }
    });
    
    // 检查是否已经登录
    checkLoginStatus();
    
    // 初始化焦点
    const usernameInput = document.getElementById('login-username');
    if (usernameInput) {
        usernameInput.focus();
    }
    
    console.log('登录页面初始化完成');
}); 

// 登录表单验证
function validateLoginForm(username, password, role) {
    // 用户名验证
    if (!username) {
        showMessage('请输入账号', 'error');
        return false;
    }
    if (username.length < 3) {
        showMessage('账号长度至少3位', 'error');
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showMessage('账号只能包含字母、数字和下划线', 'error');
        return false;
    }
    
    // 密码验证
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    if (password.length < 3) {
        showMessage('密码长度至少3位', 'error');
        return false;
    }
    
    // 角色验证
    if (!role) {
        showMessage('请选择登录类型', 'error');
        return false;
    }
    
    return true;
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE}/auth/check`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            const user = result.data;
            showMessage(`您已登录，正在跳转到${user.role === 'teacher' ? '教师' : user.role === 'student' ? '学生' : '管理'}端...`, 'info');
            
            setTimeout(() => {
                switch(user.role) {
                    case 'teacher':
                        window.location.href = 'teacher.html';
                        break;
                    case 'student':
                        window.location.href = 'student.html';
                        break;
                    case 'admin':
                        window.location.href = 'admin.html';
                        break;
                    default:
                        window.location.href = 'SmartEdu.html';
                }
            }, 1500);
        }
    } catch (error) {
        console.log('用户未登录或session已过期');
    }
}

// 注册表单验证
function validateRegisterForm(username, password, confirmPassword, role) {
    // 用户名验证
    if (!username) {
        showMessage('请输入账号', 'error');
        return false;
    }
    if (username.length < 3 || username.length > 20) {
        showMessage('账号长度应在3-20位之间', 'error');
        return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showMessage('账号只能包含字母、数字和下划线', 'error');
        return false;
    }
    
    // 密码验证
    if (!password) {
        showMessage('请输入密码', 'error');
        return false;
    }
    if (password.length < 6) {
        showMessage('密码长度至少6位', 'error');
        return false;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        showMessage('密码必须包含字母和数字', 'error');
        return false;
    }
    
    // 确认密码验证
    if (!confirmPassword) {
        showMessage('请确认密码', 'error');
        return false;
    }
    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return false;
    }
    
    // 角色验证
    if (!role) {
        showMessage('请选择注册类型', 'error');
        return false;
    }
    
    return true;
}