// 全局变量定义
let currentUser = null;
let allExams = [];
let allCourses = [];
let studentNotices = [];

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
async function showSection(sectionId) {
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
        case 'message-conversations':
            if (typeof refreshConversations === 'function') {
                refreshConversations();
            }
            if (typeof refreshUnreadCount === 'function') {
                refreshUnreadCount();
            }
            break;
        case 'message-new-chat':
            await initializeStudentNewChat();
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
            // 为了兼容性，添加userId字段
            if (currentUser.id && !currentUser.userId) {
                currentUser.userId = currentUser.id;
            }
            // 保存到全局变量
            window.currentUser = currentUser;
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
    document.querySelector('.user-name').textContent = currentUser.realName || currentUser.username;
    
    // 设置用户头像
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        if (currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '') {
            avatarElement.innerHTML = `<img src="${currentUser.avatarUrl}" alt="用户头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarElement.innerHTML = '<i class="fas fa-user-graduate"></i>';
        }
    }

    // 设置用户下拉菜单（改为CSS hover方式，无需JavaScript控制）
    // setupUserDropdown(); // 注释掉JavaScript控制，改用纯CSS

    // 设置全部通知弹窗
    setupAllNoticesModal();

    // 自动显示学习控制面板页面
    showSection('student-dashboard');
    
    // 设置默认活跃菜单项
    const dashboardMenuItem = document.querySelector('[data-section="student-dashboard"]') || 
                            document.querySelector('.menu-item:first-child');
    if (dashboardMenuItem) {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        dashboardMenuItem.classList.add('active');
    }
    
    // 确保学习控制面板内容始终可见
    ensureDashboardVisible();
    
    // 初始化控制面板数据（延迟一点确保用户信息已加载）
    setTimeout(() => {
        updateDashboardStats();
    }, 100);

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
    
    let closeTimer = null;
    let isHovering = false;
    
    // 初始化下拉菜单状态
    userDropdown.style.display = 'none';
    userDropdown.style.opacity = '0';
    userDropdown.style.visibility = 'hidden';
    userDropdown.style.transform = 'translateY(-10px)';
    
    // 显示下拉菜单的函数
    function showDropdown() {
        // 清除可能存在的关闭定时器
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
        
        userDropdown.style.display = 'block';
        setTimeout(() => {
            userDropdown.style.opacity = '1';
            userDropdown.style.visibility = 'visible';
            userDropdown.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // 隐藏下拉菜单的函数
    function hideDropdown() {
        userDropdown.style.opacity = '0';
        userDropdown.style.visibility = 'hidden';
        userDropdown.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            userDropdown.style.display = 'none';
        }, 200);
    }
    
    // 延时隐藏下拉菜单的函数
    function scheduleHide() {
        if (!isHovering) {
            closeTimer = setTimeout(() => {
                hideDropdown();
            }, 300); // 300ms延时，给用户足够时间操作
        }
    }
    
    // 点击用户配置文件切换下拉菜单
    userProfile.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        
        if (isVisible) {
            hideDropdown();
        } else {
            showDropdown();
        }
    });
    
    // 鼠标进入用户配置文件区域
    userProfile.addEventListener('mouseenter', function() {
        isHovering = true;
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
    });
    
    // 鼠标离开用户配置文件区域
    userProfile.addEventListener('mouseleave', function() {
        isHovering = false;
        if (userDropdown.style.display === 'block') {
            scheduleHide();
        }
    });
    
    // 鼠标进入下拉菜单区域
    userDropdown.addEventListener('mouseenter', function() {
        isHovering = true;
        if (closeTimer) {
            clearTimeout(closeTimer);
            closeTimer = null;
        }
    });
    
    // 鼠标离开下拉菜单区域
    userDropdown.addEventListener('mouseleave', function() {
        isHovering = false;
        scheduleHide();
    });
    
    // 点击页面其他地方关闭下拉菜单（但有延时）
    document.addEventListener('click', function(e) {
        // 检查点击的元素是否在用户菜单区域内
        if (!userProfile.contains(e.target) && !userDropdown.contains(e.target)) {
            if (userDropdown.style.display === 'block') {
                // 立即关闭，但如果鼠标在菜单区域内则延时关闭
                if (!isHovering) {
                    hideDropdown();
                } else {
                    scheduleHide();
                }
            }
        }
    });
    
    // 阻止下拉菜单内部点击事件冒泡
    userDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        // 点击菜单项后，给一个短暂延时然后关闭菜单
        if (e.target.closest('.dropdown-item')) {
            setTimeout(() => {
                hideDropdown();
            }, 100);
        }
    });
    
    // 键盘支持：按ESC键关闭下拉菜单
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && userDropdown.style.display === 'block') {
            hideDropdown();
        }
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
        
                    if (newPassword.length < 3) {
                showNotification('新密码至少需要3位', 'warning');
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
        
        // 调用获取我的课程的API，添加时间戳防止缓存
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/student/my-courses?userId=${currentUser.userId}&_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            const myCourses = result.data || [];
            
            // 验证课程数据的有效性
            const validCourses = myCourses.filter(course => 
                course && course.id && course.name && course.courseCode
            );
            
            console.log(`加载我的课程：原始${myCourses.length}个，有效${validCourses.length}个`);
        
            if (validCourses.length === 0) {
                grid.innerHTML = `
                    <div style="text-align: center; padding: 48px 0; color: #7f8c8d; grid-column: 1 / -1;">
                        <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                        <p>您还没有加入任何课程</p>
                        <p>请通过课程中心加入课程开始学习吧！</p>
                    </div>
                `;
            } else {
                displayMyCourses(validCourses);
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
        
        // 构建查询参数，添加时间戳防止缓存
        const params = new URLSearchParams();
        if (semester) params.append('semester', semester);
        if (teacherName) params.append('teacherName', teacherName);
        params.append('_t', new Date().getTime()); // 防止缓存
        
        const response = await fetch(`/api/student/courses/search?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            const courses = result.data || [];
            
            // 验证课程数据的有效性，过滤掉可能已删除的课程
            const validCourses = courses.filter(course => 
                course && course.id && course.name && course.courseCode && 
                course.teacher && course.teacher.realName
            );
            
            console.log(`搜索可用课程：原始${courses.length}个，有效${validCourses.length}个`);
            displayAvailableCourses(validCourses);
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
    
    // 加载并显示培养目标
    loadCourseTrainingObjectives(course.id);
    
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
            case 'knowledge-graph':
                loadCourseKnowledgeGraph(currentCourseDetail.id);
                break;
        }
    }
}

// 加载课程内容
async function loadCourseContent(courseId) {
    // 默认加载课程资料
    await loadCourseMaterials(courseId);
}

