// 个人信息编辑功能
const API_BASE = 'http://localhost:8080/api';

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息框，使用与其他页面一致的样式类
    const messageBox = document.createElement('div');
    messageBox.className = `notification notification-${type}`;
    messageBox.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 
                       type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageBox);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (messageBox.parentNode) {
            messageBox.parentNode.removeChild(messageBox);
        }
    }, 3000);
    
    // 点击移除
    messageBox.addEventListener('click', () => {
        if (messageBox.parentNode) {
            messageBox.parentNode.removeChild(messageBox);
        }
    });
}

// 消息样式已在style.css中定义，无需重复添加

// 获取当前用户信息
async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE}/auth/check`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            throw new Error(result.message || '获取用户信息失败');
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        throw error;
    }
}

// 初始化个人信息编辑模态框
function initProfileEditModal() {
    console.log('开始初始化个人信息编辑模态框...');
    
    const editProfileBtns = document.querySelectorAll('[data-action="edit-profile"]');
    const profileModal = document.getElementById('profile-modal');
    const profileForm = document.getElementById('profile-form');
    const cancelProfileBtn = document.getElementById('cancel-profile');
    
    console.log('找到的元素:', {
        editProfileBtns: editProfileBtns.length,
        profileModal: !!profileModal,
        profileForm: !!profileForm,
        cancelProfileBtn: !!cancelProfileBtn
    });
    
    if (!profileModal || !profileForm) {
        console.error('找不到个人信息编辑模态框');
        return;
    }
    
    // 绑定编辑按钮点击事件
    editProfileBtns.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            await openProfileModal();
        });
    });
    
    // 取消编辑 - 底部取消按钮
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', function() {
            console.log('取消按钮被点击');
            profileModal.style.display = 'none';
            profileForm.reset();
        });
    }
    
    // 关闭模态框 - 头部关闭按钮
    const closeProfileBtn = document.getElementById('close-profile-modal');
    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', function() {
            console.log('关闭按钮被点击');
            profileModal.style.display = 'none';
            profileForm.reset();
        });
    }
    
    // 点击模态框外部关闭
    profileModal.addEventListener('click', function(e) {
        if (e.target === profileModal) {
            profileModal.style.display = 'none';
            profileForm.reset();
        }
    });
    
    // 绑定表单提交事件
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleProfileUpdate();
    });
    
    // 保存按钮点击事件
    const saveProfileBtn = document.getElementById('save-profile');
    console.log('保存按钮元素:', !!saveProfileBtn);
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function(e) {
            console.log('保存按钮被点击');
            e.preventDefault();
            await handleProfileUpdate();
        });
    }
    
    // 初始化头像上传功能
    initProfileAvatarUpload();
    
    // 初始化密码强度检测
    initProfilePasswordStrength();
}

// 打开个人信息编辑模态框
async function openProfileModal() {
    try {
        const user = await getCurrentUser();
        const profileModal = document.getElementById('profile-modal');
        
        // 填充表单数据
        document.getElementById('profile-username').value = user.username || '';
        document.getElementById('profile-realname').value = user.realName || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        
        // 显示当前头像
        const avatarPreview = document.getElementById('profile-avatar-preview');
        if (user.avatarUrl && user.avatarUrl.trim() !== '') {
            console.log('显示用户头像:', user.avatarUrl);
            avatarPreview.innerHTML = `<img src="${user.avatarUrl}" alt="当前头像" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            console.log('显示默认头像图标');
            avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        // 清空密码字段
        document.getElementById('profile-old-password').value = '';
        document.getElementById('profile-new-password').value = '';
        document.getElementById('profile-confirm-password').value = '';
        
        // 显示模态框
        profileModal.style.display = 'flex';
        
    } catch (error) {
        showMessage('获取用户信息失败: ' + error.message, 'error');
    }
}

