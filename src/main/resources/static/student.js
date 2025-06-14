// 全局变量定义
let currentUser = null;

// 调试函数：检查currentUser状态
window.checkCurrentUser = function() {
    console.log('=== currentUser 状态检查 ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser 是否存在:', !!currentUser);
    console.log('currentUser.userId:', currentUser?.userId);
    console.log('currentUser.role:', currentUser?.role);
    console.log('检查通过:', !!(currentUser && currentUser.userId));
    return currentUser;
};

// 内容切换功能 - 移到全局作用域
function showSection(sectionId) {
    document.querySelectorAll('.main-section').forEach(sec => {
        if(sec.id === sectionId) {
            sec.classList.remove('hidden-section');
        } else {
            sec.classList.add('hidden-section');
        }
    });
    
    // 根据不同页面加载相应的数据
    switch(sectionId) {
        case 'student-dashboard':
            updateDashboardStats();
            break;
        case 'join-course':
            refreshAvailableCourses();
            break;
        case 'my-courses':
            refreshMyCourses();
            break;
    }
}

// 开始学习功能 - 点击开始学习按钮时调用
function startLearning() {
    // 首先切换到我的课程页面
    showSection('my-courses');
    
    // 激活左侧菜单的"我的课程"项
    // 找到"我的课程"菜单项
    const myCoursesMenuItem = document.querySelector('[data-section="my-courses"]');
    if (myCoursesMenuItem) {
        // 移除所有菜单项的活动状态
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        
        // 设置"我的课程"为活动状态
        myCoursesMenuItem.classList.add('active');
        
        // 确保课程中心的子菜单展开
        const parentSubmenu = myCoursesMenuItem.closest('.submenu');
        if (parentSubmenu) {
            const parentMenuItem = parentSubmenu.previousElementSibling;
            const arrow = parentMenuItem.querySelector('.arrow');
            
            // 先关闭所有子菜单
            document.querySelectorAll('.submenu').forEach(sub => {
                sub.style.display = 'none';
            });
            document.querySelectorAll('.menu-item .arrow').forEach(arr => {
                arr.style.transform = 'rotate(0deg)';
            });
            
            // 展开课程中心子菜单
            parentSubmenu.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // 完全不使用localStorage，直接从服务器验证登录状态
    
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success && result.data) {
            currentUser = result.data;
            console.log('currentUser 加载成功:', currentUser);
        } else {
            console.log('登录检查API返回:', result);
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html';
        return;
    }
    
    // 如果没有用户信息或角色不是学生，则跳转到登录页面
    if (!currentUser || currentUser.role !== 'student') {
        console.log('用户信息无效，currentUser:', currentUser);
        window.location.href = 'login.html';
        return;
    }

    // 设置用户名
    document.querySelector('.user-name').textContent = currentUser.username;

    // 设置用户下拉菜单
    setupUserDropdown();

    // 设置全部通知弹窗
    setupAllNoticesModal();

    // 初始化控制面板数据
    updateDashboardStats();

    // 统一的菜单状态管理
    function setActiveMenuItem(targetElement, sectionId) {
        // 移除所有菜单项的活动状态
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        
        // 设置当前菜单项为活动状态
        targetElement.classList.add('active');
        
        // 如果是子菜单项，确保其父级菜单展开但不设置为活动状态
        if (targetElement.classList.contains('submenu-item')) {
            const parentSubmenu = targetElement.closest('.submenu');
            if (parentSubmenu) {
                const parentMenuItem = parentSubmenu.previousElementSibling;
                const arrow = parentMenuItem.querySelector('.arrow');
                
                // 展开父级菜单
                parentSubmenu.style.display = 'block';
                if (arrow) arrow.style.transform = 'rotate(180deg)';
            }
        }
        
        // 执行页面跳转
        if (sectionId) {
            showSection(sectionId);
        }
    }

    // 主菜单项点击处理
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            const arrow = this.querySelector('.arrow');
            const section = this.getAttribute('data-section');
            
            // 如果有子菜单，处理展开/收起逻辑
            if (submenu && submenu.classList.contains('submenu')) {
                const isOpen = submenu.style.display === 'block';
                
                // 关闭所有子菜单
                document.querySelectorAll('.submenu').forEach(sub => {
                    sub.style.display = 'none';
                });
                document.querySelectorAll('.menu-item .arrow').forEach(arr => {
                    arr.style.transform = 'rotate(0deg)';
                });
                
                // 切换当前子菜单
                if (!isOpen) {
                    submenu.style.display = 'block';
                    if (arrow) arrow.style.transform = 'rotate(180deg)';
                    // 清除所有菜单项的活动状态，包括子菜单项
                    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                    document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
                } else {
                    submenu.style.display = 'none';
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                    // 收起子菜单时也清除所有活动状态
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
                }
            } else if (section) {
                // 如果没有子菜单且有section，直接跳转
                setActiveMenuItem(this, section);
                
                // 关闭所有子菜单
                document.querySelectorAll('.submenu').forEach(sub => {
                    sub.style.display = 'none';
                });
                document.querySelectorAll('.menu-item .arrow').forEach(arr => {
                    arr.style.transform = 'rotate(0deg)';
                });
            }
        });
    });
    
    // 子菜单项点击处理
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止事件冒泡到父菜单
            
            const section = this.getAttribute('data-section');
            if (section) {
                setActiveMenuItem(this, section);
            }
        });
    });

    // 通知图标点击
    const notifications = document.querySelector('.notifications');
    if(notifications) {
        notifications.addEventListener('click', function() {
            const count = this.querySelector('.notification-count');
            if(count) {
                count.textContent = '0';
                count.style.backgroundColor = 'var(--success-color)';
                setTimeout(() => {
                    count.remove();
                }, 2000);
            }
        });
    }

    // 用户菜单
    const userProfile = document.querySelector('.user-profile');
    if(userProfile) {
        userProfile.addEventListener('click', function() {
            // 用户菜单功能已移除alert
        });
    }

    // 按钮点击效果
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // 卡片悬停效果
    document.querySelectorAll('.content-card, .stat-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // 模拟图表动画
    setTimeout(() => {
        document.querySelectorAll('.bar').forEach(bar => {
            const height = bar.style.height;
            bar.style.height = '0';
            setTimeout(() => {
                bar.style.height = height;
            }, 300);
        });
    }, 500);

    // 待办事项完成效果
    document.querySelectorAll('.activity-action').forEach(action => {
        action.addEventListener('click', function() {
            const item = this.closest('.activity-item');
            item.style.opacity = '0.5';
            setTimeout(() => {
                item.style.textDecoration = 'line-through';
                item.style.opacity = '0.3';
            }, 300);
        });
    });

    // 退出相关
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');

    cancelLogout.addEventListener('click', function() {
        logoutModal.style.display = 'none';
    });

    confirmLogout.addEventListener('click', async function() {
        try {
            // 调用服务器端登出API清除session
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            const result = await response.json();
            if (result.success) {
                showNotification('退出登录成功', 'success');
            }
        } catch (error) {
            console.error('登出请求失败:', error);
            showNotification('退出登录失败，但页面仍将跳转', 'warning');
        }
        
        logoutModal.style.display = 'none';
        // 跳转到首页
        setTimeout(() => {
            window.location.href = 'SmartEdu.html';
        }, 1000);
    });

    // 修改密码模态框事件
    setupChangePasswordModal();

    // 注销账户模态框事件
    setupDeleteAccountModal();

    // 设置课程中心功能
    setupCourseCenterFeatures();

    // 加入课程功能
    setupJoinCourseModal();

    // 初始化课程搜索功能
    initializeCourseSearchFilters();
});