// 加载课程培养目标
async function loadCourseTrainingObjectives(courseId) {
    try {
        const container = document.getElementById('course-training-objectives');
        if (!container) return;
        
        // 显示加载状态
        const loadingElement = document.getElementById('training-objectives-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }
        
        const response = await fetch(`/api/student/courses/${courseId}/training-objectives`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCourseTrainingObjectives(result.data);
        } else {
            console.error('获取课程培养目标失败:', result.message);
            displayCourseTrainingObjectives(null);
        }
        
    } catch (error) {
        console.error('加载课程培养目标失败:', error);
        displayCourseTrainingObjectives(null);
    }
}

// 显示课程培养目标
function displayCourseTrainingObjectives(data) {
    const container = document.getElementById('course-training-objectives');
    if (!container) return;
    
    // 隐藏加载状态
    const loadingElement = document.getElementById('training-objectives-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    if (!data || !data.trainingObjectives) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                <i class="fas fa-target" style="font-size: 32px; margin-bottom: 12px; color: #bdc3c7;"></i>
                <p>教师暂未设置培养目标</p>
                <p style="font-size: 14px;">课程培养目标将在教师设置后显示</p>
            </div>
        `;
        return;
    }
    
    try {
        const objectives = JSON.parse(data.trainingObjectives);
        
        if (!objectives || objectives.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #7f8c8d;">
                    <i class="fas fa-target" style="font-size: 32px; margin-bottom: 12px; color: #bdc3c7;"></i>
                    <p>教师暂未设置培养目标</p>
                    <p style="font-size: 14px;">课程培养目标将在教师设置后显示</p>
                </div>
            `;
            return;
        }
        
        const objectivesHtml = objectives.map((objective, index) => `
            <div class="objective-display-item" style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; padding: 16px; background: white; border-radius: 8px; border-left: 4px solid #3498db; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div class="objective-number" style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 600; min-width: 24px; text-align: center; flex-shrink: 0;">
                    ${index + 1}
                </div>
                <div class="objective-text" style="flex: 1; font-size: 15px; color: #2c3e50; line-height: 1.6;">
                    ${objective}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="training-objectives-display" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <i class="fas fa-bullseye" style="color: #3498db; margin-right: 8px;"></i>
                    <h4 style="margin: 0; color: #2c3e50; font-size: 16px;">课程培养目标</h4>
                    <span style="margin-left: auto; background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${objectives.length} 项</span>
                </div>
                ${objectivesHtml}
                <div style="margin-top: 16px; padding: 12px; background: #e8f4fd; border-radius: 6px; border-left: 3px solid #3498db;">
                    <p style="margin: 0; font-size: 13px; color: #2c3e50;">
                        <i class="fas fa-lightbulb" style="color: #f39c12; margin-right: 6px;"></i>
                        <strong>提示：</strong>这些培养目标是课程的核心学习成果，建议在学习过程中重点关注这些方面的能力提升。
                    </p>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('解析培养目标数据失败:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 12px;"></i>
                <p>培养目标数据格式错误</p>
                <p style="font-size: 14px;">请联系教师检查培养目标设置</p>
            </div>
        `;
    }
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
        // 确保用户已登录
        if (!currentUser || !currentUser.userId) {
            console.error('用户信息不存在，无法加载考试');
            displayCourseExams([]);
            return;
        }

        const response = await fetch(`/api/student/courses/${courseId}/exams?userId=${currentUser.userId}`, {
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
        // 重新加载培养目标
        await loadCourseTrainingObjectives(currentCourseDetail.id);
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

        // 首先尝试加载系统通知
        const systemResponse = await fetch('/api/notices/system', {
            method: 'GET',
            credentials: 'include'
        });
        
        let systemNotices = [];
        if (systemResponse.ok) {
            const systemResult = await systemResponse.json();
            if (systemResult.success) {
                systemNotices = systemResult.data || [];
                console.log('📢 学生获取系统通知:', systemNotices.length, '条');
            }
        }
        
        // 尝试加载课程通知（如果API存在）
        let courseNotices = [];
        try {
            const courseResponse = await fetch(`/api/student/notices?userId=${currentUser.userId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (courseResponse.ok) {
                const courseResult = await courseResponse.json();
                if (courseResult.success) {
                    courseNotices = courseResult.data || [];
                    console.log('📚 学生获取课程通知:', courseNotices.length, '条');
                }
            }
        } catch (courseError) {
            console.log('课程通知API不存在或失败，仅显示系统通知');
        }
        
        // 合并系统通知和课程通知
        const allNotices = [...systemNotices, ...courseNotices];
        
        // 按创建时间排序
        allNotices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // 存储到全局变量
        studentNotices = allNotices;
        
        return allNotices;
        
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
            const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
                ? notice.scheduledTime 
                : notice.createdAt;
            const truncatedContent = notice.content.length > 80 ? notice.content.substring(0, 80) + '...' : notice.content;
            
            // 判断是系统通知还是课程通知
            const isSystemNotice = notice.targetType && (notice.targetType === 'ALL' || notice.targetType === 'STUDENT');
            const noticeType = isSystemNotice ? '系统通知' : (notice.courseName || '课程通知');
            const iconClass = isSystemNotice ? 'fas fa-bullhorn' : 'fas fa-book';
            const iconColor = isSystemNotice ? '#f39c12' : 'var(--primary-color)';
            
            return `
                <div class="recent-notice-card" onclick="viewStudentNoticeDetail(${notice.id})" style="cursor: pointer;">
                    <div class="recent-notice-header">
                        <div class="recent-notice-title">${notice.title}</div>
                        <div class="recent-notice-time">${formatPushTime(pushTime)}</div>
                    </div>
                    <div class="recent-notice-content">${truncatedContent}</div>
                    <div class="recent-notice-footer">
                        <div class="recent-notice-course">
                            <i class="${iconClass}" style="color: ${iconColor}; margin-right: 4px;"></i>
                            ${noticeType}
                        </div>
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
            const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
                ? notice.scheduledTime 
                : notice.createdAt;
            
            // 判断是系统通知还是课程通知
            const isSystemNotice = notice.targetType && (notice.targetType === 'ALL' || notice.targetType === 'STUDENT');
            const noticeType = isSystemNotice ? '系统通知' : '课程通知';
            const noticeSource = isSystemNotice ? getTargetTypeText(notice.targetType) : (notice.courseName || '未知课程');
            const iconClass = isSystemNotice ? 'fas fa-bullhorn' : 'fas fa-book';
            const iconColor = isSystemNotice ? '#f39c12' : '#5a67d8';
            
            return `
                <div class="notice-item" onclick="viewStudentNoticeDetail(${notice.id})" style="cursor: pointer; margin-bottom: 16px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: #fff; transition: box-shadow 0.2s ease;" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.boxShadow='none'">
                    <div class="notice-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <h4 class="notice-title" style="margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;">${notice.title}</h4>
                        <span class="notice-date" style="color: #7f8c8d; font-size: 12px; white-space: nowrap; margin-left: 16px;">${formatPushTime(pushTime)}</span>
                    </div>
                    <div class="notice-content" style="color: #34495e; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap;">${notice.content}</div>
                    <div class="notice-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #7f8c8d;">
                        <span class="notice-course" style="color: ${iconColor}; font-weight: 500;">
                            <i class="${iconClass}" style="margin-right: 4px;"></i>
                            ${noticeType}：${noticeSource}
                        </span>
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

// 查看学生通知详情
function viewStudentNoticeDetail(noticeId) {
    // 在全局变量中查找通知
    const notice = studentNotices.find(n => n.id === noticeId);
    
    if (!notice) {
        console.error('未找到通知:', noticeId);
        showNotification('通知不存在', 'error');
        return;
    }
    
    // 判断是系统通知还是课程通知
    const isSystemNotice = notice.targetType && (notice.targetType === 'ALL' || notice.targetType === 'STUDENT');
    const noticeType = isSystemNotice ? '系统通知' : '课程通知';
    const noticeSource = isSystemNotice ? getTargetTypeText(notice.targetType) : (notice.courseName || '未知课程');
    const iconClass = isSystemNotice ? 'fas fa-bullhorn' : 'fas fa-book';
    const iconColor = isSystemNotice ? '#f39c12' : '#5a67d8';
    
    const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime) 
        ? notice.scheduledTime 
        : notice.createdAt;
    
    // 创建弹窗内容
    const modalContent = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="closeNoticeDetailModal()">
            <div style="background: white; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; border-radius: 12px; padding: 0; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);" onclick="event.stopPropagation();">
                <div style="padding: 24px; border-bottom: 1px solid #e9ecef;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <h3 style="margin: 0; color: #2c3e50; font-size: 20px; font-weight: 600; flex: 1;">${notice.title}</h3>
                        <button onclick="closeNoticeDetailModal()" style="background: none; border: none; color: #7f8c8d; font-size: 20px; cursor: pointer; padding: 0; margin-left: 16px;">&times;</button>
                    </div>
                    <div style="display: flex; align-items: center; color: #7f8c8d; font-size: 14px; margin-bottom: 8px;">
                        <i class="fas fa-clock" style="margin-right: 6px;"></i>
                        <span>${formatPushTime(pushTime)}</span>
                    </div>
                    <div style="display: flex; align-items: center; color: ${iconColor}; font-size: 14px; font-weight: 500;">
                        <i class="${iconClass}" style="margin-right: 6px;"></i>
                        <span>${noticeType}：${noticeSource}</span>
                    </div>
                </div>
                <div style="padding: 24px;">
                    <div style="color: #34495e; line-height: 1.6; font-size: 16px; white-space: pre-wrap;">${notice.content}</div>
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid #e9ecef; text-align: right;">
                    <button onclick="closeNoticeDetailModal()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    // 插入弹窗到页面
    const modalElement = document.createElement('div');
    modalElement.id = 'notice-detail-modal';
    modalElement.innerHTML = modalContent;
    document.body.appendChild(modalElement);
    
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
}

// 关闭通知详情弹窗
function closeNoticeDetailModal() {
    const modal = document.getElementById('notice-detail-modal');
    if (modal) {
        modal.remove();
    }
    // 恢复页面滚动
    document.body.style.overflow = 'auto';
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
                // 已提交，显示查看试卷
                return `
                    <button class="btn" onclick="viewExamResult(${exam.examResultId || exam.id})" 
                            style="${buttonStyle} background: #3498db; color: white;">
                        <i class="fas fa-file-alt"></i> 查看试卷
                    </button>
                `;
            } else {
                // 检查是否有暂存的考试记录
                if (exam.examResultId) {
                    // 有考试记录但未提交，显示继续考试
        return `
                    <button class="btn" onclick="continueExam(${exam.id})" 
                            style="${buttonStyle} background: #f39c12; color: white;">
                        <i class="fas fa-play"></i> 继续考试
                    </button>
                `;
            } else {
                    // 没有考试记录，显示开始考试
                return `
                    <button class="btn" onclick="startExam(${exam.id})" 
                            style="${buttonStyle} background: #27ae60; color: white;">
                <i class="fas fa-play"></i> 开始考试
            </button>
        `;
                }
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
                        <h5 style="margin: 0; color: #2c3e50; font-weight: 600;">第${questionNumber}题
                    ${question.knowledgePoint ? `<span style="background: #e8f5e8; color: #2e7d32; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 6px;">知识点：${question.knowledgePoint}</span>` : ''}
                </h5>
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
    
    // 统一映射到标准题型 - 将大作业判断放在更前面，避免被其他类型误匹配
    if (questionType.includes('assignment') || questionType.includes('大作业') || questionType.includes('作业')) {
        actualType = 'assignment';
        displayName = '大作业题目';
    } else if (questionType.includes('choice') || questionType.includes('选择') || questionType.includes('单选') || questionType.includes('多选') || hasOptions) {
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

// 渲染大作业题目 - 文档上传
function renderAssignmentQuestion(question, savedAnswer) {
    const questionId = question.id;
    const uploadId = `assignment_upload_${questionId}`;
    const previewId = `assignment_preview_${questionId}`;
    
    // 检查是否已经上传了文件
    const hasUploadedFile = savedAnswer && savedAnswer.startsWith('FILE:');
    const fileName = hasUploadedFile ? savedAnswer.replace('FILE:', '') : '';
    
    return `
        <div class="assignment-upload-container" style="border: 2px solid #f39c12; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <i class="fas fa-upload" style="color: #f39c12; font-size: 18px;"></i>
                <h4 style="margin: 0; color: #d68910; font-weight: 600;">文档上传</h4>
                <span style="font-size: 12px; background: #f39c12; color: white; padding: 2px 6px; border-radius: 10px;">大作业</span>
            </div>
            
            <div style="margin-bottom: 15px; font-size: 14px; color: #856404; line-height: 1.5;">
                <i class="fas fa-info-circle"></i> 
                请根据作业要求完成相关文档并上传。支持格式：PDF、Word、Excel、PowerPoint、TXT、RTF、图片、压缩包等常见格式。
            </div>
            
            <div class="upload-area" style="border: 2px dashed #ddb84a; border-radius: 8px; padding: 20px; text-align: center; background: white; cursor: pointer; transition: all 0.3s ease;" 
                 onclick="document.getElementById('${uploadId}').click()"
                 onmouseover="this.style.borderColor='#f39c12'; this.style.backgroundColor='#fefbf0'"
                 onmouseout="this.style.borderColor='#ddb84a'; this.style.backgroundColor='white'">
                
                <input type="file" id="${uploadId}" 
                       style="display: none;" 
                       accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.jpg,.jpeg,.png,.zip,.rar"
                       onchange="handleAssignmentFileUpload(${questionId}, this)">
                
                <div id="${previewId}">
                    ${hasUploadedFile ? `
                        <div style="color: #27ae60;">
                            <i class="fas fa-file-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <p style="margin: 8px 0; font-weight: 600;">已上传文件</p>
                            <p style="margin: 0; font-size: 14px; color: #2c3e50;">${fileName}</p>
                            <div style="margin-top: 10px;">
                                <button type="button" onclick="document.getElementById('${uploadId}').click()" 
                                        style="background: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                                    <i class="fas fa-sync-alt"></i> 重新上传
                                </button>
                                <button type="button" onclick="removeAssignmentFile(${questionId})" 
                                        style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-trash"></i> 删除文件
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div style="color: #856404;">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                            <p style="margin: 8px 0; font-weight: 600;">点击上传文档</p>
                            <p style="margin: 0; font-size: 12px;">或拖拽文件到此区域</p>
                        </div>
                    `}
                </div>
            </div>
            
            <div style="margin-top: 12px; font-size: 12px; color: #856404;">
                <i class="fas fa-exclamation-triangle"></i> 
                注意：单个文件大小不超过50MB，提交后请等待AI分析和教师评分。
            </div>
        </div>
    `;
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
            
        case 'assignment':
            // 大作业题型处理 - 文档上传
            return renderAssignmentQuestion(question, savedAnswer);
            
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

// 处理大作业文件上传
async function handleAssignmentFileUpload(questionId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;
    
    // 验证文件大小（50MB限制）
    if (file.size > 50 * 1024 * 1024) {
        showNotification('文件大小不能超过50MB', 'error');
        fileInput.value = '';
        return;
    }
    
    // 验证文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
        showNotification('不支持的文件格式，请上传PDF、Word、Excel、PowerPoint、TXT、RTF、图片、压缩包等常见格式', 'error');
        fileInput.value = '';
        return;
    }
    
    try {
        showLoading('正在上传文档...');
        
        // 创建FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('questionId', questionId);
        formData.append('examId', currentExam.id);
        
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        formData.append('userId', userId);
        
        // 上传文件
        const response = await fetch('/api/student/assignment/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            // 保存上传成功的文件信息
            saveAnswer(questionId, `FILE:${file.name}`);
            
            // 更新上传区域显示
            updateAssignmentPreview(questionId, file.name, true);
            
            showNotification('文档上传成功', 'success');
        } else {
            showNotification(result.message || '文档上传失败', 'error');
            fileInput.value = '';
        }
        
    } catch (error) {
        hideLoading();
        console.error('文档上传失败:', error);
        showNotification('文档上传失败，请重试', 'error');
        fileInput.value = '';
    }
}

// 删除大作业文件
function removeAssignmentFile(questionId) {
    // 清空答案
    saveAnswer(questionId, '');
    
    // 更新预览区域
    updateAssignmentPreview(questionId, '', false);
    
    // 清空文件输入
    const fileInput = document.getElementById(`assignment_upload_${questionId}`);
    if (fileInput) {
        fileInput.value = '';
    }
    
    showNotification('文件已删除', 'info');
}

// 更新大作业预览区域
function updateAssignmentPreview(questionId, fileName, hasFile) {
    const previewId = `assignment_preview_${questionId}`;
    const uploadId = `assignment_upload_${questionId}`;
    const previewElement = document.getElementById(previewId);
    
    if (!previewElement) return;
    
    if (hasFile) {
        previewElement.innerHTML = `
            <div style="color: #27ae60;">
                <i class="fas fa-file-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                <p style="margin: 8px 0; font-weight: 600;">已上传文件</p>
                <p style="margin: 0; font-size: 14px; color: #2c3e50;">${fileName}</p>
                <div style="margin-top: 10px;">
                    <button type="button" onclick="document.getElementById('${uploadId}').click()" 
                            style="background: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                        <i class="fas fa-sync-alt"></i> 重新上传
                    </button>
                    <button type="button" onclick="removeAssignmentFile(${questionId})" 
                            style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-trash"></i> 删除文件
                    </button>
                </div>
            </div>
        `;
    } else {
        previewElement.innerHTML = `
            <div style="color: #856404;">
                <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 8px;"></i>
                <p style="margin: 8px 0; font-weight: 600;">点击上传文档</p>
                <p style="margin: 0; font-size: 12px;">或拖拽文件到此区域</p>
            </div>
        `;
    }
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
    
    // 退出考试按钮
    document.getElementById('exit-exam').onclick = () => confirmExitExam();
    
    // 防止意外关闭
    window.addEventListener('beforeunload', (e) => {
        if (currentExam) {
            e.preventDefault();
            e.returnValue = '考试正在进行中，确定要离开吗？';
        }
    });
}

// 确认退出考试
async function confirmExitExam() {
    const confirmed = await showConfirmModal(
        '退出考试',
        '确定要退出考试吗？\n\n注意：\n• 已答题目将被暂存\n• 可以稍后重新进入继续作答\n• 考试时间继续计时',
        'fas fa-sign-out-alt',
        'warning'
    );
    
    if (confirmed) {
        exitExam();
    }
}

// 退出考试
async function exitExam() {
    try {
        // 先暂存当前答案
        await saveExamAnswers(true); // 静默保存
        
        // 清除计时器
        if (examTimer) {
            clearInterval(examTimer);
            examTimer = null;
        }
        
        // 关闭考试模态框
        document.getElementById('exam-modal').style.display = 'none';
        
        // 重置考试状态
        currentExam = null;
        studentAnswers = {};
        
        // 显示退出成功消息
        showNotification('已退出考试，答案已暂存。您可以稍后继续考试。', 'info');
        
        // 刷新考试列表，显示可以继续的考试
        if (currentCourseDetail) {
            loadCourseExams(currentCourseDetail.id);
        }
        
    } catch (error) {
        console.error('退出考试失败:', error);
        showNotification('退出考试失败，请重试', 'error');
    }
}

// 暂存考试答案
async function saveExamAnswers(silent = false) {
    try {
        // 获取当前用户ID
        const userId = await getCurrentUserId();
        if (!userId) {
            if (!silent) showNotification('未获取到用户信息，请重新登录', 'error');
            return;
        }
        
        if (!silent) showLoading('正在暂存答案...');
        
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
        if (!silent) hideLoading();
        
        if (result.success) {
            if (!silent) showNotification('答案暂存成功', 'success');
        } else {
            if (!silent) showNotification(result.message || '暂存答案失败', 'error');
        }
        
    } catch (error) {
        if (!silent) hideLoading();
        console.error('暂存答案失败:', error);
        if (!silent) showNotification('暂存答案失败，请重试', 'error');
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
                        <h5 style="margin: 0; color: #2c3e50;">第${questionNumber}题 (${getQuestionTypeDisplayName(question.type)})
                    ${question.knowledgePoint ? `<span style="background: #e8f5e8; color: #2e7d32; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-left: 6px;">知识点：${question.knowledgePoint}</span>` : ''}
                </h5>
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

// 确保学习控制面板始终可见
function ensureDashboardVisible() {
    console.log('确保学习控制面板可见...');
    
    // 1. 确保学习控制面板section是可见的
    const dashboardSection = document.getElementById('student-dashboard');
    if (dashboardSection) {
        dashboardSection.classList.remove('hidden-section');
        console.log('学习控制面板section已显示');
    } else {
        console.error('找不到学习控制面板section');
    }
    
    // 2. 确保其他section都是隐藏的
    document.querySelectorAll('.main-section').forEach(section => {
        if (section.id !== 'student-dashboard') {
            section.classList.add('hidden-section');
        }
    });
    
    // 3. 确保菜单项状态正确
    const dashboardMenuItem = document.querySelector('[data-section="student-dashboard"]');
    if (dashboardMenuItem) {
        // 移除所有菜单项的活动状态
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        
        // 设置学习控制面板菜单为活动状态
        dashboardMenuItem.classList.add('active');
        console.log('学习控制面板菜单项已激活');
    }
    
    // 4. 显示默认的统计数据（防止完全空白）
    showDefaultDashboardContent();
}

// 显示默认的控制面板内容
function showDefaultDashboardContent() {
    console.log('显示默认控制面板内容...');
    
    // 确保统计卡片显示默认值
    const statCards = document.querySelectorAll('.stat-card .stat-value');
    if (statCards.length >= 4) {
        statCards[0].textContent = '0'; // 已选课程
        statCards[1].textContent = '0%'; // 学习进度
        statCards[2].textContent = '0'; // 待完成作业
        statCards[3].textContent = '--'; // 平均成绩
    }
    
    // 确保最近学习表格显示默认内容
    const tableBody = document.querySelector('.recent-courses-card tbody');
    if (tableBody && !tableBody.querySelector('tr')) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>暂无学习记录</p>
                    <p>加入课程后这里会显示您的学习进度</p>
                </td>
            </tr>
        `;
    }
    
    // 确保通知区域显示默认内容
    const noticesContainer = document.getElementById('recent-notices-container');
    if (noticesContainer && !noticesContainer.querySelector('.recent-notice-card')) {
        noticesContainer.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无新通知</p>
                <p>我们会在这里显示课程相关的最新通知</p>
            </div>
        `;
    }
    
    console.log('默认控制面板内容已显示');
}

// 更新学习控制面板数据
async function updateDashboardStats() {
    try {
        // 首先显示默认内容，确保页面不为空
        showDefaultDashboardContent();
        
        // 检查用户是否已登录
        if (!currentUser || !currentUser.userId) {
            console.log('updateDashboardStats - 用户未登录，显示默认内容');
            showNotification('用户信息加载中...', 'info');
            return;
        }

        // 获取控制面板统计数据
        const statsResponse = await fetch(`/api/student/dashboard/stats?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const statsResult = await statsResponse.json();
        
        if (statsResult.success) {
            const stats = statsResult.data;
            
            // 更新已选课程数量（保持不变）
            const courseCountElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
            if (courseCountElement) {
                courseCountElement.textContent = stats.myCourses || 0;
            }
            
            // 更新总考试数（学习进度改为总考试数）
            const examCountElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
            if (examCountElement) {
                examCountElement.textContent = stats.examCount || 0;
            }
            
            // 更新待参加考试数量（待完成作业改为待参加考试）
            const pendingExamElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
            if (pendingExamElement) {
                pendingExamElement.textContent = stats.pendingExams || 0;
            }
            
            // 更新平均成绩（实现平均成绩统计）
            const gradeElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
            if (gradeElement) {
                // 只有当平均成绩大于0且考试次数大于0时才显示分数
                if (stats.averageScore && stats.averageScore > 0 && stats.examCount > 0) {
                    gradeElement.textContent = Math.round(stats.averageScore * 10) / 10 + '分';
                } else {
                    gradeElement.textContent = '暂无成绩';
                }
            }
            
        } else {
            console.error('获取统计数据失败:', statsResult.message);
            showNotification('获取统计数据失败，显示默认内容', 'warning');
        }

        // 获取我的课程数据用于更新表格
        const coursesResponse = await fetch(`/api/student/my-courses?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const coursesResult = await coursesResponse.json();
        
        if (coursesResult.success) {
            const myCourses = coursesResult.data || [];
            
            // 更新最近学习表格
            await updateRecentCoursesTable(myCourses);
        }
        
        // 更新最新通知显示
        await updateDashboardRecentNotices();
        
        // 加载各科成绩分析
        await loadGradeAnalysis();
        
    } catch (error) {
        console.error('更新控制面板数据失败:', error);
        showNotification('网络连接异常，显示默认内容', 'error');
        // 确保即使网络错误也显示默认内容
        showDefaultDashboardContent();
    }
}

// 更新最近学习表格
async function updateRecentCoursesTable(courses) {
    const tableBody = document.querySelector('.recent-courses-card tbody');
    if (!tableBody) return;
    
    if (courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-book-open" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                    <p>暂无学习记录</p>
                    <p>加入课程后这里会显示您的学习进度</p>
                </td>
            </tr>
        `;
    } else {
        // 为每个课程获取详细数据
        const courseDetails = await Promise.all(courses.map(async (course) => {
            try {
                // 获取课程考试数量
                const examResponse = await fetch(`/api/student/courses/${course.id}/exams?userId=${currentUser.userId}`, {
                    method: 'GET',
                    credentials: 'include'
                });
                const examResult = await examResponse.json();
                const examCount = examResult.success ? examResult.data.length : 0;
                
                return {
                    ...course,
                    examCount
                };
            } catch (error) {
                console.error(`获取课程 ${course.id} 详细信息失败:`, error);
                return {
                    ...course,
                    examCount: 0
                };
            }
        }));
        
        tableBody.innerHTML = courseDetails.map(course => {
            // 处理教师信息
            const teacherName = course.teacher && course.teacher.realName ? course.teacher.realName : '未指定';
            const teacherInfo = course.teacher && course.teacher.title ? course.teacher.title : 
                               (course.teacher && course.teacher.department ? course.teacher.department : '教师');
            
            return `
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
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 32px; height: 32px; background: #f8f9fa; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user-tie" style="color: var(--primary-color); font-size: 14px;"></i>
                            </div>
                            <div>
                                <div style="font-weight: 500; color: var(--secondary-color); font-size: 14px;">${teacherName}</div>
                                <div style="font-size: 12px; color: #7f8c8d;">${teacherInfo}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="background: rgba(52, 152, 219, 0.1); padding: 6px 12px; border-radius: 16px; font-size: 14px; color: var(--primary-color); font-weight: 500;">
                                <i class="fas fa-file-alt" style="margin-right: 4px;"></i>
                                ${course.examCount} 个考试
                            </div>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="enterCourse('${course.id}')" style="padding: 4px 12px; font-size: 12px;">
                            <i class="fas fa-play"></i> 开始学习
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}



// ==================== 在线学习助手功能 ====================

let helperCourses = [];
let helperMaterials = [];
let chatHistory = [];
let isAIResponding = false;

// 简化的初始化学习助手
function initializeHelper() {
    console.log('初始化AI学习助手...');
    loadHelperCourses();
    
    // 简单的输入框回车事件
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }
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

// 简化的课程选择变化事件
function onRAGCourseChange() {
    const courseSelect = document.getElementById('helper-course-select');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    
    if (!courseSelect || !chatInput || !sendButton) {
        return;
    }
    
    const courseId = courseSelect.value;
    
    if (courseId) {
        // 启用聊天功能
        chatInput.disabled = false;
        sendButton.disabled = false;
        
        // 添加课程选择消息
        const chatHistory = document.getElementById('chat-history');
        if (chatHistory) {
            const selectedCourse = helperCourses.find(c => c.id == courseId);
            if (selectedCourse) {
                const systemMsg = document.createElement('div');
                systemMsg.className = 'chat-message system-message';
                systemMsg.innerHTML = `已选择课程：${selectedCourse.name} (${selectedCourse.courseCode})`;
                systemMsg.style.textAlign = 'center';
                systemMsg.style.fontStyle = 'italic';
                systemMsg.style.color = '#666';
                chatHistory.appendChild(systemMsg);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            }
        }
    } else {
        // 禁用相关功能
        chatInput.disabled = true;
        sendButton.disabled = true;
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
    const sendButton = document.getElementById('send-button');
    
    if (!chatInput) {
        console.error('setupChatInput: 找不到聊天输入框');
        return;
    }
    
    if (!sendButton) {
        console.error('setupChatInput: 找不到发送按钮');
        return;
    }
    
    console.log('setupChatInput: 开始设置聊天输入框和发送按钮');
    
    // 绑定发送按钮点击事件
    sendButton.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('发送按钮被点击');
        sendMessage();
    });
    
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
    
    console.log('setupChatInput: 聊天输入框和发送按钮设置完成');
}

// 快速访问AI学习助手
function openAIAssistant() {
    console.log('快速打开AI学习助手');
    showSection('student-helper');
    
    // 激活菜单项
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const helperMenuItem = document.querySelector('[data-section="student-helper"]');
    if (helperMenuItem) {
        helperMenuItem.classList.add('active');
    }
}

// 全局调试函数 - 检查AI学习助手状态
function debugAIAssistant() {
    console.log('=== AI学习助手调试信息 ===');
    
    // 检查当前用户
    console.log('当前用户:', currentUser);
    
    // 检查页面元素
    const elements = {
        'helper-course-select': document.getElementById('helper-course-select'),
        'chat-input': document.getElementById('chat-input'),
        'send-button': document.getElementById('send-button'),
        'chat-history': document.getElementById('chat-history')
    };
    
    console.log('页面元素状态:');
    Object.entries(elements).forEach(([name, element]) => {
        console.log(`- ${name}:`, element ? '存在' : '不存在');
        if (element) {
            console.log(`  - disabled: ${element.disabled}`);
            console.log(`  - visible: ${element.offsetParent !== null}`);
        }
    });
    
    // 检查section状态
    const helperSection = document.getElementById('student-helper');
    console.log('AI学习助手section:');
    console.log('- 存在:', helperSection ? '是' : '否');
    if (helperSection) {
        console.log('- 类名:', helperSection.className);
        console.log('- 是否隐藏:', helperSection.classList.contains('hidden-section'));
    }
    
    // 检查课程数据
    console.log('课程数据:', helperCourses);
    console.log('AI响应状态:', isAIResponding);
    
    console.log('=== 调试信息结束 ===');
}

// 快速访问AI学习助手
function openAIAssistant() {
    console.log('快速打开AI学习助手');
    showSection('student-helper');
    
    // 激活菜单项
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const helperMenuItem = document.querySelector('[data-section="student-helper"]');
    if (helperMenuItem) {
        helperMenuItem.classList.add('active');
    }
    
    // 延迟执行调试检查，确保DOM更新完成
    setTimeout(() => {
        debugAIAssistant();
    }, 100);
}

// 简单的发送消息处理函数
function handleSendMessage() {
    const chatInput = document.getElementById('chat-input');
    const courseSelect = document.getElementById('helper-course-select');
    
    if (!chatInput || !courseSelect) {
        alert('页面元素未找到');
        return;
    }
    
    const message = chatInput.value.trim();
    const courseId = courseSelect.value;
    
    if (!message) {
        alert('请输入消息');
        return;
    }
    
    if (!courseId) {
        alert('请选择课程');
        return;
    }
    
    // 调用实际的发送函数
    sendMessageToAI(message, courseId);
}

// 实际的发送消息函数
async function sendMessageToAI(message, courseId) {
    const chatInput = document.getElementById('chat-input');
    const chatHistory = document.getElementById('chat-history');
    
    // 添加用户消息到聊天历史
    if (chatHistory) {
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user-message';
        userMsg.innerHTML = `<strong>您:</strong> ${message}`;
        chatHistory.appendChild(userMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
    // 清空输入框
    chatInput.value = '';
    
    // 显示AI正在思考
    if (chatHistory) {
        const thinkingMsg = document.createElement('div');
        thinkingMsg.className = 'chat-message ai-message';
        thinkingMsg.id = 'thinking-indicator';
        thinkingMsg.innerHTML = '<strong>AI助手:</strong> 正在思考...';
        chatHistory.appendChild(thinkingMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }
    
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
                topK: 5
            })
        });
        
        const result = await response.json();
        
        // 移除思考指示器
        const thinkingIndicator = document.getElementById('thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
        
        // 添加AI回复
        if (chatHistory) {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message ai-message';
            if (result.success && result.data) {
                aiMsg.innerHTML = `<strong>AI助手:</strong> ${result.data.answer}`;
            } else {
                aiMsg.innerHTML = `<strong>AI助手:</strong> 抱歉，我暂时无法回答您的问题。错误信息：${result.message}`;
            }
            chatHistory.appendChild(aiMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
    } catch (error) {
        console.error('发送消息失败:', error);
        
        // 移除思考指示器
        const thinkingIndicator = document.getElementById('thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.remove();
        }
        
        // 显示错误消息
        if (chatHistory) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'chat-message ai-message';
            errorMsg.innerHTML = '<strong>AI助手:</strong> 抱歉，网络连接出现问题，请稍后再试。';
            chatHistory.appendChild(errorMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
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

// 获取当前用户信息
function getCurrentUser() {
    return window.currentUser;
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
                // 如果已经提交则不应该显示继续考试，这里可能是逻辑错误
                // hasSubmitted应该表示是否真正提交了（即考试完成）
                // 对于暂存的考试，后端应该返回hasSubmitted为false
                return `
                    <button class="exam-action-btn btn-info" onclick="viewExamResult(${exam.examResultId || exam.id})">
                        <i class="fas fa-file-alt"></i>
                        查看试卷
                    </button>
                `;
            } else {
                // 检查是否有考试记录（暂存状态）
                if (exam.examResultId) {
                    // 有考试记录但未提交，显示继续考试
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

// 获取通知对象文本
function getTargetTypeText(targetType) {
    switch (targetType) {
        case 'ALL':
            return '全体成员';
        case 'TEACHER':
            return '教师';
        case 'STUDENT':
            return '学生';
        default:
            return '未知';
    }
}

// ==================== 知识图谱功能 ====================

// 全局变量用于存储知识图谱实例
let knowledgeGraphInstance = null;
let knowledgeGraphData = null;

// 加载课程知识图谱
async function loadCourseKnowledgeGraph(courseId) {
    try {
        console.log('加载课程知识图谱:', courseId);
        
        // 显示加载状态
        showKnowledgeGraphLoading();
        
        // 调用后端API获取知识图谱数据
        const response = await fetch(`/api/student/courses/${courseId}/knowledge-graph`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('成功获取知识图谱数据:', result.data);
            knowledgeGraphData = result.data;
            renderRealKnowledgeGraph(result.data);
        } else {
            console.log('知识图谱数据为空或获取失败:', result.message);
            
            // 检查是否是因为没有知识库数据
            if (result.message && result.message.includes('暂无知识库数据')) {
                showKnowledgeGraphEmpty();
            } else {
                // 其他错误，显示模拟数据
                renderSimpleKnowledgeGraph();
            }
        }
        
    } catch (error) {
        console.error('加载知识图谱失败:', error);
        // API调用失败，显示模拟数据
        renderSimpleKnowledgeGraph();
    }
}

// 显示知识图谱加载状态
function showKnowledgeGraphLoading() {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'flex';
    if (emptyElement) emptyElement.style.display = 'none';
    if (canvasElement) canvasElement.style.display = 'none';
}

// 显示知识图谱空状态
function showKnowledgeGraphEmpty() {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'flex';
    if (canvasElement) canvasElement.style.display = 'none';
}

// 渲染知识图谱
function renderKnowledgeGraph(data) {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'none';
    if (canvasElement) canvasElement.style.display = 'block';
    
    // 这里实现实际的知识图谱渲染逻辑
    // 可以使用 D3.js、vis.js 或其他图形库
    renderActualKnowledgeGraph(data);
}

// 清理知识图谱事件监听器
function cleanupKnowledgeGraphListeners() {
    // 移除现有的全局事件监听器
    const canvas = document.getElementById('knowledge-graph-canvas');
    if (canvas) {
        const svg = canvas.querySelector('svg');
        if (svg) {
            svg.remove();
        }
    }
}

// 渲染真实的知识图谱数据
function renderRealKnowledgeGraph(data) {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'none';
    if (canvasElement) canvasElement.style.display = 'block';
    
    console.log('开始渲染真实知识图谱，数据:', data);
    
    try {
        // 清理现有内容和事件监听器
        cleanupKnowledgeGraphListeners();
        canvasElement.innerHTML = '';
        
        const nodes = data.nodes || [];
        const links = data.links || [];
        const stats = data.stats || {};
        
        // 创建简化的Canvas 2D渲染而非SVG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        const containerRect = canvasElement.getBoundingClientRect();
        const width = containerRect.width || 600;
        const height = containerRect.height || 600;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.cursor = 'pointer';
        ctx.scale(dpr, dpr);
        
        canvasElement.appendChild(canvas);
        
        // 计算节点布局
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = Math.min(width, height) / 600;
        
        // 处理节点位置
        const processedNodes = nodes.map(node => ({
            ...node,
            x: centerX + (node.x || 0) * scale,
            y: centerY + (node.y || 0) * scale,
            radius: Math.max(12, (node.size || 20) * scale * 0.5),
            originalX: node.x || 0,
            originalY: node.y || 0
        }));
        
        // 拖拽相关变量
        let isDragging = false;
        let draggedNode = null;
        let mouseX = 0;
        let mouseY = 0;
        let clickStartTime = 0;
        
        // 渲染函数
        function render() {
            // 清空画布
            ctx.clearRect(0, 0, width, height);
            
            // 绘制连接线
            links.forEach(link => {
                const sourceNode = processedNodes.find(n => n.id === link.source);
                const targetNode = processedNodes.find(n => n.id === link.target);
                
                if (sourceNode && targetNode) {
                    // 绘制连接线
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    
                    // 创建渐变
                    const gradient = ctx.createLinearGradient(
                        sourceNode.x, sourceNode.y, 
                        targetNode.x, targetNode.y
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
                    
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = Math.max(1.5, (link.weight || 1) * 0.8);
                    ctx.globalAlpha = 0.8;
                    ctx.stroke();
                }
            });
            
            // 绘制节点
            processedNodes.forEach(node => {
                const radius = node.radius;
                
                // 绘制外发光圈
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI);
                ctx.strokeStyle = node.color || '#3498db';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3;
                ctx.stroke();
                
                // 绘制背景圆圈
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.globalAlpha = 0.8;
                ctx.fill();
                
                // 绘制主节点
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                
                // 创建径向渐变
                const gradient = ctx.createRadialGradient(
                    node.x - radius * 0.3, node.y - radius * 0.3, 0,
                    node.x, node.y, radius
                );
                gradient.addColorStop(0, node.color || '#3498db');
                gradient.addColorStop(1, darkenColor(node.color || '#3498db', 0.3));
                
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 0.95;
                ctx.fill();
                
                // 绘制边框
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = node.type === 'course' ? 4 : 3;
                ctx.globalAlpha = 1;
                ctx.stroke();
                
                // 绘制图标
                ctx.fillStyle = '#fff';
                ctx.font = `${radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 1;
                
                if (node.type === 'course') {
                    ctx.fillText('📚', node.x, node.y);
                } else if (node.type === 'concept') {
                    ctx.fillText('💡', node.x, node.y);
                }
                
                // 绘制文本标签
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.max(12, 14 * scale)}px "Noto Sans SC", Arial, sans-serif`;
                ctx.fontWeight = node.type === 'course' ? 'bold' : '500';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                
                // 添加文字阴影效果
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                
                const label = node.label || node.id;
                const displayLabel = label.length > 10 ? label.substring(0, 10) + '...' : label;
                ctx.fillText(displayLabel, node.x, node.y + radius + 10);
                
                // 重置阴影
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            });
        }
        
        // 查找点击的节点
        function getNodeAt(x, y) {
            for (let i = processedNodes.length - 1; i >= 0; i--) {
                const node = processedNodes[i];
                const dx = x - node.x;
                const dy = y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= node.radius + 5) {
                    return node;
                }
            }
            return null;
        }
        
        // 获取鼠标位置
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        // 鼠标事件处理
        canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            mouseX = pos.x;
            mouseY = pos.y;
            clickStartTime = Date.now();
            
            const node = getNodeAt(pos.x, pos.y);
            if (node) {
                isDragging = false;
                draggedNode = node;
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const pos = getMousePos(e);
            
            if (draggedNode) {
                if (!isDragging && (Math.abs(pos.x - mouseX) > 3 || Math.abs(pos.y - mouseY) > 3)) {
                    isDragging = true;
                }
                
                if (isDragging) {
                    draggedNode.x = pos.x;
                    draggedNode.y = pos.y;
                    render();
                }
            } else {
                // 鼠标悬停效果
                const hoveredNode = getNodeAt(pos.x, pos.y);
                canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (draggedNode) {
                if (!isDragging && Date.now() - clickStartTime < 300) {
                    // 这是一次点击而非拖拽
                    console.log('点击节点:', draggedNode.label);
                    showNodeDetails(draggedNode);
                }
                
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'pointer';
            }
        });
        
        // 防止拖拽时离开画布导致的问题
        document.addEventListener('mouseup', () => {
            if (draggedNode) {
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'default';
            }
        });
        
        // 初始渲染
        render();
        
        // 添加图例
        addGraphLegend(canvasElement, stats);
        
        showNotification(`知识图谱加载成功！包含 ${nodes.length} 个知识点`, 'success');
        
    } catch (error) {
        console.error('渲染知识图谱失败:', error);
        showNotification('知识图谱渲染失败', 'error');
        // 渲染失败时显示模拟数据
        renderSimpleKnowledgeGraph();
    }
}

// 更新节点连接线
function updateNodeConnections(node, nodeX, nodeY, allNodes, centerX, centerY, scale) {
    const svg = document.querySelector('#knowledge-graph-canvas svg');
    if (!svg) return;
    
    const lines = svg.querySelectorAll('line');
    lines.forEach(line => {
        const sourceId = line.getAttribute('data-source');
        const targetId = line.getAttribute('data-target');
        
        if (sourceId === node.id) {
            // 当前节点是连接线的起点
            line.setAttribute('x1', nodeX);
            line.setAttribute('y1', nodeY);
            
            // 找到目标节点更新终点
            const targetNode = allNodes.find(n => n.id === targetId);
            if (targetNode) {
                line.setAttribute('x2', centerX + (targetNode.x || 0) * scale);
                line.setAttribute('y2', centerY + (targetNode.y || 0) * scale);
            }
        } else if (targetId === node.id) {
            // 当前节点是连接线的终点
            line.setAttribute('x2', nodeX);
            line.setAttribute('y2', nodeY);
            
            // 找到源节点更新起点
            const sourceNode = allNodes.find(n => n.id === sourceId);
            if (sourceNode) {
                line.setAttribute('x1', centerX + (sourceNode.x || 0) * scale);
                line.setAttribute('y1', centerY + (sourceNode.y || 0) * scale);
            }
        }
    });
}

// 获取连接线颜色
function getLineColor(linkType) {
    switch (linkType) {
        case 'contains':
            return '#3498db';
        case 'related':
            return '#95a5a6';
        case 'detail':
            return '#e74c3c';
        default:
            return '#bdc3c7';
    }
}

// 显示节点详情
function showNodeDetails(node) {
    console.log('显示节点详情:', node);
    
    // 移除现有的弹窗
    const existingPopup = document.querySelector('.knowledge-node-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    let details = `
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 24px; margin-right: 12px;">
                ${node.type === 'course' ? '📚' : node.type === 'concept' ? '💡' : '📖'}
            </div>
            <div>
                <h4 style="margin: 0; color: #2c3e50;">${node.label}</h4>
                <p style="margin: 4px 0 0 0; color: #7f8c8d; font-size: 14px;">${getNodeTypeText(node.type)}</p>
            </div>
        </div>
    `;
    
    if (node.frequency) {
        details += `
            <div style="margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #3498db;">
                <strong style="color: #2c3e50;">出现频率:</strong> 
                <span style="color: #3498db; font-weight: 600;">${node.frequency} 次</span>
            </div>
        `;
    }
    
    if (node.content) {
        details += `
            <div style="margin-bottom: 12px;">
                <strong style="color: #2c3e50;">内容预览:</strong>
                <div style="max-height: 150px; overflow-y: auto; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 13px; line-height: 1.5; margin-top: 8px; border: 1px solid #e9ecef;">
                    ${node.content}
                </div>
            </div>
        `;
    } else {
        // 为演示数据添加一些模拟内容
        const demoContent = getDemoContent(node.type, node.label);
        if (demoContent) {
            details += `
                <div style="margin-bottom: 12px;">
                    <strong style="color: #2c3e50;">详细说明:</strong>
                    <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 13px; line-height: 1.5; margin-top: 8px; border: 1px solid #e9ecef;">
                        ${demoContent}
                    </div>
                </div>
            `;
        }
    }
    
    // 创建高级的提示框
    const popup = document.createElement('div');
    popup.className = 'knowledge-node-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: none;
        border-radius: 12px;
        padding: 20px;
        max-width: 450px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: popupSlideIn 0.3s ease-out;
    `;
    
    popup.innerHTML = details + `
        <div style="display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end;">
            <button onclick="this.parentElement.parentElement.remove()" style="
                padding: 8px 16px; 
                background: #95a5a6; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s ease;
            " onmouseover="this.style.background='#7f8c8d'" onmouseout="this.style.background='#95a5a6'">
                关闭
            </button>
        </div>
    `;
    
    // 添加动画样式
    if (!document.querySelector('#popup-styles')) {
        const style = document.createElement('style');
        style.id = 'popup-styles';
        style.textContent = `
            @keyframes popupSlideIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            .knowledge-node-popup::-webkit-scrollbar {
                width: 6px;
            }
            
            .knowledge-node-popup::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }
            
            .knowledge-node-popup::-webkit-scrollbar-thumb {
                background: #bdc3c7;
                border-radius: 3px;
            }
            
            .knowledge-node-popup::-webkit-scrollbar-thumb:hover {
                background: #95a5a6;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(popup);
    
    // 5秒后自动关闭
    setTimeout(() => {
        if (popup.parentElement) {
            popup.style.animation = 'popupSlideOut 0.3s ease-in';
            setTimeout(() => popup.remove(), 300);
        }
    }, 5000);
    
    // 点击空白区域关闭
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    });
}

// 获取演示内容
function getDemoContent(type, label) {
    const contents = {
        'course': {
            '课程核心概念': '这是课程的核心概念，包含了该学科的基础理论框架和主要学习目标。通过学习核心概念，学生能够建立起对整个学科的整体认知。',
            '数学': '数学是研究数量、结构、变化、空间以及信息等概念的学科。它是自然科学的基础，也是许多其他学科的重要工具。',
            '物理': '物理学是研究物质运动最一般规律和物质基本结构的学科。它探索自然界的基本规律，从微观粒子到宏观宇宙。'
        },
        'concept': {
            '基础理论': '基础理论是学科知识体系的根基，包含了该领域的基本概念、定律和原理。掌握基础理论有助于深入理解专业知识。',
            '实践应用': '实践应用是理论知识在实际场景中的运用，通过实践能够加深对理论的理解，并培养解决实际问题的能力。',
            '相关技术': '相关技术是支撑学科发展的技术手段和工具，包括实验技术、计算技术、测量技术等。'
        },
        'detail': {
            '知识点 A': '这是一个重要的知识点，包含了具体的概念定义、应用方法和相关实例。学生需要通过理解、记忆和练习来掌握。',
            '知识点 B': '该知识点与其他概念密切相关，需要在理解的基础上进行综合应用。建议通过案例分析来深化理解。',
            '知识点 C': '这是一个核心知识点，在整个知识体系中占据重要地位。掌握该知识点有助于理解更高层次的概念。',
            '知识点 D': '该知识点具有实践性特点，需要结合实际操作来学习。建议通过实验或项目来加深理解。'
        }
    };
    
    return contents[type] && contents[type][label] ? contents[type][label] : null;
}

// 获取节点类型文本
function getNodeTypeText(type) {
    switch (type) {
        case 'course':
            return '课程';
        case 'concept':
            return '核心概念';
        case 'detail':
            return '详细知识点';
        default:
            return '未知';
    }
}

// 添加图例
function addGraphLegend(container, stats) {
    const legendDiv = document.createElement('div');
    legendDiv.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
        max-width: 200px;
    `;
    
    legendDiv.innerHTML = `
        <h5 style="margin: 0 0 8px 0; color: #2c3e50;">图谱信息</h5>
        <p style="margin: 2px 0;"><span style="color: #3498db;">●</span> 课程核心</p>
        <p style="margin: 2px 0;"><span style="color: #2ecc71;">●</span> 核心概念</p>
        <p style="margin: 2px 0;"><span style="color: #f39c12;">●</span> 重要概念</p>
        <p style="margin: 2px 0;"><span style="color: #9b59b6;">●</span> 一般概念</p>
        <p style="margin: 2px 0;"><span style="color: #34495e;">●</span> 详细知识点</p>
        <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
        <p style="margin: 2px 0; font-size: 11px;">知识块: ${stats.totalKnowledgeChunks || 0}</p>
        <p style="margin: 2px 0; font-size: 11px;">概念数: ${stats.extractedConcepts || 0}</p>
    `;
    
    container.appendChild(legendDiv);
}

// 渲染模拟知识图谱（新版本）
function renderMockKnowledgeGraph() {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'none';
    if (canvasElement) canvasElement.style.display = 'block';
    
    console.log('渲染模拟知识图谱');
    
    try {
        // 清理现有内容
        cleanupKnowledgeGraphListeners();
        canvasElement.innerHTML = '';
        
        // 创建模拟数据
        const mockNodes = [
            { id: 'course-1', label: currentCourseDetail?.name || '课程核心概念', type: 'course', x: 300, y: 200, radius: 35, color: '#667eea' },
            { id: 'concept-1', label: '基础理论', type: 'concept', x: 150, y: 300, radius: 25, color: '#56ab2f' },
            { id: 'concept-2', label: '实践应用', type: 'concept', x: 300, y: 300, radius: 25, color: '#f093fb' },
            { id: 'concept-3', label: '相关技术', type: 'concept', x: 450, y: 300, radius: 25, color: '#4facfe' },
            { id: 'detail-1', label: '知识点 A', type: 'detail', x: 100, y: 400, radius: 18, color: '#ffecd2' },
            { id: 'detail-2', label: '知识点 B', type: 'detail', x: 200, y: 400, radius: 18, color: '#a8edea' },
            { id: 'detail-3', label: '知识点 C', type: 'detail', x: 350, y: 400, radius: 18, color: '#fad0c4' },
            { id: 'detail-4', label: '知识点 D', type: 'detail', x: 450, y: 400, radius: 18, color: '#d299c2' }
        ];
        
        const mockLinks = [
            { source: 'course-1', target: 'concept-1', type: 'contains' },
            { source: 'course-1', target: 'concept-2', type: 'contains' },
            { source: 'course-1', target: 'concept-3', type: 'contains' },
            { source: 'concept-1', target: 'detail-1', type: 'detail' },
            { source: 'concept-1', target: 'detail-2', type: 'detail' },
            { source: 'concept-2', target: 'detail-3', type: 'detail' },
            { source: 'concept-3', target: 'detail-4', type: 'detail' }
        ];
        
        // 创建Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const containerRect = canvasElement.getBoundingClientRect();
        const width = containerRect.width || 600;
        const height = containerRect.height || 600;
        const dpr = window.devicePixelRatio || 1;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.cursor = 'pointer';
        ctx.scale(dpr, dpr);
        
        canvasElement.appendChild(canvas);
        
        // 拖拽相关变量
        let isDragging = false;
        let draggedNode = null;
        let mouseX = 0;
        let mouseY = 0;
        let clickStartTime = 0;
        
        // 渲染函数
        function render() {
            // 清空画布
            ctx.clearRect(0, 0, width, height);
            
            // 绘制背景渐变
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 绘制背景光斑
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(width * 0.2, height * 0.3, 30, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(width * 0.8, height * 0.7, 25, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(width * 0.6, height * 0.2, 20, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // 绘制连接线
            mockLinks.forEach(link => {
                const sourceNode = mockNodes.find(n => n.id === link.source);
                const targetNode = mockNodes.find(n => n.id === link.target);
                
                if (sourceNode && targetNode) {
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    
                    const lineGradient = ctx.createLinearGradient(
                        sourceNode.x, sourceNode.y,
                        targetNode.x, targetNode.y
                    );
                    lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                    lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
                    
                    ctx.strokeStyle = lineGradient;
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.8;
                    ctx.stroke();
                }
            });
            
            // 绘制节点
            mockNodes.forEach(node => {
                // 外发光圈
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 8, 0, 2 * Math.PI);
                ctx.strokeStyle = node.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
                
                // 背景圆圈
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius + 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.globalAlpha = 0.8;
                ctx.fill();
                
                // 主节点
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
                
                const nodeGradient = ctx.createRadialGradient(
                    node.x - node.radius * 0.3, node.y - node.radius * 0.3, 0,
                    node.x, node.y, node.radius
                );
                nodeGradient.addColorStop(0, node.color);
                nodeGradient.addColorStop(1, darkenColor(node.color, 0.3));
                
                ctx.fillStyle = nodeGradient;
                ctx.globalAlpha = 0.95;
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = node.type === 'course' ? 4 : 3;
                ctx.globalAlpha = 1;
                ctx.stroke();
                
                // 图标
                ctx.fillStyle = '#fff';
                ctx.font = `${node.radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.globalAlpha = 1;
                
                if (node.type === 'course') {
                    ctx.fillText('📚', node.x, node.y);
                } else if (node.type === 'concept') {
                    ctx.fillText('💡', node.x, node.y);
                } else {
                    ctx.fillText('📖', node.x, node.y);
                }
                
                // 文本标签
                ctx.fillStyle = '#fff';
                ctx.font = `${node.type === 'course' ? '16' : '14'}px "Noto Sans SC", Arial, sans-serif`;
                ctx.fontWeight = node.type === 'course' ? 'bold' : '500';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                
                // 添加文字阴影
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 2;
                
                ctx.fillText(node.label, node.x, node.y + node.radius + 10);
                
                // 重置阴影
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            });
        }
        
        // 查找点击的节点
        function getNodeAt(x, y) {
            for (let i = mockNodes.length - 1; i >= 0; i--) {
                const node = mockNodes[i];
                const dx = x - node.x;
                const dy = y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= node.radius + 5) {
                    return node;
                }
            }
            return null;
        }
        
        // 获取鼠标位置
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        // 鼠标事件处理
        canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            mouseX = pos.x;
            mouseY = pos.y;
            clickStartTime = Date.now();
            
            const node = getNodeAt(pos.x, pos.y);
            if (node) {
                isDragging = false;
                draggedNode = node;
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const pos = getMousePos(e);
            
            if (draggedNode) {
                if (!isDragging && (Math.abs(pos.x - mouseX) > 3 || Math.abs(pos.y - mouseY) > 3)) {
                    isDragging = true;
                }
                
                if (isDragging) {
                    draggedNode.x = pos.x;
                    draggedNode.y = pos.y;
                    render();
                }
            } else {
                const hoveredNode = getNodeAt(pos.x, pos.y);
                canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (draggedNode) {
                if (!isDragging && Date.now() - clickStartTime < 300) {
                    console.log('点击模拟节点:', draggedNode.label);
                    showNodeDetails(draggedNode);
                }
                
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'pointer';
            }
        });
        
        // 防止拖拽时离开画布导致的问题
        document.addEventListener('mouseup', () => {
            if (draggedNode) {
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'default';
            }
        });
        
        // 初始渲染
        render();
        
        // 添加简化的图例
        const legendData = {
            totalNodes: mockNodes.length,
            totalLinks: mockLinks.length,
            conceptCount: mockNodes.filter(n => n.type === 'concept').length,
            detailCount: mockNodes.filter(n => n.type === 'detail').length
        };
        
        addGraphLegend(canvasElement, legendData);
        
        showNotification('知识图谱渲染完成（演示数据）', 'info');
        
    } catch (error) {
        console.error('渲染模拟知识图谱失败:', error);
        showNotification('知识图谱渲染失败', 'error');
    }
}

// 渲染简化高性能知识图谱
function renderSimpleKnowledgeGraph() {
    const loadingElement = document.getElementById('knowledge-graph-loading');
    const emptyElement = document.getElementById('knowledge-graph-empty');
    const canvasElement = document.getElementById('knowledge-graph-canvas');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (emptyElement) emptyElement.style.display = 'none';
    if (canvasElement) canvasElement.style.display = 'block';
    
    console.log('渲染高性能模拟知识图谱');
    
    try {
        // 清理现有内容
        cleanupKnowledgeGraphListeners();
        canvasElement.innerHTML = '';
        
        // 创建模拟数据
        const mockNodes = [
            { id: 'course-1', label: currentCourseDetail?.name || '课程核心概念', type: 'course', x: 300, y: 200, radius: 35, color: '#667eea' },
            { id: 'concept-1', label: '基础理论', type: 'concept', x: 150, y: 300, radius: 25, color: '#56ab2f' },
            { id: 'concept-2', label: '实践应用', type: 'concept', x: 300, y: 300, radius: 25, color: '#f093fb' },
            { id: 'concept-3', label: '相关技术', type: 'concept', x: 450, y: 300, radius: 25, color: '#4facfe' },
            { id: 'detail-1', label: '知识点 A', type: 'detail', x: 100, y: 400, radius: 18, color: '#ffecd2' },
            { id: 'detail-2', label: '知识点 B', type: 'detail', x: 200, y: 400, radius: 18, color: '#a8edea' },
            { id: 'detail-3', label: '知识点 C', type: 'detail', x: 350, y: 400, radius: 18, color: '#fad0c4' },
            { id: 'detail-4', label: '知识点 D', type: 'detail', x: 450, y: 400, radius: 18, color: '#d299c2' }
        ];
        
        const mockLinks = [
            { source: 'course-1', target: 'concept-1' },
            { source: 'course-1', target: 'concept-2' },
            { source: 'course-1', target: 'concept-3' },
            { source: 'concept-1', target: 'detail-1' },
            { source: 'concept-1', target: 'detail-2' },
            { source: 'concept-2', target: 'detail-3' },
            { source: 'concept-3', target: 'detail-4' }
        ];
        
        // 创建Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const containerRect = canvasElement.getBoundingClientRect();
        const width = containerRect.width || 600;
        const height = containerRect.height || 600;
        
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.cursor = 'pointer';
        
        canvasElement.appendChild(canvas);
        
        // 拖拽相关变量
        let isDragging = false;
        let draggedNode = null;
        let mouseX = 0;
        let mouseY = 0;
        let clickStartTime = 0;
        
        // 渲染函数
        function render() {
            // 清空画布
            ctx.clearRect(0, 0, width, height);
            
            // 绘制背景渐变
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            // 绘制连接线
            mockLinks.forEach(link => {
                const sourceNode = mockNodes.find(n => n.id === link.source);
                const targetNode = mockNodes.find(n => n.id === link.target);
                
                if (sourceNode && targetNode) {
                    ctx.beginPath();
                    ctx.moveTo(sourceNode.x, sourceNode.y);
                    ctx.lineTo(targetNode.x, targetNode.y);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
            
            // 绘制节点
            mockNodes.forEach(node => {
                // 主节点
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
                ctx.fillStyle = node.color;
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = node.type === 'course' ? 4 : 3;
                ctx.stroke();
                
                // 图标
                ctx.fillStyle = '#fff';
                ctx.font = `${node.radius * 0.8}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if (node.type === 'course') {
                    ctx.fillText('📚', node.x, node.y);
                } else if (node.type === 'concept') {
                    ctx.fillText('💡', node.x, node.y);
                } else {
                    ctx.fillText('📖', node.x, node.y);
                }
                
                // 文本标签
                ctx.fillStyle = '#fff';
                ctx.font = `${node.type === 'course' ? '16' : '14'}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(node.label, node.x, node.y + node.radius + 10);
            });
        }
        
        // 查找点击的节点
        function getNodeAt(x, y) {
            for (let i = mockNodes.length - 1; i >= 0; i--) {
                const node = mockNodes[i];
                const dx = x - node.x;
                const dy = y - node.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= node.radius + 5) {
                    return node;
                }
            }
            return null;
        }
        
        // 获取鼠标位置
        function getMousePos(e) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
        
        // 鼠标事件处理
        canvas.addEventListener('mousedown', (e) => {
            const pos = getMousePos(e);
            mouseX = pos.x;
            mouseY = pos.y;
            clickStartTime = Date.now();
            
            const node = getNodeAt(pos.x, pos.y);
            if (node) {
                isDragging = false;
                draggedNode = node;
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const pos = getMousePos(e);
            
            if (draggedNode) {
                if (!isDragging && (Math.abs(pos.x - mouseX) > 3 || Math.abs(pos.y - mouseY) > 3)) {
                    isDragging = true;
                }
                
                if (isDragging) {
                    draggedNode.x = pos.x;
                    draggedNode.y = pos.y;
                    render();
                }
            } else {
                const hoveredNode = getNodeAt(pos.x, pos.y);
                canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (draggedNode) {
                if (!isDragging && Date.now() - clickStartTime < 300) {
                    console.log('点击模拟节点:', draggedNode.label);
                    showNodeDetails(draggedNode);
                }
                
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'pointer';
            }
        });
        
        // 防止拖拽时离开画布导致的问题
        document.addEventListener('mouseup', () => {
            if (draggedNode) {
                draggedNode = null;
                isDragging = false;
                canvas.style.cursor = 'default';
            }
        });
        
        // 初始渲染
        render();
        
        showNotification('知识图谱渲染完成（演示数据）', 'info');
        
    } catch (error) {
        console.error('渲染模拟知识图谱失败:', error);
        showNotification('知识图谱渲染失败', 'error');
    }
}

// 实际的知识图谱渲染函数（待实现具体图形库）
function renderActualKnowledgeGraph(data) {
    // 这里可以使用 D3.js、vis.js 等图形库来实现复杂的知识图谱
    // 暂时使用简化高性能版本
    renderSimpleKnowledgeGraph();
}

// 刷新知识图谱
function refreshKnowledgeGraph() {
    if (currentCourseDetail) {
        showNotification('正在刷新知识图谱...', 'info');
        loadCourseKnowledgeGraph(currentCourseDetail.id);
    }
}

// 全屏知识图谱功能
let isKnowledgeGraphFullscreen = false;
let originalContainerParent = null;
let originalContainerStyle = null;

// 切换全屏模式
function toggleFullscreenKnowledgeGraph() {
    if (isKnowledgeGraphFullscreen) {
        exitFullscreenKnowledgeGraph();
    } else {
        enterFullscreenKnowledgeGraph();
    }
}

// 进入全屏模式
function enterFullscreenKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph-container');
    const fullscreenControls = document.getElementById('fullscreen-controls');
    
    if (!container) return;
    
    // 保存原始状态
    originalContainerParent = container.parentElement;
    originalContainerStyle = container.getAttribute('style');
    
    // 添加全屏样式
    container.classList.add('knowledge-graph-fullscreen');
    
    // 显示全屏控制按钮
    if (fullscreenControls) {
        fullscreenControls.style.display = 'block';
    }
    
    // 隐藏页面其他元素
    document.body.style.overflow = 'hidden';
    
    // 标记为全屏状态
    isKnowledgeGraphFullscreen = true;
    
    // 强制重新渲染知识图谱以适应新尺寸
    // 使用多次重试确保正确显示
    let retryCount = 0;
    const maxRetries = 5;
    
    function retryRender() {
        setTimeout(() => {
            refreshKnowledgeGraphDisplay();
            retryCount++;
            
            // 检查是否成功渲染
            const graphCanvas = container.querySelector('canvas, svg');
            if (!graphCanvas && retryCount < maxRetries) {
                console.log(`知识图谱重渲染第${retryCount}次重试...`);
                retryRender();
            } else if (retryCount >= maxRetries) {
                console.warn('知识图谱全屏渲染失败，请手动刷新');
                showNotification('知识图谱加载可能需要一些时间，如未显示请点击刷新', 'warning');
            }
        }, 200 + retryCount * 100); // 递增延迟
    }
    
    retryRender();
    showNotification('已进入全屏模式', 'success');
}

// 退出全屏模式
function exitFullscreenKnowledgeGraph() {
    const container = document.getElementById('knowledge-graph-container');
    const fullscreenControls = document.getElementById('fullscreen-controls');
    
    if (!container) return;
    
    // 标记为非全屏状态
    isKnowledgeGraphFullscreen = false;
    
    // 添加退出动画
    container.classList.add('knowledge-graph-exit-fullscreen');
    
    setTimeout(() => {
        // 移除全屏样式
        container.classList.remove('knowledge-graph-fullscreen', 'knowledge-graph-exit-fullscreen');
        
        // 恢复原始样式
        if (originalContainerStyle) {
            container.setAttribute('style', originalContainerStyle);
        } else {
            container.removeAttribute('style');
        }
        
        // 隐藏全屏控制按钮
        if (fullscreenControls) {
            fullscreenControls.style.display = 'none';
        }
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        
        // 延时重新渲染知识图谱以确保尺寸正确
        setTimeout(() => {
            refreshKnowledgeGraphDisplay();
        }, 100);
        
        showNotification('已退出全屏模式', 'info');
    }, 300);
}

// 刷新知识图谱显示
function refreshKnowledgeGraphDisplay() {
    const container = document.getElementById('knowledge-graph-container');
    if (!container) {
        console.warn('知识图谱容器未找到');
        return;
    }
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 等待DOM更新后再重新渲染
    setTimeout(() => {
        if (knowledgeGraphData && knowledgeGraphData.length > 0) {
            // 如果有真实数据，重新渲染
            console.log('重新渲染真实知识图谱数据');
            renderRealKnowledgeGraph(knowledgeGraphData);
        } else {
            // 否则显示模拟数据
            console.log('重新渲染模拟知识图谱数据');
            renderSimpleKnowledgeGraph();
        }
    }, 50);
}

// 颜色加深函数
function darkenColor(color, factor) {
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        const rgb = parseInt(hex, 16);
        const r = Math.floor(((rgb >> 16) & 0xFF) * (1 - factor));
        const g = Math.floor(((rgb >> 8) & 0xFF) * (1 - factor));
        const b = Math.floor((rgb & 0xFF) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
}

// 监听ESC键退出全屏
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && isKnowledgeGraphFullscreen) {
        exitFullscreenKnowledgeGraph();
    }
});

// 拖拽相关的全局变量
let draggedNode = null;
let dragOffset = { x: 0, y: 0 };
let isDragging = false;

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

// ==================== 学生成绩分析功能 ====================

// 加载学生各科成绩分析
async function loadGradeAnalysis() {
    try {
        if (!currentUser || !currentUser.userId) {
            console.log('loadGradeAnalysis - 用户未登录');
            return;
        }

        const response = await fetch(`/api/student/grade-analysis?userId=${currentUser.userId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            const gradeData = result.data || [];
            displayGradeAnalysis(gradeData);
        } else {
            console.error('获取成绩分析失败:', result.message);
            showGradeAnalysisEmpty();
        }
    } catch (error) {
        console.error('加载成绩分析失败:', error);
        showGradeAnalysisEmpty();
    }
}

// 显示成绩分析图表
function displayGradeAnalysis(gradeData) {
    const chartContainer = document.querySelector('.chart-bars');
    
    if (!chartContainer) {
        console.error('未找到图表容器');
        return;
    }

    if (gradeData.length === 0) {
        showGradeAnalysisEmpty();
        return;
    }

    // 清空现有内容
    chartContainer.innerHTML = '';

    // 创建图表
    const chartHTML = gradeData.map(course => {
        const averageScore = course.averageScore || 0;
        const gradeLevel = course.gradeLevel || '待提升';
        const examCount = course.totalExams || 0;
        
        // 根据成绩等级确定颜色
        let colorClass = 'low'; // 默认红色
        if (averageScore >= 90) {
            colorClass = 'high'; // 绿色
        } else if (averageScore >= 80) {
            colorClass = 'medium'; // 橙色
        }

        // 计算条形图的宽度百分比
        const barWidth = Math.min(averageScore, 100);

        return `
            <div class="chart-bar-item" style="margin-bottom: 16px;">
                <div class="chart-bar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div class="course-info">
                        <span class="course-name" style="font-weight: 500; color: var(--secondary-color);">${course.courseName}</span>
                        <span class="course-code" style="font-size: 12px; color: white; margin-left: 8px;">${course.courseCode}</span>
                    </div>
                    <div class="score-info" style="text-align: right;">
                        <span class="average-score" style="font-weight: 600; color: var(--primary-color);">${averageScore}分</span>
                        <div class="grade-level" style="font-size: 12px; color: #7f8c8d;">
                            ${gradeLevel} (${examCount}次考试)
                        </div>
                    </div>
                </div>
                <div class="chart-bar-container" style="width: 100%; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden;">
                    <div class="chart-bar ${colorClass}" style="width: ${barWidth}%; height: 100%; transition: width 0.8s ease;"></div>
                </div>
                <div class="score-details" style="display: flex; justify-content: space-between; font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                    <span>最高: ${course.highestScore || 0}分</span>
                    <span>最低: ${course.lowestScore || 0}分</span>
                </div>
            </div>
        `;
    }).join('');

    chartContainer.innerHTML = chartHTML;
}

// 显示成绩分析空状态
function showGradeAnalysisEmpty() {
    const chartContainer = document.querySelector('.chart-bars');
    
    if (!chartContainer) {
        return;
    }

    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
            <p>暂无成绩数据</p>
            <p>请完成课程学习和测评后查看</p>
        </div>
    `;
}

// 添加课程数据自动刷新机制
let courseRefreshInterval = null;

// 启动课程数据自动刷新
function startCourseDataRefresh() {
    // 清除之前的定时器
    if (courseRefreshInterval) {
        clearInterval(courseRefreshInterval);
    }
    
    // 每2分钟自动刷新一次课程数据（静默刷新，不显示消息）
    courseRefreshInterval = setInterval(async () => {
        try {
            // 如果当前在我的课程页面，刷新我的课程
            const myCoursesSection = document.getElementById('my-courses');
            if (myCoursesSection && !myCoursesSection.hidden) {
                console.log('自动刷新我的课程数据...');
                await refreshMyCourses();
            }
            
            // 如果当前在课程中心页面，刷新可用课程
            const courseCenterSection = document.getElementById('course-center');
            if (courseCenterSection && !courseCenterSection.hidden) {
                console.log('自动刷新可用课程数据...');
                await refreshAvailableCourses(false); // 不显示刷新消息
            }
        } catch (error) {
            console.error('自动刷新课程数据失败:', error);
        }
    }, 120000); // 2分钟 = 120000毫秒
}

// 停止课程数据自动刷新
function stopCourseDataRefresh() {
    if (courseRefreshInterval) {
        clearInterval(courseRefreshInterval);
        courseRefreshInterval = null;
    }
}

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时停止自动刷新
        stopCourseDataRefresh();
    } else {
        // 页面可见时启动自动刷新，并立即刷新一次
        startCourseDataRefresh();
        // 立即刷新当前页面的数据
        setTimeout(async () => {
            const myCoursesSection = document.getElementById('my-courses');
            const courseCenterSection = document.getElementById('course-center');
            
            if (myCoursesSection && !myCoursesSection.hidden) {
                await refreshMyCourses();
            } else if (courseCenterSection && !courseCenterSection.hidden) {
                await refreshAvailableCourses(false);
            }
        }, 1000);
    }
});

// ==================== 学生端消息功能 ====================

/**
 * 获取当前学生用户信息 - 适配messaging-functions.js
 */
// 删除自定义的getCurrentUserInfo函数，使用messaging-functions.js中的函数

/**
 * 加载学生的课程列表
 */
async function loadStudentCourses() {
    try {
        console.log('开始加载学生课程列表...');
        
        // 动态获取当前用户信息
        if (!currentUser || !currentUser.userId) {
            console.error('无法获取当前用户信息或userId');
            throw new Error('用户信息不完整');
        }
        
        const userInfo = {
            userId: currentUser.userId,
            userType: 'STUDENT',
            userName: currentUser.realName || currentUser.username,
            role: 'student'
        };
        
        console.log('用户信息:', userInfo);
        
        // 添加时间戳防止缓存，确保获取最新数据
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/messages/user-courses?userId=${userInfo.userId}&userType=${userInfo.userType}&_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('课程API响应状态:', response.status);
        const result = await response.json();
        console.log('课程API响应数据:', result);
        
        if (result.success) {
            const select = document.getElementById('course-select');
            if (select) {
                select.innerHTML = '<option value="">请选择课程</option>' + 
                    result.data.map(course => `<option value="${course.id}">${course.name} (${course.courseCode})</option>`).join('');
                
                console.log(`成功加载 ${result.data.length} 门课程到选择器`);
                
                // 如果只有一门课程，自动选择并加载用户
                if (result.data.length === 1) {
                    select.value = result.data[0].id;
                    await loadStudentCourseUsers(result.data[0].id);
                }
            } else {
                console.error('找不到course-select元素');
            }
        } else {
            console.error('课程加载失败:', result.message);
            showNotification('课程加载失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('加载学生课程列表失败:', error);
        showNotification('网络错误，请重试', 'error');
    }
}

/**
 * 学生端初始化新建对话页面（参照教师端实现）
 */
async function initializeStudentNewChat() {
    console.log('🔄 开始初始化学生端新建对话页面...');
    
    // 加载学生的课程列表
    await loadStudentCourses();
    
    // 清空用户列表
    const usersContainer = document.getElementById('available-users-list');
    if (usersContainer) {
        usersContainer.innerHTML = '';
    }
    
    const emptyDiv = document.getElementById('users-empty');
    if (emptyDiv) {
        emptyDiv.style.display = 'block';
    }
}

/**
 * 加载课程中的用户列表（学生端选择聊天对象，参照教师端实现）
 */
async function loadStudentCourseUsers(courseId) {
    try {
        console.log('加载课程用户列表，课程ID:', courseId);
        
        if (!courseId) {
            console.log('没有选择课程，清空用户列表');
            clearStudentCourseUsersList();
            return;
        }
        
        // 动态获取当前用户信息
        if (!currentUser || !currentUser.userId) {
            console.error('无法获取当前用户信息或userId');
            throw new Error('用户信息不完整');
        }
        
        const userInfo = {
            userId: currentUser.userId,
            userType: 'STUDENT',
            userName: currentUser.realName || currentUser.username,
            role: 'student'
        };
        
        console.log('学生用户信息:', userInfo);
        
        // 添加时间戳防止缓存，确保获取最新数据，并使用正确的API路径
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/messages/course/${courseId}/users?userId=${userInfo.userId}&userType=${userInfo.userType}&_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        console.log('用户列表API响应状态:', response.status);
        const result = await response.json();
        console.log('用户列表API响应数据:', result);
        
        if (result.success) {
            displayStudentCourseUsers(result.data, courseId);
            console.log(`课程 ${courseId} 中有 ${result.data.length} 个用户`);
        } else {
            console.error('加载课程用户失败:', result.message);
            clearStudentCourseUsersList();
            showNotification('加载课程用户失败: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('加载课程用户列表失败:', error);
        clearStudentCourseUsersList();
        showNotification('网络错误，请重试', 'error');
    }
}

/**
 * 显示课程用户列表（移除用户类型筛选，显示所有相关用户）
 */
function displayCourseUsers(users, courseId = null) {
    const usersList = document.getElementById('available-users-list');
    const usersEmpty = document.getElementById('users-empty');
    
    if (!usersList) return;
    
    if (!users || users.length === 0) {
        usersList.style.display = 'none';
        if (usersEmpty) usersEmpty.style.display = 'block';
        return;
    }
    
    if (usersEmpty) usersEmpty.style.display = 'none';
    usersList.style.display = 'grid';
    
    // 清空现有内容
    usersList.innerHTML = '';
    
    // 显示所有用户，不进行类型筛选
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        const typeText = user.type === 'TEACHER' ? '教师' : '同学';
        const iconClass = user.type === 'TEACHER' ? 'fa-chalkboard-teacher' : 'fa-user-graduate';
        
        userCard.innerHTML = `
            <div class="user-card-header">
                <div class="user-card-avatar">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="user-card-info">
                    <div class="user-card-name">${user.name}</div>
                    <div class="user-card-type">${typeText}</div>
                </div>
            </div>
            <div class="user-card-actions">
                <button class="chat-btn" onclick="startStudentChat(${user.id}, '${user.userType}', '${user.name}', ${courseId})">
                    <i class="fas fa-comment"></i>
                    开始聊天
                </button>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
    
    console.log('显示课程用户列表完成，共', filteredUsers.length, '个用户');
}

/**
 * 显示课程用户列表（学生端新版本，参照教师端实现）
 */
function displayStudentCourseUsers(users, courseId) {
    const container = document.getElementById('available-users-list');
    const emptyDiv = document.getElementById('users-empty');
    
    if (!container) {
        console.error('❌ 找不到available-users-list元素');
        return;
    }
    
    if (!users || users.length === 0) {
        container.innerHTML = '';
        if (emptyDiv) emptyDiv.style.display = 'block';
        console.log('没有找到可对话用户');
        return;
    }
    
    if (emptyDiv) emptyDiv.style.display = 'none';
    
    // 按照用户类型分组
    const teachers = users.filter(user => user.userType === 'TEACHER');
    const students = users.filter(user => user.userType === 'STUDENT');
    
    let html = '';
    
    // 显示教师
    if (teachers.length > 0) {
        html += '<h4 style="margin: 15px 0 10px 0; color: #2c3e50;">👨‍🏫 教师</h4>';
        teachers.forEach(user => {
            html += `
                <div class="user-card" style="border: 1px solid #e0e0e0; margin: 10px 0; padding: 15px; border-radius: 8px; background: #f9f9f9;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #333;">${user.name}</h4>
                            <p style="margin: 0; color: #666;">教师</p>
                        </div>
                        <button class="btn btn-primary" onclick="startStudentChat(${user.id}, '${user.userType}', '${user.name}', ${courseId})">
                            <i class="fas fa-comments"></i> 开始聊天
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // 显示学生
    if (students.length > 0) {
        html += '<h4 style="margin: 15px 0 10px 0; color: #2c3e50;">👨‍🎓 同学</h4>';
        students.forEach(user => {
            html += `
                <div class="user-card" style="border: 1px solid #e0e0e0; margin: 10px 0; padding: 15px; border-radius: 8px; background: #f9f9f9;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0 0 5px 0; color: #333;">${user.name}</h4>
                            <p style="margin: 0; color: #666;">学生</p>
                        </div>
                        <button class="btn btn-primary" onclick="startStudentChat(${user.id}, '${user.userType}', '${user.name}', ${courseId})">
                            <i class="fas fa-comments"></i> 开始聊天
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
    console.log(`显示了 ${users.length} 个可对话用户 (${teachers.length} 名教师, ${students.length} 名学生)`);
}

/**
 * 清空用户列表
 */
function clearStudentCourseUsersList() {
    const container = document.getElementById('available-users-list');
    const emptyDiv = document.getElementById('users-empty');
    
    if (container) container.innerHTML = '';
    if (emptyDiv) emptyDiv.style.display = 'block';
}

/**
 * 筛选用户列表
 */
// 已删除用户类型筛选功能，学生端直接显示所有相关用户

/**
 * 学生端开始聊天功能（参照教师端实现）
 */
async function startStudentChat(userId, userType, userName, courseId) {
    try {
        console.log('🚀 学生端开始聊天 - 使用messaging-functions.js:', {userId, userType, userName, courseId});
        
        // 跳转到对话页面
        showSection('message-conversations');
        
        // 等待页面加载完成后打开对话 - 使用messaging-functions.js中的openConversation
        setTimeout(async () => {
            if (typeof openConversation === 'function') {
                console.log('✅ 调用messaging-functions.js中的openConversation函数');
                await openConversation(userId, userType, userName, courseId);
            } else {
                console.error('❌ messaging-functions.js中的openConversation函数不存在');
                showNotification('聊天功能尚未加载完成，请刷新页面重试', 'error');
            }
        }, 300);
        
        showNotification(`正在打开与 ${userName} 的对话...`, 'success');
    } catch (error) {
        console.error('开始聊天失败:', error);
        showNotification('开始聊天失败: ' + error.message, 'error');
    }
}

/**
 * 学生端发送消息适配函数
 */
async function sendStudentMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput?.value?.trim();
    
    if (!message) {
        showNotification('请输入消息内容', 'warning');
        return;
    }
    
    const userInfo = getCurrentUserInfo();
    if (!userInfo) {
        showNotification('用户信息获取失败', 'error');
        return;
    }
    
    // 获取当前聊天对象信息
    const chatWindow = document.getElementById('chat-window');
    const receiverId = chatWindow?.dataset?.receiverId;
    const receiverType = chatWindow?.dataset?.receiverType;
    const courseId = chatWindow?.dataset?.courseId;
    
    if (!receiverId || !receiverType) {
        showNotification('聊天信息获取失败', 'error');
        return;
    }
    
    try {
        console.log('学生发送消息:', {
            senderId: userInfo.userId,
            senderType: userInfo.userType || 'STUDENT',
            receiverId: parseInt(receiverId),
            receiverType: receiverType,
            message: message,
            courseId: courseId ? parseInt(courseId) : null
        });
        
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                senderId: userInfo.userId,
                senderType: userInfo.userType || 'STUDENT',
                receiverId: parseInt(receiverId),
                receiverType: receiverType,
                content: message,
                courseId: courseId ? parseInt(courseId) : null
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 清空输入框
            messageInput.value = '';
            
            // 添加消息到聊天窗口
            addStudentMessageToChat({
                id: result.data.id,
                content: message,
                senderId: userInfo.userId,
                senderType: userInfo.userType || 'STUDENT',
                senderName: userInfo.userName || userInfo.realName,
                sentAt: new Date().toISOString(),
                isRead: false
            }, true);
            
            console.log('学生消息发送成功');
        } else {
            throw new Error(result.message || '发送失败');
        }
    } catch (error) {
        console.error('学生发送消息失败:', error);
        showNotification('发送消息失败: ' + error.message, 'error');
    }
}

/**
 * 学生端刷新对话列表
 */
async function refreshStudentConversations() {
    try {
        console.log('刷新学生端对话列表');
        
        const userInfo = getCurrentUserInfo();
        if (!userInfo) {
            console.error('获取用户信息失败');
            return;
        }
        
        const response = await fetch(`/api/messages/conversations?userId=${userInfo.userId}&userType=${userInfo.userType}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('学生端对话列表响应:', result);
        
        if (result.success && result.data) {
            displayConversationsList(result.data);
        } else {
            throw new Error(result.message || '获取对话列表失败');
        }
    } catch (error) {
        console.error('刷新学生端对话列表失败:', error);
        showNotification('刷新对话列表失败: ' + error.message, 'error');
    }
}

/**
 * 学生端刷新当前聊天窗口的消息（为messaging-functions.js提供）
 */
async function refreshMessages() {
    try {
        console.log('学生端刷新消息');
        
        // 获取当前聊天窗口信息
        const chatWindow = document.querySelector('.chat-window:not([style*="display: none"])');
        if (!chatWindow) {
            console.log('没有打开的聊天窗口');
            return;
        }
        
        const receiverId = chatWindow.getAttribute('data-receiver-id');
        const receiverType = chatWindow.getAttribute('data-receiver-type');
        
        if (!receiverId || !receiverType) {
            console.log('聊天窗口缺少用户信息');
            return;
        }
        
        const userInfo = getCurrentUserInfo();
        if (!userInfo) {
            console.error('获取用户信息失败');
            return;
        }
        
        // 加载消息历史
        await loadConversationMessages(userInfo.id, userInfo.type, parseInt(receiverId), receiverType);
        
    } catch (error) {
        console.error('学生端刷新消息失败:', error);
    }
}

/**
 * 加载对话消息历史
 */
async function loadConversationMessages(senderId, senderType, receiverId, receiverType) {
    try {
        console.log('加载对话消息历史:', { senderId, senderType, receiverId, receiverType });
        
        const response = await fetch(`/api/messages/conversation?senderId=${senderId}&senderType=${senderType}&receiverId=${receiverId}&receiverType=${receiverType}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('消息历史响应:', result);
        
        if (result.success && result.data) {
            // 清空聊天窗口并重新显示所有消息
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                
                // 添加所有消息
                result.data.forEach(message => {
                    addStudentMessageToChat(message, message.senderId === senderId);
                });
                
                // 滚动到底部
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            // 标记消息为已读
            await markMessagesAsRead(senderId, senderType, receiverId, receiverType);
        }
    } catch (error) {
        console.error('加载对话消息失败:', error);
    }
}

/**
 * 标记消息为已读
 */
async function markMessagesAsRead(senderId, senderType, receiverId, receiverType) {
    try {
        await fetch('/api/messages/mark-read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                receiverId: senderId,
                receiverType: senderType,
                senderId: receiverId,
                senderType: receiverType
            })
        });
    } catch (error) {
        console.error('标记消息已读失败:', error);
    }
}

/**
 * 启动学生端消息自动刷新
 */
let studentMessageRefreshTimer = null;

function startStudentMessageRefresh() {
    // 停止之前的定时器
    if (studentMessageRefreshTimer) {
        clearInterval(studentMessageRefreshTimer);
    }
    
    // 启动新的定时器，每30秒刷新一次
    studentMessageRefreshTimer = setInterval(() => {
        // 只有在聊天窗口打开时才刷新消息
        const chatWindow = document.querySelector('.chat-window:not([style*="display: none"])');
        if (chatWindow) {
            refreshMessages();
        }
        
        // 始终刷新对话列表
        if (document.getElementById('conversations-section') && !document.getElementById('conversations-section').hidden) {
            refreshStudentConversations();
        }
    }, 30000); // 30秒
    
    console.log('学生端消息自动刷新已启动');
}

function stopStudentMessageRefresh() {
    if (studentMessageRefreshTimer) {
        clearInterval(studentMessageRefreshTimer);
        studentMessageRefreshTimer = null;
        console.log('学生端消息自动刷新已停止');
    }
}

/**
 * 显示对话列表（为messaging-functions.js提供）
 */
function displayConversationsList(conversations) {
    console.log('显示学生端对话列表:', conversations);
    
    const conversationsContainer = document.getElementById('conversations-list');
    const emptyState = document.getElementById('conversations-empty');
    
    if (!conversationsContainer) {
        console.error('找不到对话列表容器');
        return;
    }
    
    if (!conversations || conversations.length === 0) {
        conversationsContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    conversationsContainer.style.display = 'block';
    
    conversationsContainer.innerHTML = conversations.map(conv => `
        <div class="conversation-item" onclick="openConversationFromList('${conv.userId}', '${conv.userName}', '${conv.userType}', ${conv.courseId || 'null'})">
            <div class="conversation-avatar">
                <i class="fas fa-${conv.userType === 'TEACHER' ? 'chalkboard-teacher' : 'user-graduate'}"></i>
            </div>
            <div class="conversation-info">
                <div class="conversation-name">${conv.userName}</div>
                <div class="conversation-type">${conv.userType === 'TEACHER' ? '教师' : '学生'}</div>
                <div class="conversation-preview">${conv.lastMessage || '暂无消息'}</div>
            </div>
            <div class="conversation-meta">
                <div class="conversation-time">${conv.lastMessageTime || ''}</div>
                ${conv.unreadCount > 0 ? `<div class="unread-count">${conv.unreadCount}</div>` : ''}
            </div>
        </div>
    `).join('');
}

// 删除自定义的openConversation函数，使用messaging-functions.js中的函数

/**
 * 学生端关闭对话函数
 */
function closeConversation() {
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
        chatWindow.style.display = 'none';
        console.log('✅ 聊天窗口已关闭');
        // 清除dataset
        delete chatWindow.dataset.receiverId;
        delete chatWindow.dataset.receiverType;
        delete chatWindow.dataset.courseId;
    }
    
    // 停止消息刷新
    stopStudentMessageRefresh();
    
    console.log('✅ 学生端对话窗口已关闭');
}

/**
 * 从对话列表打开对话
 */
async function openConversationFromList(userId, userName, userType, courseId) {
    console.log('从对话列表打开对话:', { userId, userName, userType, courseId });
    
    try {
        await openConversation(userId, userType, userName, courseId);
    } catch (error) {
        console.error('打开对话失败:', error);
        showNotification('打开对话失败: ' + error.message, 'error');
    }
}

/**
 * 关闭聊天窗口
 */
function closeChatWindow() {
    console.log('🔒 学生端关闭聊天窗口');
    closeConversation();
}

/**
 * 刷新未读消息数量
 */
function refreshUnreadCount() {
    // 这个函数可以根据需要实现
    console.log('刷新未读消息数量');
}

/**
 * 学生端专用的添加消息到聊天窗口函数
 */
function addStudentMessageToChat(message, isOwnMessage = false) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;
    
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwnMessage ? 'message-own' : 'message-other'}`;
    
    // 格式化时间
    const sentTime = new Date(message.sentAt);
    const timeStr = sentTime.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // 消息内容HTML - 使用已有的escapeHtml函数
    const messageContent = escapeHtml(message.content).replace(/\n/g, '<br>');
    const senderName = escapeHtml(message.senderName || '未知用户');
    
    if (isOwnMessage) {
        // 自己发送的消息 - 右对齐，使用WeChat样式
        messageDiv.innerHTML = `
            <div class="message-content message-right">
                <div class="message-header">
                    <span class="message-time">${timeStr}</span>
                    <span class="message-sender">我</span>
                </div>
                <div class="message-bubble message-bubble-own">
                    ${messageContent}
                </div>
            </div>
        `;
    } else {
        // 别人发送的消息 - 左对齐，使用WeChat样式
        messageDiv.innerHTML = `
            <div class="message-content message-left">
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${timeStr}</span>
                </div>
                <div class="message-bubble message-bubble-other">
                    ${messageContent}
                </div>
            </div>
        `;
    }
    
    // 添加到容器
    messagesContainer.appendChild(messageDiv);
    
    // 滚动到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    console.log('已添加消息到聊天窗口:', { 
        isOwnMessage, 
        sender: senderName,
        content: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
    });
}

/**
 * 初始化学生端消息输入功能
 */
function initializeStudentMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (!messageInput) return;
    
    // 回车发送消息，Shift+Enter换行
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter允许换行，不做任何处理
                return;
            } else {
                // 单独Enter键发送消息
                e.preventDefault();
                const message = this.value.trim();
                if (message) {
                    sendStudentMessage();
                }
            }
        }
    });
    
    // 自动调整高度
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

/**
 * 全局消息功能适配
 */
window.refreshConversations = refreshStudentConversations;
window.refreshAvailableUsers = initializeStudentNewChat;
window.sendMessage = sendStudentMessage;
window.startChat = startStudentChat; // 提供通用的开始聊天函数
window.displayConversationsList = displayConversationsList;
window.refreshUnreadCount = refreshUnreadCount;

/**
 * 直接测试聊天窗口显示
 */
function testChatWindow() {
    console.log('🔧 直接测试聊天窗口');
    
    // 直接调用openConversation函数
    openConversation(4, 'TEACHER', '张教授', 1);
    
    showNotification('正在测试聊天窗口显示...', 'info');
}

// 将测试函数暴露到全局
window.testChatWindow = testChatWindow;

// ==================== DOMContentLoaded 事件监听器 ====================

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('学生页面开始初始化...');
    
    // 初始化各种功能
    setupUserDropdown();
    setupJoinCourseModal();
    setupChangePasswordModal();
    setupDeleteAccountModal();
    setupCourseCenterFeatures();
    setupAllNoticesModal();
    initializeHelper();
    initializeExamPage();
    initializeStudentMessageInput();
    
    // 启动课程数据自动刷新机制
    startCourseDataRefresh();
    
    // 启动消息自动刷新机制
    startStudentMessageRefresh();
    
    // 检查登录状态
    fetch('/api/auth/current-user', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data) {
            currentUser = data.data;
            console.log('当前登录用户:', currentUser);
            
            // 默认显示控制面板
            showSection('dashboard');
            updateDashboardStats();
            
            // 预加载我的课程数据
            refreshMyCourses();
        } else {
            console.log('用户未登录，跳转到登录页面');
            window.location.href = '/login.html';
        }
    })
    .catch(error => {
        console.error('检查登录状态失败:', error);
        window.location.href = '/login.html';
    });
});

// 确保关键函数在全局作用域中可用
window.handleSendMessage = handleSendMessage;
window.sendMessageToAI = sendMessageToAI;
window.openAIAssistant = openAIAssistant;
window.onRAGCourseChange = onRAGCourseChange;
window.debugAIAssistant = debugAIAssistant;

console.log('全局函数已暴露:', {
    handleSendMessage: typeof window.handleSendMessage,
    sendMessageToAI: typeof window.sendMessageToAI,
    openAIAssistant: typeof window.openAIAssistant,
    onRAGCourseChange: typeof window.onRAGCourseChange,
    debugAIAssistant: typeof window.debugAIAssistant
});