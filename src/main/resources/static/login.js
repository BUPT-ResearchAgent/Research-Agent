// 登录页面JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // API基础地址
    const API_BASE = 'http://localhost:8080/api';
    
    // 强制等待DOM完全加载
    setTimeout(function() {
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
        
        // 确保所有元素都找到后再绑定事件
        if (showRegisterBtn && registerModal && registerForm) {
            initializeRegistration();
        }
        if (loginForm) {
            initializeLogin();
        }
        if (showResetBtn && resetModal && resetForm) {
            initializePasswordReset();
        }
        if (backHomeBtn) {
            initializeNavigation();
        }
    }, 100);
    
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

    function initializeRegistration() {
        const showRegisterBtn = document.getElementById('show-register');
        const registerModal = document.getElementById('register-modal');
        const registerForm = document.getElementById('register-form');
        const cancelRegisterBtn = document.getElementById('cancel-register');

        // 显示注册弹窗
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            registerModal.style.display = 'flex';
            initAvatarUpload();
            initPasswordStrength();
        });

        // 取消注册
        cancelRegisterBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
            registerForm.reset();
        });

        // 点击弹窗外部关闭
        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
                registerForm.reset();
            }
        });

        // 注册表单提交
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('注册表单提交事件触发');
            
            const username = document.getElementById('register-username').value.trim();
            const realName = document.getElementById('register-realname').value.trim();
            const email = document.getElementById('register-email')?.value.trim() || '';
            const phone = document.getElementById('register-phone')?.value.trim() || '';
            const password = document.getElementById('register-password').value.trim();
            const confirmPassword = document.getElementById('register-confirm-password').value.trim();
            const role = document.getElementById('register-role').value;
            
            console.log('表单数据:', { username, realName, password, role });
            
            // 简化验证，避免函数调用问题
            if (!username || !realName || !password || !confirmPassword || !role) {
                alert('请填写所有必填项');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('两次密码不一致');
                return;
            }
            
            console.log('验证通过，开始注册');
            
            // 显示加载状态
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '注册中...';
            submitBtn.disabled = true;
            
            try {
                // 准备注册数据
                const registerData = {
                    username: username,
                    realName: realName,
                    email: email,
                    phone: phone,
                    password: password,
                    role: role
                };
                
                // 根据角色添加额外字段
                if (role === 'teacher') {
                    registerData.teacherCode = `T${Date.now().toString().slice(-6)}`;
                    registerData.department = '未设置';
                    registerData.title = '讲师';
                } else if (role === 'student') {
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
                    credentials: 'include',
                    body: JSON.stringify(registerData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // 显示成功消息 - 更加明显
                    showMessage(`🎉 注册成功！用户名: ${username}，请使用该账号登录`, 'success');
                    
                    // 关闭注册弹窗
                    registerModal.style.display = 'none';
                    registerForm.reset();
                    
                    // 重置头像预览
                    const avatarPreview = document.getElementById('avatar-preview');
                    if (avatarPreview) {
                        avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
                    }
                    
                    // 自动填充登录表单并高亮
                    const loginUsername = document.getElementById('login-username');
                    const loginRole = document.getElementById('login-role');
                    
                    loginUsername.value = username;
                    loginRole.value = role;
                    
                    // 高亮登录表单
                    loginUsername.style.backgroundColor = '#e8f5e8';
                    loginRole.style.backgroundColor = '#e8f5e8';
                    
                    // 3秒后移除高亮
                    setTimeout(() => {
                        loginUsername.style.backgroundColor = '';
                        loginRole.style.backgroundColor = '';
                    }, 3000);
                    
                    // 聚焦到密码输入框
                    const loginPassword = document.getElementById('login-password');
                    if (loginPassword) {
                        loginPassword.focus();
                    }
                    
                } else {
                    showMessage('❌ 注册失败: ' + (result.message || '未知错误'), 'error');
                }
                
            } catch (error) {
                console.error('注册错误:', error);
                showMessage('❌ 网络连接错误，请检查服务器状态', 'error');
            } finally {
                // 恢复按钮状态
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    function initializeLogin() {
        const loginForm = document.getElementById('login-form');
        
        // 登录表单提交
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
                    credentials: 'include',
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        role: role
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showMessage('登录成功！正在跳转...', 'success');
                    
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

    function initializePasswordReset() {
        const showResetBtn = document.getElementById('show-reset');
        const resetModal = document.getElementById('reset-modal');
        const resetForm = document.getElementById('reset-form');
        const cancelResetBtn = document.getElementById('cancel-reset');

        // 显示重置密码弹窗
        showResetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetModal.style.display = 'flex';
        });

        // 取消重置密码
        cancelResetBtn.addEventListener('click', function() {
            resetModal.style.display = 'none';
            resetForm.reset();
        });

        // 点击弹窗外部关闭
        resetModal.addEventListener('click', function(e) {
            if (e.target === resetModal) {
                resetModal.style.display = 'none';
                resetForm.reset();
            }
        });

        // 重置密码表单提交
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            showMessage('密码重置功能正在开发中，请联系管理员', 'info');
            resetModal.style.display = 'none';
            resetForm.reset();
        });
    }

    function initializeNavigation() {
        const backHomeBtn = document.getElementById('back-home-btn');
        
        // 返回主页按钮
        backHomeBtn.addEventListener('click', function() {
            window.location.href = 'SmartEdu.html';
        });
    }

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const registerModal = document.getElementById('register-modal');
            const resetModal = document.getElementById('reset-modal');
            const registerForm = document.getElementById('register-form');
            const resetForm = document.getElementById('reset-form');
            
            if (registerModal && registerModal.style.display === 'flex') {
                registerModal.style.display = 'none';
                if (registerForm) registerForm.reset();
            }
            if (resetModal && resetModal.style.display === 'flex') {
                resetModal.style.display = 'none';
                if (resetForm) resetForm.reset();
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
function validateRegisterForm(username, realName, email, phone, password, confirmPassword, role) {
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
    
    // 真实姓名验证
    if (!realName) {
        showMessage('请输入真实姓名', 'error');
        return false;
    }
    if (realName.length < 2 || realName.length > 20) {
        showMessage('真实姓名长度应在2-20位之间', 'error');
        return false;
    }
    
    // 邮箱验证（可选）
    if (email && email.trim() !== '') {
        if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            showMessage('邮箱格式不正确', 'error');
            return false;
        }
    }
    
    // 手机号验证（可选）
    if (phone && phone.trim() !== '') {
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            showMessage('手机号格式不正确', 'error');
            return false;
        }
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

// 初始化头像上传功能
function initAvatarUpload() {
    const avatarInput = document.getElementById('register-avatar');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // 验证文件类型
                if (!file.type.startsWith('image/')) {
                    showMessage('请选择图片文件', 'error');
                    return;
                }
                
                // 验证文件大小（2MB限制）
                if (file.size > 2 * 1024 * 1024) {
                    showMessage('头像文件大小不能超过2MB', 'error');
                    return;
                }
                
                // 预览图片
                const reader = new FileReader();
                reader.onload = function(e) {
                    avatarPreview.innerHTML = `<img src="${e.target.result}" alt="头像预览">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// 初始化密码强度检测
function initPasswordStrength() {
    const passwordInput = document.getElementById('register-password');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (passwordInput && strengthFill && strengthText) {
        passwordInput.addEventListener('input', function(e) {
            const password = e.target.value;
            const strength = calculatePasswordStrength(password);
            
            // 清除之前的样式
            strengthFill.className = 'strength-fill';
            strengthText.className = 'strength-text';
            
            // 应用新样式
            strengthFill.classList.add(strength.level);
            strengthText.classList.add(strength.level);
            strengthText.textContent = `密码强度：${strength.text}`;
        });
    }
}

// 计算密码强度
function calculatePasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    let text = '弱';
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score >= 4) {
        level = 'strong';
        text = '强';
    } else if (score >= 2) {
        level = 'medium';
        text = '中';
    }
    
    return { level, text, score };
}