// 设置加入课程模态框
function setupJoinCourseModal() {
    const modal = document.getElementById('join-course-modal');
    const closeBtn = document.getElementById('close-join-modal');
    const cancelBtn = document.getElementById('cancel-join');
    const previewBtn = document.getElementById('preview-course');
    const form = document.getElementById('join-course-form');
    const courseCodeInput = document.getElementById('course-code-input');
    const coursePreview = document.getElementById('course-preview');
    const submitBtn = form.querySelector('button[type="submit"]');

    let currentCourse = null;

    // 关闭模态框
    closeBtn.addEventListener('click', hideJoinCourseModal);
    cancelBtn.addEventListener('click', hideJoinCourseModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideJoinCourseModal();
        }
    });

    // 查找课程
    previewBtn.addEventListener('click', async function() {
        const courseCode = courseCodeInput.value.trim();
        if (!courseCode) {
            showNotification('请输入课程号', 'warning');
            return;
        }

        if (!isValidCourseCode(courseCode)) {
            showNotification('课程号格式不正确，应为：SE-XXXX（4位数字）', 'warning');
            return;
        }

        try {
            showLoading('正在查找课程...');
            const response = await fetch(`/api/teacher/courses/code/${courseCode}`);
            const result = await response.json();
            hideLoading();

            if (result.success && result.data) {
                currentCourse = result.data;
                displayCoursePreview(currentCourse);
                submitBtn.disabled = false;
            } else {
                showNotification(result.message || '课程不存在', 'error');
                hideCoursePreview();
                submitBtn.disabled = true;
            }
        } catch (error) {
            hideLoading();
            console.error('查找课程失败:', error);
            showNotification('查找课程失败，请重试', 'error');
            hideCoursePreview();
            submitBtn.disabled = true;
        }
    });

    // 提交加入课程
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentCourse) {
            showNotification('请先查找课程', 'warning');
            return;
        }

        try {
            showLoading('正在加入课程...');
            
            // 这里应该调用加入课程的API
            // 暂时模拟成功
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            hideLoading();
            showNotification('成功加入课程！', 'success');
            hideJoinCourseModal();
            
            // 刷新页面数据
            // location.reload();
            
        } catch (error) {
            hideLoading();
            console.error('加入课程失败:', error);
            showNotification('加入课程失败，请重试', 'error');
        }
    });

    // 课程号输入变化时重置状态
    courseCodeInput.addEventListener('input', function() {
        hideCoursePreview();
        submitBtn.disabled = true;
        currentCourse = null;
    });
}

// 显示加入课程模态框
function showJoinCourseModal() {
    const modal = document.getElementById('join-course-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // 重置表单
    document.getElementById('join-course-form').reset();
    hideCoursePreview();
    document.querySelector('#join-course-form button[type="submit"]').disabled = true;
    
    // 聚焦到课程号输入框
    setTimeout(() => {
        document.getElementById('course-code-input').focus();
    }, 300);
}

// 隐藏加入课程模态框
function hideJoinCourseModal() {
    const modal = document.getElementById('join-course-modal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// ================= 用户下拉菜单功能 =================

// 设置用户下拉菜单
function setupUserDropdown() {
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    
    if (!userProfile || !userDropdown) return;
    
    // 初始化下拉菜单状态
    userDropdown.style.display = 'none';
    userDropdown.style.opacity = '0';
    userDropdown.style.visibility = 'hidden';
    userDropdown.style.transform = 'translateY(-10px)';
    
    // 点击用户配置文件切换下拉菜单
    userProfile.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        
        if (isVisible) {
            // 隐藏下拉菜单
            userDropdown.style.opacity = '0';
            userDropdown.style.visibility = 'hidden';
            userDropdown.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                userDropdown.style.display = 'none';
            }, 200);
        } else {
            // 显示下拉菜单
            userDropdown.style.display = 'block';
            setTimeout(() => {
                userDropdown.style.opacity = '1';
                userDropdown.style.visibility = 'visible';
                userDropdown.style.transform = 'translateY(0)';
            }, 10);
        }
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', function() {
        if (userDropdown.style.display === 'block') {
            userDropdown.style.opacity = '0';
            userDropdown.style.visibility = 'hidden';
            userDropdown.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                userDropdown.style.display = 'none';
            }, 200);
        }
    });
    
    // 阻止下拉菜单内部点击事件冒泡
    userDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// 隐藏用户下拉菜单的辅助函数
function hideUserDropdown() {
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown && userDropdown.style.display === 'block') {
        userDropdown.style.opacity = '0';
        userDropdown.style.visibility = 'hidden';
        userDropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            userDropdown.style.display = 'none';
        }, 200);
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // 清空表单
        const form = document.getElementById('change-password-form');
        if (form) form.reset();
    }
    
    // 隐藏用户下拉菜单
    hideUserDropdown();
}

// 隐藏修改密码模态框
function hideChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// 设置修改密码模态框事件
function setupChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    const closeBtn = document.getElementById('close-password-modal');
    const cancelBtn = document.getElementById('cancel-password-change');
    const form = document.getElementById('change-password-form');
    
    if (!modal) return;
    
    // 关闭模态框
    if (closeBtn) closeBtn.addEventListener('click', hideChangePasswordModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideChangePasswordModal);
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideChangePasswordModal();
        }
    });
    
    // 表单提交
    if (form) form.addEventListener('submit', handleChangePassword);
}

// 处理修改密码
async function handleChangePassword(e) {
    e.preventDefault();
    
    try {
        const currentPassword = document.getElementById('current-password').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        
        // 表单验证
        if (!currentPassword) {
            showNotification('请输入当前密码', 'warning');
            return;
        }
        
        if (!newPassword) {
            showNotification('请输入新密码', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            showNotification('新密码至少需要6位', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showNotification('两次输入的新密码不一致', 'warning');
            return;
        }
        
        if (currentPassword === newPassword) {
            showNotification('新密码不能与当前密码相同', 'warning');
            return;
        }
        
        // 获取当前用户ID
        const userResponse = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!userResponse.ok) {
            throw new Error('获取用户信息失败');
        }
        
        const userResult = await userResponse.json();
        if (!userResult.success) {
            throw new Error(userResult.message || '获取用户信息失败');
        }
        
        // 调用修改密码API
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: userResult.data.userId,
                oldPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('密码修改成功！', 'success');
            hideChangePasswordModal();
        } else {
            showNotification(result.message || '密码修改失败', 'error');
        }
        
    } catch (error) {
        console.error('修改密码失败:', error);
        showNotification('修改密码失败，请稍后重试', 'error');
    }
}

// 显示注销账户模态框
function showDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // 清空表单
        const passwordInput = document.getElementById('delete-account-password');
        const confirmCheckbox = document.getElementById('delete-account-confirm');
        
        if (passwordInput) passwordInput.value = '';
        if (confirmCheckbox) confirmCheckbox.checked = false;
    }
    
    // 隐藏用户下拉菜单
    hideUserDropdown();
}

// 隐藏注销账户模态框
function hideDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// 设置注销账户模态框事件
function setupDeleteAccountModal() {
    const modal = document.getElementById('delete-account-modal');
    const closeBtn = document.getElementById('close-delete-account-modal');
    const cancelBtn = document.getElementById('cancel-delete-account');
    const form = document.getElementById('delete-account-form');
    
    if (!modal) return;
    
    // 关闭按钮事件
    if (closeBtn) closeBtn.addEventListener('click', hideDeleteAccountModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideDeleteAccountModal);
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideDeleteAccountModal();
        }
    });
    
    // 表单提交事件
    if (form) form.addEventListener('submit', handleDeleteAccount);
}