// 处理个人信息更新
async function handleProfileUpdate() {
    const form = document.getElementById('profile-form');
    const formData = new FormData(form);
    
    const realName = formData.get('realName').trim();
    const email = formData.get('email').trim();
    const phone = formData.get('phone').trim();
    const oldPassword = formData.get('oldPassword').trim();
    const newPassword = formData.get('newPassword').trim();
    const confirmPassword = formData.get('confirmPassword').trim();
    const avatarFile = formData.get('avatar');
    
    // 验证表单
    if (!validateProfileForm(realName, email, phone, oldPassword, newPassword, confirmPassword)) {
        return;
    }
    
    // 显示加载状态
    const submitBtn = document.getElementById('save-profile');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '更新中...';
    submitBtn.disabled = true;
    
    try {
        let updatedUser = null;
        
        // 先处理头像上传（如果有新头像）
        if (avatarFile && avatarFile.size > 0) {
            console.log('正在上传头像...');
            submitBtn.textContent = '上传头像中...';
            
            const avatarFormData = new FormData();
            avatarFormData.append('avatar', avatarFile);
            
            const avatarResponse = await fetch(`${API_BASE}/auth/upload-avatar`, {
                method: 'POST',
                credentials: 'include',
                body: avatarFormData
            });
            
            const avatarResult = await avatarResponse.json();
            
            if (!avatarResult.success) {
                showMessage(avatarResult.message || '头像上传失败', 'error');
                return;
            }
            
            updatedUser = avatarResult.data;
            console.log('头像上传成功');
        }
        
        // 然后处理其他个人信息更新
        submitBtn.textContent = '更新信息中...';
        
        // 构建更新数据
        const updateData = {
            realName: realName,
            email: email || null,
            phone: phone || null
        };
        
        // 如果要修改密码
        if (newPassword) {
            updateData.oldPassword = oldPassword;
            updateData.newPassword = newPassword;
        }
        
        // 调用更新API
        const response = await fetch(`${API_BASE}/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            updatedUser = result.data;
            showMessage('个人信息更新成功', 'success');
            
            // 更新页面显示的用户信息
            updateUserDisplay(updatedUser);
            
            // 关闭模态框
            document.getElementById('profile-modal').style.display = 'none';
            form.reset();
            
        } else {
            showMessage(result.message || '更新失败', 'error');
        }
        
    } catch (error) {
        console.error('更新个人信息失败:', error);
        showMessage('网络连接错误，请检查服务器状态', 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// 验证个人信息表单
function validateProfileForm(realName, email, phone, oldPassword, newPassword, confirmPassword) {
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
    if (email && email !== '') {
        if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            showMessage('邮箱格式不正确', 'error');
            return false;
        }
    }
    
    // 手机号验证（可选）
    if (phone && phone !== '') {
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            showMessage('手机号格式不正确', 'error');
            return false;
        }
    }
    
    // 密码修改验证
    if (newPassword || confirmPassword) {
        if (!oldPassword) {
            showMessage('修改密码时必须输入当前密码', 'error');
            return false;
        }
        
        if (!newPassword) {
            showMessage('请输入新密码', 'error');
            return false;
        }
        
        if (newPassword.length < 6) {
            showMessage('新密码长度至少6位', 'error');
            return false;
        }
        
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
            showMessage('新密码必须包含字母和数字', 'error');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showMessage('两次输入的新密码不一致', 'error');
            return false;
        }
        
        if (oldPassword === newPassword) {
            showMessage('新密码不能与当前密码相同', 'error');
            return false;
        }
    }
    
    return true;
}

// 初始化个人信息页面的头像上传功能
function initProfileAvatarUpload() {
    const avatarInput = document.getElementById('profile-avatar');
    const avatarPreview = document.getElementById('profile-avatar-preview');
    const removeAvatarBtn = document.getElementById('remove-avatar');
    
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
    
    // 移除头像按钮
    if (removeAvatarBtn) {
        removeAvatarBtn.addEventListener('click', function() {
            avatarPreview.innerHTML = '<i class="fas fa-user"></i>';
            avatarInput.value = '';
        });
    }
}

// 初始化个人信息页面的密码强度检测
function initProfilePasswordStrength() {
    const passwordInput = document.getElementById('profile-new-password');
    const strengthFill = document.getElementById('profile-strength-fill');
    const strengthText = document.getElementById('profile-strength-text');
    
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
            strengthText.textContent = password ? `密码强度：${strength.text}` : '';
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

// 更新页面显示的用户信息
function updateUserDisplay(user) {
    console.log('更新用户显示信息:', user);
    
    // 更新头像显示
    const avatarElements = document.querySelectorAll('.user-avatar');
    console.log('找到头像元素数量:', avatarElements.length);
    
    avatarElements.forEach((avatar, index) => {
        if (user.avatarUrl && user.avatarUrl.trim() !== '') {
            console.log(`更新头像元素 ${index}:`, user.avatarUrl);
            avatar.innerHTML = `<img src="${user.avatarUrl}" alt="用户头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            console.log(`显示默认头像图标 ${index}`);
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        }
    });
    
    // 更新用户名显示
    const usernameElements = document.querySelectorAll('.user-name');
    usernameElements.forEach(element => {
        element.textContent = user.realName || user.username;
    });
}

// 上传头像
async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch(`${API_BASE}/auth/upload-avatar`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('头像上传成功', 'success');
            // 更新页面显示的头像
            updateUserDisplay(result.data);
            return result.data;
        } else {
            showMessage(result.message || '头像上传失败', 'error');
            return null;
        }
    } catch (error) {
        console.error('头像上传失败:', error);
        showMessage('网络连接错误，请检查服务器状态', 'error');
        return null;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化个人信息编辑功能
    initProfileEditModal();
    
    // 初始化页面时加载用户信息并显示头像
    loadAndDisplayUserInfo();
});

// 加载并显示用户信息
async function loadAndDisplayUserInfo() {
    try {
        const user = await getCurrentUser();
        updateUserDisplay(user);
    } catch (error) {
        console.log('获取用户信息失败，可能未登录:', error);
    }
} 