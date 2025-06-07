document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    const currentUser = JSON.parse(localStorage.getItem('smartedu_current_user') || 'null');
    if (!currentUser || currentUser.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    // 设置用户名
    document.querySelector('.user-name').textContent = currentUser.username;

    // 菜单点击切换功能
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动状态
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
        });
    });

    // 内容切换功能
    function showSection(sectionId) {
        document.querySelectorAll('.main-section').forEach(sec => {
            if(sec.id === sectionId) {
                sec.classList.remove('hidden-section');
            } else {
                sec.classList.add('hidden-section');
            }
        });
    }

    // 主菜单项点击切换内容
    document.querySelectorAll('.menu-item[data-section]').forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if(section) showSection(section);
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
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');

    logoutBtn.addEventListener('click', function() {
        logoutModal.style.display = 'flex';
    });

    cancelLogout.addEventListener('click', function() {
        logoutModal.style.display = 'none';
    });

    confirmLogout.addEventListener('click', function() {
        // 清除当前用户
        localStorage.removeItem('smartedu_current_user');
        logoutModal.style.display = 'none';
        // 跳转到首页
        window.location.href = 'SmartEdu.html';
    });

    // 加入课程功能
    setupJoinCourseModal();
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
            showNotification('课程号格式不正确，应为：SE-XX00', 'warning');
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
    const pattern = /^SE-[A-Z]{2}[0-9]{2}$/;
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