// 处理注销账户
async function handleDeleteAccount(e) {
    e.preventDefault();
    
    try {
        const passwordInput = document.getElementById('delete-account-password');
        const confirmCheckbox = document.getElementById('delete-account-confirm');
        
        const password = passwordInput.value.trim();
        const isConfirmed = confirmCheckbox.checked;
        
        // 验证输入
        if (!password) {
            showNotification('请输入您的密码', 'warning');
            passwordInput.focus();
            return;
        }
        
        if (!isConfirmed) {
            showNotification('请确认您已知晓此操作的风险', 'warning');
            return;
        }
        
        // 二次确认
        const finalConfirm = confirm('最后确认：此操作将永久删除您的账户和所有相关数据，且无法恢复！\n\n确定要继续吗？');
        
        if (!finalConfirm) {
            return;
        }
        
        // 获取当前用户ID
        const userResponse = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!userResponse.ok) {
            throw new Error('获取用户信息失败');
        }
        
        const userResult = await userResponse.json();
        if (!userResult.success) {
            throw new Error(userResult.message || '获取用户信息失败');
        }
        
        // 先验证密码（通过登录接口验证）
        const loginCheckResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                username: userResult.data.username,
                password: password,
                role: userResult.data.role
            })
        });
        
        const loginCheckResult = await loginCheckResponse.json();
        if (!loginCheckResult.success) {
            showNotification('密码验证失败，请检查您的密码', 'error');
            return;
        }
        
        // 调用删除账户API
        const deleteResponse = await fetch(`/api/auth/users/${userResult.data.userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const deleteResult = await deleteResponse.json();
        
        if (deleteResult.success) {
            showNotification('账户注销成功，页面将自动跳转...', 'success');
            hideDeleteAccountModal();
            
            // 延迟2秒后跳转到首页
            setTimeout(() => {
                window.location.href = 'SmartEdu.html';
            }, 2000);
        } else {
            showNotification(deleteResult.message || '账户注销失败', 'error');
        }
        
    } catch (error) {
        console.error('注销失败:', error);
        showNotification('注销失败，请稍后重试', 'error');
    }
}

// 处理用户下拉菜单中的退出登录
function handleLogout() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
    
    // 隐藏用户下拉菜单
    hideUserDropdown();
}



// 显示课程预览
function displayCoursePreview(course) {
    const preview = document.getElementById('course-preview');
    
    document.getElementById('preview-name').textContent = course.name || '-';
    document.getElementById('preview-teacher').textContent = course.teacherName || '-';
    document.getElementById('preview-description').textContent = course.description || '暂无描述';
    
    const creditHours = [];
    if (course.credit) creditHours.push(`${course.credit}学分`);
    if (course.hours) creditHours.push(`${course.hours}学时`);
    document.getElementById('preview-credit-hours').textContent = creditHours.length > 0 ? creditHours.join(' / ') : '-';
    
    preview.style.display = 'block';
}

// 隐藏课程预览
function hideCoursePreview() {
    document.getElementById('course-preview').style.display = 'none';
}

// 验证课程号格式
function isValidCourseCode(courseCode) {
    const pattern = /^SE-[0-9]{4}$/;
    return pattern.test(courseCode);
}

// 显示通知
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动移除
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// 显示加载状态
function showLoading(message = '加载中...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('.loading-text').textContent = message;
    }
    overlay.style.display = 'flex';
}

// 隐藏加载状态
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
} 

// ==================== 课程中心功能 ====================

// 设置课程中心功能
function setupCourseCenterFeatures() {
    // 设置主要的加入课程表单
    const mainJoinForm = document.getElementById('join-course-form-main');
    const searchBtn = document.getElementById('search-course-btn');
    const courseCodeInput = document.getElementById('course-code-main');
    
    if (searchBtn && courseCodeInput) {
        searchBtn.addEventListener('click', searchCourseMain);
        courseCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchCourseMain();
            }
        });
    }
    
    if (mainJoinForm) {
        mainJoinForm.addEventListener('submit', handleJoinCourseMain);
    }
    

}

// 搜索课程（主页面）
async function searchCourseMain() {
    const courseCode = document.getElementById('course-code-main').value.trim();
    const previewDiv = document.getElementById('course-preview-main');
    const detailsDiv = document.getElementById('course-details-main');
    
    if (!courseCode) {
        showNotification('请输入课程号', 'warning');
        return;
    }
    
    if (!isValidCourseCode(courseCode)) {
        showNotification('课程号格式不正确，应为：SE-XXXX（4位数字）', 'warning');
        return;
    }
    
    try {
        showLoading('正在查找课程...');
        const response = await fetch(`/api/student/courses/code/${courseCode}`);
        const result = await response.json();
        hideLoading();
        
        if (result.success && result.data) {
            const course = result.data;
            
            // 显示课程详情
            detailsDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                    <div><strong>课程名称：</strong>${course.name}</div>
                    <div><strong>课程号：</strong>${course.courseCode}</div>
                    <div><strong>学分：</strong>${course.credit || 0}学分</div>
                    <div><strong>课时：</strong>${course.hours || 0}课时</div>
                    <div><strong>任课教师：</strong>${course.teacher?.realName || '未知'}</div>
                    <div><strong>开课学期：</strong>${course.semester || '未设置'}</div>
                </div>
                <div style="margin-top: 12px;">
                    <strong>课程描述：</strong>
                    <p style="margin: 8px 0; color: #5d6d7e; line-height: 1.5;">
                        ${course.description || '暂无课程描述'}
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; font-size: 14px;">
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <div style="color: #7f8c8d;">当前学生</div>
                        <div style="font-weight: 600; color: var(--primary-color);">${course.currentStudents || 0}人</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <div style="color: #7f8c8d;">最大容量</div>
                        <div style="font-weight: 600; color: var(--success-color);">${course.maxStudents || '无限制'}</div>
                    </div>
                </div>
            `;
            
            previewDiv.style.display = 'block';
            window.currentSearchedCourse = course;
            
        } else {
            showNotification(result.message || '课程不存在', 'error');
            previewDiv.style.display = 'none';
        }
        
    } catch (error) {
        hideLoading();
        console.error('查找课程失败:', error);
        showNotification('查找课程失败，请重试', 'error');
        previewDiv.style.display = 'none';
    }
}

