// 全局变量定义
let currentUser = null;
let allExams = [];
let allCourses = [];

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
        case 'student-helper':
            initializeHelper();
            break;
        case 'practice-eval':
            // 异步初始化考试页面
            setTimeout(() => initializeExamPage(), 100);
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
    const examsEmpty = document.getElementById('exams-empty');
    const examsContainer = document.getElementById('exams-container');
    
    if (!examsEmpty || !examsContainer) return;
    
    if (exams.length === 0) {
        examsEmpty.style.display = 'block';
        examsContainer.style.display = 'none';
        return;
    }
    
    examsEmpty.style.display = 'none';
    examsContainer.style.display = 'block';
    
    examsContainer.innerHTML = exams.map(exam => {
        const status = exam.examStatus || exam.status || 'UNKNOWN';
        const statusClass = getExamStatusClass(status);
        const statusText = getExamStatusText(status);
        
        return `
            <div class="exam-item" style="background: #fff; border: 1px solid #e9ecef; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div class="exam-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <div>
                        <h4 class="exam-title" style="margin: 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${exam.title}</h4>
                        <p style="margin: 4px 0 0 0; color: #7f8c8d; font-size: 14px;">${exam.description || '暂无描述'}</p>
                    </div>
                    <span class="exam-status ${statusClass}" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${statusText}</span>
                </div>
                <div class="exam-meta" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                    <div class="exam-meta-item" style="display: flex; align-items: center; gap: 8px; color: #6c757d; font-size: 14px;">
                        <i class="fas fa-clock" style="color: #3498db;"></i>
                        <span>时长: ${exam.duration || 0} 分钟</span>
                    </div>
                    <div class="exam-meta-item" style="display: flex; align-items: center; gap: 8px; color: #6c757d; font-size: 14px;">
                        <i class="fas fa-question-circle" style="color: #9b59b6;"></i>
                        <span>题目数: ${exam.totalQuestions || exam.questionCount || 0} 题</span>
                    </div>
                    <div class="exam-meta-item" style="display: flex; align-items: center; gap: 8px; color: #6c757d; font-size: 14px;">
                        <i class="fas fa-star" style="color: #f39c12;"></i>
                        <span>总分: ${exam.totalScore || 100} 分</span>
                    </div>
                    ${exam.remainingMinutes && exam.remainingMinutes > 0 ? `
                    <div class="exam-meta-item" style="display: flex; align-items: center; gap: 8px; color: #e74c3c; font-size: 14px; font-weight: 500;">
                        <i class="fas fa-hourglass-half" style="color: #e74c3c;"></i>
                        <span>剩余时间: ${Math.floor(exam.remainingMinutes / 60)}小时${exam.remainingMinutes % 60}分钟</span>
                    </div>
                    ` : ''}
                </div>
                <div class="exam-time-info" style="display: flex; gap: 20px; margin-bottom: 20px; font-size: 13px; color: #6c757d;">
                    <span><i class="fas fa-calendar-alt" style="margin-right: 5px;"></i>开始: ${formatDateTime(exam.startTime)}</span>
                    <span><i class="fas fa-calendar-times" style="margin-right: 5px;"></i>结束: ${formatDateTime(exam.endTime)}</span>
                </div>
                <div class="exam-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
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
        'UPCOMING': 'upcoming',
        'ONGOING': 'ongoing', 
        'FINISHED': 'finished',
        'EXPIRED': 'expired',
        'SUBMITTED': 'submitted'
    };
    return statusMap[status] || 'upcoming';
}

function getExamStatusText(status) {
    const statusMap = {
        'UPCOMING': '即将开始',
        'ONGOING': '进行中',
        'FINISHED': '已完成',
        'EXPIRED': '已过期',
        'SUBMITTED': '已提交'
    };
    return statusMap[status] || '未知';
}

function getExamActionButtons(exam) {
    const buttonStyle = 'padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; text-decoration: none; transition: all 0.2s;';
    const status = exam.examStatus || exam.status || 'UNKNOWN';
    
    switch(status) {
        case 'ONGOING':
            if (exam.hasSubmitted) {
        return `
                    <button class="btn" onclick="continueExam(${exam.id})" 
                            style="${buttonStyle} background: #f39c12; color: white;">
                        <i class="fas fa-play"></i> 继续考试
                    </button>
                `;
            } else {
                return `
                    <button class="btn" onclick="startExam(${exam.id})" 
                            style="${buttonStyle} background: #27ae60; color: white;">
                <i class="fas fa-play"></i> 开始考试
            </button>
        `;
            }
                case 'SUBMITTED':
        return `
                <button class="btn" onclick="viewExamResult(${exam.examResultId || exam.id})" 
                        style="${buttonStyle} background: #3498db; color: white;">
                    <i class="fas fa-file-alt"></i> 查看试卷
            </button>
        `;
        case 'UPCOMING':
        return `
                <button class="btn" disabled 
                        style="${buttonStyle} background: #95a5a6; color: white; cursor: not-allowed;">
                <i class="fas fa-clock"></i> 未开始
            </button>
        `;
        case 'EXPIRED':
            if (exam.hasSubmitted) {
                return `
                    <button class="btn" onclick="viewExamResult(${exam.examResultId || exam.id})" 
                            style="${buttonStyle} background: #3498db; color: white;">
                        <i class="fas fa-file-alt"></i> 查看试卷
                    </button>
                `;
            } else {
                return `
                    <button class="btn" disabled 
                            style="${buttonStyle} background: #e74c3c; color: white; cursor: not-allowed;">
                        <i class="fas fa-times"></i> 已过期
                    </button>
                `;
            }
        default:
            return `
                <button class="btn" disabled 
                        style="${buttonStyle} background: #bdc3c7; color: white; cursor: not-allowed;">
                    <i class="fas fa-question"></i> 未知状态
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

// 全局考试变量
let currentExam = null;
let examTimer = null;
let examStartTime = null;
let studentAnswers = {};

// 开始考试
async function startExam(examId) {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        showLoading('正在加载考试...');
        
        // 获取考试详情
        const examResponse = await fetch(`/api/student/exam/${examId}?userId=${userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const examResult = await examResponse.json();
        hideLoading();
        
        if (!examResult.success) {
            showNotification(examResult.message || '获取考试信息失败', 'error');
            return;
        }
        
        currentExam = examResult.data;
        
        // 确认开始考试
        const confirmed = await showConfirmModal(
            '开始考试',
            `确定要开始考试"${currentExam.title}"吗？考试开始后将开始计时，请确保网络连接稳定。`,
            'fas fa-play-circle',
            'primary'
        );
        
        if (!confirmed) return;
        
        // 调用开始考试API
        showLoading('正在开始考试...');
        const startResponse = await fetch(`/api/student/exam/${examId}/start?userId=${userId}`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const startResult = await startResponse.json();
        hideLoading();
        
        if (!startResult.success) {
            showNotification(startResult.message || '开始考试失败', 'error');
            return;
        }
        
        // 开始考试界面
        showExamModal();
        startExamTimer();
        
    } catch (error) {
        hideLoading();
        console.error('开始考试失败:', error);
        showNotification('开始考试失败，请重试', 'error');
    }
}

// 继续考试
async function continueExam(examId) {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        showLoading('正在加载考试...');
        
        const response = await fetch(`/api/student/exam/${examId}?userId=${userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (!result.success) {
            showNotification(result.message || '获取考试信息失败', 'error');
            return;
        }
        
        currentExam = result.data;
        showExamModal();
        startExamTimer();
        
    } catch (error) {
        hideLoading();
        console.error('继续考试失败:', error);
        showNotification('继续考试失败，请重试', 'error');
    }
}

// 显示考试模态框
function showExamModal() {
    const modal = document.getElementById('exam-modal');
    const titleElement = document.getElementById('exam-modal-title');
    const examTitleElement = document.getElementById('exam-title');
    const examDescriptionElement = document.getElementById('exam-description');
    const examTotalScoreElement = document.getElementById('exam-total-score');
    const examDurationElement = document.getElementById('exam-duration');
    const examQuestionCountElement = document.getElementById('exam-question-count');
    const questionsContainer = document.getElementById('exam-questions');
    const totalQuestionsElement = document.getElementById('total-questions');
    
    // 设置考试信息
    titleElement.textContent = `在线考试 - ${currentExam.title}`;
    examTitleElement.textContent = currentExam.title;
    examDescriptionElement.textContent = currentExam.description || '请认真答题，祝您考试顺利！';
    examTotalScoreElement.textContent = currentExam.totalScore || 100;
    examDurationElement.textContent = currentExam.duration || 90;
    examQuestionCountElement.textContent = currentExam.questions?.length || 0;
    totalQuestionsElement.textContent = currentExam.questions?.length || 0;
    
    // 渲染题目
    renderExamQuestions();
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置事件监听器
    setupExamEventListeners();
}

// 渲染考试题目
function renderExamQuestions() {
    const container = document.getElementById('exam-questions');
    if (!currentExam.questions || currentExam.questions.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">暂无题目</div>';
        return;
    }
    
    container.innerHTML = currentExam.questions.map((question, index) => {
        const questionNumber = index + 1;
        const questionTypeInfo = getQuestionTypeInfo(question);
        return `
            <div class="question-item" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <h5 style="margin: 0; color: #2c3e50; font-weight: 600;">第${questionNumber}题</h5>
                        <div style="padding: 4px 8px; background-color: #e8f4fd; border-radius: 4px; font-size: 12px; color: #2c5aa0;">${questionTypeInfo.displayName}</div>
                    </div>
                    <span style="color: #7f8c8d; font-size: 14px;">${question.score || 10}分</span>
                </div>
                <div class="question-content" style="margin-bottom: 15px;">
                    <p style="margin: 0; color: #34495e; line-height: 1.6; font-size: 15px;">${question.content}</p>
                </div>
                <div class="question-options">
                    ${renderQuestionOptions(question, questionNumber)}
                </div>
            </div>
        `;
    }).join('');
}

// 获取题目类型信息 - 与后端保持一致的标准化映射
function getQuestionTypeInfo(question) {
    const questionType = question.type ? question.type.toLowerCase() : '';
    const questionContent = question.content || '';
    const hasOptions = question.options && typeof question.options === 'string' && question.options.trim() !== '';
    
    console.log('题目类型分析:', {
        原始类型: question.type,
        题目内容: questionContent.substring(0, 50) + '...',
        有选项: hasOptions,
        选项内容: question.options ? (typeof question.options === 'string' ? question.options.substring(0, 100) + '...' : JSON.stringify(question.options)) : '无'
    });
    
    // 使用与后端一致的标准化映射
    let actualType = '';
    let displayName = '';
    
    // 统一映射到标准题型
    if (questionType.includes('choice') || questionType.includes('选择') || questionType.includes('单选') || questionType.includes('多选') || hasOptions) {
        actualType = 'choice';
        displayName = '选择题';
    } else if (questionType.includes('true_false') || questionType.includes('判断') || questionType.includes('true') || questionType.includes('false') || questionType.includes('对错')) {
        actualType = 'true_false';
        displayName = '判断题';
    } else if (questionType.includes('fill_blank') || questionType.includes('填空') || questionType.includes('fill') || questionType.includes('blank') || 
               questionContent.includes('___') || questionContent.includes('____')) {
        actualType = 'fill_blank';
        displayName = '填空题';
    } else if (questionType.includes('programming') || questionType.includes('编程') || questionType.includes('program') || questionType.includes('代码') || questionType.includes('code')) {
        actualType = 'programming';
        displayName = '编程题';
    } else if (questionType.includes('short_answer') || questionType.includes('简答') || questionType.includes('short')) {
        actualType = 'short_answer';
        displayName = '简答题';
    } else if (questionType.includes('calculation') || questionType.includes('计算') || questionType.includes('计算题')) {
        actualType = 'calculation';
        displayName = '计算题';
    } else if (questionType.includes('case_analysis') || questionType.includes('案例') || questionType.includes('case') || questionType.includes('分析')) {
        actualType = 'case_analysis';
        displayName = '案例分析题';
    } else if (questionType.includes('essay') || questionType.includes('解答') || questionType.includes('论述') || questionType.includes('answer')) {
        actualType = 'essay';
        displayName = '解答题';
    } else {
        // 默认判断
        actualType = 'essay';
        displayName = '解答题';
    }
    
    return {
        actualType: actualType,
        displayName: displayName
    };
}

// 渲染填空题
function renderFillBlankQuestion(question, savedAnswer) {
    // 检测题目中的空位标记（如 ___、____、_____等）
    const content = question.content || '';
    const blanks = content.match(/_{2,}/g) || []; // 匹配两个或更多下划线
    const blankCount = blanks.length;
    
    if (blankCount === 0) {
        // 如果没有检测到空位标记，提供一个通用输入框
        return `
            <input type="text" 
                   name="question_${question.id}" 
                   placeholder="请填入答案" 
                   value="${savedAnswer}"
                   onchange="saveAnswer(${question.id}, this.value)"
                   style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
        `;
    }
    
    // 如果有多个空位，为每个空位生成输入框
    const savedAnswers = savedAnswer ? savedAnswer.split('|') : [];
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    for (let i = 0; i < blankCount; i++) {
        const blankAnswer = savedAnswers[i] || '';
        html += `
            <div style="display: flex; align-items: center; gap: 10px;">
                <label style="min-width: 60px; color: #34495e; font-weight: 500;">第${i + 1}空:</label>
                <input type="text" 
                       name="question_${question.id}_blank_${i}" 
                       placeholder="请填入答案" 
                       value="${blankAnswer}"
                       onchange="saveFillBlankAnswer(${question.id}, ${i}, this.value)"
                       style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// 渲染题目选项
function renderQuestionOptions(question, questionNumber) {
    const savedAnswer = studentAnswers[question.id] || '';
    const typeInfo = getQuestionTypeInfo(question);
    const actualType = typeInfo.actualType;
    
    switch (actualType) {
        case 'choice':
            // 选择题处理
            console.log('处理选择题选项，原始数据:', question.options, '类型:', typeof question.options);
            
            let optionsArray = [];
            
            // 处理不同格式的选项数据
            if (question.options) {
                if (typeof question.options === 'string') {
                    try {
                        // 尝试解析JSON
                        optionsArray = JSON.parse(question.options);
                        console.log('JSON解析成功:', optionsArray);
                    } catch (e) {
                        // 如果不是JSON，按换行符分割
                        optionsArray = question.options.split('\n').filter(opt => opt.trim() !== '');
                        console.log('按换行符分割:', optionsArray);
                    }
                } else if (Array.isArray(question.options)) {
                    optionsArray = question.options;
                    console.log('直接使用数组:', optionsArray);
                }
            }
            
            // 检查是否有有效选项
            if (!optionsArray || optionsArray.length === 0) {
                console.log('没有找到有效选项');
                return `<div style="color: #f39c12;">该选择题缺少选项数据</div>`;
            }
            
            console.log('最终选项数组:', optionsArray);
            
            return optionsArray.map((option, optionIndex) => {
                // 清理选项文本，移除可能的A. B. C. D.前缀
                let cleanOption = option.trim();
                if (cleanOption.match(/^[A-Za-z][.）)]\s*/)) {
                    cleanOption = cleanOption.replace(/^[A-Za-z][.）)]\s*/, '');
                }
                
                const optionLabel = String.fromCharCode(65 + optionIndex); // A, B, C, D
                const isChecked = savedAnswer === optionLabel;
                return `
                    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                        <input type="radio" name="question_${question.id}" value="${optionLabel}" 
                               ${isChecked ? 'checked' : ''} 
                               onchange="saveAnswer(${question.id}, this.value)" 
                               style="margin-right: 8px;">
                        <span style="color: #34495e;">${optionLabel}. ${cleanOption}</span>
                    </label>
                `;
            }).join('');
            
        case 'true_false':
            // 判断题处理
            return `
                <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                    <input type="radio" name="question_${question.id}" value="正确" 
                           ${savedAnswer === '正确' ? 'checked' : ''} 
                           onchange="saveAnswer(${question.id}, this.value)" 
                           style="margin-right: 8px;">
                    <span style="color: #34495e;">正确</span>
                </label>
                <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                    <input type="radio" name="question_${question.id}" value="错误" 
                           ${savedAnswer === '错误' ? 'checked' : ''} 
                           onchange="saveAnswer(${question.id}, this.value)" 
                           style="margin-right: 8px;">
                    <span style="color: #34495e;">错误</span>
                </label>
            `;
            
        case 'fill_blank':
            // 填空题处理
            return renderFillBlankQuestion(question, savedAnswer);
            
        case 'short_answer':
        case 'programming':
        case 'calculation':
        case 'case_analysis':
        case 'essay':
        default:
            // 所有文本输入题型都使用统一的"请输入答案"提示
            let rows;
            switch (actualType) {
                case 'programming':
                    rows = 8;
                    break;
                case 'short_answer':
                    rows = 3;
                    break;
                case 'calculation':
                    rows = 4;
                    break;
                case 'case_analysis':
                    rows = 8;
                    break;
                default:
                    rows = 6;
            }
            
            return `
                <textarea name="question_${question.id}" 
                          placeholder="请输入答案" 
                          rows="${rows}" 
                          onchange="saveAnswer(${question.id}, this.value)"
                          style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; resize: vertical;">${savedAnswer}</textarea>
            `;
    }
}

// 保存单选答案
function saveAnswer(questionId, answer) {
    studentAnswers[questionId] = answer;
    updateAnsweredCount();
}

// 保存多选答案
function saveMultipleAnswer(questionId) {
    const checkboxes = document.querySelectorAll(`input[name="question_${questionId}"]:checked`);
    const answers = Array.from(checkboxes).map(cb => cb.value);
    studentAnswers[questionId] = answers.join(',');
    updateAnsweredCount();
}

// 保存填空题答案
function saveFillBlankAnswer(questionId, blankIndex, answer) {
    // 获取当前题目的所有空位答案
    const currentAnswer = studentAnswers[questionId] || '';
    const answers = currentAnswer ? currentAnswer.split('|') : [];
    
    // 确保数组长度足够
    while (answers.length <= blankIndex) {
        answers.push('');
    }
    
    // 更新指定空位的答案
    answers[blankIndex] = answer;
    
    // 保存更新后的答案（用|分隔多个空位的答案）
    studentAnswers[questionId] = answers.join('|');
    updateAnsweredCount();
}

// 更新已答题数量
function updateAnsweredCount() {
    const answeredCount = Object.keys(studentAnswers).filter(qId => {
        const answer = studentAnswers[qId];
        return answer && answer.trim() !== '';
    }).length;
    
    document.getElementById('answered-count').textContent = answeredCount;
}

// 开始考试计时器
function startExamTimer() {
    if (!currentExam) return;
    
    // 计算考试结束时间
    let endTime;
    if (currentExam.endTime) {
        // 如果有明确的结束时间，使用结束时间
        endTime = new Date(currentExam.endTime).getTime();
    } else if (currentExam.startTime && currentExam.duration) {
        // 如果有开始时间和时长，计算结束时间
        const startTime = new Date(currentExam.startTime).getTime();
        endTime = startTime + (currentExam.duration * 60 * 1000);
    } else {
        // 兜底：从当前时间开始计算
        endTime = new Date().getTime() + (currentExam.duration * 60 * 1000);
    }
    
    examTimer = setInterval(() => {
        const now = new Date().getTime();
        const remaining = endTime - now;
        
        if (remaining <= 0) {
            clearInterval(examTimer);
            showNotification('考试时间到，系统将自动提交', 'warning');
            setTimeout(() => submitExam(true), 2000); // 2秒后自动提交
            return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        const timerElement = document.getElementById('exam-timer');
        if (timerElement) {
            timerElement.textContent = `剩余时间：${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // 最后5分钟变红色警告
            if (remaining <= 5 * 60 * 1000) {
                timerElement.style.color = '#e74c3c';
                timerElement.style.fontWeight = 'bold';
            }
        }
    }, 1000);
}

// 设置考试事件监听器
function setupExamEventListeners() {
    // 暂存答案按钮
    document.getElementById('save-exam').onclick = () => saveExamAnswers();
    
    // 提交考试按钮
    document.getElementById('submit-exam').onclick = () => confirmSubmitExam();
    
    // 防止意外关闭
    window.addEventListener('beforeunload', (e) => {
        if (currentExam) {
            e.preventDefault();
            e.returnValue = '考试正在进行中，确定要离开吗？';
        }
    });
}

// 暂存答案
async function saveExamAnswers() {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        showLoading('正在保存答案...');
        
        const answers = Object.keys(studentAnswers).map(questionId => ({
            questionId: parseInt(questionId),
            answer: studentAnswers[questionId] || ''
        }));
        
        const response = await fetch(`/api/student/exam/save-answers?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                examId: currentExam.id,
                answers: answers
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showNotification('答案已暂存', 'success');
        } else {
            showNotification(result.message || '保存失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('保存答案失败:', error);
        showNotification('保存答案失败', 'error');
    }
}

// 确认提交考试
async function confirmSubmitExam() {
    const totalQuestions = currentExam.questions?.length || 0;
    const answeredCount = Object.keys(studentAnswers).filter(qId => {
        const answer = studentAnswers[qId];
        return answer && answer.trim() !== '';
    }).length;
    
    const unansweredCount = totalQuestions - answeredCount;
    let message = '确定要提交考试吗？提交后将无法修改答案。';
    
    if (unansweredCount > 0) {
        message += `\n\n注意：还有 ${unansweredCount} 题未作答。`;
    }
    
    const confirmed = await showConfirmModal(
        '提交考试',
        message,
        'fas fa-paper-plane',
        'warning'
    );
    
    if (confirmed) {
        submitExam(false);
    }
}

// 提交考试
async function submitExam(isAutoSubmit = false) {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        if (!isAutoSubmit) {
            showLoading('正在提交考试...');
        }
        
        // 清除计时器
        if (examTimer) {
            clearInterval(examTimer);
            examTimer = null;
        }
        
        const answers = Object.keys(studentAnswers).map(questionId => ({
            questionId: parseInt(questionId),
            answer: studentAnswers[questionId] || ''
        }));
        
        const response = await fetch(`/api/student/exam/submit?userId=${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                examId: currentExam.id,
                answers: answers
            })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            // 关闭考试模态框
            document.getElementById('exam-modal').style.display = 'none';
            
            // 重置考试状态
            currentExam = null;
            studentAnswers = {};
            
            // 显示提交成功消息
            showNotification(isAutoSubmit ? '考试已自动提交' : '考试提交成功', 'success');
            
            // 刷新考试列表
            if (currentCourseDetail) {
                loadCourseExams(currentCourseDetail.id);
            }
            
        } else {
            showNotification(result.message || '提交考试失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('提交考试失败:', error);
        showNotification('提交考试失败，请重试', 'error');
    }
}

// 查看考试成绩
async function viewExamResult(examResultId) {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        showLoading('正在加载考试结果...');
        
        const response = await fetch(`/api/student/exam-result/${examResultId}?userId=${userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (!result.success) {
            showNotification(result.message || '获取考试结果失败', 'error');
            return;
        }
        
        showExamResultModal(result.data);
        
    } catch (error) {
        hideLoading();
        console.error('查看考试结果失败:', error);
        showNotification('查看考试结果失败，请重试', 'error');
    }
}

// 显示考试结果模态框
function showExamResultModal(data) {
    // 保存考试数据供AI对话使用
    currentExamData = data;
    // 重置AI对话状态
    closeAIChat();
    
    const modal = document.getElementById('exam-result-modal');
    const examTitleElement = document.getElementById('result-exam-title');
    const submitTimeElement = document.getElementById('result-submit-time');
    const durationElement = document.getElementById('result-duration');
    const scoreElement = document.getElementById('result-score');
    const totalScoreElement = document.getElementById('result-total-score');
    const questionsContainer = document.getElementById('result-questions');
    
    const examResult = data.examResult;
    const exam = data.exam;
    const canViewPaper = data.canViewPaper;
    const viewMessage = data.viewMessage;
    const showAnswers = data.showAnswers;
    
    // 设置基本信息
    examTitleElement.textContent = exam.title || '考试';
    submitTimeElement.textContent = formatDateTime(examResult.submitTime);
    durationElement.textContent = examResult.durationMinutes || '-';
    // 根据成绩发布状态显示分数
    if (data.showFinalScore && data.score !== null) {
        scoreElement.textContent = data.score;
    } else {
        scoreElement.textContent = '待发布';
    }
    totalScoreElement.textContent = examResult.totalScore || 100;
    
    // 在成绩概览后添加教师评语（如果存在且成绩已发布）
    const resultSummary = document.querySelector('.result-summary');
    if (data.teacherComments && data.showFinalScore) {
        // 检查是否已经存在教师评语元素，避免重复添加
        const existingComments = document.getElementById('teacher-comments-section');
        if (existingComments) {
            existingComments.remove();
        }
        
        const teacherCommentsHtml = `
            <div id="teacher-comments-section" style="margin-top: 20px; padding: 15px; background: #fff8e1; border-left: 4px solid #ffc107; border-radius: 0 6px 6px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <i class="fas fa-comment-alt" style="color: #f57c00; margin-right: 8px;"></i>
                    <strong style="color: #ef6c00;">教师评语</strong>
                </div>
                <p style="margin: 0; color: #4a4a4a; line-height: 1.6; font-style: italic;">${data.teacherComments}</p>
            </div>
        `;
        resultSummary.insertAdjacentHTML('beforeend', teacherCommentsHtml);
    }
    
    // 检查是否可以查看试卷详情
    if (!canViewPaper) {
        questionsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <i class="fas fa-clock" style="font-size: 48px; color: #6c757d; margin-bottom: 20px;"></i>
                <h4 style="color: #495057; margin-bottom: 15px;">试卷暂未开放查看</h4>
                <p style="color: #6c757d; margin: 0; font-size: 16px;">${viewMessage}</p>
            </div>
        `;
    } else if (exam.questions && exam.questions.length > 0) {
        // 渲染题目结果
        questionsContainer.innerHTML = exam.questions.map((question, index) => {
            const questionNumber = index + 1;
            const studentAnswer = question.studentAnswer || '未作答';
            const studentScore = question.studentScore || 0;
            const maxScore = question.score || 10;
            // 修改正确与否的判断逻辑：满分即为正确，否则为错误
            const isCorrect = studentScore === maxScore;
            
            // 根据题目类型渲染选项
            let optionsHtml = '';
            if (question.options && question.options.length > 0) {
                optionsHtml = `
                    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px;">
                        <strong style="color: #495057; display: block; margin-bottom: 10px;">选项：</strong>
                        ${question.options.map((option, idx) => {
                            const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
                            const isSelected = studentAnswer.includes(optionLetter) || studentAnswer.includes(option);
                            const isCorrectOption = showAnswers && question.answer && (question.answer.includes(optionLetter) || question.answer.includes(option));
                            
                            let optionStyle = 'padding: 8px 12px; margin: 5px 0; border-radius: 4px; display: block;';
                            if (isSelected && isCorrectOption) {
                                optionStyle += ' background: #d4edda; border: 1px solid #c3e6cb; color: #155724;';
                            } else if (isSelected && !isCorrectOption) {
                                optionStyle += ' background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24;';
                            } else if (!isSelected && isCorrectOption && showAnswers) {
                                optionStyle += ' background: #cce5ff; border: 1px solid #99d1ff; color: #004085;';
                            } else {
                                optionStyle += ' background: #fff; border: 1px solid #dee2e6; color: #495057;';
                            }
                            
                            return `
                                <div style="${optionStyle}">
                                    ${optionLetter}. ${option}
                                    ${isSelected ? ' <i class="fas fa-check" style="color: #28a745;"></i>' : ''}
                                    ${!isSelected && isCorrectOption && showAnswers ? ' <i class="fas fa-star" style="color: #ffc107;"></i>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
            
            return `
                <div class="result-question-item" style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                    <div class="result-question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h5 style="margin: 0; color: #2c3e50;">第${questionNumber}题 (${getQuestionTypeDisplayName(question.type)})</h5>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="ai-help-btn" onclick="openAIChat(${index})" title="AI学习助手" 
                                    style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);"
                                    onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 8px rgba(102, 126, 234, 0.4)';"
                                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(102, 126, 234, 0.3)';">
                                <i class="fas fa-robot" style="color: white; font-size: 12px;"></i>
                            </button>
                            <span style="color: #7f8c8d; font-size: 14px;">得分：${studentScore}/${maxScore}分</span>
                            <span class="result-status" style="padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; ${isCorrect ? 'background: #d4edda; color: #155724;' : 'background: #f8d7da; color: #721c24;'}">
                                ${isCorrect ? '✓ 正确' : '✗ 错误'}
                            </span>
                        </div>
                    </div>
                    <div class="result-question-content" style="margin-bottom: 15px;">
                        <strong style="color: #495057; display: block; margin-bottom: 10px;">题目：</strong>
                        <p style="margin: 0; color: #34495e; line-height: 1.6;">${question.content}</p>
                    </div>
                    
                    ${optionsHtml}
                    
                    <div class="result-answer-section" style="margin-top: 15px;">
                        <div style="margin-bottom: 10px; padding: 10px; background: ${isCorrect ? '#f8fff8' : '#fff8f8'}; border-radius: 6px;">
                            <strong style="color: #2c3e50;">您的答案：</strong>
                            <span style="color: ${isCorrect ? '#27ae60' : '#e74c3c'}; font-weight: 500;">${studentAnswer}</span>
                        </div>
                        ${showAnswers && question.answer ? `
                        <div style="margin-bottom: 10px; padding: 10px; background: #e8f4fd; border-radius: 6px;">
                            <strong style="color: #2c3e50;">正确答案：</strong>
                            <span style="color: #0056b3; font-weight: 500;">${question.answer}</span>
                        </div>
                        ` : ''}
                        ${showAnswers && question.explanation ? `
                        <div style="padding: 10px; background: #f0f9ff; border-radius: 6px;">
                            <strong style="color: #2c3e50;">解析：</strong>
                            <p style="margin: 5px 0 0 0; color: #374151; line-height: 1.6;">${question.explanation}</p>
                        </div>
                        ` : ''}
                        ${data.showFinalScore && question.teacherFeedback ? `
                        <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 3px solid #ffc107;">
                            <strong style="color: #856404; display: flex; align-items: center;">
                                <i class="fas fa-user-tie" style="margin-right: 6px;"></i>
                                教师点评：
                            </strong>
                            <p style="margin: 5px 0 0 0; color: #6c5a00; line-height: 1.6; font-style: italic;">${question.teacherFeedback}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        questionsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #6c757d;">
                <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 15px;"></i>
                <p>暂无题目信息</p>
            </div>
        `;
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 设置关闭按钮事件
    document.getElementById('close-result-modal').onclick = () => {
        modal.style.display = 'none';
    };
}

// 获取题目类型显示名称
function getQuestionTypeDisplayName(type) {
    const typeMap = {
        'choice': '选择题',
        'single_choice': '单选题',
        'multiple_choice': '多选题',
        'true_false': '判断题',
        'fill_blank': '填空题',
        'short_answer': '简答题',
        'essay': '论述题',
        'calculation': '计算题',
        'case_analysis': '案例分析题',
        'programming': '编程题'
    };
    return typeMap[type] || type || '未知题型';
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
        if (!currentUser || !currentUser.userId) {
            console.error('用户信息不存在');
            return;
        }
        
        const response = await fetch(`/api/student/my-courses?userId=${currentUser.userId}`, {
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
        option.textContent = `${course.name} (${course.courseCode})`;
        courseSelect.appendChild(option);
    });
}

// RAG课程选择变化事件
async function onRAGCourseChange() {
    const courseSelect = document.getElementById('helper-course-select');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    const courseId = courseSelect.value;
    
    if (courseId) {
        // 启用聊天功能
        chatInput.disabled = false;
        sendButton.disabled = false;
        
        // 更新状态
        updateHelperStatus('ready', '准备就绪');
        
        // 添加课程选择消息到聊天历史
        const selectedCourse = helperCourses.find(c => c.id == courseId);
        if (selectedCourse) {
            addSystemMessage(`已选择课程：${selectedCourse.name} (${selectedCourse.courseCode})`);
        }
    } else {
        // 禁用相关功能
        chatInput.disabled = true;
        sendButton.disabled = true;
        
        updateHelperStatus('ready', '请选择课程');
    }
}



// 加载助手课程资料
async function loadHelperCourseMaterials(courseId) {
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
    
    // 回车发送消息，Shift+Enter换行
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter允许换行，不做任何处理
                return;
            } else {
                // 单独Enter键发送消息
            e.preventDefault();
                const message = this.value.trim();
                if (message) {
            sendMessage();
                }
            }
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
    
    const message = chatInput.value.trim();
    const courseId = courseSelect.value;
    const topK = 5; // 固定使用5个检索结果
    
    if (!message) {
        showNotification('请输入您的问题', 'warning');
        return;
    }
    
    if (!courseId) {
        showNotification('请先选择课程', 'warning');
        return;
    }
    
    if (!currentUser || !currentUser.userId) {
        showNotification('用户信息不存在，请重新登录', 'error');
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
        const response = await fetch('/api/student/learning-assistant/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                userId: currentUser.userId,
                courseId: courseId,
                question: message,
                topK: topK
            })
        });
        
        const result = await response.json();
        
        // 隐藏打字指示器
        hideTypingIndicator();
        
        if (result.success && result.data) {
            const ragData = result.data;
            
            // 添加AI回答
            addAIMessage(ragData.answer);
            
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

// 格式化AI消息（使用Marked.js解析Markdown）
function formatAIMessage(message) {
    try {
        // 配置Marked.js选项
        marked.setOptions({
            breaks: true,        // 支持换行
            gfm: true,          // 支持GitHub风格Markdown
            sanitize: false,    // 不过度清理HTML（我们信任AI的输出）
            smartLists: true,   // 智能列表处理
            smartypants: false  // 不转换引号
        });
        
        // 使用Marked.js解析Markdown
        const htmlContent = marked.parse(message);
        
        return `<div class="ai-message-content">${htmlContent}</div>`;
    } catch (error) {
        console.error('Markdown解析错误:', error);
        // 如果解析失败，回退到简单的HTML转义
        return `<div class="ai-message-content">${escapeHtml(message).replace(/\n/g, '<br>')}</div>`;
    }
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

// 获取当前学生用户ID
async function getCurrentUserId() {
    try {
        const response = await fetch('/api/auth/current-user', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const userData = result.data;
            if (userData.role === 'student') {
                // 后端API需要的是userId（User表的ID），不是studentId
                return userData.userId;
            }
        }
        throw new Error('未获取到有效的学生用户ID');
    } catch (error) {
        console.error('获取用户ID失败:', error);
        return null;
    }
}

// 页面加载时初始化学习助手
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否在学习助手页面
    if (document.getElementById('helper-course-select')) {
        initializeHelper();
    }
});

// ==================== 考试功能相关函数 ====================

// 初始化考试页面
async function initializeExamPage() {
    try {
        // 等待用户信息加载完成
        let retryCount = 0;
        while (!currentUser && retryCount < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retryCount++;
        }
        
        if (!currentUser) {
            throw new Error('用户信息未加载完成');
        }
        
        await loadAllExams();
        await loadCourseFilter();
        
        // 添加事件监听器
        setupExamPageEventListeners();
    } catch (error) {
        console.error('初始化考试页面失败:', error);
        showNotification('初始化考试页面失败', 'error');
    }
}

// 设置考试页面事件监听器
function setupExamPageEventListeners() {
    const courseFilter = document.getElementById('course-filter');
    const statusFilter = document.getElementById('status-filter');
    const searchInput = document.getElementById('exam-search-input');
    
    if (courseFilter) {
        courseFilter.addEventListener('change', filterExams);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterExams);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterExams);
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                searchExams();
            }
        });
    }
}

// 加载所有考试
async function loadAllExams() {
    try {
        showLoading('加载考试列表中...');
        
        // 获取当前用户ID
        if (!currentUser || !currentUser.userId) {
            throw new Error('用户未登录');
        }
        
        const response = await fetch(`/api/student/my-courses?userId=${currentUser.userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const coursesResult = await response.json();
        
        if (coursesResult.success) {
            allCourses = coursesResult.data;
            
            // 加载所有课程的考试
            const examPromises = allCourses.map(course => 
                fetch(`/api/student/courses/${course.id}/exams?userId=${currentUser.userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json())
            );
            
            const examResults = await Promise.all(examPromises);
            
            // 合并所有考试数据
            allExams = [];
            examResults.forEach((result, index) => {
                if (result.success && result.data) {
                    result.data.forEach(exam => {
                        exam.courseName = allCourses[index].name;
                        exam.courseCode = allCourses[index].courseCode;
                        exam.courseId = allCourses[index].id;
                        allExams.push(exam);
                    });
                }
            });
            
            displayStudentExams(allExams);
            updateExamCountBadge(allExams.length);
        } else {
            throw new Error(coursesResult.message || '加载课程失败');
        }
    } catch (error) {
        console.error('加载考试失败:', error);
        showNotification('加载考试列表失败', 'error');
        showStudentExamsEmpty('加载考试失败', '请检查网络连接后重试');
    } finally {
        hideLoading();
    }
}

// 加载课程筛选选项
function loadCourseFilter() {
    const courseFilter = document.getElementById('course-filter');
    if (!courseFilter) return;
    
    // 清空现有选项（保留默认选项）
    courseFilter.innerHTML = '<option value="">所有课程</option>';
    
    if (allCourses && allCourses.length > 0) {
        allCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.courseCode})`;
            courseFilter.appendChild(option);
        });
    }
}

// 刷新考试列表
async function refreshExamList() {
    await loadAllExams();
    await loadCourseFilter();
    
    // 重置筛选条件
    const searchInput = document.getElementById('exam-search-input');
    const courseFilter = document.getElementById('course-filter');
    const statusFilter = document.getElementById('status-filter');
    
    if (searchInput) searchInput.value = '';
    if (courseFilter) courseFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    
    showNotification('考试列表已刷新', 'success');
}

// 搜索考试
function searchExams() {
    filterExams();
}

// 筛选考试
function filterExams() {
    const searchText = document.getElementById('exam-search-input')?.value.toLowerCase() || '';
    const courseId = document.getElementById('course-filter')?.value || '';
    const status = document.getElementById('status-filter')?.value || '';
    
    let filteredExams = allExams.filter(exam => {
        // 搜索标题
        const titleMatch = exam.title.toLowerCase().includes(searchText);
        
        // 筛选课程
        const courseMatch = !courseId || exam.courseId.toString() === courseId;
        
        // 筛选状态
        const examStatus = exam.examStatus || exam.status;
        const statusMatch = !status || examStatus === status;
        
        return titleMatch && courseMatch && statusMatch;
    });
    
    displayStudentExams(filteredExams);
    updateExamCountBadge(filteredExams.length);
}

// 显示学生考试列表
function displayStudentExams(exams) {
    const emptyDiv = document.getElementById('student-exams-empty');
    const tableBody = document.getElementById('exam-table-body');
    const table = document.getElementById('exam-table');
    
    if (!tableBody) return;
    
    if (!exams || exams.length === 0) {
        showStudentExamsEmpty('暂无考试', '教师发布考试后会在这里显示');
        return;
    }
    
    // 隐藏空状态，显示表格
    if (emptyDiv) emptyDiv.style.display = 'none';
    if (table) table.style.display = 'table';
    
    // 生成表格行HTML
    tableBody.innerHTML = exams.map(exam => `
        <tr data-exam-id="${exam.id}">
            <td>
                <div class="course-name">${escapeHtml(exam.courseName || '')}</div>
                <div class="course-code">${escapeHtml(exam.courseCode || '')}</div>
            </td>
            <td>
                <div class="exam-title">${escapeHtml(exam.title || '')}</div>
                ${exam.description ? `<div class="exam-meta-info">${escapeHtml(exam.description)}</div>` : ''}
            </td>
            <td class="exam-meta-info">${exam.totalQuestions || 0} 题</td>
            <td class="exam-meta-info">${exam.startTime ? formatDateTime(exam.startTime) : (exam.publishedAt ? formatDateTime(exam.publishedAt) : '立即开始')}</td>
            <td class="exam-meta-info">${exam.duration || 0} 分钟</td>
            <td class="exam-meta-info">${exam.totalScore || 0} 分</td>
            <td>
                <span class="exam-status-badge exam-status-${(exam.examStatus || exam.status || 'unknown').toLowerCase()}">
                    ${getExamStatusText(exam.examStatus || exam.status)}
                </span>
            </td>
            <td>
                ${generateExamActionButtons(exam)}
            </td>
        </tr>
    `).join('');
}

// 生成考试操作按钮
function generateExamActionButtons(exam) {
    const status = exam.examStatus || exam.status || 'UNKNOWN';
    switch (status) {
        case 'UPCOMING':
            return `
                <button class="exam-action-btn btn-secondary" disabled>
                    <i class="fas fa-clock"></i>
                    等待开始
                </button>
            `;
        case 'ONGOING':
            if (exam.hasSubmitted) {
                // 已经有考试记录，显示继续考试
                return `
                    <button class="exam-action-btn btn-warning" onclick="continueExam(${exam.id})">
                        <i class="fas fa-play"></i>
                        继续考试
                    </button>
                `;
            } else {
                // 没有考试记录，显示开始考试
                return `
                    <button class="exam-action-btn btn-primary" onclick="startExam(${exam.id})">
                        <i class="fas fa-play"></i>
                        开始考试
                    </button>
                `;
            }
        case 'SUBMITTED':
            return `
                <button class="exam-action-btn btn-info" onclick="viewExamResult(${exam.examResultId || exam.id})">
                    <i class="fas fa-file-alt"></i>
                    查看试卷
                </button>
            `;
        case 'EXPIRED':
            if (exam.hasSubmitted) {
                return `
                    <button class="exam-action-btn btn-info" onclick="viewExamResult(${exam.examResultId || exam.id})">
                        <i class="fas fa-file-alt"></i>
                        查看试卷
                    </button>
                `;
            } else {
                return `
                    <button class="exam-action-btn btn-secondary" disabled>
                        <i class="fas fa-times"></i>
                        已过期
                    </button>
                `;
            }
        default:
            return `
                <button class="exam-action-btn btn-secondary" disabled>
                    <i class="fas fa-question"></i>
                    状态未知
                </button>
            `;
    }
}

// 显示考试空状态
function showStudentExamsEmpty(title, subtitle) {
    const emptyDiv = document.getElementById('student-exams-empty');
    const table = document.getElementById('exam-table');
    
    if (emptyDiv) {
        emptyDiv.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-clipboard-check" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>${escapeHtml(title)}</p>
                <p>${escapeHtml(subtitle)}</p>
            </div>
        `;
        emptyDiv.style.display = 'block';
    }
    
    if (table) {
        table.style.display = 'none';
    }
    
    updateExamCountBadge(0);
}

// 更新考试数量徽章
function updateExamCountBadge(count) {
    const badge = document.getElementById('exam-count-badge');
    if (badge) {
        badge.textContent = `${count} 个考试`;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// ================ AI对话相关功能 ================

// 全局变量
let currentExamData = null;
let currentQuestionIndex = -1;
let aiChatHistory = [];

// 打开AI对话
function openAIChat(questionIndex) {
    currentQuestionIndex = questionIndex;
    
    if (!currentExamData || !currentExamData.exam.questions) {
        showNotification('无法获取题目信息', 'error');
        return;
    }
    
    const question = currentExamData.exam.questions[questionIndex];
    if (!question) {
        showNotification('题目不存在', 'error');
        return;
    }
    
    // 显示AI对话面板
    const aiChatPanel = document.getElementById('ai-chat-panel');
    aiChatPanel.style.display = 'flex';
    
    // 更新当前题目信息
    const currentQuestionInfo = document.getElementById('current-question-info');
    const currentQuestionTitle = document.getElementById('current-question-title');
    
    currentQuestionInfo.style.display = 'block';
    currentQuestionTitle.textContent = `第${questionIndex + 1}题 (${getQuestionTypeDisplayName(question.type)})`;
    
    // 清空之前的对话并添加欢迎消息
    clearAIChatMessages();
    addAIChatMessage('AI', `您好！我是您的学习助手。您现在正在查看第${questionIndex + 1}题，有什么问题可以问我！`, 'ai');
    
    // 显示输入区域
    const aiInputArea = document.getElementById('ai-input-area');
    aiInputArea.style.display = 'block';
    
    // 更新状态
    const aiStatus = document.getElementById('ai-status');
    aiStatus.textContent = '正在为您服务...';
    
    // 设置事件监听器
    setupAIChatEventListeners();
    
    // 聚焦到输入框
    setTimeout(() => {
        const messageInput = document.getElementById('ai-message-input');
        if (messageInput) {
            messageInput.focus();
        }
    }, 100);
}

// 关闭AI对话
function closeAIChat() {
    const aiChatPanel = document.getElementById('ai-chat-panel');
    aiChatPanel.style.display = 'none';
    
    // 隐藏题目信息和输入区域
    document.getElementById('current-question-info').style.display = 'none';
    document.getElementById('ai-input-area').style.display = 'none';
    
    // 重置状态
    const aiStatus = document.getElementById('ai-status');
    aiStatus.textContent = '点击题目旁的机器人按钮开始对话';
    
    // 清空当前题目索引
    currentQuestionIndex = -1;
}

// 设置AI对话事件监听器
function setupAIChatEventListeners() {
    // 移除旧的事件监听器
    const closeBtn = document.getElementById('close-ai-chat');
    const sendBtn = document.getElementById('send-ai-message');
    const messageInput = document.getElementById('ai-message-input');
    
    // 关闭按钮
    closeBtn.removeEventListener('click', closeAIChat);
    closeBtn.addEventListener('click', closeAIChat);
    
    // 发送按钮
    sendBtn.removeEventListener('click', sendAIMessage);
    sendBtn.addEventListener('click', sendAIMessage);
    
    // 输入框回车键
    messageInput.removeEventListener('keypress', handleAIInputKeyPress);
    messageInput.addEventListener('keypress', handleAIInputKeyPress);
}

// 处理输入框回车键
function handleAIInputKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendAIMessage();
    }
}

// 发送AI消息
async function sendAIMessage() {
    const messageInput = document.getElementById('ai-message-input');
    const userMessage = messageInput.value.trim();
    
    if (!userMessage) {
        showNotification('请输入您的问题', 'warning');
        return;
    }
    
    if (currentQuestionIndex < 0 || !currentExamData) {
        showNotification('请先选择题目', 'error');
        return;
    }
    
    const question = currentExamData.exam.questions[currentQuestionIndex];
    
    // 清空输入框
    messageInput.value = '';
    
    // 添加用户消息
    addAIChatMessage('User', userMessage, 'user');
    
    // 显示AI正在思考
    showAIThinking();
    
    try {
        // 调用后端AI接口
        const response = await fetch('/api/student/ai-question-help', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                questionContent: question.content,
                questionType: question.type,
                options: question.options || null,
                correctAnswer: question.answer || null,
                explanation: question.explanation || null,
                userQuestion: userMessage,
                chatHistory: aiChatHistory.slice(-6) // 只发送最近6条对话记录
            })
        });
        
        const result = await response.json();
        
        // 隐藏思考状态
        hideAIThinking();
        
        if (result.success) {
            // 添加AI回复
            addAIChatMessage('AI', result.data.response, 'ai');
            
            // 保存对话历史
            aiChatHistory.push({
                role: 'user',
                content: userMessage
            });
            aiChatHistory.push({
                role: 'assistant',
                content: result.data.response
            });
            
            // 限制历史记录长度
            if (aiChatHistory.length > 20) {
                aiChatHistory = aiChatHistory.slice(-20);
            }
        } else {
            addAIChatMessage('System', '抱歉，AI助手暂时无法回答您的问题，请稍后再试。', 'system');
            showNotification(result.message || 'AI回复失败', 'error');
        }
        
    } catch (error) {
        console.error('AI对话错误:', error);
        hideAIThinking();
        addAIChatMessage('System', '网络连接异常，请检查网络后重试。', 'system');
        showNotification('网络异常，请重试', 'error');
    }
}

// 添加AI对话消息
function addAIChatMessage(sender, message, type) {
    const messagesContainer = document.getElementById('ai-chat-messages');
    
    // 如果是第一条消息，清空空状态
    const emptyState = messagesContainer.querySelector('[style*="text-align: center"]');
    if (emptyState) {
        emptyState.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-message-${type}`;
    
    const time = new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let avatarHtml = '';
    let messageStyle = '';
    let headerStyle = '';
    
    if (type === 'user') {
        avatarHtml = '<div style="width: 32px; height: 32px; border-radius: 50%; background: #007bff; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">我</div>';
        messageStyle = 'background: #007bff; color: white; margin-left: 8px; border-radius: 18px 18px 4px 18px;';
        headerStyle = 'justify-content: flex-end;';
    } else if (type === 'ai') {
        avatarHtml = '<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;"><i class="fas fa-robot" style="color: white; font-size: 14px;"></i></div>';
        messageStyle = 'background: #f1f3f4; color: #333; margin-right: 8px; border-radius: 18px 18px 18px 4px;';
        headerStyle = 'justify-content: flex-start;';
    } else {
        avatarHtml = '<div style="width: 32px; height: 32px; border-radius: 50%; background: #6c757d; display: flex; align-items: center; justify-content: center;"><i class="fas fa-info-circle" style="color: white; font-size: 14px;"></i></div>';
        messageStyle = 'background: #fff3cd; color: #856404; margin-right: 8px; border-radius: 18px 18px 18px 4px; border: 1px solid #ffeaa7;';
        headerStyle = 'justify-content: flex-start;';
    }
    
    messageDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px; ${headerStyle}">
            ${type !== 'user' ? avatarHtml : ''}
            <div style="max-width: 85%; display: flex; flex-direction: column;">
                <div style="padding: 10px 15px; ${messageStyle}">
                    ${formatAIMessageText(message)}
                </div>
                <div style="font-size: 11px; color: #7f8c8d; margin-top: 4px; ${type === 'user' ? 'text-align: right;' : ''}">${time}</div>
            </div>
            ${type === 'user' ? avatarHtml : ''}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    
    // 滚动到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 显示AI思考状态
function showAIThinking() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    
    const thinkingDiv = document.createElement('div');
    thinkingDiv.id = 'ai-thinking';
    thinkingDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-robot" style="color: white; font-size: 14px;"></i>
            </div>
            <div style="background: #f1f3f4; color: #333; margin-right: 8px; border-radius: 18px 18px 18px 4px; padding: 10px 15px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>正在思考</span>
                    <div style="display: flex; gap: 2px;">
                        <div style="width: 4px; height: 4px; border-radius: 50%; background: #667eea; animation: thinking-dot 1.4s infinite both; animation-delay: 0s;"></div>
                        <div style="width: 4px; height: 4px; border-radius: 50%; background: #667eea; animation: thinking-dot 1.4s infinite both; animation-delay: 0.2s;"></div>
                        <div style="width: 4px; height: 4px; border-radius: 50%; background: #667eea; animation: thinking-dot 1.4s infinite both; animation-delay: 0.4s;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(thinkingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // 添加动画样式
    if (!document.querySelector('#thinking-animation-style')) {
        const style = document.createElement('style');
        style.id = 'thinking-animation-style';
        style.textContent = `
            @keyframes thinking-dot {
                0%, 80%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 隐藏AI思考状态
function hideAIThinking() {
    const thinkingDiv = document.getElementById('ai-thinking');
    if (thinkingDiv) {
        thinkingDiv.remove();
    }
}

// 清空AI对话消息
function clearAIChatMessages() {
    const messagesContainer = document.getElementById('ai-chat-messages');
    messagesContainer.innerHTML = '';
    aiChatHistory = [];
}

// 格式化AI消息
function formatAIMessageText(message) {
    // 转换markdown格式到HTML
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/```(.*?)```/gs, '<pre style="background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; margin: 4px 0;"><code>$1</code></pre>')
        .replace(/`(.*?)`/g, '<code style="background: #f8f9fa; padding: 2px 4px; border-radius: 2px; font-family: monospace; font-size: 13px;">$1</code>');
}

// 在页面加载时初始化AI聊天功能
document.addEventListener('DOMContentLoaded', function() {
    // 监听考试结果模态框的关闭事件
    const modal = document.getElementById('exam-result-modal');
    if (modal) {
        const closeBtn = document.getElementById('close-result-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeAIChat();
                currentExamData = null;
            });
        }
    }
});