// 处理加入课程（主页面）
async function handleJoinCourseMain(e) {
    e.preventDefault();
    
    // 检查用户是否已登录
    if (!currentUser || !currentUser.userId) {
        console.log('handleJoinCourseMain - currentUser 检查失败:', currentUser);
        showNotification('请先登录', 'error');
        return;
    }
    
    console.log('handleJoinCourseMain - currentUser 检查通过:', currentUser);
    
    if (!window.currentSearchedCourse) {
        showNotification('请先查找课程', 'warning');
        return;
    }
    
    // 显示确认弹窗
    const confirmed = await showConfirmModal(
        '加入课程',
        `确定要加入课程 ${window.currentSearchedCourse.courseCode} 吗？`,
        'fas fa-user-plus',
        'primary'
    );
    if (!confirmed) return;
    
    try {
        showLoading('正在加入课程...');
        
        // 调用加入课程API
        const response = await fetch('/api/student/courses/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                userId: currentUser.userId,
                courseCode: window.currentSearchedCourse.courseCode 
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
        showNotification('成功加入课程！', 'success');
        
        // 清空表单和预览
        document.getElementById('join-course-form-main').reset();
        document.getElementById('course-preview-main').style.display = 'none';
        window.currentSearchedCourse = null;
        
        // 刷新我的课程列表
        refreshMyCourses();
        } else {
            showNotification(result.message || '加入课程失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('加入课程失败:', error);
        showNotification('加入课程失败，请重试', 'error');
    }
}

// 刷新可用课程列表
async function refreshAvailableCourses(showMessage = true) {
    try {
        // 重新加载筛选器数据并搜索课程
        await loadSemesters();
        await loadTeachers();
        await searchAvailableCourses();
        
        if (showMessage) {
        showNotification('课程列表已刷新', 'success');
        }
        
    } catch (error) {
        console.error('刷新课程列表失败:', error);
        if (showMessage) {
        showNotification('刷新课程列表失败', 'error');
        }
    }
}

// 刷新我的课程列表
async function refreshMyCourses() {
    const grid = document.getElementById('my-courses-grid');
    
    // 检查用户是否已登录
    if (!currentUser || !currentUser.userId) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #e74c3c; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>请先登录</p>
            </div>
        `;
        return;
    }
    
    try {
        showLoading('正在加载我的课程...');
        
        // 调用获取我的课程的API
        const response = await fetch(`/api/student/my-courses?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            const myCourses = result.data || [];
        
        if (myCourses.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 48px 0; color: #7f8c8d; grid-column: 1 / -1;">
                    <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>您还没有加入任何课程</p>
                    <p>请通过课程中心加入课程开始学习吧！</p>
                </div>
            `;
        } else {
            displayMyCourses(myCourses);
            }
            
            // 同时更新控制面板数据
            updateDashboardStats();
        } else {
            showNotification(result.message || '加载课程列表失败', 'error');
            grid.innerHTML = `
                <div style="text-align: center; padding: 48px 0; color: #e74c3c; grid-column: 1 / -1;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <p>加载课程列表失败</p>
                    <p>请刷新页面重试</p>
                </div>
            `;
        }
        
    } catch (error) {
        hideLoading();
        console.error('加载我的课程失败:', error);
        showNotification('加载课程列表失败', 'error');
        grid.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #e74c3c; grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>加载课程列表失败</p>
                <p>请刷新页面重试</p>
            </div>
        `;
    }
}



// 通过ID加入课程
async function joinCourseById(courseId) {
    try {
        showLoading('正在加入课程...');
        
        // 调用加入课程API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        hideLoading();
        showNotification('成功加入课程！', 'success');
        refreshMyCourses();
        
    } catch (error) {
        hideLoading();
        showNotification('加入课程失败', 'error');
    }
}

// ================= 课程搜索和筛选功能 =================

// 初始化课程搜索筛选器
async function initializeCourseSearchFilters() {
    try {
        // 加载学期列表
        await loadSemesters();
        
        // 加载教师列表
        await loadTeachers();
        
        // 初始搜索以显示所有课程
        await searchAvailableCourses();
        
    } catch (error) {
        console.error('初始化筛选器失败:', error);
        showNotification('初始化失败，请刷新页面重试', 'error');
    }
}

// 加载学期列表
async function loadSemesters() {
    try {
        const response = await fetch('/api/student/semesters', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const semesterSelect = document.getElementById('semester-filter');
            if (semesterSelect) {
                // 清空现有选项（保留"全部学期"）
                semesterSelect.innerHTML = '<option value="">全部学期</option>';
                
                // 添加学期选项
                result.data.forEach(semester => {
                    const option = document.createElement('option');
                    option.value = semester;
                    option.textContent = semester;
                    semesterSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('加载学期列表失败:', error);
    }
}

// 加载教师列表
async function loadTeachers() {
    try {
        const response = await fetch('/api/student/teachers', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const teacherSelect = document.getElementById('teacher-filter');
            if (teacherSelect) {
                // 清空现有选项（保留"全部教师"）
                teacherSelect.innerHTML = '<option value="">全部教师</option>';
                
                // 添加教师选项
                result.data.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.realName;
                    option.textContent = `${teacher.realName}${teacher.department ? ` (${teacher.department})` : ''}`;
                    teacherSelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('加载教师列表失败:', error);
    }
}

// 搜索可加入的课程
async function searchAvailableCourses() {
    try {
        showLoading('正在搜索课程...');
        
        // 获取筛选条件（移除专业筛选）
        const semester = document.getElementById('semester-filter')?.value || '';
        const teacherName = document.getElementById('teacher-filter')?.value || '';
        
        // 构建查询参数
        const params = new URLSearchParams();
        if (semester) params.append('semester', semester);
        if (teacherName) params.append('teacherName', teacherName);
        
        const response = await fetch(`/api/student/courses/search?${params.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            displayAvailableCourses(result.data || []);
        } else {
            showNotification(result.message || '搜索课程失败', 'error');
            displayAvailableCourses([]);
        }
        
    } catch (error) {
        hideLoading();
        console.error('搜索课程失败:', error);
        showNotification('搜索课程失败，请重试', 'error');
        displayAvailableCourses([]);
    }
}

// 显示可加入的课程列表
function displayAvailableCourses(courses) {
    const grid = document.getElementById('available-courses-grid');
    
    if (!grid) return;
    
    if (!courses || courses.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d; grid-column: 1 / -1;">
                <i class="fas fa-graduation-cap" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无符合条件的课程</p>
                <p>请尝试调整筛选条件或联系教师获取课程号</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-card-header">
                <div class="course-info">
                    <h3 class="course-title">${course.name || '未命名课程'}</h3>
                    <div class="course-code">${course.courseCode || 'N/A'}</div>
                </div>
            </div>
            
            <div class="course-card-body">
                <div class="course-details">
                    <div class="detail-item">
                        <i class="fas fa-user-tie"></i>
                        <span>任课教师：${course.teacher?.realName || course.teacherName || '未指定'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>学期：${course.semester || '未设置'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-star"></i>
                        <span>学分：${course.credit || 0}学分</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>课时：${course.hours || 0}课时</span>
                    </div>
                </div>
                
                <div class="course-description">
                    <p>${course.description || '暂无课程描述'}</p>
                </div>
                
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-number">${course.currentStudents || 0}</span>
                        <span class="stat-label">当前学生</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${course.maxStudents || '无限制'}</span>
                        <span class="stat-label">最大容量</span>
                    </div>
                </div>
            </div>
            
            <div class="course-card-footer" style="text-align: center;">
                <button class="btn btn-primary" onclick="joinCourseFromList('${course.id}', '${course.courseCode}')">
                    <i class="fas fa-user-plus"></i> 加入课程
                </button>
            </div>
        </div>
    `).join('');
}

// 从课程列表加入课程
async function joinCourseFromList(courseId, courseCode) {
    try {
        // 检查用户是否已登录
        if (!currentUser || !currentUser.userId) {
            console.log('joinCourseFromList - currentUser 检查失败:', currentUser);
            showNotification('请先登录', 'error');
            return;
        }
        
        console.log('joinCourseFromList - currentUser 检查通过:', currentUser);
        
        const confirmed = await showConfirmModal(
            '加入课程',
            `确定要加入课程 ${courseCode} 吗？`,
            'fas fa-user-plus',
            'primary'
        );
        if (!confirmed) return;
        
        showLoading('正在加入课程...');
        
        // 调用加入课程API
        const response = await fetch('/api/student/courses/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                userId: currentUser.userId,
                courseCode: courseCode 
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('成功加入课程！', 'success');
            // 刷新我的课程列表和课程中心
        refreshMyCourses();
            refreshAvailableCourses(false); // 不显示刷新消息
        } else {
            showNotification(result.message || '加入课程失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('加入课程失败:', error);
        showNotification('加入课程失败，请重试', 'error');
    }
}



// 显示我的课程列表
function displayMyCourses(courses) {
    const grid = document.getElementById('my-courses-grid');
    
    if (!grid) return;
    
    grid.innerHTML = courses.map(course => `
        <div class="course-card" data-course-id="${course.id}">
            <div class="course-card-header">
                <h3 class="course-title">${course.name || '未命名课程'}</h3>
                <div class="course-code">${course.courseCode || 'N/A'}</div>
            </div>
            
            <div class="course-card-body">
                <div class="course-details">
                    <div class="detail-item">
                        <i class="fas fa-user-tie"></i>
                        <span>任课教师：${course.teacher?.realName || course.teacherName || '未指定'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>学期：${course.semester || '未设置'}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-star"></i>
                        <span>学分：${course.credit || 0}学分</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>课时：${course.hours || 0}课时</span>
                    </div>

                </div>
                
                <div class="course-description">
                    <p>${course.description || '暂无课程描述'}</p>
                </div>
                
                <div class="course-stats">
                    <div class="stat-item">
                        <span class="stat-number">${course.currentStudents || 0}</span>
                        <span class="stat-label">当前学生</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${course.maxStudents || '无限制'}</span>
                        <span class="stat-label">最大容量</span>
                    </div>
                </div>
            </div>
            
            <div class="course-card-footer">
                <button class="btn btn-primary" onclick="enterCourse('${course.id}')">
                    <i class="fas fa-sign-in-alt"></i>
                    <span>进入课程</span>
                </button>
                <button class="btn btn-danger" onclick="dropCourse('${course.id}')">
                    <i class="fas fa-user-minus"></i>
                    <span>退出课程</span>
                </button>
            </div>
        </div>
    `).join('');
}

// 进入课程
async function enterCourse(courseId) {
    try {
        // 检查用户是否已登录
        if (!currentUser || !currentUser.userId) {
            showNotification('请先登录', 'error');
            return;
        }
        
        showLoading('正在加载课程详情...');
        
        // 获取课程详情
        const response = await fetch(`/api/student/courses/${courseId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            // 存储当前课程信息
            currentCourseDetail = result.data;
            
            // 显示课程详情页面
            showCourseDetail(result.data);
        } else {
            showNotification(result.message || '获取课程详情失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('进入课程失败:', error);
        showNotification('进入课程失败，请重试', 'error');
    }
}

// 显示课程详情页面
function showCourseDetail(course) {
    // 隐藏其他页面，显示课程详情页面
    showSection('course-detail');
    
    // 激活左侧菜单的"我的课程"项
    const myCoursesMenuItem = document.querySelector('[data-section="my-courses"]');
    if (myCoursesMenuItem) {
        // 移除所有菜单项的活动状态
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        
        // 设置"我的课程"为活动状态
        myCoursesMenuItem.classList.add('active');
        
        // 确保课程中心的子菜单展开
        const parentSubmenu = myCoursesMenuItem.closest('.submenu');
        if (parentSubmenu) {
            const parentMenuItem = parentSubmenu.previousElementSibling;
            const arrow = parentMenuItem.querySelector('.arrow');
            
            // 先关闭所有子菜单
            document.querySelectorAll('.submenu').forEach(sub => {
                sub.style.display = 'none';
            });
            document.querySelectorAll('.menu-item .arrow').forEach(arr => {
                arr.style.transform = 'rotate(0deg)';
            });
            
            // 展开课程中心子菜单
            parentSubmenu.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    }
    
    // 更新页面标题
    const titleElement = document.getElementById('course-detail-title');
    if (titleElement) {
        titleElement.textContent = course.name || '课程详情';
    }
    
    // 显示课程信息
    displayCourseInfo(course);
    
    // 默认显示课程资料选项卡
    switchCourseTab('materials');
    
    // 加载课程内容
    loadCourseContent(course.id);
}

// 显示课程信息
function displayCourseInfo(course) {
    const infoContainer = document.getElementById('course-info-detail');
    if (!infoContainer) return;
    
    const teacher = course.teacher || {};
    
    infoContainer.innerHTML = `
        <div class="course-info-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-book"></i> 课程名称
                </div>
                <div class="info-value">${course.name || '未命名课程'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-hashtag"></i> 课程代码
                </div>
                <div class="info-value">${course.courseCode || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-user-tie"></i> 任课教师
                </div>
                <div class="info-value">${teacher.realName || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-calendar"></i> 学期
                </div>
                <div class="info-value">${course.semester || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-star"></i> 学分
                </div>
                <div class="info-value">${course.credit || 0} 学分</div>
            </div>
            <div class="info-item">
                <div class="info-label">
                    <i class="fas fa-clock"></i> 课时
                </div>
                <div class="info-value">${course.hours || 0} 课时</div>
            </div>
        </div>
        ${course.description ? `
            <div class="course-description" style="margin-top: 20px;">
                <div class="info-label">
                    <i class="fas fa-info-circle"></i> 课程描述
                </div>
                <div class="info-value" style="margin-top: 8px; padding: 12px; background: #f8f9fa; border-radius: 6px; line-height: 1.6;">
                    ${course.description}
                </div>
            </div>
        ` : ''}
    `;
}

// 切换课程选项卡
function switchCourseTab(tabName) {
    // 更新选项卡状态
    document.querySelectorAll('.course-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.course-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 激活当前选项卡
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`course-${tabName}`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // 根据选项卡加载对应内容
    if (currentCourseDetail) {
        switch (tabName) {
            case 'materials':
                loadCourseMaterials(currentCourseDetail.id);
                break;
            case 'notices':
                loadCourseNotices(currentCourseDetail.id);
                break;
            case 'exams':
                loadCourseExams(currentCourseDetail.id);
                break;
        }
    }
}

// 加载课程内容
async function loadCourseContent(courseId) {
    // 默认加载课程资料
    await loadCourseMaterials(courseId);
}

// 加载课程资料
async function loadCourseMaterials(courseId) {
    try {
        const response = await fetch(`/api/student/courses/${courseId}/materials`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCourseMaterials(result.data || []);
        } else {
            console.error('获取课程资料失败:', result.message);
            displayCourseMaterials([]);
        }
        
    } catch (error) {
        console.error('加载课程资料失败:', error);
        displayCourseMaterials([]);
    }
}

// 显示课程资料
function displayCourseMaterials(materials) {
    const container = document.getElementById('materials-list');
    if (!container) return;
    
    if (materials.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无课程资料</p>
                <p>教师上传资料后会在这里显示</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = materials.map(material => {
        const fileName = material.originalName || material.filename;
        const fileExtension = getFileExtension(fileName);
        const iconClass = getFileIconClass(fileExtension);
        const fileSize = formatFileSize(material.fileSize);
        
        return `
            <div class="material-item">
                <div class="material-icon ${iconClass}">
                    <i class="fas ${getFileIcon(fileExtension)}"></i>
                </div>
                <div class="material-info">
                    <div class="material-name">${fileName}</div>
                    <div class="material-meta">
                        <span><i class="fas fa-file"></i> ${fileSize}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(material.uploadedAt)}</span>
                    </div>
                </div>
                <div class="material-actions">
                    <button class="btn btn-sm btn-primary" onclick="downloadMaterial('${material.id}', '${fileName}')">
                        <i class="fas fa-download"></i> 下载
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 加载课程通知
async function loadCourseNotices(courseId) {
    try {
        const response = await fetch(`/api/student/courses/${courseId}/notices`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCourseNotices(result.data || []);
        } else {
            console.error('获取课程通知失败:', result.message);
            displayCourseNotices([]);
        }
        
    } catch (error) {
        console.error('加载课程通知失败:', error);
        displayCourseNotices([]);
    }
}

// 显示课程通知
function displayCourseNotices(notices) {
    const container = document.getElementById('notices-list');
    if (!container) return;
    
    // 过滤掉未到推送时间的通知
    const currentTime = new Date();
    const visibleNotices = notices.filter(notice => {
        // 如果是定时推送且有推送时间，检查是否已到推送时间
        if (notice.pushTime === 'scheduled' && notice.scheduledTime) {
            const scheduledTime = new Date(notice.scheduledTime);
            return scheduledTime <= currentTime;
        }
        // 立即推送的通知直接显示
        return true;
    });
    
    if (visibleNotices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-bell" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无课程通知</p>
                <p>教师发布通知后会在这里显示</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = visibleNotices.map(notice => {
        // 计算推送时间：如果是定时推送且有推送时间，使用推送时间；否则使用创建时间
        const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
            ? notice.scheduledTime 
            : notice.createdAt;
        
        return `
            <div class="notice-item">
                <div class="notice-header">
                    <h4 class="notice-title">${notice.title}</h4>
                    <span class="notice-date">${formatPushTime(pushTime)}</span>
                </div>
                <div class="notice-content">${notice.content}</div>
            </div>
        `;
    }).join('');
}

// 加载课程测评
async function loadCourseExams(courseId) {
    try {
        const response = await fetch(`/api/student/courses/${courseId}/exams`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCourseExams(result.data || []);
        } else {
            console.error('获取课程测评失败:', result.message);
            displayCourseExams([]);
        }
        
    } catch (error) {
        console.error('加载课程测评失败:', error);
        displayCourseExams([]);
    }
}

// 显示课程测评
function displayCourseExams(exams) {
    const container = document.getElementById('exams-list');
    if (!container) return;
    
    if (exams.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-clipboard-check" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无测评考试</p>
                <p>教师发布测评后会在这里显示</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = exams.map(exam => {
        const statusClass = getExamStatusClass(exam.status);
        const statusText = getExamStatusText(exam.status);
        
        return `
            <div class="exam-item">
                <div class="exam-header">
                    <div>
                        <h4 class="exam-title">${exam.title}</h4>
                    </div>
                    <span class="exam-status ${statusClass}">${statusText}</span>
                </div>
                <div class="exam-meta">
                    <div class="exam-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>时长: ${exam.duration || 0} 分钟</span>
                    </div>
                    <div class="exam-meta-item">
                        <i class="fas fa-question-circle"></i>
                        <span>题目数: ${exam.questionCount || 0} 题</span>
                    </div>
                    <div class="exam-meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>开始时间: ${formatDateTime(exam.startTime)}</span>
                    </div>
                    <div class="exam-meta-item">
                        <i class="fas fa-calendar-times"></i>
                        <span>结束时间: ${formatDateTime(exam.endTime)}</span>
                    </div>
                </div>
                <div class="exam-actions">
                    ${getExamActionButtons(exam)}
                </div>
            </div>
        `;
    }).join('');
}

// 返回我的课程
function backToMyCourses() {
    // 使用startLearning函数来确保菜单也被正确激活
    startLearning();
    currentCourseDetail = null;
}

// 刷新课程详情
async function refreshCourseDetail() {
    if (currentCourseDetail) {
        await enterCourse(currentCourseDetail.id);
        showNotification('课程详情已刷新', 'success');
    }
}

// 加载学生的所有通知
async function loadStudentNotices() {
    try {
        if (!currentUser || !currentUser.userId) {
            console.log('用户未登录，无法加载通知');
            return [];
        }

        const response = await fetch(`/api/student/notices?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            console.error('获取学生通知失败:', result.message);
            return [];
        }
        
    } catch (error) {
        console.error('加载学生通知失败:', error);
        return [];
    }
}

// 更新控制面板最新通知显示
async function updateDashboardRecentNotices() {
    const container = document.getElementById('recent-notices-container');
    if (!container) return;
    
    try {
        const allNotices = await loadStudentNotices();
        
        if (!allNotices || allNotices.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>暂无新通知</p>
                    <p>我们会在这里显示课程相关的最新通知</p>
                </div>
            `;
            return;
        }
        
        // 取最新的2条通知
        const recentNotices = allNotices.slice(0, 2);
        
        const noticesHtml = recentNotices.map(notice => {
            const courseName = notice.courseName || '未知课程';
            const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
                ? notice.scheduledTime 
                : notice.createdAt;
            const truncatedContent = notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content;
            
            return `
                <div class="recent-notice-card">
                    <div class="recent-notice-header">
                        <div class="recent-notice-title">${notice.title}</div>
                        <div class="recent-notice-time">${formatPushTime(pushTime)}</div>
                    </div>
                    <div class="recent-notice-content">${truncatedContent}</div>
                    <div class="recent-notice-footer">
                        <div class="recent-notice-course">${courseName}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="recent-notices-list">
                ${noticesHtml}
            </div>
        `;
        
        // 更新查看全部按钮的显示状态
        const viewAllBtn = document.getElementById('view-all-notices-btn');
        if (viewAllBtn) {
            if (allNotices.length > 2) {
                viewAllBtn.style.display = 'block';
                viewAllBtn.innerHTML = `<i class="fas fa-eye"></i> 查看全部 (${allNotices.length})`;
            } else {
                viewAllBtn.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('更新最新通知失败:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>加载通知失败</p>
                <p>请刷新页面重试</p>
            </div>
        `;
    }
}

// 显示全部通知弹窗
async function showAllNotices() {
    try {
        const modal = document.getElementById('all-notices-modal');
        const container = document.getElementById('all-notices-container');
        
        // 显示加载状态
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-spinner fa-spin" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>正在加载通知...</p>
            </div>
        `;
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 加载所有通知
        const allNotices = await loadStudentNotices();
        
        if (!allNotices || allNotices.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>暂无通知</p>
                    <p>教师发布通知后会在这里显示</p>
                </div>
            `;
            return;
        }
        
        // 显示所有通知
        const noticesHtml = allNotices.map(notice => {
            const courseName = notice.courseName || '未知课程';
            const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
                ? notice.scheduledTime 
                : notice.createdAt;
            
            return `
                <div class="notice-item" style="margin-bottom: 16px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: #fff;">
                    <div class="notice-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <h4 class="notice-title" style="margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${notice.title}</h4>
                        <span class="notice-date" style="color: #7f8c8d; font-size: 12px; white-space: nowrap; margin-left: 16px;">${formatPushTime(pushTime)}</span>
                    </div>
                    <div class="notice-content" style="color: #34495e; line-height: 1.6; margin-bottom: 12px;">${notice.content}</div>
                    <div class="notice-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #7f8c8d;">
                        <span class="notice-course" style="color: #5a67d8; font-weight: 500;">课程：${courseName}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = noticesHtml;
        
    } catch (error) {
        console.error('显示全部通知失败:', error);
        const container = document.getElementById('all-notices-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                <p>加载通知失败</p>
                <p>请重试</p>
            </div>
        `;
    }
}

// 关闭全部通知弹窗
function closeAllNoticesModal() {
    const modal = document.getElementById('all-notices-modal');
    modal.style.display = 'none';
}

// 设置全部通知弹窗事件监听器
function setupAllNoticesModal() {
    const modal = document.getElementById('all-notices-modal');
    const closeBtn = document.getElementById('close-all-notices-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAllNoticesModal);
    }
    
    if (modal) {
        // 点击背景关闭弹窗
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAllNoticesModal();
            }
        });
        
        // ESC键关闭弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closeAllNoticesModal();
            }
        });
    }
}

// 工具函数
function getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
}

function getFileIconClass(extension) {
    const iconMap = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'ppt': 'ppt',
        'pptx': 'ppt',
        'txt': 'txt'
    };
    return iconMap[extension] || 'default';
}

function getFileIcon(extension) {
    const iconMap = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'txt': 'fa-file-alt'
    };
    return iconMap[extension] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

function formatPushTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getExamStatusClass(status) {
    const statusMap = {
        'draft': 'draft',
        'published': 'published',
        'ongoing': 'ongoing',
        'finished': 'finished'
    };
    return statusMap[status] || 'draft';
}

function getExamStatusText(status) {
    const statusMap = {
        'draft': '草稿',
        'published': '已发布',
        'ongoing': '进行中',
        'finished': '已结束'
    };
    return statusMap[status] || '未知';
}

function getExamActionButtons(exam) {
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (exam.status === 'published' && now >= startTime && now <= endTime) {
        return `
            <button class="btn btn-primary" onclick="startExam('${exam.id}')">
                <i class="fas fa-play"></i> 开始考试
            </button>
        `;
    } else if (exam.status === 'finished' || now > endTime) {
        return `
            <button class="btn btn-secondary" onclick="viewExamResult('${exam.id}')">
                <i class="fas fa-chart-bar"></i> 查看成绩
            </button>
        `;
    } else {
        return `
            <button class="btn btn-secondary" disabled>
                <i class="fas fa-clock"></i> 未开始
            </button>
        `;
    }
}

// 下载资料
async function downloadMaterial(materialId, fileName) {
    try {
        const response = await fetch(`/api/student/material/${materialId}/download`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification('文件下载成功', 'success');
        } else {
            showNotification('文件下载失败', 'error');
        }
        
    } catch (error) {
        console.error('下载文件失败:', error);
        showNotification('文件下载失败，请重试', 'error');
    }
}

// 开始考试
function startExam(examId) {
    showNotification('考试功能正在开发中...', 'info');
}

// 查看考试成绩
function viewExamResult(examId) {
    showNotification('成绩查看功能正在开发中...', 'info');
}

// 全局变量
let currentCourseDetail = null;

// 退出课程
async function dropCourse(courseId) {
    try {
        // 检查用户是否已登录
        if (!currentUser || !currentUser.userId) {
            showNotification('请先登录', 'error');
            return;
        }
        
        const confirmed = await showConfirmModal(
            '退出课程',
            '确定要退出这门课程吗？退出后将无法查看课程内容。',
            'fas fa-user-minus',
            'warning'
        );
        if (!confirmed) return;
        
        showLoading('正在退出课程...');
        
        const response = await fetch('/api/student/courses/drop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                userId: currentUser.userId,
                courseId: courseId 
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('成功退出课程', 'success');
            // 刷新我的课程列表
            refreshMyCourses();
        } else {
            showNotification(result.message || '退出课程失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('退出课程失败:', error);
        showNotification('退出课程失败，请重试', 'error');
    }
}

// 显示确认弹窗
function showConfirmModal(title, message, icon = 'fas fa-question-circle', type = 'primary') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleElement = document.getElementById('confirm-modal-title');
        const messageElement = document.getElementById('confirm-modal-message');
        const iconElement = document.getElementById('confirm-modal-icon');
        const confirmBtn = document.getElementById('confirm-modal-confirm');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        
        // 设置内容
        titleElement.textContent = title;
        messageElement.textContent = message;
        iconElement.innerHTML = `<i class="${icon}"></i>`;
        
        // 设置按钮样式 - 确定按钮始终使用主色调
        confirmBtn.className = 'course-btn course-btn-primary';
        confirmBtn.innerHTML = '<i class="fas fa-check"></i><span>确定</span>';
        
        // 设置弹窗类型样式
        modal.className = 'course-modal-overlay';
        if (type !== 'primary') {
            modal.classList.add(type);
        }
        
        // 显示弹窗
        modal.style.display = 'flex';
        
        // 处理确认
        const handleConfirm = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(true);
        };
        
        // 处理取消
        const handleCancel = () => {
            modal.style.display = 'none';
            cleanup();
            resolve(false);
        };
        
        // 清理事件监听器
        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleModalClick);
            document.removeEventListener('keydown', handleKeyDown);
        };
        
        // 点击背景关闭
        const handleModalClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
        
        // ESC键关闭
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // 添加事件监听器
        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleModalClick);
        document.addEventListener('keydown', handleKeyDown);
    });
}

// 更新学习控制面板数据
async function updateDashboardStats() {
    try {
        // 检查用户是否已登录
        if (!currentUser || !currentUser.userId) {
            console.log('updateDashboardStats - 用户未登录');
            return;
        }

        // 获取我的课程数据
        const response = await fetch(`/api/student/my-courses?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            const myCourses = result.data || [];
            
            // 更新已选课程数量
            const courseCountElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
            if (courseCountElement) {
                courseCountElement.textContent = myCourses.length;
            }
            
            // 计算平均学习进度（这里暂时设为0，后续可以根据实际需求计算）
            const progressElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
            if (progressElement) {
                progressElement.textContent = '0%';
            }
            
            // 待完成作业数量（暂时设为0，后续可以根据实际需求计算）
            const homeworkElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
            if (homeworkElement) {
                homeworkElement.textContent = '0';
            }
            
            // 平均成绩（暂时设为--，后续可以根据实际需求计算）
            const gradeElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
            if (gradeElement) {
                gradeElement.textContent = '--';
            }
            
            // 更新最近学习表格
            updateRecentCoursesTable(myCourses);
            
            // 更新最新通知显示
            await updateDashboardRecentNotices();
            
        } else {
            console.error('获取课程数据失败:', result.message);
        }
        
    } catch (error) {
        console.error('更新控制面板数据失败:', error);
    }
}

// 更新最近学习表格
function updateRecentCoursesTable(courses) {
    const tableBody = document.querySelector('.recent-courses-card tbody');
    if (!tableBody) return;
    
    if (courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>暂无学习记录</p>
                    <p>加入课程后这里会显示您的学习进度</p>
                </td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = courses.map(course => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="course-avatar" style="width: 40px; height: 40px; background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${course.name ? course.name.charAt(0) : 'C'}
                        </div>
                        <div>
                            <div style="font-weight: 500; color: var(--secondary-color);">${course.name || '未命名课程'}</div>
                            <div style="font-size: 12px; color: #7f8c8d;">${course.courseCode || 'N/A'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="progress-bar" style="width: 100%; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                        <div class="progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--primary-color), var(--accent-color)); transition: width 0.3s ease;"></div>
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">0%</div>
                </td>
                <td style="color: #7f8c8d; font-size: 14px;">暂无记录</td>
                <td>
                    <span class="status-badge" style="padding: 4px 8px; border-radius: 12px; font-size: 11px; background: #ecf0f1; color: #7f8c8d;">
                        暂无作业
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="enterCourse('${course.id}')" style="padding: 4px 12px; font-size: 12px;">
                        <i class="fas fa-play"></i> 开始学习
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

// ==================== 在线学习助手功能 ====================

let helperCourses = [];
let helperMaterials = [];
let chatHistory = [];
let isAIResponding = false;

// 初始化学习助手
function initializeHelper() {
    loadHelperCourses();
    setupChatInput();
}

// 加载学生课程列表
async function loadHelperCourses() {
    try {
        const response = await fetch('http://localhost:8080/api/ai-helper/courses', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            helperCourses = result.data || [];
            updateCourseSelect();
        } else {
            console.error('加载课程列表失败:', result.message);
            showNotification('加载课程列表失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('加载课程列表失败:', error);
        showNotification('加载课程列表失败，请检查网络连接', 'error');
    }
}

// 更新课程选择下拉框
function updateCourseSelect() {
    const courseSelect = document.getElementById('helper-course-select');
    if (!courseSelect) return;
    
    courseSelect.innerHTML = '<option value="">请选择课程</option>';
    
    helperCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} (${course.code})`;
        courseSelect.appendChild(option);
    });
}

// 课程选择变化事件
async function onCourseChange() {
    const courseSelect = document.getElementById('helper-course-select');
    const materialSelect = document.getElementById('helper-material-select');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    const courseId = courseSelect.value;
    
    if (courseId) {
        // 启用资料选择和聊天功能
        materialSelect.disabled = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        
        // 加载课程资料
        await loadCourseMaterials(courseId);
        
        // 更新状态
        updateHelperStatus('ready', '准备就绪');
        
        // 添加课程选择消息到聊天历史
        const selectedCourse = helperCourses.find(c => c.id == courseId);
        if (selectedCourse) {
            addSystemMessage(`已选择课程：${selectedCourse.name} (${selectedCourse.code})`);
        }
    } else {
        // 禁用相关功能
        materialSelect.disabled = true;
        materialSelect.innerHTML = '<option value="">请先选择课程</option>';
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        updateHelperStatus('ready', '请选择课程');
    }
}

// 加载课程资料
async function loadCourseMaterials(courseId) {
    try {
        const response = await fetch(`http://localhost:8080/api/ai-helper/materials/${courseId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            helperMaterials = result.data || [];
            updateMaterialSelect();
        } else {
            console.error('加载课程资料失败:', result.message);
            helperMaterials = [];
            updateMaterialSelect();
        }
    } catch (error) {
        console.error('加载课程资料失败:', error);
        helperMaterials = [];
        updateMaterialSelect();
    }
}

// 更新资料选择下拉框
function updateMaterialSelect() {
    const materialSelect = document.getElementById('helper-material-select');
    if (!materialSelect) return;
    
    materialSelect.innerHTML = '<option value="">选择资料（可选）</option>';
    
    helperMaterials.forEach(material => {
        const option = document.createElement('option');
        option.value = material.id;
        option.textContent = material.name;
        
        // 如果是"全部资料"选项，默认选中
        if (material.id === 0) {
            option.selected = true;
        }
        
        materialSelect.appendChild(option);
    });
}

// 设置聊天输入框
function setupChatInput() {
    const chatInput = document.getElementById('chat-input');
    if (!chatInput) return;
    
    // 回车发送消息
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 自动调整高度
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// 发送消息
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const courseSelect = document.getElementById('helper-course-select');
    const materialSelect = document.getElementById('helper-material-select');
    
    const message = chatInput.value.trim();
    const courseId = courseSelect.value;
    const materialId = materialSelect.value || null;
    
    if (!message) {
        showNotification('请输入您的问题', 'warning');
        return;
    }
    
    if (!courseId) {
        showNotification('请先选择课程', 'warning');
        return;
    }
    
    if (isAIResponding) {
        showNotification('AI正在思考中，请稍候...', 'info');
        return;
    }
    
    // 添加用户消息到聊天历史
    addUserMessage(message);
    
    // 清空输入框
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // 显示AI正在思考
    showTypingIndicator();
    updateHelperStatus('thinking', 'AI正在思考...');
    isAIResponding = true;
    
    try {
        const response = await fetch('http://localhost:8080/api/ai-helper/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                message: message,
                courseId: courseId,
                materialId: materialId
            })
        });
        
        const result = await response.json();
        
        // 隐藏打字指示器
        hideTypingIndicator();
        
        if (result.success) {
            addAIMessage(result.data.message);
            updateHelperStatus('ready', '准备就绪');
        } else {
            addAIMessage('抱歉，我暂时无法回答您的问题。错误信息：' + result.message);
            updateHelperStatus('error', '响应失败');
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        hideTypingIndicator();
        addAIMessage('抱歉，网络连接出现问题，请稍后再试。');
        updateHelperStatus('error', '网络错误');
    } finally {
        isAIResponding = false;
    }
}

// 添加用户消息
function addUserMessage(message) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message user-message';
    messageDiv.innerHTML = `
        <div class="user-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

// 添加AI消息
function addAIMessage(message) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <div class="ai-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            ${formatAIMessage(message)}
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

// 添加系统消息
function addSystemMessage(message) {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <div class="ai-avatar">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="message-content">
            <p style="color: #7f8c8d; font-style: italic;">${escapeHtml(message)}</p>
            <div class="message-time">${formatTime(new Date())}</div>
        </div>
    `;
    
    chatHistory.appendChild(messageDiv);
    scrollToBottom();
}

// 显示打字指示器
function showTypingIndicator() {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="ai-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatHistory.appendChild(typingDiv);
    scrollToBottom();
}

// 隐藏打字指示器
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 更新助手状态
function updateHelperStatus(status, text) {
    const statusElement = document.getElementById('helper-status');
    if (!statusElement) return;
    
    statusElement.className = `status-badge status-${status}`;
    statusElement.textContent = text;
}

// 格式化AI消息（支持简单的Markdown）
function formatAIMessage(message) {
    // 转义HTML
    let formatted = escapeHtml(message);
    
    // 处理换行
    formatted = formatted.replace(/\n/g, '<br>');
    
    // 处理粗体 **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 处理列表项 • 或 -
    formatted = formatted.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
    
    // 包装连续的列表项
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // 处理数字列表
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
    
    return `<div>${formatted}</div>`;
}

// 清空对话历史
function clearChatHistory() {
    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;
    
    if (confirm('确定要清空所有对话记录吗？')) {
        // 保留欢迎消息
        chatHistory.innerHTML = `
            <div class="welcome-message">
                <div class="ai-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <h4>👋 欢迎使用AI学习助手！</h4>
                    <p>我是您的专属学习伙伴，可以帮助您：</p>
                    <ul>
                        <li>📚 解答课程相关问题</li>
                        <li>📖 分析学习资料内容</li>
                        <li>💡 提供学习建议和指导</li>
                        <li>🔍 深入解释复杂概念</li>
                    </ul>
                    <p>请先选择课程，然后开始提问吧！</p>
                </div>
            </div>
        `;
        
        showNotification('对话记录已清空', 'success');
    }
}

// 滚动到底部
function scrollToBottom() {
    const chatHistory = document.getElementById('chat-history');
    if (chatHistory) {
        setTimeout(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }, 100);
    }
}

// 格式化时间
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载时初始化学习助手
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在学习助手页面
    if (document.getElementById('helper-course-select')) {
        initializeHelper();
    }
});