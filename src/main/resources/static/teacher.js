// 智囊WisdomEdu 教师端交互逻辑
let currentCourses = [];
let currentExams = [];
let currentMaterials = [];
let currentNotices = [];
let allNotices = []; // 存储所有通知
let filteredNotices = []; // 存储筛选后的通知
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;

// 知识点掌握情况相关变量
let knowledgeMasteryRefreshInterval = null;
let currentSelectedCourseId = null;
let lastKnowledgeMasteryData = null;

// 知识库相关变量
let knowledgeCurrentCourses = [];
let knowledgeStats = {
    totalFiles: 0,
    totalChunks: 0,
    processedChunks: 0,
    processingProgress: 0
};
let isProcessingFiles = false;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherPage();
    setupEventListeners();
});

// 初始化教师页面
async function initializeTeacherPage() {
    try {
        console.log('=== 开始初始化教师页面 ===');

        // 加载基础数据
        console.log('加载用户信息...');
        await loadCurrentUser();

    loadJobPostings(); // 加载产业信息
        // 提前加载课程列表，这样知识库模块就可以使用了
        console.log('初始化时加载课程列表...');
        await loadCourseList();
        console.log('初始化后的课程数据:', currentCourses);
        console.log('课程数量:', currentCourses.length);

        // 设置默认显示的页面，这会自动加载控制面板数据
        showSection('dashboard');

        // 设置默认活动菜单项
        const defaultMenuItem = document.querySelector('.menu-item[data-section="dashboard"]');
        if (defaultMenuItem) {
            updateActiveMenu(defaultMenuItem);
        }

        console.log('教师端页面初始化完成');
        console.log('最终课程数据:', currentCourses);
        console.log('currentCourses是否为数组:', Array.isArray(currentCourses));

        // 添加测试学生按钮功能的调试
        if (currentCourses.length > 0) {
            console.log('第一个课程数据:', currentCourses[0]);
            console.log('可以测试学生按钮功能');
        } else {
            console.warn('没有课程数据，学生按钮功能可能无法正常工作');
        }

        // 延迟初始化热点推送，确保页面其他部分已加载完成
        setTimeout(() => {
            initializeHotTopics();
        }, 2000);

    } catch (error) {
        console.error('页面初始化失败:', error);
        showNotification('页面加载失败，请刷新重试', 'error');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 先移除已有的事件监听器，防止重复绑定
    document.querySelectorAll('.menu-item').forEach(item => {
        // 克隆节点来移除所有事件监听器
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
    });

    // 侧边栏一级菜单点击处理
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

                const submenu = this.nextElementSibling;
            const arrow = this.querySelector('.arrow');

            // 如果有子菜单，则只处理展开/收起逻辑，不跳转页面
            if (submenu && submenu.classList.contains('submenu')) {
                // 切换子菜单显示状态
                const isOpen = submenu.style.display === 'block';

                // 关闭所有其他子菜单
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
                } else {
                    submenu.style.display = 'none';
                    if (arrow) arrow.style.transform = 'rotate(0deg)';
                }
        } else {
                // 如果没有子菜单，则跳转页面（如dashboard）
                const section = this.getAttribute('data-section');
                if (section) {
                    showSection(section);
                    updateActiveMenu(this);
                }
            }
        });
    });

    // 侧边栏二级菜单点击 - 跳转内容
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
                updateActiveMenu(this);
            }
        });
    });

    // 退出登录模态框
    document.getElementById('confirm-logout').addEventListener('click', confirmLogout);
    document.getElementById('cancel-logout').addEventListener('click', cancelLogout);

    // 文件上传区域拖放
    setupFileUpload();

    // 难度滑块变化
    setupDifficultySliders();

    // 新建课程模态框事件
    setupCreateCourseModal();

    // 修改密码模态框事件
    setupChangePasswordModal();

    // 上传资料模态框事件
    setupUploadModal();

    // 设置用户下拉菜单
    setupUserDropdown();

    // 知识库上传模态框事件（只设置一次）
    setupKnowledgeUploadModal();

    // 知识块查看模态框事件
    setupKnowledgeChunksModal();

    // 知识块详情模态框事件
    setupChunkDetailModal();

    // 知识块编辑模态框事件
    setupEditChunkModal();

    // 题型分数设置事件监听
    setupQuestionTypeScoreListeners();

    // 大作业要求模态框事件监听器
    document.addEventListener('DOMContentLoaded', function() {
        // 大作业选择框事件监听
        const assignmentCheckbox = document.getElementById('q-assignment');
        if (assignmentCheckbox) {
            assignmentCheckbox.addEventListener('change', function() {
                toggleAssignmentMode(this);
            });
        }

        // 关闭按钮事件
        const closeBtn = document.getElementById('close-assignment-requirement-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideAssignmentRequirementModal);
        }

        // 取消按钮事件
        const cancelBtn = document.getElementById('cancel-assignment-requirement');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideAssignmentRequirementModal);
        }

        // 保存按钮事件
        const saveBtn = document.getElementById('save-assignment-requirement');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveAssignmentRequirement);
        }

        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('assignment-requirement-modal');
                if (modal && modal.style.display === 'flex') {
                    hideAssignmentRequirementModal();
                }
            }
        });
    });
}

// 设置知识块模态框事件监听器
function setupKnowledgeChunksModal() {
    const closeBtn = document.getElementById('close-chunks-modal');
    if (closeBtn) {
        closeBtn.removeEventListener('click', hideKnowledgeChunksModal);
        closeBtn.addEventListener('click', hideKnowledgeChunksModal);
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('knowledge-chunks-modal');
            if (modal && modal.style.display === 'flex') {
                hideKnowledgeChunksModal();
            }
        }
    });
}

// 设置知识块详情模态框事件监听器
function setupChunkDetailModal() {
    const closeBtn = document.getElementById('close-chunk-detail-modal');
    if (closeBtn) {
        closeBtn.removeEventListener('click', hideChunkDetailModal);
        closeBtn.addEventListener('click', hideChunkDetailModal);
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('chunk-detail-modal');
            if (modal && modal.style.display === 'flex') {
                hideChunkDetailModal();
            }
        }
    });
}

// 设置知识块编辑模态框事件监听器
function setupEditChunkModal() {
    const closeBtn = document.getElementById('close-edit-chunk-modal');
    if (closeBtn) {
        closeBtn.removeEventListener('click', hideEditChunkModal);
        closeBtn.addEventListener('click', hideEditChunkModal);
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('edit-chunk-modal');
            if (modal && modal.style.display === 'flex') {
                hideEditChunkModal();
            }
        }
    });
}

// 设置新建课程模态框事件
function setupCreateCourseModal() {
    const modal = document.getElementById('create-course-modal');
    const closeBtn = document.getElementById('close-course-modal');
    const cancelBtn = document.getElementById('cancel-course-create');
    const form = document.getElementById('create-course-form');

    // 移除旧的事件监听器，防止重复绑定
    closeBtn.removeEventListener('click', hideCreateCourseModal);
    cancelBtn.removeEventListener('click', hideCreateCourseModal);

    // 关闭模态框
    closeBtn.addEventListener('click', hideCreateCourseModal);
    cancelBtn.addEventListener('click', hideCreateCourseModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideCreateCourseModal();
        }
    });

    // 移除旧的表单提交事件，防止重复绑定
    form.removeEventListener('submit', handleCreateCourse);
    // 表单提交
    form.addEventListener('submit', handleCreateCourse);
}

// 显示新建课程模态框
function showCreateCourseModal(isEditMode = false) {
    const modal = document.getElementById('create-course-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';

    // 只有在非编辑模式下才重置模态框状态和清空表单
    if (!isEditMode) {
        // 重置模态框状态
        resetCreateCourseModal();

        // 清空表单
        document.getElementById('create-course-form').reset();
    }

    // 聚焦到第一个输入框
    setTimeout(() => {
        const firstInput = document.getElementById('course-name');
        if (firstInput) {
            firstInput.focus();
        }
    }, 300);
}

// 隐藏新建课程模态框
function hideCreateCourseModal() {
    const modal = document.getElementById('create-course-modal');
    modal.classList.remove('show');

    // 延迟隐藏，等待动画完成
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

        // 处理新建课程
async function handleCreateCourse(e) {
    e.preventDefault();

    try {
        // 先检查所有必需的元素是否存在
        const nameElement = document.getElementById('course-name');
        const descElement = document.getElementById('course-description');
        const creditElement = document.getElementById('course-credit');
        const hoursElement = document.getElementById('course-hours');

        if (!nameElement || !descElement || !creditElement || !hoursElement) {
            console.error('找不到必需的表单元素');
            showNotification('表单初始化失败，请刷新页面重试', 'error');
            return;
        }

        const semesterElement = document.getElementById('course-semester');

        if (!semesterElement) {
            console.error('找不到学期选择元素');
            showNotification('表单初始化失败，请刷新页面重试', 'error');
            return;
        }

        // 收集培养目标
        const trainingObjectives = collectTrainingObjectives();

        const courseData = {
            name: nameElement.value.trim(),
            description: descElement.value.trim(),
            credit: parseInt(creditElement.value),
            hours: parseInt(hoursElement.value),
            semester: semesterElement.value,
            trainingObjectives: JSON.stringify(trainingObjectives)
        };

        if (!courseData.name) {
            showNotification('请输入课程名称', 'warning');
            return;
        }

        if (!courseData.credit || courseData.credit < 1 || courseData.credit > 10) {
            showNotification('学分必须在1-10之间', 'warning');
            return;
        }

        if (!courseData.hours || courseData.hours < 16 || courseData.hours > 200) {
            showNotification('学时必须在16-200之间', 'warning');
            return;
        }

        if (!courseData.semester) {
            showNotification('请选择开课学期', 'warning');
            return;
        }

        showLoading('正在创建课程...');

        console.log('提交创建课程请求:', courseData);
        const response = await TeacherAPI.createCourse(courseData);
        console.log('创建课程响应:', response);

        hideLoading();

        if (response.success) {
            showNotification('课程创建成功！', 'success');
            hideCreateCourseModal();

            // 只重新加载控制面板数据，它会自动获取最新的课程列表
            await loadDashboardData();
                } else {
            showNotification(response.message || '创建失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('创建课程失败:', error);
        showNotification('创建失败，请重试', 'error');
    }
}

// 显示页面部分
    function showSection(sectionId) {
    // 隐藏所有section
    document.querySelectorAll('.main-section').forEach(section => {
        section.classList.add('hidden-section');
    });

    // 显示目标section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden-section');

        // 加载对应页面数据
        loadSectionData(sectionId);
    }
}

// 加载页面数据
async function loadSectionData(sectionId) {
    try {
        switch(sectionId) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'upload-material':
                await loadKnowledgeData();
                break;
            case 'outline':
                await loadOutlineData();
                break;
            case 'publish-notice':
                await loadNoticesData();
                break;
            case 'gen-test':
                await loadExamGenerationData();
                break;
            case 'test-manage':
                await loadExamManageData();
                break;

            case 'grade-mark':
                await loadGradeData();
                break;
            case 'grade-analysis':
                await loadAnalysisData();
                break;
            case 'improve-suggest':
                await loadImprovementData();
                break;
            case 'my-courses':
                await loadMyCoursesData();
                break;
            case 'knowledge':
                await loadKnowledgeData();
                break;

            case 'message-conversations':
                await initializeMessageConversations();
                break;
            case 'message-new-chat':
                await initializeNewChat();
                break;
        }
    } catch (error) {
        console.error('加载页面数据失败:', error);
        showNotification('数据加载失败', 'error');
    }
}

// 初始化消息对话页面
async function initializeMessageConversations() {
    if (typeof refreshConversations === 'function') {
        await refreshConversations();
    }
    if (typeof refreshUnreadCount === 'function') {
        await refreshUnreadCount();
    }
}

// 初始化新建对话页面
async function initializeNewChat() {
    console.log('🔄 开始初始化新建对话页面...');

    // 确保用户信息已经完全加载
    let retryCount = 0;
    const maxRetries = 5;

    while (retryCount < maxRetries) {
        const currentUser = getCurrentUser();
        if (currentUser && (currentUser.id || currentUser.userId)) {
            console.log('✅ 用户信息已加载，开始加载课程');
            break;
        }

        console.log(`⏳ 等待用户信息加载... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 200));
        retryCount++;
    }

    // 直接在这里实现课程加载逻辑
    await loadTeacherCourses();

    // 清空学生列表
    const usersContainer = document.getElementById('available-users-list');
    if (usersContainer) {
        usersContainer.innerHTML = '';
    }

    const emptyDiv = document.getElementById('users-empty');
    if (emptyDiv) {
        emptyDiv.style.display = 'block';
    }
}

// 加载教师课程列表
async function loadTeacherCourses() {
    try {
        console.log('开始加载教师课程列表...');

        // 照搬学生端的实现方式 - 直接使用全局变量
        if (!window.currentUser || !window.currentUser.userId) {
            console.error('无法获取当前用户信息或userId');
            throw new Error('用户信息不完整');
        }

        const userInfo = {
            userId: window.currentUser.userId,
            userType: 'TEACHER',
            userName: window.currentUser.realName || window.currentUser.username,
            role: 'teacher'
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

                // 如果只有一门课程，自动选择并加载学生
                if (result.data.length === 1) {
                    select.value = result.data[0].id;
                    await loadTeacherCourseUsers(result.data[0].id);
                }
            } else {
                console.error('找不到course-select元素');
            }
        } else {
            console.error('课程加载失败:', result.message);
            showNotification('课程加载失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('加载课程列表失败:', error);
        showNotification('课程加载失败', 'error');
    }
}

// 加载课程学生列表
async function loadTeacherCourseUsers(courseId) {
    try {
        console.log('加载课程学生，课程ID:', courseId);

        if (!courseId) {
            console.log('没有选择课程，清空学生列表');
            clearCourseUsersList();
            return;
        }

        // 照搬学生端的实现方式 - 直接使用全局变量
        if (!window.currentUser || !window.currentUser.userId) {
            console.error('无法获取当前用户信息或userId');
            throw new Error('用户信息不完整');
        }

        const userInfo = {
            userId: window.currentUser.userId,
            userType: 'TEACHER'
        };

        // 添加时间戳防止缓存，确保获取最新数据
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/messages/course/${courseId}/users?userId=${userInfo.userId}&userType=${userInfo.userType}&_t=${timestamp}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log('学生API响应状态:', response.status);
        const result = await response.json();
        console.log('学生API响应数据:', result);

        if (result.success) {
            displayTeacherCourseUsers(result.data);
        } else {
            console.error('学生列表加载失败:', result.message);
            clearCourseUsersList();
        }
    } catch (error) {
        console.error('加载学生列表失败:', error);
        clearCourseUsersList();
    }
}

// 显示课程学生列表
function displayTeacherCourseUsers(users) {
    const container = document.getElementById('available-users-list');
    const emptyDiv = document.getElementById('users-empty');

    if (!container) {
        console.error('❌ 找不到available-users-list元素');
        return;
    }

    if (!users || users.length === 0) {
        container.innerHTML = '';
        if (emptyDiv) emptyDiv.style.display = 'block';
        console.log('没有找到学生');
        return;
    }

    if (emptyDiv) emptyDiv.style.display = 'none';

    container.innerHTML = users.map(user => `
        <div class="user-card" style="border: 1px solid #e0e0e0; margin: 10px 0; padding: 15px; border-radius: 8px; background: #f9f9f9;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0 0 5px 0; color: #333;">${user.name}</h4>
                    <p style="margin: 0; color: #666;">学号: ${user.username}</p>
                </div>
                <button class="btn btn-primary" onclick="startTeacherChat(${user.id}, '${user.userType}', '${user.name}', 5)">
                    <i class="fas fa-comments"></i> 开始聊天
                </button>
            </div>
        </div>
    `).join('');

    console.log(`显示了 ${users.length} 名学生`);
}

// 清空学生列表
function clearCourseUsersList() {
    const container = document.getElementById('available-users-list');
    const emptyDiv = document.getElementById('users-empty');

    if (container) container.innerHTML = '';
    if (emptyDiv) emptyDiv.style.display = 'block';
}

// 开始聊天
async function startTeacherChat(userId, userType, userName, courseId = 5) {
    try {
        console.log('🚀 开始聊天:', {userId, userType, userName, courseId});

        // 跳转到对话页面
        showSection('message-conversations');

        // 等待页面加载完成后打开对话
        setTimeout(async () => {
            // 检查messaging-functions.js是否已加载
            if (typeof openConversation === 'function') {
                console.log('✅ 调用openConversation函数');
                await openConversation(userId, userType, userName, courseId);
            } else {
                console.error('❌ openConversation函数不存在');
                showNotification('聊天功能尚未加载完成，请刷新页面重试', 'error');
                return;
            }
        }, 300);

        showNotification(`正在打开与 ${userName} 的对话...`, 'success');
    } catch (error) {
        console.error('开始聊天失败:', error);
        showNotification('开始聊天失败: ' + error.message, 'error');
    }
}

// 加载控制面板数据
async function loadDashboardData() {
    try {
        console.log('开始加载控制面板数据...');

        // 加载课程列表
        console.log('加载课程列表...');
        const coursesResponse = await TeacherAPI.getCourses();
        console.log('课程列表响应:', coursesResponse);

        if (!coursesResponse.success) {
            throw new Error('课程列表加载失败: ' + coursesResponse.message);
        }

        let courses = coursesResponse.data || [];

        // 根据课程ID去重，防止显示重复课程
        const uniqueCourses = [];
        const seenIds = new Set();
        for (const course of courses) {
            if (!seenIds.has(course.id)) {
                seenIds.add(course.id);
                uniqueCourses.push(course);
            }
        }

        currentCourses = uniqueCourses;
        console.log('当前课程数据:', currentCourses);

        // 加载统计数据
        console.log('加载统计数据...');
        const statsResponse = await TeacherAPI.getDashboardStats();
        console.log('统计数据响应:', statsResponse);

        if (!statsResponse.success) {
            throw new Error('统计数据加载失败: ' + statsResponse.message);
        }

        const stats = statsResponse.data || {};
        console.log('统计数据:', stats);

        // 更新统计卡片
        updateStatsCards(stats);

        // 更新课程表格
        updateRecentCoursesTable();

        // 更新知识点掌握情况的课程选择器
        updateKnowledgeCourseSelect();

        // 加载通知数据以更新首页最新通知显示
        try {
            console.log('加载通知数据...');
        await loadNoticesData();
        } catch (noticeError) {
            console.warn('通知数据加载失败，但不影响主界面:', noticeError);
        }

        // 加载系统通知
        try {
            console.log('加载系统通知...');
            await loadSystemNotices();
        } catch (systemNoticeError) {
            console.warn('系统通知数据加载失败，但不影响主界面:', systemNoticeError);
        }

        console.log('控制面板数据加载完成');
    } catch (error) {
        console.error('加载控制面板数据失败:', error);
        showNotification('数据加载失败: ' + error.message, 'error');
    }
}

// 更新统计卡片
function updateStatsCards(stats) {
    // 更新活跃学生数
    const studentsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (studentsElement) {
        studentsElement.textContent = stats.totalStudents ? stats.totalStudents.toLocaleString() : '0';
    }

    // 更新平均分
    const avgScoreElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (avgScoreElement) {
        const avgScore = stats.averageScore || 0;
        avgScoreElement.textContent = avgScore.toFixed(1);
    }

    // 更新待批改试卷数量
    const pendingElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (pendingElement) {
        pendingElement.textContent = stats.pendingGradeCount || '0';
    }

    // 更新课程数
    const courseCountElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
    if (courseCountElement) {
        const courseCount = stats.courseCount || 0;
        courseCountElement.textContent = courseCount.toString();
    }
}

// 更新知识点掌握情况的课程选择器
function updateKnowledgeCourseSelect() {
    const courseSelect = document.getElementById('dashboard-course-select');
    if (!courseSelect) return;

    // 清空现有选项，保留默认选项
    courseSelect.innerHTML = '<option value="">请选择课程</option>';

    // 添加真实的课程选项
    currentCourses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = course.name;
        courseSelect.appendChild(option);
    });

    // 移除旧的事件监听器，避免重复绑定
    courseSelect.removeEventListener('change', handleCourseSelectChange);

    // 添加课程选择变化事件监听器
    courseSelect.addEventListener('change', handleCourseSelectChange);

    // 如果有课程，默认选择第一个并加载知识点掌握情况
    if (currentCourses.length > 0) {
        courseSelect.value = currentCourses[0].id;
        loadKnowledgeMastery(currentCourses[0].id);
    }
}

// 独立的事件处理函数，便于移除监听器
function handleCourseSelectChange() {
    const selectedCourseId = this.value;
    currentSelectedCourseId = selectedCourseId;

    if (selectedCourseId) {
        loadKnowledgeMastery(selectedCourseId);
        // 启动自动刷新
        startKnowledgeMasteryAutoRefresh(selectedCourseId);
    } else {
        clearKnowledgeMasteryDisplay();
        // 停止自动刷新
        stopKnowledgeMasteryAutoRefresh();
    }
}

// 启动知识点掌握情况自动刷新
function startKnowledgeMasteryAutoRefresh(courseId) {
    // 停止之前的定时器
    stopKnowledgeMasteryAutoRefresh();

    // 每30秒刷新一次知识点掌握情况
    knowledgeMasteryRefreshInterval = setInterval(() => {
        if (currentSelectedCourseId === courseId) {
            loadKnowledgeMastery(courseId, true); // 静默刷新
        }
    }, 30000);

    console.log('已启动知识点掌握情况自动刷新，每30秒更新一次');
}

// 停止知识点掌握情况自动刷新
function stopKnowledgeMasteryAutoRefresh() {
    if (knowledgeMasteryRefreshInterval) {
        clearInterval(knowledgeMasteryRefreshInterval);
        knowledgeMasteryRefreshInterval = null;
        console.log('已停止知识点掌握情况自动刷新');
    }
}

// 加载知识点掌握情况
async function loadKnowledgeMastery(courseId, isSilentRefresh = false) {
    try {
        if (!isSilentRefresh) {
            console.log('========== 知识点掌握情况调试 ==========');
            console.log('加载课程', courseId, '的知识点掌握情况...');
        }

        // 显示加载状态（非静默刷新时）
        if (!isSilentRefresh) {
            showKnowledgeMasteryLoading();
        }

        const response = await TeacherAPI.getKnowledgeMastery(courseId);

        if (!isSilentRefresh) {
            console.log('API响应:', response);
        }

        if (response.success) {
            const masteryData = response.data;

            if (!isSilentRefresh) {
                console.log('知识点掌握数据:', masteryData);
                console.log('数据长度:', masteryData ? masteryData.length : 'null');

                if (!masteryData || masteryData.length === 0) {
                    console.log('⚠️ 知识点掌握数据为空，可能的原因：');
                    console.log('1. 该课程还没有发布考试');
                    console.log('2. 考试题目没有设置知识点');
                    console.log('3. 没有学生参与答题');
                    console.log('4. 学生答题数据没有保存成功');

                    // 进一步检查课程信息
                    await debugCourseInfo(courseId);
                }
            }

            // 检查数据是否有变化
            const hasDataChanged = hasKnowledgeMasteryDataChanged(masteryData);

            displayKnowledgeMastery(masteryData);
            lastKnowledgeMasteryData = JSON.parse(JSON.stringify(masteryData)); // 深拷贝

            // 如果是静默刷新且数据有变化，显示通知
            if (isSilentRefresh && hasDataChanged) {
                showKnowledgeMasteryUpdateNotification();
            }

            // 更新最后刷新时间
            updateKnowledgeMasteryRefreshTime();

            if (!isSilentRefresh) {
                console.log('知识点掌握情况加载成功');
                console.log('==========================================');
            }
        } else {
            console.error('获取知识点掌握情况失败:', response.message);
            if (!isSilentRefresh) {
                clearKnowledgeMasteryDisplay();
                showNotification('获取知识点掌握情况失败: ' + response.message, 'error');
            }
        }
    } catch (error) {
        console.error('加载知识点掌握情况失败:', error);
        if (!isSilentRefresh) {
            clearKnowledgeMasteryDisplay();
            showNotification('加载知识点掌握情况失败', 'error');
        }
    }
}

// 调试课程信息
async function debugCourseInfo(courseId) {
    try {
        console.log('========== 课程调试信息 ==========');
        console.log('正在检查课程', courseId, '的详细信息...');

        // 获取教师的考试列表（需要先获取teacherId）
        const userResponse = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        if (!userResponse.ok) {
            throw new Error('无法获取用户信息');
        }

        const userResult = await userResponse.json();
        if (!userResult.success || !userResult.data) {
            throw new Error('用户信息无效');
        }

        const teacherId = userResult.data.id;
        const examsResponse = await fetch(`/api/exam/list?teacherId=${teacherId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (examsResponse.ok) {
            const examsResult = await examsResponse.json();
            if (examsResult.success) {
                const allExams = examsResult.data || [];
                // 过滤出该课程的考试
                const exams = allExams.filter(exam => exam.courseId === parseInt(courseId));
                console.log('课程考试列表:', exams);
                console.log('考试数量:', exams.length);

                if (exams.length === 0) {
                    console.log('❌ 该课程还没有创建考试');
                    showKnowledgeMasteryDiagnostic('该课程还没有创建考试，请先在"考核内容生成"→"生成测评"中创建考试。');
                    return;
                }

                // 检查考试发布状态
                const publishedExams = exams.filter(exam => exam.isPublished);
                console.log('已发布考试数量:', publishedExams.length);

                if (publishedExams.length === 0) {
                    console.log('❌ 没有已发布的考试');
                    showKnowledgeMasteryDiagnostic('该课程有考试但都未发布，请在"测评管理"中发布考试后学生才能参与答题。');
                    return;
                }

                // 检查考试是否有题目和知识点
                let hasQuestionsWithKnowledge = false;
                let hasStudentAnswers = false;

                for (const exam of publishedExams) {
                    console.log(`检查考试 "${exam.title}" (ID: ${exam.id}):`);

                    if (exam.totalQuestions && exam.totalQuestions > 0) {
                        console.log(`  - 题目数量: ${exam.totalQuestions}`);
                        hasQuestionsWithKnowledge = true;

                        // 检查学生答题情况
                        const hasAnswers = await checkStudentAnswers(exam.id, exam.title);
                        if (hasAnswers) {
                            hasStudentAnswers = true;
                        }
                    }
                }

                if (!hasQuestionsWithKnowledge) {
                    console.log('❌ 考试没有题目或题目没有设置知识点');
                    showKnowledgeMasteryDiagnostic('考试题目可能没有设置知识点。请在编辑题目时为每道题设置对应的知识点。');
                    return;
                }

                if (!hasStudentAnswers) {
                    console.log('❌ 没有学生答题数据');
                    showKnowledgeMasteryDiagnostic('考试已发布但没有学生提交答案，或答案数据未正确保存。请提醒学生参与考试答题。');
                    return;
                }

                console.log('✅ 数据看起来正常，可能需要等待系统处理...');
                showKnowledgeMasteryDiagnostic('数据检查正常，但知识点掌握情况仍为空。可能是数据处理延迟，请稍后重试。');
            } else {
                console.error('获取考试列表失败:', examsResult.message);
                showKnowledgeMasteryDiagnostic('无法获取课程考试信息：' + examsResult.message);
            }
        } else {
            console.error('获取考试列表请求失败');
            showKnowledgeMasteryDiagnostic('无法连接到服务器获取考试信息，请检查网络连接。');
        }

        console.log('================================');
    } catch (error) {
        console.error('调试课程信息失败:', error);
        showKnowledgeMasteryDiagnostic('系统调试过程中出现错误：' + error.message);
    }
}

// 检查学生答题情况
async function checkStudentAnswers(examId, examTitle) {
    try {
        // 尝试获取考试的成绩统计
        const statsResponse = await fetch(`/api/teacher/analysis/${examId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            if (statsResult.success && statsResult.data) {
                const participantCount = statsResult.data.participantCount || 0;
                console.log(`  - 考试 "${examTitle}" 的参与学生: ${participantCount}`);

                if (participantCount > 0) {
                    console.log('✅ 有学生参与答题');
                    return true;
                }
            }
        }

        // 备用方法：检查成绩列表
        const gradesResponse = await fetch(`/api/teacher/grades`, {
            method: 'GET',
            credentials: 'include'
        });

        if (gradesResponse.ok) {
            const gradesResult = await gradesResponse.json();
            if (gradesResult.success) {
                const grades = gradesResult.data || [];
                const examGrades = grades.filter(g => g.examId === examId && g.submitTime);
                console.log(`  - 考试 "${examTitle}" 的已提交答案: ${examGrades.length}`);

                return examGrades.length > 0;
            }
        }

        console.log('❌ 没有学生提交答案');
        return false;
    } catch (error) {
        console.error('检查学生答题情况失败:', error);
        return false;
    }
}

// 显示知识点掌握情况诊断信息
function showKnowledgeMasteryDiagnostic(message) {
    const chartContainer = document.querySelector('.knowledge-mastery-card .chart-bars');
    if (!chartContainer) return;

    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: #e74c3c;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #f39c12;"></i>
            <h3 style="color: #2c3e50; margin-bottom: 16px;">诊断结果</h3>
            <p style="color: #7f8c8d; line-height: 1.6; max-width: 500px; margin: 0 auto 20px;">${message}</p>
            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                <button onclick="manualRefreshKnowledgeMastery()" class="btn btn-sm btn-primary">
                    <i class="fas fa-sync-alt"></i> 重新检查
                </button>
                <button onclick="showSection('gen-test')" class="btn btn-sm btn-accent">
                    <i class="fas fa-plus"></i> 创建考试
                </button>
                <button onclick="showSection('test-manage')" class="btn btn-sm btn-success">
                    <i class="fas fa-cog"></i> 管理考试
                </button>
            </div>
        </div>
    `;
}

// 检查知识点掌握情况数据是否有变化
function hasKnowledgeMasteryDataChanged(newData) {
    if (!lastKnowledgeMasteryData) {
        return true; // 初次加载视为有变化
    }

    // 简单的数据比较
    if (!newData || newData.length !== lastKnowledgeMasteryData.length) {
        return true;
    }

    // 比较每个知识点的掌握率
    for (let i = 0; i < newData.length; i++) {
        const newItem = newData[i];
        const oldItem = lastKnowledgeMasteryData[i];

        if (!oldItem ||
            newItem.knowledgePoint !== oldItem.knowledgePoint ||
            newItem.masteryRate !== oldItem.masteryRate ||
            newItem.totalAnswers !== oldItem.totalAnswers) {
            return true;
        }
    }

    return false;
}

// 显示知识点掌握情况加载状态
function showKnowledgeMasteryLoading() {
    const chartContainer = document.querySelector('.knowledge-mastery-card .chart-bars');
    if (!chartContainer) return;

    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-spinner fa-spin" style="font-size: 32px; margin-bottom: 16px; color: #3498db;"></i>
            <p>正在加载知识点掌握情况...</p>
        </div>
    `;
}

// 显示知识点掌握情况更新通知
function showKnowledgeMasteryUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'knowledge-mastery-update-notification';
    notification.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span>知识点掌握情况已更新</span>
    `;

    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// 更新知识点掌握情况刷新时间
function updateKnowledgeMasteryRefreshTime() {
    const refreshTimeElement = document.querySelector('.knowledge-mastery-refresh-time');
    if (refreshTimeElement) {
        const now = new Date();
        refreshTimeElement.textContent = `最后更新: ${formatTime(now)}`;
    }
}

// 格式化时间
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 显示知识点掌握情况 - 紧凑型现代化设计
function displayKnowledgeMastery(masteryData) {
    const chartContainer = document.querySelector('.knowledge-mastery-card .chart-bars');
    if (!chartContainer) return;

    if (!masteryData || masteryData.length === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 32px 0; color: #7f8c8d;">
                <i class="fas fa-chart-pie" style="font-size: 36px; margin-bottom: 12px; color: #bdc3c7;"></i>
                <p>暂无学习掌握度数据</p>
                <p style="font-size: 14px; margin-top: 8px;">完成课程测评后这里会显示学生的知识掌握情况分析</p>
                <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px;">
                    <button onclick="manualRefreshKnowledgeMastery()" class="btn btn-sm btn-primary">
                    <i class="fas fa-sync-alt"></i> 刷新数据
                </button>
                    <button onclick="debugKnowledgeMasteryData()" class="btn btn-sm btn-warning">
                        <i class="fas fa-bug"></i> 诊断问题
                    </button>
                </div>
            </div>
        `;
        return;
    }

    // 显示前10个知识点，保持紧凑
    const displayData = masteryData.slice(0, 10);

    // 计算整体掌握情况统计
    const totalAnswers = displayData.reduce((sum, item) => sum + (item.totalAnswers || 0), 0);
    const totalCorrect = displayData.reduce((sum, item) => sum + (item.correctAnswers || 0), 0);
    const overallRate = totalAnswers > 0 ? (totalCorrect / totalAnswers * 100) : 0;

    // 创建两栏布局
    let contentHtml = `
        <!-- 概览信息条 -->
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            text-align: center;
        ">
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <div style="text-align: center;">
                    <h4 style="margin: 0; font-size: 16px; font-weight: 600;">学习掌握度概览</h4>
                    <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">
                        ${displayData.length} 个知识点 • ${totalAnswers} 次答题 • 平均掌握率 ${overallRate.toFixed(1)}%
                    </p>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div class="mini-circle-progress" style="
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        background: conic-gradient(#fff ${overallRate * 3.6}deg, rgba(255,255,255,0.2) 0deg);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 12px;
                    ">${overallRate.toFixed(0)}%</div>
                    <button onclick="manualRefreshKnowledgeMastery()" class="btn btn-sm" style="
                        background: rgba(255,255,255,0.15);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        padding: 6px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                    " title="刷新数据">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- 两栏布局容器 -->
        <div class="two-column-layout" style="
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            margin-bottom: 16px;
        ">
            <!-- 左栏：统计信息 -->
            <div class="stats-column" style="
                background: white;
                border: 1px solid #eee;
                border-radius: 12px;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            ">
                <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: #2c3e50;">学习概况</h5>

                <!-- 整体统计 -->
                <div style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 8px;
                ">
                    <div style="font-size: 11px; color: #6c757d; margin-bottom: 8px;">整体表现</div>
                    <div style="font-size: 24px; font-weight: bold; color: #2c3e50; margin-bottom: 4px;">
                        ${overallRate.toFixed(1)}%
                    </div>
                    <div style="font-size: 11px; color: #6c757d;">
                        ${totalCorrect} / ${totalAnswers} 正确率
                    </div>
                </div>
            </div>

            <!-- 右栏：知识点掌握度横向滚动 -->
            <div class="grid-column">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: #2c3e50;">各知识点详情</h5>
                    <div style="font-size: 12px; color: #6c757d;">
                        <i class="fas fa-arrows-alt-h"></i> 横向滑动查看更多
                    </div>
                </div>
                <div class="horizontal-mastery-scroll">
    `;

    // 生成横向网格的知识点掌握度条目
    displayData.forEach((item, index) => {
        const masteryRate = item.masteryRate || 0;
        const level = item.level || '需要强化';
        const knowledgePoint = item.knowledgePoint || '未知知识点';
        const correctAnswers = item.correctAnswers || 0;
        const totalAnswers = item.totalAnswers || 0;
        const totalQuestions = item.totalQuestions || 0;

        // 根据掌握率设置主题色彩
        let themeColor, statusIcon, bgColor;
        if (masteryRate >= 80) {
            themeColor = '#27ae60';
            statusIcon = 'fas fa-check-circle';
            bgColor = '#27ae6015';
        } else if (masteryRate >= 60) {
            themeColor = '#f39c12';
            statusIcon = 'fas fa-exclamation-circle';
            bgColor = '#f39c1215';
        } else {
            themeColor = '#e74c3c';
            statusIcon = 'fas fa-times-circle';
            bgColor = '#e74c3c15';
        }

        contentHtml += `
            <div class="horizontal-mastery-card" style="
                background: white;
                border: 1px solid #eee;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.2s ease;
                animation: slideInRight 0.3s ease-out ${index * 0.08}s both;
                min-width: 160px;
                height: 180px;
                flex-shrink: 0;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            " onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'"
               onmouseout="this.style.boxShadow='none'; this.style.transform='translateY(0)'">

                <!-- 顶部：知识点名称和状态 -->
                <div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 8px;">
                        <i class="${statusIcon}" style="color: ${themeColor}; font-size: 12px;"></i>
                        <span style="
                            background: ${bgColor};
                            color: ${themeColor};
                            padding: 2px 6px;
                            border-radius: 8px;
                            font-size: 10px;
                            font-weight: 500;
                        ">${level}</span>
                    </div>

                    <h4 style="
                        margin: 0 0 12px 0;
                        font-size: 13px;
                        font-weight: 600;
                        color: #2c3e50;
                        line-height: 1.3;
                        height: 36px;
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                    " title="${knowledgePoint}">${knowledgePoint}</h4>
                </div>

                <!-- 中间：掌握率显示 -->
                <div style="margin: 8px 0;">
                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        color: ${themeColor};
                        line-height: 1;
                        margin-bottom: 6px;
                    ">${masteryRate.toFixed(0)}%</div>

                    <!-- 小型进度条 -->
                    <div style="
                        width: 100%;
                        height: 5px;
                        background: #f1f2f6;
                        border-radius: 3px;
                        overflow: hidden;
                        margin-bottom: 8px;
                    ">
                        <div style="
                            width: ${masteryRate}%;
                            height: 100%;
                            background: ${themeColor};
                            border-radius: 3px;
                            transition: width 0.8s ease ${index * 0.1}s;
                        "></div>
                    </div>
                </div>

                <!-- 底部：统计信息 -->
                <div style="font-size: 11px; color: #7f8c8d; line-height: 1.2;">
                    <div>${correctAnswers}/${totalAnswers} 答对</div>
                    <div>${totalQuestions} 道题目</div>
                </div>
            </div>
        `;
    });

    contentHtml += `
                </div>
            </div>
        </div>

        <!-- 底部操作栏 -->
        <div style="
            margin-top: 16px;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        ">
            <div style="display: flex; align-items: center; gap: 12px; font-size: 12px; color: #6c757d;">
                <span><i class="fas fa-clock"></i> ${formatTime(new Date())}</span>
                <span><i class="fas fa-sync-alt fa-spin"></i> 自动同步</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="debugKnowledgeMasteryData()" class="btn btn-sm" style="
                    background: transparent;
                    border: 1px solid #dee2e6;
                    color: #6c757d;
                    font-size: 11px;
                    padding: 4px 8px;
                " title="诊断问题">
                    <i class="fas fa-bug"></i> 诊断
            </button>
        </div>
        </div>

        <style>
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(30px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .two-column-layout {
                display: grid;
                grid-template-columns: 1fr 3fr;
                gap: 20px;
                width: 100%;
                overflow: hidden;
            }

            .grid-column {
                min-width: 0;
                overflow: hidden;
            }

            .stats-column {
                min-width: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }

            .horizontal-mastery-scroll {
                display: flex;
                gap: 12px;
                overflow-x: auto;
                overflow-y: visible;
                padding: 4px 0 12px 0;
                scroll-behavior: smooth;
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }

            .horizontal-mastery-scroll::-webkit-scrollbar {
                height: 8px;
            }

            .horizontal-mastery-scroll::-webkit-scrollbar-track {
                background: #f1f2f6;
                border-radius: 4px;
            }

            .horizontal-mastery-scroll::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .horizontal-mastery-scroll::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }

            .horizontal-mastery-card {
                cursor: pointer;
                box-sizing: border-box;
            }

            .horizontal-mastery-card:first-child {
                margin-left: 0;
            }

            .horizontal-mastery-card:last-child {
                margin-right: 0;
            }

            /* 响应式调整 */
            @media (max-width: 1200px) {
                .two-column-layout {
                    grid-template-columns: 1fr 1.8fr;
                    gap: 16px;
                }
                .horizontal-mastery-card {
                    min-width: 140px !important;
                    height: 160px !important;
                }
            }

            @media (max-width: 768px) {
                .two-column-layout {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                .horizontal-mastery-card {
                    min-width: 130px !important;
                    height: 150px !important;
                    padding: 12px !important;
                }
                .stats-column {
                    order: 2;
                }
                .grid-column {
                    order: 1;
                }
                .horizontal-mastery-scroll {
                    margin: 0;
                    max-width: 100%;
                }
            }
        </style>
    `;

    chartContainer.innerHTML = contentHtml;

    console.log('紧凑型知识点掌握度显示完成，共', displayData.length, '个知识点');
}

// 调试知识点掌握情况数据
async function debugKnowledgeMasteryData() {
    const courseSelect = document.getElementById('dashboard-course-select');
    const selectedCourseId = courseSelect ? courseSelect.value : null;

    if (!selectedCourseId) {
        showNotification('请先选择一个课程', 'warning');
        return;
    }

    showLoading('正在诊断权限和数据问题...');

    try {
        // 首先进行权限诊断
        console.log('========== 权限诊断开始 ==========');

        // 1. 检查用户登录状态
        console.log('1. 检查用户登录状态...');
        const authResponse = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        if (!authResponse.ok) {
            console.error('❌ 用户认证请求失败:', authResponse.status);
            showKnowledgeMasteryDiagnostic('用户认证失败，请重新登录。');
            hideLoading();
            return;
        }

        const authResult = await authResponse.json();
        console.log('用户认证结果:', authResult);

        if (!authResult.success) {
            console.error('❌ 用户未登录:', authResult.message);
            showKnowledgeMasteryDiagnostic('用户未登录，请重新登录后再试。');
            hideLoading();
            return;
        }

        const currentUser = authResult.data;
        console.log('✅ 用户已登录:', currentUser.username, '角色:', currentUser.role);

        // 2. 检查用户角色权限
        console.log('2. 检查用户角色权限...');
        if (currentUser.role !== 'teacher') {
            console.error('❌ 用户角色不是教师:', currentUser.role);
            showKnowledgeMasteryDiagnostic(`当前用户角色是 "${currentUser.role}"，只有教师才能查看知识点掌握情况。`);
            hideLoading();
            return;
        }
        console.log('✅ 用户角色验证通过: teacher');

        // 3. 检查教师信息
        console.log('3. 检查教师信息...');
        const teacherCoursesResponse = await fetch('/api/teacher/courses', {
            method: 'GET',
            credentials: 'include'
        });

        if (!teacherCoursesResponse.ok) {
            console.error('❌ 获取教师课程失败:', teacherCoursesResponse.status);
            showKnowledgeMasteryDiagnostic('无法获取教师课程信息，可能教师档案不完整。');
            hideLoading();
            return;
        }

        const teacherCoursesResult = await teacherCoursesResponse.json();
        console.log('教师课程结果:', teacherCoursesResult);

        if (!teacherCoursesResult.success) {
            console.error('❌ 教师课程信息获取失败:', teacherCoursesResult.message);
            showKnowledgeMasteryDiagnostic('教师信息验证失败：' + teacherCoursesResult.message);
            hideLoading();
            return;
        }

        const teacherCourses = teacherCoursesResult.data || [];
        console.log('✅ 教师课程列表:', teacherCourses);
        console.log('课程数量:', teacherCourses.length);

        // 4. 检查课程权限
        console.log('4. 检查课程权限...');
        const selectedCourse = teacherCourses.find(course => course.id.toString() === selectedCourseId.toString());

        if (!selectedCourse) {
            console.error('❌ 教师没有权限访问课程:', selectedCourseId);
            console.log('教师有权限的课程ID列表:', teacherCourses.map(c => c.id));
            showKnowledgeMasteryDiagnostic('您没有权限访问所选课程。请确认课程选择是否正确，或联系管理员检查课程分配。');
            hideLoading();
            return;
        }

        console.log('✅ 课程权限验证通过:', selectedCourse.courseName);

        // 5. 直接测试知识点掌握情况API
        console.log('5. 测试知识点掌握情况API...');
        const masteryResponse = await fetch(`/api/teacher/knowledge-mastery/${selectedCourseId}`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('知识点掌握API响应状态:', masteryResponse.status);

        if (!masteryResponse.ok) {
            console.error('❌ 知识点掌握API调用失败:', masteryResponse.status);

            // 尝试获取错误详情
            try {
                const errorText = await masteryResponse.text();
                console.error('API错误详情:', errorText);
                showKnowledgeMasteryDiagnostic(`API调用失败（状态码：${masteryResponse.status}）：${errorText}`);
            } catch (e) {
                showKnowledgeMasteryDiagnostic(`API调用失败，状态码：${masteryResponse.status}`);
            }
            hideLoading();
            return;
        }

        const masteryResult = await masteryResponse.json();
        console.log('知识点掌握API结果:', masteryResult);

        if (!masteryResult.success) {
            console.error('❌ 知识点掌握API返回错误:', masteryResult.message);
            showKnowledgeMasteryDiagnostic('知识点掌握情况获取失败：' + masteryResult.message);
            hideLoading();
            return;
        }

        console.log('✅ 知识点掌握API调用成功');
        console.log('返回数据长度:', masteryResult.data ? masteryResult.data.length : 'null');

        if (!masteryResult.data || masteryResult.data.length === 0) {
            console.log('⚠️ 权限验证通过，但知识点掌握数据为空');
            console.log('开始检查数据问题...');
            console.log('================================');

            // 继续数据检查流程
            await continueDataDiagnosis(selectedCourseId);
        } else {
            console.log('✅ 权限和数据都正常');
            showKnowledgeMasteryDiagnostic('权限验证通过，数据获取成功！正在刷新显示...');

            // 重新显示数据
            displayKnowledgeMastery(masteryResult.data);
        }

        console.log('========== 权限诊断完成 ==========');
        hideLoading();

    } catch (error) {
        console.error('权限诊断过程中出现错误:', error);
        showKnowledgeMasteryDiagnostic('权限诊断失败：' + error.message);
        hideLoading();
    }
}

// 继续数据诊断（权限通过后的数据检查）
async function continueDataDiagnosis(selectedCourseId) {
    try {
        // 显示诊断加载状态
        const chartContainer = document.querySelector('.knowledge-mastery-card .chart-bars');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; margin-bottom: 16px; color: #3498db;"></i>
                    <p>权限验证通过，正在检查数据问题...</p>
                    <p style="font-size: 12px;">检查课程考试、题目设置、学生答题情况等</p>
                </div>
            `;
        }

        // 强制重新加载知识点掌握情况（非静默模式，会触发调试）
        await loadKnowledgeMastery(selectedCourseId, false);

    } catch (error) {
        console.error('调试知识点掌握情况失败:', error);
        showNotification('调试过程中出现错误: ' + error.message, 'error');

        // 恢复空状态显示
        displayKnowledgeMastery([]);
    } finally {
        hideLoading();
    }
}

// 手动刷新知识点掌握情况
async function manualRefreshKnowledgeMastery() {
    if (!currentSelectedCourseId) {
        showNotification('请先选择课程', 'warning');
        return;
    }

    // 显示刷新状态
    const refreshBtn = document.querySelector('.knowledge-mastery-controls button');
    if (refreshBtn) {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
        refreshBtn.disabled = true;

        await loadKnowledgeMastery(currentSelectedCourseId);

        // 恢复按钮状态
        setTimeout(() => {
            refreshBtn.innerHTML = originalHtml;
            refreshBtn.disabled = false;
        }, 500);
    } else {
        await loadKnowledgeMastery(currentSelectedCourseId);
    }

    showNotification('知识点掌握情况已刷新', 'success');
}

// 清空知识点掌握情况显示
function clearKnowledgeMasteryDisplay() {
    const chartContainer = document.querySelector('.knowledge-mastery-card .chart-bars');
    if (!chartContainer) return;

    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
            <p>请选择课程查看知识点掌握情况</p>
        </div>
    `;

    // 停止自动刷新
    stopKnowledgeMasteryAutoRefresh();
    lastKnowledgeMasteryData = null;
}

// 更新最近课程表格
function updateRecentCoursesTable() {
    const tbody = document.querySelector('#dashboard .table-container tbody');
    if (!tbody) return;

    tbody.innerHTML = '';



    if (currentCourses.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-book" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                还没有课程，点击"新建课程"开始创建
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    currentCourses.slice(0, 5).forEach((course, index) => {
        const row = document.createElement('tr');

        // 为不同课程设置不同的图标颜色
        const iconColors = ['var(--primary-color)', 'var(--accent-color)', 'var(--success-color)', 'var(--warning-color)', 'var(--danger-color)'];
        const iconColor = iconColors[index % iconColors.length];

        // 学生数量：使用实际数据
        const studentCount = course.currentStudents || 0;
        const completionRate = 0; // 完成率暂时保持为0，可以后续添加
        const progressClass = 'progress-low';

        row.innerHTML = `
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-book" style="color: ${iconColor};"></i>
                    <span>${course.name}</span>
                </div>
            </td>
            <td>
                <span style="background: var(--accent-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                    ${course.courseCode || 'SE-0000'}
                </span>
            </td>
            <td>${studentCount}人</td>
            <td>${formatDate(course.updatedAt || course.createdAt)}</td>
            <td>
                <div class="progress-bar">
                    <div class="progress-fill ${progressClass}" style="width: ${completionRate}%;"></div>
                </div>
                <span style="font-size: 12px; color: #7f8c8d;">${completionRate}%</span>
            </td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editCourse(${course.id})" title="编辑课程">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id})" style="margin-left: 8px;" title="删除课程">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 刷新控制面板数据
async function refreshDashboardData() {
    try {
        await loadDashboardData();
        showNotification('数据已刷新', 'success');
    } catch (error) {
        console.error('刷新数据失败:', error);
        showNotification('刷新数据失败', 'error');
    }
}

// 编辑课程
async function editCourse(courseId) {
    const course = currentCourses.find(c => c.id === courseId);
    if (!course) {
        showNotification('课程不存在', 'error');
        return;
    }

    // 填充表单数据
    document.getElementById('course-name').value = course.name;
    document.getElementById('course-description').value = course.description || '';
    document.getElementById('course-credit').value = course.credit || '';
    document.getElementById('course-hours').value = course.hours || '';

    // 显示课程号（只读）
    const courseCodeDisplay = document.getElementById('course-code-display');
    const courseCodeValue = document.getElementById('course-code-value');
    if (courseCodeDisplay && courseCodeValue) {
        courseCodeValue.textContent = course.courseCode || '未设置';
        courseCodeDisplay.style.display = 'block';
    }

    // 定义编辑课程的处理函数
    const handleEditCourse = async function(e) {
        e.preventDefault();

        try {
            const courseData = {
                name: document.getElementById('course-name').value.trim(),
                description: document.getElementById('course-description').value.trim(),
                credit: parseInt(document.getElementById('course-credit').value),
                hours: parseInt(document.getElementById('course-hours').value)
            };

            showLoading('正在更新课程...');

            const response = await TeacherAPI.updateCourse(courseId, courseData);

            hideLoading();

            if (response.success) {
                showNotification('课程更新成功！', 'success');
                hideCreateCourseModal();

                // 重新加载数据
                await loadDashboardData();
        } else {
                showNotification(response.message || '更新失败', 'error');
            }

        } catch (error) {
            hideLoading();
            console.error('更新课程失败:', error);
            showNotification('更新失败，请重试', 'error');
        }
    };

    // 修改模态框标题和图标，显示课程号
    document.querySelector('#create-course-modal h3').textContent = `编辑课程 - ${course.courseCode}`;

    // 更改模态框图标为编辑图标
    const modalIcon = document.querySelector('#create-course-modal .modal-icon i');
    if (modalIcon) {
        modalIcon.className = 'fas fa-edit';
    }

    // 修改表单提交处理
    const form = document.getElementById('create-course-form');

    // 移除原有的事件监听器
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    // 修改按钮文字（在替换表单后）
    const submitButton = newForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-save"></i> 更新课程';
    }

    // 绑定编辑事件
    newForm.addEventListener('submit', handleEditCourse);

    // 重新绑定取消按钮事件（因为表单被替换了）
    const cancelBtn = newForm.querySelector('#cancel-course-create');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideCreateCourseModal);
    }

    showCreateCourseModal(true); // 传入true表示编辑模式
}

// 删除课程
async function deleteCourse(courseId) {
    const course = currentCourses.find(c => c.id === courseId);
    if (!course) {
        showNotification('课程不存在', 'error');
        return;
    }

    // 显示确认删除弹窗
    const confirmed = await showDeleteConfirmModal(course.name, course.courseCode);
    if (!confirmed) {
        return;
    }

    try {
        showLoading('正在删除课程...');

        console.log(`[DEBUG] 开始删除课程，ID: ${courseId}, 名称: ${course.name}`);
        const response = await TeacherAPI.deleteCourse(courseId);

        hideLoading();

        // 添加详细的调试信息
        console.log('[DEBUG] 删除课程API响应完整信息:', response);
        console.log('[DEBUG] 响应类型:', typeof response);
        console.log('[DEBUG] 响应success字段值:', response.success);
        console.log('[DEBUG] 响应success字段类型:', typeof response.success);
        console.log('[DEBUG] 响应message字段:', response.message);
        console.log('[DEBUG] 响应data字段:', response.data);

        // 严格检查响应是否为成功（确保响应存在且success字段为true）
        const isValidResponse = response && typeof response === 'object';
        const isSuccess = isValidResponse && response.success === true;

        console.log('[DEBUG] 响应是否有效:', isValidResponse);
        console.log('[DEBUG] 判定删除是否成功:', isSuccess);

        if (isSuccess) {
            console.log('[DEBUG] 删除成功，显示成功消息');

            // 显示详细的成功消息
            showNotification(
                '课程删除成功！已清理所有相关数据（学生选课记录、考试、资料等）。' +
                '学生端和管理端的课程列表将在2分钟内自动更新，或建议相关用户刷新页面。',
                'success'
            );

            // 延迟刷新课程列表，给用户时间看到成功消息
            setTimeout(async () => {
                console.log('[DEBUG] 3秒后自动刷新课程列表');
                await loadCourseList();
                showNotification('课程列表已更新', 'success');
            }, 3000);

        } else {
            // 处理响应错误情况
            console.error('[DEBUG] 删除课程失败，响应详情:', response);
            let errorMessage = '删除失败';

            if (isValidResponse && response.message) {
                errorMessage = response.message;

                // 针对特定错误类型提供更友好的提示
                if (errorMessage.includes('权限不足') || errorMessage.includes('没有权限')) {
                    errorMessage = '删除失败：您没有权限删除此课程，只能删除自己创建的课程';
                } else if (errorMessage.includes('用户未登录') || errorMessage.includes('未登录')) {
                    errorMessage = '删除失败：登录状态已过期，请重新登录';
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else if (errorMessage.includes('关联数据')) {
                    errorMessage = '删除失败：课程存在关联数据，请先移除相关学生或清理课程数据';
                } else if (errorMessage.includes('学生选课记录')) {
                    errorMessage = '删除失败：无法移除学生选课记录，请联系系统管理员或稍后重试';
                } else if (errorMessage.includes('课程不存在')) {
                    errorMessage = '删除失败：课程不存在或已被删除';
                }
            } else if (!isValidResponse) {
                errorMessage = '删除失败：服务器响应无效，请重试';
                console.error('[DEBUG] 无效的响应格式:', response);
            } else {
                errorMessage = '删除失败：未知错误，请重试';
            }

            console.log('[DEBUG] 最终错误信息:', errorMessage);
            showNotification(errorMessage, 'error');

            // 即使失败也尝试刷新数据，可能实际删除已经成功了
            console.log('[DEBUG] 删除失败，但仍尝试刷新数据以确认状态');
            setTimeout(async () => {
                try {
                    await loadDashboardData();
                    console.log('[DEBUG] 失败后数据刷新完成');
                } catch (reloadError) {
                    console.error('[DEBUG] 失败后数据刷新失败:', reloadError);
                }
            }, 1000);
        }

    } catch (error) {
        hideLoading();
        console.error('[DEBUG] 删除课程网络错误详情:', error);

        // 处理网络或其他异常
        let errorMessage = '删除失败，请重试';

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = '网络连接失败，请检查网络连接后重试';
        } else if (error.message && error.message.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试';
        } else if (error.message && error.message.includes('HTTP error')) {
            // 解析HTTP错误信息
            if (error.message.includes('403')) {
                errorMessage = '权限不足，无法删除该课程';
            } else if (error.message.includes('404')) {
                errorMessage = '课程不存在或已被删除';
            } else if (error.message.includes('500')) {
                errorMessage = '服务器错误，请稍后重试或联系管理员';
            } else {
                errorMessage = '删除失败：' + error.message;
            }
        } else if (error.message) {
            errorMessage = '删除失败：' + error.message;
        }

        console.log('[DEBUG] 网络错误最终信息:', errorMessage);
        showNotification(errorMessage, 'error');

        // 即使网络错误也尝试刷新一下页面，可能实际已经删除成功了
        console.log('[DEBUG] 网络错误后，尝试刷新数据检查实际状态');
        setTimeout(async () => {
            try {
                await loadDashboardData();
                console.log('[DEBUG] 网络错误后数据刷新完成');
            } catch (reloadError) {
                console.error('[DEBUG] 网络错误后数据刷新失败:', reloadError);
            }
        }, 1500);
    }
}

// 重置新建课程模态框
function resetCreateCourseModal() {
    // 重置模态框标题和图标
    document.querySelector('#create-course-modal h3').textContent = '新建课程';

    // 重置模态框图标为添加图标
    const modalIcon = document.querySelector('#create-course-modal .modal-icon i');
    if (modalIcon) {
        modalIcon.className = 'fas fa-plus-circle';
    }

    // 直接重置表单，不要替换DOM元素
    const form = document.getElementById('create-course-form');
    if (form) {
        form.reset(); // 重置表单数据
    }

    // 重置按钮文字
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-save"></i> 创建课程';
    }

    // 隐藏课程号显示区域（在编辑模式时会显示）
    const courseCodeDisplay = document.getElementById('course-code-display');
    if (courseCodeDisplay) {
        courseCodeDisplay.style.display = 'none';
    }
}

// 加载课程列表
async function loadCourseList() {
    try {
        console.log('开始加载课程列表...');
        const response = await TeacherAPI.getCourses();
        console.log('API响应:', response);

        let courses = response.data || [];
        console.log('课程数据:', courses);

        // 根据课程ID去重
        const uniqueCourses = [];
        const seenIds = new Set();
        for (const course of courses) {
            if (!seenIds.has(course.id)) {
                seenIds.add(course.id);
                uniqueCourses.push(course);
            }
        }

        currentCourses = uniqueCourses;
        console.log('处理后的课程数据:', currentCourses);

        // 更新各种课程选择框
        updateCourseSelects();

        // 通知知识库模块课程数据已更新
        if (typeof updateKnowledgeUploadCourseSelects === 'function') {
            updateKnowledgeUploadCourseSelects();
        }

    } catch (error) {
        console.error('加载课程列表失败:', error);
        showNotification('加载课程列表失败，请检查网络连接', 'error');
    }
}

// 更新课程选择框
function updateCourseSelects() {
    const selects = [
        'material-course-select',
        'outline-course-select',
        'exam-course-select',
        'improve-course-select'
    ];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">请选择课程</option>';
            currentCourses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                select.appendChild(option);
            });
        }
    });
    }
// 文件上传功能
function setupFileUpload() {
    const uploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('file-input');

    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// 处理文件选择
function handleFileSelect(file) {
    const uploadPrompt = document.querySelector('.upload-prompt');
    if (uploadPrompt) {
        uploadPrompt.innerHTML = `
            <i class="fas fa-file"></i>
            <p>已选择文件: ${file.name}</p>
            <p class="upload-tips">文件大小: ${formatFileSize(file.size)}</p>
        `;
    }
}

// 上传课程资料
async function uploadMaterial() {
    try {
        const courseId = document.getElementById('material-course-select').value;
        const materialType = document.getElementById('material-type').value;
        const description = document.getElementById('material-description').value;
        const fileInput = document.getElementById('file-input');

        if (!courseId) {
            showNotification('请选择课程', 'warning');
            return;
        }

        if (!fileInput.files[0]) {
            showNotification('请选择要上传的文件', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('materialType', materialType);
        formData.append('description', description);
        formData.append('file', fileInput.files[0]);

        showLoading('正在上传文件...');

        const response = await TeacherAPI.uploadFile(formData);

        hideLoading();

        if (response.success) {
            showNotification('资料上传成功！', 'success');
            clearUploadForm();
            await loadMaterialsData();
            } else {
            showNotification(response.message || '上传失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('上传失败:', error);
        showNotification('上传失败，请重试', 'error');
    }
}

// 清空上传表单
function clearUploadForm() {
    document.getElementById('material-course-select').value = '';
    document.getElementById('material-type').value = 'PPT';
    document.getElementById('material-description').value = '';
    document.getElementById('file-input').value = '';

    const uploadPrompt = document.querySelector('.upload-prompt');
    if (uploadPrompt) {
        uploadPrompt.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>点击上传文件或拖拽文件至此区域</p>
            <p class="upload-tips">支持 PDF、Word、PPT、TXT 格式，单个文件不超过50MB</p>
        `;
    }
}

// 加载课程资料
async function loadCourseMaterials() {
    const courseId = document.getElementById('outline-course-select').value;
    const loadingDiv = document.getElementById('materials-loading');
    const selectionDiv = document.getElementById('materials-selection');
    const emptyDiv = document.getElementById('materials-empty');
    const materialsListDiv = document.getElementById('materials-list');

    // 重置显示状态
    loadingDiv.style.display = 'none';
    selectionDiv.style.display = 'none';
    emptyDiv.style.display = 'none';

    if (!courseId) {
        emptyDiv.style.display = 'block';
        return;
    }

    try {
        loadingDiv.style.display = 'block';
        console.log('开始加载课程资料，courseId:', courseId);

        // 获取课程资料
        const response = await fetch(`/api/teacher/courses/${courseId}/materials`);
        console.log('API响应状态:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API响应结果:', result);

        loadingDiv.style.display = 'none';

        if (result.success) {
            if (result.data && result.data.length > 0) {
                console.log('找到课程资料数量:', result.data.length);
                // 显示资料选择区域
                selectionDiv.style.display = 'block';

                // 渲染资料列表
                materialsListDiv.innerHTML = result.data.map((material, index) => `
                    <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; border-radius: 6px; background: #f8f9fa;">
                        <input type="checkbox" id="material-${material.id}" value="${material.id}"
                               style="margin-right: 10px; cursor: pointer; width: 12px; height: 12px;" onchange="updateSelectedMaterials()">
                        <label for="material-${material.id}" style="cursor: pointer; flex: 1; margin: 0;">
                            <i class="fas ${getFileTypeIcon(material.originalName)}" style="margin-right: 8px; color: #5b8cff;"></i>
                            <span style="font-weight: 500;">${material.originalName || material.filename}</span>
                            <span style="color: #7f8c8d; font-size: 12px; margin-left: 8px;">(${formatFileSize(material.fileSize)})</span>
                        </label>
                    </div>
                `).join('');
            } else {
                console.log('该课程暂无资料');
                emptyDiv.style.display = 'block';
            }
        } else {
            console.error('API返回错误:', result.message);
            emptyDiv.style.display = 'block';
            showNotification(result.message || '获取课程资料失败', 'error');
        }

    } catch (error) {
        loadingDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        console.error('加载课程资料失败:', error);
        showNotification('加载课程资料失败: ' + error.message, 'error');
    }
}

// 全选资料
function selectAllMaterials() {
    const checkboxes = document.querySelectorAll('#materials-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelectedMaterials();
}

// 清空选择
function clearAllMaterials() {
    const checkboxes = document.querySelectorAll('#materials-list input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelectedMaterials();
}

// 更新选中的资料
function updateSelectedMaterials() {
    const checkboxes = document.querySelectorAll('#materials-list input[type="checkbox"]:checked');
    const selectedCount = checkboxes.length;

    // 可以在这里显示选中数量
    console.log(`已选择 ${selectedCount} 个资料`);
}

// RAG智能检索：选择课程后的处理（无需加载具体资料）
async function loadExamCourseMaterials() {
    const courseId = document.getElementById('exam-course-select').value;

    if (!courseId) {
        console.log('未选择课程');
        return;
    }

    // 使用RAG技术，无需加载具体资料列表
    // 系统会自动从知识库中检索相关内容
    console.log('已选择课程:', courseId, '- 将使用RAG技术自动从知识库检索相关内容');
}

// RAG智能检索：无需手动选择资料的相关函数已移除
// 系统将自动从知识库中检索最相关的内容

// 生成教学大纲（基于知识库）
async function generateOutline() {
    try {
        const courseId = document.getElementById('outline-course-select').value;
        const hours = document.getElementById('outline-hours').value;
        const requirements = document.getElementById('outline-requirements').value;

        if (!courseId) {
            showNotification('请选择课程', 'warning');
            return;
        }

        if (!hours || hours <= 0) {
            showNotification('请输入有效的教学学时', 'warning');
            return;
        }

        // 检查是否启用了联网搜索
        const webSearchEnabled = document.getElementById('enable-web-search-outline').checked;

        if (webSearchEnabled) {
            // 获取课程名称
            const courseSelect = document.getElementById('outline-course-select');
            const courseName = courseSelect.options[courseSelect.selectedIndex].text;

            // 智能生成搜索查询
            const searchQuery = generateSmartSearchQuery(courseName, requirements, 'outline');

            // 显示确认对话框
            const confirmed = await showWebSearchConfirmDialog('教学大纲', searchQuery);
            if (!confirmed) {
                return;
            }

            // 执行联网搜索生成
            await generateOutlineWithWebSearch(courseId, hours, requirements, searchQuery);
        } else {
            // 执行原有的RAG生成
            await generateOutlineWithRAG(courseId, hours, requirements);
        }

    } catch (error) {
        hideLoading();
        console.error('生成大纲失败:', error);
        showNotification('生成失败，请重试', 'error');
    }
}

// 原有的RAG生成逻辑
async function generateOutlineWithRAG(courseId, hours, requirements) {
    showLoading('🔍 正在使用RAG技术从知识库中搜索相关内容...<br>🤖 AI将基于检索到的知识块生成教学大纲...');

    const response = await TeacherAPI.generateOutline({
        courseId: parseInt(courseId),
        requirements: requirements || '',
        hours: parseInt(hours)
    });

    hideLoading();

    if (response.success) {
        console.log('教学大纲生成成功，响应数据:', response);
        showNotification('🎉 基于知识库的教学大纲生成成功！', 'success');
        displayOutlineResult(response.data);
    } else {
        console.error('教学大纲生成失败:', response);
        showNotification(response.message || '生成失败', 'error');
    }
}

// 联网搜索生成逻辑
async function generateOutlineWithWebSearch(courseId, hours, requirements, searchQuery) {
    showLoading('🌐 正在联网搜索相关信息...<br>🤖 AI将结合网络搜索结果生成教学大纲...');

    // 获取课程名称
    const courseSelect = document.getElementById('outline-course-select');
    const courseName = courseSelect.options[courseSelect.selectedIndex].text;

    const response = await fetch('/api/web-search/outline', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            courseName: courseName,
            requirements: requirements || '',
            hours: parseInt(hours),
            searchQuery: searchQuery
        })
    });

    const result = await response.json();
    hideLoading();

    if (result.success) {
        console.log('联网搜索生成大纲成功:', result);
        showNotification('🎉 基于联网搜索的教学大纲生成成功！', 'success');
        displayWebSearchOutlineResult(result.data);
    } else {
        console.error('联网搜索生成大纲失败:', result);
        showNotification(result.message || '联网搜索生成失败', 'error');
    }
}

// 清空表单
function clearOutlineForm() {
    document.getElementById('outline-course-select').value = '';
    document.getElementById('outline-hours').value = '';
    document.getElementById('outline-requirements').value = '';

    // 隐藏结果区域
    const resultDiv = document.getElementById('outline-result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

// 显示教学大纲结果
function displayOutlineResult(outlineData) {
    console.log('开始显示教学大纲结果，数据:', outlineData);
    const resultDiv = document.getElementById('outline-result');
    const contentDiv = document.getElementById('outline-content');

    console.log('DOM元素检查:', {
        resultDiv: !!resultDiv,
        contentDiv: !!contentDiv,
        outlineData: !!outlineData
    });

    // 设置当前生成的大纲数据
    currentGeneratedOutline = {
        courseName: outlineData.courseName || '教学大纲',
        hours: outlineData.hours,
        requirements: outlineData.requirements,
        content: outlineData.outlineContent,
        type: 'rag'
    };

    if (!resultDiv) {
        console.error('找不到 outline-result 元素');
        return;
    }

    if (!contentDiv) {
        console.error('找不到 outline-content 元素');
        return;
    }

    if (!outlineData) {
        console.error('outlineData 为空');
        return;
    }

    // 获取原始Markdown内容
    const originalMarkdown = outlineData.teachingDesign || '暂无内容';

    // 格式化教学大纲内容
    const formattedContent = formatOutlineContent(originalMarkdown);

    // 使用与试卷预览相同的卡片结构
    contentDiv.innerHTML = `
        <div class="card-header">
            <i class="fas fa-file-alt"></i> 教学大纲预览
            <div class="card-actions">

                <button class="btn btn-sm btn-secondary" onclick="downloadOutline()">
                        <i class="fas fa-download"></i> 下载大纲
                    </button>
                <button class="btn btn-sm btn-primary" onclick="editOutline()">
                        <i class="fas fa-edit"></i> 编辑大纲
                    </button>
                </div>
            </div>
        <div id="outline-content-body" style="padding: 24px;">
            <div class="outline-header">
                <h3>${extractOutlineTitle(originalMarkdown)}</h3>
                <div class="outline-info">
                    <span>课程：${outlineData.course?.name || '未知课程'}</span>
                    <span>学时：${outlineData.hours || 'N/A'}学时</span>
                    <span>生成时间：${formatDate(outlineData.createdAt) || '刚才'}</span>
                </div>
            </div>
            <div class="outline-content">
                ${formattedContent}
            </div>
        </div>
    `;

    // 保存原始Markdown内容和大纲ID到DOM属性中
    const outlineContentDiv = contentDiv.querySelector('.outline-content');
    if (outlineContentDiv) {
        outlineContentDiv.setAttribute('data-markdown', originalMarkdown);
        outlineContentDiv.setAttribute('data-outline-id', outlineData.id);
    }

    // 保存当前大纲数据到全局变量
    window.currentOutlineData = outlineData;

    resultDiv.style.display = 'block';
}



// Markdown解析器 - 改进版
function parseMarkdown(markdown) {
    if (!markdown) return '暂无内容';

    console.log('开始解析Markdown:', markdown.substring(0, 200) + '...');

    let html = markdown;

    // 先进行表格解析（在其他解析之前）
    html = parseTableContent(html);

    // 转义HTML特殊字符（但保留已生成的表格HTML）
    html = html.replace(/&(?!amp;|lt;|gt;|#)/g, '&amp;');

    // 解析标题 (# ## ### ####)
    html = html.replace(/^#### (.*$)/gim, '<h4 style="color: #7f8c8d; margin: 16px 0 8px 0; font-size: 16px;">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 style="color: #2c3e50; margin: 20px 0 12px 0; font-size: 18px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color: #2980b9; margin: 24px 0 16px 0; font-size: 20px; border-bottom: 2px solid #3498db; padding-bottom: 8px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="color: #e74c3c; margin: 32px 0 20px 0; font-size: 24px; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">$1</h1>');

    // 解析粗体 **text** 或 __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2c3e50; font-weight: 600;">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong style="color: #2c3e50; font-weight: 600;">$1</strong>');

    // 解析斜体 *text* 或 _text_
    html = html.replace(/\*(.*?)\*/g, '<em style="color: #7f8c8d; font-style: italic;">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em style="color: #7f8c8d; font-style: italic;">$1</em>');

    // 解析行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code style="background: #f1f2f6; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Consolas, monospace; font-size: 13px;">$1</code>');

    // 解析链接 [text](url) - 使用安全提示
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="javascript:void(0)" onclick="showTeacherSecurityWarning(\'$2\')" style="color: #3498db; text-decoration: none; cursor: pointer;" title="点击安全访问: $2">$1</a>');

    // 解析无序列表 - item 或 * item
    html = html.replace(/^[\s]*[-*+]\s+(.*)$/gim, '<li style="margin: 4px 0; color: #2c3e50;">$1</li>');

    // 解析有序列表 1. item
    html = html.replace(/^[\s]*\d+\.\s+(.*)$/gim, '<li style="margin: 4px 0; color: #2c3e50; list-style-type: decimal;">$1</li>');

    // 将连续的li标签包装在ul或ol中
    html = html.replace(/(<li[^>]*>.*?<\/li>[\s]*)+/g, function(match) {
        // 检查是否包含有序列表项
        if (match.includes('list-style-type: decimal')) {
            return '<ol style="margin: 12px 0; padding-left: 24px; color: #2c3e50;">' + match + '</ol>';
        } else {
            return '<ul style="margin: 12px 0; padding-left: 24px; color: #2c3e50; list-style-type: disc;">' + match + '</ul>';
        }
    });

    // 解析代码块 ```code```
    html = html.replace(/```([^`]+)```/g, '<pre style="background: #2d3748; color: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; font-family: Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5;"><code>$1</code></pre>');

    // 解析分隔线 --- 或 ***
    html = html.replace(/^[\s]*[-*]{3,}[\s]*$/gim, '<hr style="border: none; height: 2px; background: linear-gradient(to right, #3498db, transparent); margin: 24px 0;">');

    // 解析引用 > text
    html = html.replace(/^>\s*(.*)$/gim, '<blockquote style="border-left: 4px solid #3498db; margin: 16px 0; padding: 8px 16px; background: #f8f9fa; color: #2c3e50; font-style: italic;">$1</blockquote>');

    // 解析段落 (连续两个换行符分隔)
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs.map(p => {
        p = p.trim();
        if (p && !p.startsWith('<') && !p.match(/^[\s]*$/)) {
            return `<p style="margin: 12px 0; line-height: 1.7; color: #2c3e50;">${p}</p>`;
        }
        return p;
    }).join('\n\n');

    // 处理单独的换行
    html = html.replace(/\n/g, '<br>');

    console.log('Markdown解析完成');
    return html;
}

// 专门的表格解析函数 - 更强大的识别能力
function parseTableContent(html) {
    console.log('开始表格解析...');

    // 更宽松的表格匹配 - 处理各种可能的格式
    return html.replace(/(\|[^|\r\n]*\|[\r\n]*)+/gm, function(match) {
        console.log('检测到潜在表格:', match);

        const lines = match.trim().split(/[\r\n]+/).map(line => line.trim()).filter(line => line);

        if (lines.length < 2) return match; // 至少需要2行

        // 检查是否有包含|的行
        const tableLines = lines.filter(line => line.includes('|'));
        if (tableLines.length < 2) return match;

        // 寻找分隔行（包含---的行）
        let separatorIndex = -1;
        for (let i = 0; i < tableLines.length; i++) {
            if (tableLines[i].match(/\|[\s-|:]+\|/) || tableLines[i].includes('---')) {
                separatorIndex = i;
                break;
            }
        }

        let headers = [];
        let rows = [];

        if (separatorIndex !== -1) {
            // 标准Markdown表格格式
            const headerLines = tableLines.slice(0, separatorIndex);
            const dataLines = tableLines.slice(separatorIndex + 1);

            // 解析表头
            if (headerLines.length > 0) {
                headers = headerLines[0].split('|').map(h => h.trim()).filter(h => h);
            }

            // 解析数据行
            dataLines.forEach(line => {
                const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                if (cells.length > 0) {
                    rows.push(cells);
                }
            });
        } else {
            // 非标准格式，尝试智能解析
            // 假设第一行是表头
            if (tableLines.length > 0) {
                headers = tableLines[0].split('|').map(h => h.trim()).filter(h => h);

                // 其余行作为数据行
                for (let i = 1; i < tableLines.length; i++) {
                    const cells = tableLines[i].split('|').map(cell => cell.trim()).filter(cell => cell);
                    if (cells.length > 0) {
                        rows.push(cells);
                    }
                }
            }
        }

        // 如果没有解析出有效表格，返回原内容
        if (headers.length === 0 || rows.length === 0) {
            console.log('未能解析出有效表格');
            return match;
        }

        console.log('表格解析成功:', { headers, rows: rows.length });

        // 生成HTML表格
        let tableHtml = '<table class="teaching-design-table">';

        // 表头
        tableHtml += '<thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${header}</th>`;
        });
        tableHtml += '</tr></thead>';

        // 表体
        tableHtml += '<tbody>';
        rows.forEach(row => {
            tableHtml += '<tr>';
            // 确保每行都有足够的列
            for (let i = 0; i < headers.length; i++) {
                const cell = row[i] || '';
                // 处理表格内容
                let processedCell = cell.replace(/\n/g, '<br>');
                // 处理表格内的粗体标记
                processedCell = processedCell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                tableHtml += `<td>${processedCell}</td>`;
            }
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody>';

        tableHtml += '</table>';

        console.log('表格HTML生成完成');
        return tableHtml;
    });
}

// 格式化教学大纲内容 (优化版，增强格式规范和联网搜索信息显示)
function formatOutlineContent(content) {
    if (!content) return '<div style="text-align: center; color: #7f8c8d; padding: 40px; font-style: italic;">暂无内容</div>';

    console.log('🎨 开始格式化教学大纲内容，长度:', content.length);
    console.log('📄 内容预览:', content.substring(0, 100));

    // 检测并优化HTML表格
    if (content.includes('<table') && content.includes('</table>')) {
        console.log('📊 检测到HTML表格，进行样式优化');
        let optimizedHtml = content;

        // 优化表格样式
        optimizedHtml = optimizedHtml.replace(/<table([^>]*)>/gi,
            '<table$1 style="border-collapse: collapse !important; width: 100% !important; margin: 24px 0 !important; font-size: 14px !important; box-shadow: 0 6px 20px rgba(0,0,0,0.12) !important; border-radius: 12px !important; overflow: hidden !important; background: white !important; font-family: \'Segoe UI\', \'PingFang SC\', sans-serif;">');

        // 优化表头样式
        optimizedHtml = optimizedHtml.replace(/<tr([^>]*?)style=['"][^'"]*['"]([^>]*)>/gi,
            '<tr$1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; height: 55px !important;"$2>');

        // 优化表头单元格
        optimizedHtml = optimizedHtml.replace(/<th([^>]*)>/gi,
            '<th$1 style="padding: 16px 20px !important; text-align: center !important; font-weight: 700 !important; border: none !important; font-size: 15px !important; letter-spacing: 0.8px !important; text-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;">');

        // 优化表格数据单元格
        optimizedHtml = optimizedHtml.replace(/<td([^>]*)>/gi,
            '<td$1 style="padding: 16px 20px !important; border: 1px solid #e0e6ed !important; vertical-align: middle !important; line-height: 1.7 !important; transition: all 0.2s ease !important; min-height: 60px !important;">');

        // 添加行间颜色交替和悬停效果
        optimizedHtml = optimizedHtml.replace(/<tbody>/gi, '<tbody>');

        // 检测行业搜索信息关键词并高亮显示
        const industryKeywords = ['招聘', '岗位', '薪资', '技能要求', '就业', '行业', '发展趋势', '能力要求', 'Java开发', 'Python开发', '前端开发', '算法工程师', '数据分析'];
        industryKeywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            optimizedHtml = optimizedHtml.replace(regex, '<span style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436; padding: 2px 6px; border-radius: 4px; font-weight: 600; box-shadow: 0 2px 4px rgba(253, 203, 110, 0.3);">$1</span>');
        });

        return optimizedHtml;
    }

    // 检查并优化其他HTML内容
    if (content.includes('<') && content.includes('>')) {
        console.log('🏷️ 检测到HTML标签，进行格式优化');
        let html = content;

        // 优化标题样式
        html = html.replace(/<h1([^>]*)>/gi, '<h1$1 style="color: #2c3e50; margin: 0 0 32px 0; font-size: 28px; font-weight: 800; text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); line-height: 1.4;">');
        html = html.replace(/<h2([^>]*)>/gi, '<h2$1 style="color: #2c3e50; margin: 32px 0 20px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #3498db; padding-bottom: 12px; position: relative; background: linear-gradient(135deg, #3498db, #2980b9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">');
        html = html.replace(/<h3([^>]*)>/gi, '<h3$1 style="color: #2c3e50; margin: 24px 0 16px 0; font-size: 18px; font-weight: 600; border-left: 4px solid #3498db; padding-left: 12px; background: linear-gradient(90deg, rgba(52, 152, 219, 0.1) 0%, transparent 100%); padding: 8px 12px; border-radius: 4px;">');
        html = html.replace(/<h4([^>]*)>/gi, '<h4$1 style="color: #34495e; margin: 20px 0 12px 0; font-size: 16px; font-weight: 600; padding-left: 8px; border-left: 3px solid #95a5a6;">');

        // 优化段落样式
        html = html.replace(/<p([^>]*)>/gi, '<p$1 style="margin: 16px 0; line-height: 1.8; color: #2c3e50; text-align: justify; padding: 12px; background: rgba(248, 249, 250, 0.5); border-radius: 6px; border-left: 3px solid #ecf0f1; font-size: 15px;">');

        // 检测并高亮行业信息
        const industryKeywords = ['招聘', '岗位', '薪资', '技能要求', '就业', '行业', '发展趋势', '能力要求', 'Java开发', 'Python开发', '前端开发', '算法工程师', '数据分析', '企业级', '工作场景', '实际应用'];
        industryKeywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            html = html.replace(regex, '<span style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436; padding: 2px 6px; border-radius: 4px; font-weight: 600; box-shadow: 0 2px 4px rgba(253, 203, 110, 0.3); margin: 0 2px;">💼 $1</span>');
        });

        // 添加整体容器样式
        html = `<div style="font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.7; color: #2c3e50; max-width: 100%; overflow-x: auto; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 12px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">${html}</div>`;

        return html;
    }

    console.log('📝 使用增强Markdown解析器');
    // 如果是纯文本或Markdown内容，使用增强的Markdown解析器
    return parseEnhancedMarkdown(content);
}

// 增强的Markdown解析器（专门优化教学大纲显示）
function parseEnhancedMarkdown(markdown) {
    let html = markdown;

    // 转义HTML特殊字符（保护现有HTML）
    const htmlBlocks = [];
    html = html.replace(/<[^>]+>/g, (match) => {
        htmlBlocks.push(match);
        return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
    });

    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // 恢复HTML块
    htmlBlocks.forEach((block, index) => {
        html = html.replace(`__HTML_BLOCK_${index}__`, block);
    });

    // 解析Markdown标题
    html = html.replace(/^# (.*$)/gim, '<h1 style="color: #2c3e50; margin: 0 0 32px 0; font-size: 28px; font-weight: 800; text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); line-height: 1.4;">$1</h1>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="color: #2c3e50; margin: 32px 0 20px 0; font-size: 22px; font-weight: 700; border-bottom: 3px solid #3498db; padding-bottom: 12px;">$1</h2>');
    html = html.replace(/^### (.*$)/gim, '<h3 style="color: #2c3e50; margin: 24px 0 16px 0; font-size: 18px; font-weight: 600; border-left: 4px solid #3498db; padding-left: 12px; background: linear-gradient(90deg, rgba(52, 152, 219, 0.1) 0%, transparent 100%); padding: 8px 12px; border-radius: 4px;">$1</h3>');

    // 解析强调和格式
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2c3e50; font-weight: 700; background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(52, 152, 219, 0.05) 100%); padding: 2px 6px; border-radius: 4px;">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em style="color: #34495e; font-style: italic; font-weight: 500;">$1</em>');

    // 解析列表
    html = html.replace(/^[\s]*[-*+]\s+(.*)$/gim, '<li style="margin: 8px 0; color: #2c3e50; padding: 6px 0; position: relative; padding-left: 20px;"><span style="position: absolute; left: 0; color: #3498db; font-weight: bold;">•</span>$1</li>');
    html = html.replace(/^[\s]*\d+\.\s+(.*)$/gim, '<li style="margin: 8px 0; color: #2c3e50; padding: 6px 0; list-style-type: decimal;">$1</li>');

    // 包装列表
    html = html.replace(/(<li[^>]*>.*?<\/li>[\s]*)+/g, function(match) {
        if (match.includes('list-style-type: decimal')) {
            return '<ol style="margin: 16px 0; padding-left: 32px; background: rgba(52, 152, 219, 0.02); border-radius: 8px; padding: 16px; border-left: 4px solid #3498db;">' + match + '</ol>';
        } else {
            return '<ul style="margin: 16px 0; padding-left: 32px; background: rgba(46, 204, 113, 0.02); border-radius: 8px; padding: 16px; border-left: 4px solid #2ecc71; list-style: none;">' + match + '</ul>';
        }
    });

    // 处理段落
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs.map(p => {
        const trimmedP = p.trim();
        if (trimmedP === '' || trimmedP.match(/^<[h1-6]|^<ul|^<ol/)) {
            return trimmedP;
        }
        return `<p style="margin: 16px 0; line-height: 1.8; color: #2c3e50; text-align: justify; padding: 12px; background: rgba(248, 249, 250, 0.5); border-radius: 6px; border-left: 3px solid #ecf0f1; font-size: 15px;">${trimmedP}</p>`;
    }).join('\n');

    // 检测并高亮行业相关信息
    const industryKeywords = ['招聘', '岗位', '薪资', '技能要求', '就业', '行业', '发展趋势', '能力要求', 'Java开发', 'Python开发', '前端开发', '算法工程师', '数据分析', '企业级', '工作场景', '实际应用'];
    industryKeywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword})`, 'gi');
        html = html.replace(regex, '<span style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); color: #2d3436; padding: 2px 6px; border-radius: 4px; font-weight: 600; box-shadow: 0 2px 4px rgba(253, 203, 110, 0.3); margin: 0 2px;">💼 $1</span>');
    });

    // 添加整体容器
    html = `<div style="font-family: 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; line-height: 1.7; color: #2c3e50; max-width: 100%; overflow-x: auto; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 20px; border-radius: 12px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">${html}</div>`;

    return html;
}

// 提取教学大纲标题（显示用）
function extractOutlineTitle(content) {
    return 'AI生成的大纲';
}

// 提取AI生成的原始标题（文件名用）
function extractOriginalOutlineTitle(content) {
    if (!content) return 'AI生成的教学大纲';

    // 尝试匹配《课程名》XXXX教学大纲格式
    const titleMatch = content.match(/《[^》]+》[^教学大纲]*教学大纲/);
    if (titleMatch) {
        return titleMatch[0];
    }

    // 尝试匹配第一个一级标题
    const h1Match = content.match(/^# (.+)$/m);
    if (h1Match) {
        // 如果第一个标题包含教学大纲相关字样，就使用它
        if (h1Match[1].includes('教学大纲') || h1Match[1].includes('教学设计')) {
            return h1Match[1];
        }
    }

    // 尝试匹配第二个一级标题（可能第一个是其他内容）
    const allH1Matches = content.match(/^# (.+)$/gm);
    if (allH1Matches && allH1Matches.length > 1) {
        for (let i = 0; i < allH1Matches.length; i++) {
            const match = allH1Matches[i].replace(/^# /, '');
            if (match.includes('教学大纲') || match.includes('教学设计')) {
                return match;
            }
        }
    }

    // 尝试匹配第一个二级标题
    const h2Match = content.match(/^## (.+)$/m);
    if (h2Match) {
        if (h2Match[1].includes('教学大纲') || h2Match[1].includes('教学设计')) {
            return h2Match[1];
        }
    }

    // 如果都没找到，返回默认标题
    return 'AI生成的教学大纲';
}

// 下载教学大纲
function downloadOutline() {
    const outlineContentDiv = document.querySelector('.outline-content');

    // 尝试获取原始Markdown内容，如果没有则使用文本内容
    const markdownContent = outlineContentDiv.getAttribute('data-markdown');
    const content = markdownContent || outlineContentDiv.textContent;
    const fileExtension = markdownContent ? '.md' : '.txt';

    // 使用AI凝练的原始标题作为文件名
    const originalTitle = extractOriginalOutlineTitle(content);
    // 清理文件名中的特殊字符
    const cleanTitle = originalTitle.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    const fileName = `${cleanTitle}${fileExtension}`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 编辑教学大纲
function editOutline() {
    const contentDiv = document.querySelector('.outline-content');

    // 获取当前的原始Markdown内容
    // 从全局变量或DOM属性中获取原始内容
    let currentMarkdown = contentDiv.getAttribute('data-markdown') || contentDiv.textContent;

    // 创建编辑界面
    const editContainer = document.createElement('div');
    editContainer.className = 'outline-edit-container';

    // 创建Markdown编辑器
    const textarea = document.createElement('textarea');
    textarea.className = 'outline-edit-textarea';
    textarea.value = currentMarkdown;
    textarea.placeholder = '在此输入Markdown格式的教学大纲...';

    // 创建预览区域
    const previewDiv = document.createElement('div');
    previewDiv.className = 'outline-edit-preview';

    // 实时预览功能
    function updatePreview() {
        previewDiv.innerHTML = parseMarkdown(textarea.value);
    }

    textarea.addEventListener('input', updatePreview);
    updatePreview(); // 初始预览

    // 添加标签
    const leftLabel = document.createElement('div');
    leftLabel.className = 'edit-label';
    leftLabel.innerHTML = '<i class="fas fa-edit"></i> Markdown编辑器';

    const rightLabel = document.createElement('div');
    rightLabel.className = 'edit-label';
    rightLabel.innerHTML = '<i class="fas fa-eye"></i> 实时预览';

    // 组装编辑界面
    const leftPanel = document.createElement('div');
    leftPanel.className = 'outline-edit-panel';
    leftPanel.appendChild(leftLabel);
    leftPanel.appendChild(textarea);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'outline-edit-panel';
    rightPanel.appendChild(rightLabel);
    rightPanel.appendChild(previewDiv);

    editContainer.appendChild(leftPanel);
    editContainer.appendChild(rightPanel);

    // 创建按钮组（在编辑容器外面）
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-actions';
    buttonGroup.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 12px;
        justify-content: center;
        padding: 16px 0;
    `;

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> 取消';
    cancelBtn.onclick = function() {
        contentDiv.innerHTML = parseMarkdown(currentMarkdown);
        contentDiv.setAttribute('data-markdown', currentMarkdown);
    };

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存修改';
    saveBtn.onclick = function() {
        const newMarkdown = textarea.value;
        contentDiv.innerHTML = parseMarkdown(newMarkdown);
        contentDiv.setAttribute('data-markdown', newMarkdown); // 保存原始Markdown
        showNotification('教学大纲已保存', 'success');
    };

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(saveBtn);

    // 替换内容：先添加编辑容器，再添加按钮组
    contentDiv.innerHTML = '';
    contentDiv.appendChild(editContainer);
    contentDiv.appendChild(buttonGroup);

    // 聚焦到编辑器
    textarea.focus();
}

// 发布通知
async function publishNotice() {
    try {
        const title = document.getElementById('notice-title').value.trim();
        const content = document.getElementById('notice-content').value.trim();
        const courseId = document.getElementById('notice-target-select').value;
        const pushTime = document.getElementById('notice-push-time').value;
        const scheduleTime = document.getElementById('notice-schedule-time').value;

        if (!title || !content) {
            showNotification('请填写标题和内容', 'warning');
            return;
        }

        // 验证课程选择
        if (!courseId) {
            showNotification('请选择要发送的课程', 'warning');
            return;
        }

        // 验证定时推送时间
        if (pushTime === 'scheduled') {
            if (!scheduleTime) {
                showNotification('请选择推送时间', 'warning');
                return;
            }

            const selectedTime = new Date(scheduleTime);
            const now = new Date();
            if (selectedTime <= now) {
                showNotification('推送时间不能早于当前时间', 'warning');
                return;
            }
        }

        const noticeData = {
            title: title,
            content: content,
            targetType: 'COURSE',
            courseId: parseInt(courseId),
            pushTime: pushTime
        };

        // 如果是定时推送，添加推送时间
        if (pushTime === 'scheduled' && scheduleTime) {
            noticeData.scheduledTime = scheduleTime;
        }

        showLoading('正在发布通知...');

        // 直接调用API而不是通过TeacherAPI
        const response = await fetch('http://localhost:8080/api/teacher/notices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(noticeData)
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            const message = pushTime === 'now' ? '通知发布成功！' : '通知已设置定时推送！';
            showNotification(message, 'success');
            clearNoticeForm();
            await loadNoticesData();
        } else {
            showNotification(result.message || '发布失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('发布通知失败:', error);
        showNotification('发布失败，请重试', 'error');
    }
}

// 生成试卷
async function generateExam() {
    try {
        // 必填项验证
        const courseId = document.getElementById('exam-course-select').value;
        const examTitle = document.getElementById('exam-title').value.trim();
        const duration = document.getElementById('exam-duration').value;
        const totalScore = document.getElementById('exam-total-score').value;

        // 1. 验证选择课程（必填）
        if (!courseId) {
            showNotification('请选择课程 *', 'warning');
            return;
        }

        // 2. 验证测评名称（必填）
        console.log('输入框值检查:', {
            'exam-title元素': document.getElementById('exam-title'),
            '原始值': document.getElementById('exam-title')?.value,
            '去空格后': examTitle,
            '长度': examTitle.length
        });
        if (!examTitle) {
            showNotification('请输入测评名称 *', 'warning');
            return;
        }

        // 2. 验证课程知识库（RAG自动检索，无需手动选择资料）
        // 注意：现在使用RAG技术自动从整个课程知识库中检索相关内容
        const selectedMaterials = []; // 保持空数组，后端将使用RAG检索

        // 3. 验证题型设置（必填）
        const questionTypes = {};
        ['multiple-choice', 'fill-blank', 'true-false', 'answer'].forEach(type => {
            const checkbox = document.getElementById(`q-${type}`);
            const count = document.getElementById(`q-${type}-count`);
            const score = document.getElementById(`q-${type}-score`);
            if (checkbox && checkbox.checked && count) {
                const questionCount = parseInt(count.value) || 0;
                const questionScore = parseInt(score.value) || getDefaultScoreForType(type);
                if (questionCount > 0) {
                    questionTypes[type] = {
                        count: questionCount,
                        scorePerQuestion: questionScore
                    };
                }
            }
        });

        // 处理自定义题型
        const customCheckbox = document.getElementById('q-custom');
        const customRequirement = document.getElementById('q-custom-requirement');
        const customCount = document.getElementById('q-custom-count');
        const customScore = document.getElementById('q-custom-score');

        if (customCheckbox && customCheckbox.checked) {
            if (!customRequirement || !customRequirement.value.trim()) {
                showNotification('选择自定义题型时，请填写题型要求 *', 'warning');
                return;
            }
            if (customCount) {
                const questionCount = parseInt(customCount.value) || 0;
                const questionScore = parseInt(customScore.value) || 20;
                if (questionCount > 0) {
                    questionTypes['custom'] = {
                        count: questionCount,
                        requirement: customRequirement.value.trim(),
                        scorePerQuestion: questionScore
                    };
                }
            }
        }

        // 处理大作业题型
        const assignmentCheckbox = document.getElementById('q-assignment');
        const assignmentCount = document.getElementById('q-assignment-count');
        const assignmentScore = document.getElementById('q-assignment-score');

        if (assignmentCheckbox && assignmentCheckbox.checked) {
            if (assignmentCount) {
                const questionCount = parseInt(assignmentCount.value) || 1;
                const questionScore = parseInt(assignmentScore.value) || 50;
                if (questionCount > 0) {
                    questionTypes['assignment'] = {
                        count: questionCount,
                        scorePerQuestion: questionScore,
                        isAssignment: true
                    };
                }
            }
        }

        // 计算总题目数量和预期总分
        let totalQuestions = 0;
        let expectedTotalScore = 0;
        Object.values(questionTypes).forEach(value => {
            if (typeof value === 'object' && value.count !== undefined) {
                totalQuestions += value.count;
                expectedTotalScore += value.count * value.scorePerQuestion;
            }
        });

        if (totalQuestions === 0) {
            showNotification('请至少选择一种题型 *', 'warning');
            return;
        }

        // 检查预期总分与设置总分的差异
        const setTotalScore = parseInt(totalScore);
        if (Math.abs(expectedTotalScore - setTotalScore) > 5) {
            const confirmed = confirm(
                `根据题型分数设置，预期总分为${expectedTotalScore}分，但您设置的总分为${setTotalScore}分。\n\n` +
                `建议：\n` +
                `• 修改总分设置为${expectedTotalScore}分\n` +
                `• 或调整各题型的单题分数\n\n` +
                `是否继续生成试卷？`
            );
            if (!confirmed) {
                return;
            }
        }

        // 4. 验证考试时长（必填）
        if (!duration || parseInt(duration) < 30 || parseInt(duration) > 180) {
            showNotification('请设置有效的考试时长（30-180分钟）*', 'warning');
            return;
        }

        // 5. 验证总分设置（必填）
        if (!totalScore || parseInt(totalScore) < 50 || parseInt(totalScore) > 200) {
            showNotification('请设置有效的总分（50-200分）*', 'warning');
            return;
        }

        // 6. 验证难度分布（必填）
        const difficulty = {
            easy: parseInt(document.getElementById('difficulty-easy-input').value) || 0,
            medium: parseInt(document.getElementById('difficulty-medium-input').value) || 0,
            hard: parseInt(document.getElementById('difficulty-hard-input').value) || 0
        };

        const difficultyTotal = difficulty.easy + difficulty.medium + difficulty.hard;
        if (difficultyTotal !== 100) {
            showNotification(`难度分布总和必须为100%，当前为${difficultyTotal}% *`, 'warning');
            return;
        }

        // 获取特殊要求（可选）
        const specialRequirements = document.getElementById('exam-special-requirements').value.trim();

        // 获取能力维度要求（如果启用）
        const capabilityRequirements = collectCapabilityRequirements();
        const enableCapabilityAnalysis = document.getElementById('enable-capability-analysis')?.checked || false;

        // 检查是否启用了联网搜索
        const webSearchEnabled = document.getElementById('enable-web-search-exam').checked;

        if (webSearchEnabled) {
            // 获取课程名称
            const courseSelect = document.getElementById('exam-course-select');
            const courseName = courseSelect.options[courseSelect.selectedIndex].text;

            // 智能生成搜索查询
            const searchQuery = generateSmartSearchQuery(courseName, specialRequirements, 'exam');

            // 显示确认对话框
            const confirmed = await showWebSearchConfirmDialog('试卷', searchQuery);
            if (!confirmed) {
                return;
            }

            // 执行联网搜索生成
            await generateExamWithWebSearch(examTitle, courseId, duration, totalScore, questionTypes, difficulty, specialRequirements, searchQuery);
        } else {
            // 执行原有的RAG生成
            const examData = {
                title: examTitle,
                courseId: parseInt(courseId),
                materialIds: selectedMaterials,
                duration: parseInt(duration),
                totalScore: parseInt(totalScore),
                questionTypes,
                difficulty,
                specialRequirements: specialRequirements || null,
                enableCapabilityAnalysis: enableCapabilityAnalysis,
                capabilityRequirements: capabilityRequirements
            };

            console.log('生成试卷数据:', examData);
            console.log('发送的测评名称:', examTitle);

            showLoading('AI正在使用RAG技术从知识库生成试卷...');

            const response = await TeacherAPI.generateExam(examData);

            hideLoading();

            if (response.success) {
                showNotification('试卷生成成功！', 'success');
                // 获取完整的考试数据包括题目
                const examDetailResponse = await TeacherAPI.getExamDetail(response.data.id);
                if (examDetailResponse.success) {
                    displayExamPreview(examDetailResponse.data);
                } else {
                displayExamPreview(response.data);
                }
            } else {
                showNotification(response.message || '生成失败', 'error');
            }
        }

    } catch (error) {
        hideLoading();
        console.error('生成试卷失败:', error);
        showNotification('生成失败，请重试', 'error');
    }
}

// 显示试卷预览
function displayExamPreview(examData) {
    const previewDiv = document.getElementById('exam-preview');
    const contentDiv = document.getElementById('exam-content');

    if (!previewDiv || !contentDiv || !examData) return;

    // 保存到全局变量并生成原始Markdown内容
    window.currentExam = examData;
    if (examData.questions && examData.questions.length > 0) {
        examData.originalContent = generateMarkdownFromQuestions(examData.questions);
    }

    // 恢复完整的预览界面HTML结构，包括头部按钮
    previewDiv.innerHTML = `
        <div class="card-header">
            <i class="fas fa-file-alt"></i> 试卷预览
            <div class="card-actions">
                <button class="btn btn-sm btn-accent" onclick="editExam(${examData.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-sm btn-primary" onclick="publishExam(${examData.id})">
                    <i class="fas fa-paper-plane"></i> 发布
                </button>
                <button class="btn btn-sm btn-secondary" onclick="exportExam()">
                    <i class="fas fa-download"></i> 导出
                </button>
            </div>
        </div>
        <div id="exam-content" style="padding: 24px;">
            <!-- 动态生成的试卷内容 -->
        </div>
    `;

    // 重新获取contentDiv引用（因为innerHTML被重置了）
    const newContentDiv = document.getElementById('exam-content');

    let questionsHtml = '';
    if (examData.questions && examData.questions.length > 0) {
        examData.questions.forEach((question, index) => {
            // 解析选项（可能是JSON字符串）
            let options = [];
            if (question.options) {
                try {
                    options = typeof question.options === 'string' ?
                        JSON.parse(question.options) : question.options;
                } catch (e) {
                    console.error('解析选项失败:', e);
                    options = [];
                }
            }

                            // 检查是否为大作业题型
                const isAssignmentType = question.type === 'assignment' || question.type.includes('大作业');

            questionsHtml += `
                <div class="question-item">
                    <h4>第${index + 1}题 (${question.score || 2}分)
                        ${question.knowledgePoint ? `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">知识点：${question.knowledgePoint}</span>` : ''}
                        ${isAssignmentType ? `<span style="background: #f39c12; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">📋 大作业</span>` : ''}
                    </h4>
                    <div class="question-content">${formatTeacherMarkdown(question.content || '题目内容加载失败')}</div>
                    ${options.length > 0 ? `
                        <div class="question-options">
                            ${options.map((option, i) => {
                                // 检查选项是否已经包含标签，如果有则去掉
                                const cleanOption = typeof option === 'string' ?
                                    option.replace(/^[A-Z]\.\s*/, '') : option;
                                return `<p><span style="font-weight: 500; color: #3498db; margin-right: 8px;">${String.fromCharCode(65 + i)}.</span>${formatTeacherMarkdown(cleanOption)}</p>`;
                            }).join('')}
                        </div>
                    ` : ''}

                    ${isAssignmentType ? `
                        <div class="assignment-requirement-section" style="margin-bottom: 15px; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <span style="font-weight: 600; color: #856404;">
                                    <i class="fas fa-tasks"></i> 作业要求设置
                                </span>
                                <button class="btn btn-sm btn-primary" onclick="showAssignmentRequirementModal(${question.id}, '第${index + 1}题', ${question.score})"
                                        style="font-size: 12px; padding: 4px 8px;">
                                    <i class="fas fa-edit"></i> 设置要求
                                </button>
                            </div>
                            <div style="color: #856404; font-size: 14px;">
                                ${question.assignmentRequirement ?
                                    '✅ 已设置作业要求' :
                                    '⚠️ 请点击"设置要求"按钮来配置详细的作业要求和评分标准'}
                            </div>
                        </div>
                    ` : `
                    <div class="question-answer" style="margin-bottom: 15px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
                        <span style="font-weight: 600; color: #155724;">参考答案：</span>
                        <div style="color: #155724; margin-top: 8px;">${formatTeacherMarkdown(question.answer || 'N/A')}</div>
                    </div>
                    `}

                    ${question.explanation ? `
                        <div class="question-explanation" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px;">
                            <span style="font-weight: 600; color: #0c5460;">解析：</span>
                            <div style="color: #0c5460; line-height: 1.6; margin-top: 8px;">${formatTeacherMarkdown(question.explanation)}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        questionsHtml = '<p class="no-questions">暂无题目数据</p>';
    }

    newContentDiv.innerHTML = `
        <div class="exam-header">
            <h3>${examData.title || '试卷'}</h3>
            <div class="exam-info">
                <span>考试时长：${examData.duration}分钟</span>
                <span>总分：${examData.totalScore}分</span>
                <span>题目数：${examData.questions ? examData.questions.length : 0}题</span>
            </div>
        </div>
        <div class="exam-questions">
            ${questionsHtml}
        </div>
    `;

    previewDiv.style.display = 'block';
}

// 设置难度滑块
function setupDifficultySliders() {
    const sliders = ['difficulty-easy', 'difficulty-medium', 'difficulty-hard'];

    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(sliderId + '-input');

        if (slider && input) {
            // 滑块变化时更新输入框
            slider.addEventListener('input', function() {
                input.value = this.value;

                // 自动调整其他滑块保持总和为100%
                adjustDifficultySliders(sliderId);
            });

            // 输入框变化时更新滑块
            input.addEventListener('input', function() {
                let value = parseInt(this.value) || 0;
                // 限制输入范围
                if (value < 0) value = 0;
                if (value > 100) value = 100;
                this.value = value;

                slider.value = value;

                // 自动调整其他滑块保持总和为100%
                adjustDifficultySliders(sliderId);
            });

            // 输入框失去焦点时验证总和
            input.addEventListener('blur', function() {
                validateDifficultyTotal();
            });
        }
    });
}

// 调整难度滑块
function adjustDifficultySliders(changedSliderId) {
    const sliders = {
        'difficulty-easy': document.getElementById('difficulty-easy'),
        'difficulty-medium': document.getElementById('difficulty-medium'),
        'difficulty-hard': document.getElementById('difficulty-hard')
    };

    const inputs = {
        'difficulty-easy': document.getElementById('difficulty-easy-input'),
        'difficulty-medium': document.getElementById('difficulty-medium-input'),
        'difficulty-hard': document.getElementById('difficulty-hard-input')
    };

    const values = {
        'difficulty-easy': parseInt(sliders['difficulty-easy'].value),
        'difficulty-medium': parseInt(sliders['difficulty-medium'].value),
        'difficulty-hard': parseInt(sliders['difficulty-hard'].value)
    };

    const total = values['difficulty-easy'] + values['difficulty-medium'] + values['difficulty-hard'];

    if (total > 100) {
        const excess = total - 100;
        const otherSliders = Object.keys(sliders).filter(id => id !== changedSliderId);

        // 平均分配减少量
        const reduceEach = Math.floor(excess / otherSliders.length);
        let remaining = excess - reduceEach * otherSliders.length;

        otherSliders.forEach(sliderId => {
            const currentValue = parseInt(sliders[sliderId].value);
            const reduction = reduceEach + (remaining > 0 ? 1 : 0);
            if (remaining > 0) remaining--;

            const newValue = Math.max(0, currentValue - reduction);
            sliders[sliderId].value = newValue;
            inputs[sliderId].value = newValue;
        });
    }
}

// 验证难度分布总和
function validateDifficultyTotal() {
    const inputs = {
        'difficulty-easy': document.getElementById('difficulty-easy-input'),
        'difficulty-medium': document.getElementById('difficulty-medium-input'),
        'difficulty-hard': document.getElementById('difficulty-hard-input')
    };

    const values = {
        'difficulty-easy': parseInt(inputs['difficulty-easy'].value) || 0,
        'difficulty-medium': parseInt(inputs['difficulty-medium'].value) || 0,
        'difficulty-hard': parseInt(inputs['difficulty-hard'].value) || 0
    };

    const total = values['difficulty-easy'] + values['difficulty-medium'] + values['difficulty-hard'];

    if (total !== 100) {
        showNotification(`难度分布总和为${total}%，建议调整为100%`, 'warning');
    }
}

// 加载各种数据的函数
async function loadMaterialsData() {
    try {
        console.log('开始加载资料数据...');
        showLoading('正在刷新数据...');

        // 总是重新加载课程数据，确保数据是最新的
        console.log('正在重新加载课程列表...');
        const coursesResponse = await TeacherAPI.getCourses();
        currentCourses = coursesResponse.data || [];
        console.log('重新加载课程列表:', currentCourses);

        // 更新课程选择器
        updateCourseSelects();

        // 加载资料数据
        console.log('正在重新加载资料列表...');
        const response = await TeacherAPI.getMaterials();
        console.log('获取资料数据响应:', response);
        currentMaterials = response.data || [];
        console.log('当前资料列表:', currentMaterials);

        // 强制更新表格
        updateMaterialsTable();

        hideLoading();
        console.log('资料数据加载完成！');

    } catch (error) {
        hideLoading();
        console.error('加载资料数据失败:', error);
        showNotification('数据加载失败，请稍后重试', 'error');
    }
}

async function loadNoticesData() {
    try {
        // 获取所有教师发送的通知（用于首页显示）
        const response = await fetch('http://localhost:8080/api/teacher/notices/all', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            currentNotices = result.data || [];
            allNotices = currentNotices; // 存储所有通知
            filteredNotices = currentNotices; // 存储筛选后的通知
        updateNoticesTable();
            updateDashboardRecentNotices(); // 更新首页最新通知
        } else {
            console.error('加载通知数据失败:', result.message);
            currentNotices = [];
            allNotices = [];
            filteredNotices = [];
            updateNoticesTable();
            updateDashboardRecentNotices();
        }
    } catch (error) {
        console.error('加载通知数据失败:', error);
        currentNotices = [];
        allNotices = [];
        filteredNotices = [];
        updateNoticesTable();
        updateDashboardRecentNotices();
    }
}

async function loadExamManageData() {
    try {
        // 加载试卷列表
        await loadExamList();

        // 获取当前教师ID
        const teacherId = await getUserId();
        if (!teacherId) {
            throw new Error('未获取到教师ID');
        }

        // 加载考试统计数据
        const statsResponse = await TeacherAPI.getExamStats(teacherId);
        const stats = statsResponse.data || {};

        // 更新考试统计卡片
        updateExamStatsCards(stats);

    } catch (error) {
        console.error('加载考试管理数据失败:', error);
        showNotification('加载试卷管理数据失败', 'error');
    }
}

// 工具函数
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // 创建并显示通知
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // 自动移除
            setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function showLoading(message = '加载中...') {
    let loading = document.getElementById('loading-overlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p id="loading-message">${message}</p>
            </div>
        `;
        document.body.appendChild(loading);
    } else {
        document.getElementById('loading-message').textContent = message;
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

// 设置用户下拉菜单 - 优化交互体验
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
        showDropdown(); // 鼠标进入时立即显示
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

// 退出登录相关
function handleLogout() {
    document.getElementById('logout-modal').style.display = 'flex';
}

// 显示删除确认弹窗
function showDeleteConfirmModal(courseName, courseCode) {
    return new Promise((resolve) => {
        // 创建弹窗HTML
        const modalHtml = `
            <div id="delete-confirm-modal" class="course-modal-overlay" style="display: flex;">
                <div class="course-modal-container" style="max-width: 450px;">
                    <div class="course-modal-header">
                        <div class="modal-title-section">
                            <div class="modal-icon" style="background: var(--danger-color);">
                                <i class="fas fa-exclamation-triangle"></i>
                            </div>
                            <h3>确认删除课程</h3>
                        </div>
                        <button id="close-delete-modal" class="modal-close-btn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="course-modal-body">
                        <div class="delete-warning">
                            <p><strong>您确定要删除以下课程吗？</strong></p>
                            <div class="course-info">
                                <p><strong>课程名称：</strong>${courseName}</p>
                                <p><strong>课程号：</strong>${courseCode}</p>
                            </div>
                            <div class="warning-note">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span>删除后不可恢复，相关的课程资料、通知和考试记录也将被删除！</span>
                            </div>
                        </div>

                        <div class="course-modal-actions">
                            <button type="button" id="cancel-delete" class="course-btn course-btn-cancel">
                                <i class="fas fa-times"></i>
                                <span>取消</span>
                            </button>
                            <button type="button" id="confirm-delete" class="course-btn" style="background: var(--danger-color); color: white;">
                                <i class="fas fa-trash"></i>
                                <span>确认删除</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加弹窗到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('delete-confirm-modal');
        const closeBtn = document.getElementById('close-delete-modal');
        const cancelBtn = document.getElementById('cancel-delete');
        const confirmBtn = document.getElementById('confirm-delete');

        // 关闭弹窗
        const closeModal = (result) => {
            modal.remove();
            resolve(result);
        };

        // 绑定事件
        closeBtn.addEventListener('click', () => closeModal(false));
        cancelBtn.addEventListener('click', () => closeModal(false));
        confirmBtn.addEventListener('click', () => closeModal(true));

        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(false);
            }
        });
    });
}

async function confirmLogout() {
    try {
        // 调用服务器端的登出API
        await fetch('http://localhost:8080/api/auth/logout', {
            method: 'POST',
            credentials: 'include' // 包含cookie以维持session
        });
    } catch (error) {
        console.error('登出请求失败:', error);
    }

    // 无论服务器端登出是否成功，都跳转到主页
    window.location.href = 'index.html';
}

function cancelLogout() {
    document.getElementById('logout-modal').style.display = 'none';
}

// 更新活动菜单项
function updateActiveMenu(activeItem) {
    // 移除所有菜单项的active状态
    document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
        item.classList.remove('active');
    });

    // 添加active状态到当前项
    activeItem.classList.add('active');

    // 如果是二级菜单项，确保其父级一级菜单也展开
    if (activeItem.classList.contains('submenu-item')) {
        const parentSubmenu = activeItem.closest('.submenu');
        if (parentSubmenu) {
            const parentMenuItem = parentSubmenu.previousElementSibling;
            const arrow = parentMenuItem.querySelector('.arrow');

            // 展开父级菜单
            parentSubmenu.style.display = 'block';
            if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
    }
}

// 其他需要实现的函数占位符
async function loadOutlineData() {
    try {
        // 如果课程列表为空，先加载课程列表
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        } else {
            // 如果已有课程数据，直接更新选择框
            updateCourseSelects();
        }

        console.log('教学大纲页面数据加载完成');
    } catch (error) {
        console.error('加载教学大纲页面数据失败:', error);
    }
}
async function loadExamGenerationData() {
    try {
        // 加载课程列表
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        } else {
            updateCourseSelects();
        }

        console.log('试卷生成页面数据加载完成');
    } catch (error) {
        console.error('加载试卷生成页面数据失败:', error);
    }
}


async function loadGradeData() {
    try {
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        }
        await loadGradeList();
        console.log('成绩批改页面数据加载完成');
    } catch (error) {
        console.error('加载成绩批改页面数据失败:', error);
    }
}

// 加载待批改试卷列表
async function loadGradeList() {
    try {
        showLoading('正在加载待批改试卷...');
        const response = await TeacherAPI.getGradeList();
        hideLoading();

        if (response.success) {
            displayGradeList(response.data);
        } else {
            showNotification('加载失败：' + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('加载待批改试卷失败:', error);
        showNotification('加载失败，请重试', 'error');
    }
}

// 显示待批改试卷列表
function displayGradeList(grades) {
    const tbody = document.querySelector('#grades-table tbody');
    if (!tbody) return;

    if (!grades || grades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    暂无待批改试卷
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = grades.map(grade => {
        const statusClass = getGradeStatusClass(grade.gradeStatus);
        const statusText = getGradeStatusText(grade.gradeStatus);

        // 检查考试是否已发布成绩
        const isPublished = grade.isAnswerPublished || false;
        const publishButtonClass = isPublished ? 'btn-warning' : 'btn-success';
        const publishButtonIcon = isPublished ? 'fas fa-undo' : 'fas fa-share';
        const publishButtonTitle = isPublished ? '取消发布' : '发布成绩';
        const publishButtonText = isPublished ? '已发布' : '发布';

        return `
            <tr data-result-id="${grade.id}" data-exam-id="${grade.examId}" data-is-published="${isPublished}">
                <td style="text-align: center;">
                    <input type="checkbox" class="grade-checkbox" value="${grade.id}" onchange="updateBatchButtons()" style="transform: scale(1.2);">
                </td>
                <td>${grade.studentName || '-'}</td>
                <td>${grade.examTitle || '-'}</td>
                <td>${formatDateTime(grade.submitTime)}</td>
                <td>${grade.aiScore !== null && grade.aiScore !== undefined && grade.aiScore !== '' ? grade.aiScore : '-'}</td>
                <td>${grade.finalScore || '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="gradeExam(${grade.id})" title="批改">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="viewGradeDetail(${grade.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-accent" onclick="aiGradeExam(${grade.id})" title="AI批改" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <i class="fas fa-brain"></i>
                        </button>
                        <button class="btn btn-sm ${publishButtonClass}" onclick="publishSingleGrade(${grade.examId}, ${grade.id}, ${isPublished})" title="${publishButtonTitle}">
                            <i class="${publishButtonIcon}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 加载筛选选项
    setTimeout(() => {
        loadStudentsForGradeFilter();
        loadExamsForGradeFilter();
    }, 100);
}

// 获取批改状态样式
function getGradeStatusClass(status) {
    const statusMap = {
        'PENDING': 'status-warning',
        'AI_GRADED': 'status-info',
        'MANUAL_GRADED': 'status-success'
    };
    return statusMap[status] || 'status-secondary';
}

// 获取批改状态文本
function getGradeStatusText(status) {
    const statusMap = {
        'PENDING': '待批改',
        'AI_GRADED': 'AI已批改',
        'MANUAL_GRADED': '人工已批改'
    };
    return statusMap[status] || '未知状态';
}

// 加载学生列表用于筛选
async function loadStudentsForGradeFilter() {
    try {
        const studentFilter = document.getElementById('grade-student-filter');
        if (!studentFilter) return;

        // 从当前成绩列表中提取学生名单
        const rows = document.querySelectorAll('#grades-table tbody tr');
        const students = new Set();

        rows.forEach(row => {
            if (row.cells.length >= 8) {
                const studentName = row.cells[1].textContent.trim();
                if (studentName && studentName !== '-') {
                    students.add(studentName);
                }
            }
        });

        // 填充学生筛选下拉框
        const studentOptions = Array.from(students).sort().map(student =>
            `<option value="${student}">${student}</option>`
        ).join('');

        studentFilter.innerHTML = '<option value="">所有学生</option>' + studentOptions;

    } catch (error) {
        console.error('加载学生筛选列表失败:', error);
    }
}

// 加载考试列表用于筛选
async function loadExamsForGradeFilter() {
    try {
        const examFilter = document.getElementById('grade-exam-filter');
        if (!examFilter) return;

        // 从当前成绩列表中提取考试列表
        const rows = document.querySelectorAll('#grades-table tbody tr');
        const exams = new Set();

        rows.forEach(row => {
            if (row.cells.length >= 8) {
                const examTitle = row.cells[2].textContent.trim();
                if (examTitle && examTitle !== '-') {
                    exams.add(examTitle);
                }
            }
        });

        // 填充考试筛选下拉框
        const examOptions = Array.from(exams).sort().map(exam =>
            `<option value="${exam}">${exam}</option>`
        ).join('');

        examFilter.innerHTML = '<option value="">所有考试</option>' + examOptions;

    } catch (error) {
        console.error('加载考试筛选列表失败:', error);
    }
}

// 筛选成绩
function filterGrades() {
    const studentFilter = document.getElementById('grade-student-filter').value;
    const examFilter = document.getElementById('grade-exam-filter').value;
    const statusFilter = document.getElementById('grade-status-filter').value;

    // 获取当前显示的所有行
    const rows = document.querySelectorAll('#grades-table tbody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        // 跳过空数据行
        if (row.cells.length < 8) {
            return;
        }

        const studentName = row.cells[1].textContent.trim();
        const examTitle = row.cells[2].textContent.trim();
        const statusElement = row.cells[6].querySelector('.status-badge');
        const gradeStatus = statusElement ? statusElement.textContent.trim() : '';

        let shouldShow = true;

        // 学生筛选
        if (studentFilter && !studentName.toLowerCase().includes(studentFilter.toLowerCase())) {
            shouldShow = false;
        }

        // 考试筛选
        if (examFilter && !examTitle.toLowerCase().includes(examFilter.toLowerCase())) {
            shouldShow = false;
        }

        // 状态筛选
        if (statusFilter) {
            const statusMap = {
                'PENDING': '待批改',
                'AI_GRADED': 'AI已批改',
                'MANUAL_GRADED': '人工已批改'
            };
            if (statusMap[statusFilter] && gradeStatus !== statusMap[statusFilter]) {
                shouldShow = false;
            }
        }

        // 显示或隐藏行
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // 如果没有可见行，显示无数据提示
    const tbody = document.querySelector('#grades-table tbody');
    if (visibleCount === 0 && tbody) {
        // 检查是否已经有无数据行
        const existingEmptyRow = tbody.querySelector('tr[data-empty="true"]');
        if (!existingEmptyRow) {
            const emptyRow = document.createElement('tr');
            emptyRow.setAttribute('data-empty', 'true');
            emptyRow.innerHTML = `
                <td colspan="8" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    没有符合筛选条件的记录
                </td>
            `;
            tbody.appendChild(emptyRow);
        }
    } else {
        // 移除无数据行
        const emptyRow = tbody.querySelector('tr[data-empty="true"]');
        if (emptyRow) {
            emptyRow.remove();
        }
     }

     // 更新批量操作按钮状态
     updateBatchButtons();
}

// 重置筛选器
function resetGradeFilters() {
    const studentFilter = document.getElementById('grade-student-filter');
    const examFilter = document.getElementById('grade-exam-filter');
    const statusFilter = document.getElementById('grade-status-filter');

    if (studentFilter) studentFilter.value = '';
    if (examFilter) examFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    // 重新显示所有行
    const rows = document.querySelectorAll('#grades-table tbody tr');
    rows.forEach(row => {
        if (!row.hasAttribute('data-empty')) {
            row.style.display = '';
        }
    });

    // 移除无数据行
    const emptyRow = document.querySelector('#grades-table tbody tr[data-empty="true"]');
    if (emptyRow) {
        emptyRow.remove();
    }

    // 重置勾选框状态
    const selectAllCheckbox = document.getElementById('select-all-grades');
    const gradeCheckboxes = document.querySelectorAll('.grade-checkbox');

    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }

    gradeCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // 更新批量操作按钮
    updateBatchButtons();
}

// 全选/取消全选
function toggleAllGrades() {
    const selectAllCheckbox = document.getElementById('select-all-grades');
    const gradeCheckboxes = document.querySelectorAll('.grade-checkbox');

    gradeCheckboxes.forEach(checkbox => {
        if (checkbox.closest('tr').style.display !== 'none') {
            checkbox.checked = selectAllCheckbox.checked;
        }
    });

    updateBatchButtons();
}

// 更新批量操作按钮状态
function updateBatchButtons() {
    const checkedBoxes = document.querySelectorAll('.grade-checkbox:checked');
    const visibleCheckedBoxes = Array.from(checkedBoxes).filter(checkbox =>
        checkbox.closest('tr').style.display !== 'none'
    );

    const batchGradeBtn = document.querySelector('button[onclick="autoGradeAll()"]');
    const publishBtn = document.querySelector('button[onclick="publishSelectedExamGrades()"]');

    if (batchGradeBtn) {
        if (visibleCheckedBoxes.length > 0) {
            batchGradeBtn.textContent = `批量AI评分 (${visibleCheckedBoxes.length})`;
            batchGradeBtn.disabled = false;
        } else {
            batchGradeBtn.innerHTML = '<i class="fas fa-brain"></i> DeepSeek智能评分';
            batchGradeBtn.disabled = false;
        }
    }

    if (publishBtn) {
        if (visibleCheckedBoxes.length > 0) {
            publishBtn.innerHTML = `<i class="fas fa-paper-plane"></i> 批量发布成绩 (${visibleCheckedBoxes.length})`;
            publishBtn.disabled = false;
        } else {
            publishBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发布成绩';
            publishBtn.disabled = false;
        }
    }

    // 更新全选复选框状态
    const selectAllCheckbox = document.getElementById('select-all-grades');
    const visibleCheckboxes = document.querySelectorAll('.grade-checkbox');
    const visibleChecked = Array.from(visibleCheckboxes).filter(checkbox =>
        checkbox.closest('tr').style.display !== 'none' && checkbox.checked
    );
    const visibleTotal = Array.from(visibleCheckboxes).filter(checkbox =>
        checkbox.closest('tr').style.display !== 'none'
    );

    if (selectAllCheckbox) {
        if (visibleTotal.length === 0) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        } else if (visibleChecked.length === visibleTotal.length) {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = true;
        } else if (visibleChecked.length > 0) {
            selectAllCheckbox.indeterminate = true;
            selectAllCheckbox.checked = false;
        } else {
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.checked = false;
        }
    }
}

// 批改考试
async function gradeExam(resultId) {
    try {
        showLoading('正在加载考试详情...');
        const response = await TeacherAPI.getGradeDetail(resultId);
        hideLoading();

        if (response.success) {
            showGradeModal(response.data);
        } else {
            showNotification('加载失败：' + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('加载考试详情失败:', error);
        showNotification('加载失败，请重试', 'error');
    }
}

// 查看成绩详情
async function viewGradeDetail(resultId) {
    try {
        showLoading('正在加载成绩详情...');
        const response = await TeacherAPI.getGradeDetail(resultId);
        hideLoading();

        if (response.success) {
            showGradeDetailModal(response.data);
        } else {
            showNotification('加载失败：' + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('加载成绩详情失败:', error);
        showNotification('加载失败，请重试', 'error');
    }
}

async function loadAnalysisData() {
    try {
        console.log('加载成绩分析页面数据开始...');

        // 首先测试登录状态
        console.log('检查登录状态...');
        const currentUserResponse = await fetch('/api/auth/current-user', {
            method: 'GET',
            credentials: 'include'
        });
        const currentUserData = await currentUserResponse.json();
        console.log('当前用户状态:', currentUserData);

        if (!currentCourses || currentCourses.length === 0) {
            console.log('加载课程列表...');
            await loadCourseList();
        }

        console.log('加载考试分析列表...');
        await loadExamsForAnalysis();
        console.log('成绩分析页面数据加载完成');
    } catch (error) {
        console.error('加载成绩分析页面数据失败:', error);
    }
}

// 加载考试列表用于分析
async function loadExamsForAnalysis() {
    try {
        console.log('开始加载考试分析列表...');
        const examSelect = document.getElementById('analysis-exam-select');
        if (!examSelect) {
            console.error('未找到考试选择下拉框元素');
            return;
        }

        // 获取当前教师ID
        console.log('正在获取教师ID...');
        const teacherId = await getUserId();
        console.log('获取到的教师ID:', teacherId);
        if (!teacherId) {
            console.error('未获取到教师ID');
            examSelect.innerHTML = '<option value="">未获取到教师信息</option>';
            return;
        }

        // 获取教师的所有考试
        console.log('正在调用TeacherAPI.getExamList...');
        const response = await TeacherAPI.getExamList(teacherId, '', '');
        console.log('API响应:', response);

        if (!response.success) {
            console.error('API调用失败:', response.message);
            examSelect.innerHTML = '<option value="">API调用失败</option>';
            return;
        }

        if (!response.data) {
            console.error('API返回数据为空');
            examSelect.innerHTML = '<option value="">暂无考试数据</option>';
            return;
        }

        console.log('API返回的考试数据:', response.data);
        console.log('考试数量:', response.data.length);

        // 显示所有考试的详细信息用于调试
        response.data.forEach(exam => {
            console.log(`考试详情: ID=${exam.id}, 标题=${exam.title}, status=${exam.status}, isPublished=${exam.isPublished}`);
        });

        // 只显示已发布的考试用于成绩分析
        const publishedExams = response.data.filter(exam => {
            const isPublished = exam.status === 'published' || exam.isPublished === true;
            console.log(`考试 ${exam.title}: status=${exam.status}, isPublished=${exam.isPublished}, 可分析=${isPublished}`);
            return isPublished;
        });

        // 如果没有已发布的考试，但有草稿，给出提示
        if (publishedExams.length === 0 && response.data.length > 0) {
            console.warn('没有已发布的考试可供分析，但有以下草稿考试:');
            response.data.forEach(exam => {
                console.warn(`- ${exam.title} (状态: ${exam.status})`);
            });
        }

        console.log('所有考试:', response.data);
        console.log('已发布的考试:', publishedExams);
        console.log('考试状态映射:', response.data.map(exam => ({
            id: exam.id,
            title: exam.title,
            status: exam.status,
            isPublished: exam.isPublished
        })));

        // 填充下拉框，并异步检查每个考试是否有成绩数据
        if (publishedExams.length > 0) {
            // 先显示所有已发布考试
            const optionsHtml = '<option value="">选择考试</option>' +
                publishedExams.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
            console.log('生成的选项HTML:', optionsHtml);
            examSelect.innerHTML = optionsHtml;
            console.log('下拉框填充完成，发布考试数量:', publishedExams.length);



            // 异步检查并更新考试选项，显示参与人数
            updateExamOptionsWithStats(publishedExams);
        } else {
            examSelect.innerHTML = '<option value="">暂无已发布的考试</option>';
            console.log('没有已发布的考试');
        }

    } catch (error) {
        console.error('加载考试分析列表失败:', error);
        console.error('错误堆栈:', error.stack);
        const examSelect = document.getElementById('analysis-exam-select');
        if (examSelect) {
            examSelect.innerHTML = '<option value="">加载失败，请重试</option>';
        }
    }
}

// 异步更新考试选项，显示参与人数信息
async function updateExamOptionsWithStats(exams) {
    const examSelect = document.getElementById('analysis-exam-select');
    if (!examSelect) return;

    console.log('开始检查考试参与人数...');
    const optionsWithStats = ['<option value="">选择考试</option>'];

    for (const exam of exams) {
        try {
            // 获取该考试的分析数据来检查参与人数
            const response = await TeacherAPI.getGradeAnalysis(exam.id);

            let optionText = exam.title;
            if (response.success && response.data) {
                const participantCount = response.data.participantCount || 0;
                if (participantCount > 0) {
                    optionText += ` (${participantCount}人参与)`;
                } else {
                    optionText += ' (暂无成绩)';
                }
            } else {
                optionText += ' (数据加载失败)';
            }

            optionsWithStats.push(`<option value="${exam.id}">${optionText}</option>`);
            console.log(`考试 ${exam.title}: 更新为 "${optionText}"`);

        } catch (error) {
            console.error(`检查考试 ${exam.title} 失败:`, error);
            optionsWithStats.push(`<option value="${exam.id}">${exam.title} (检查失败)</option>`);
        }
    }

    // 更新下拉框选项
    examSelect.innerHTML = optionsWithStats.join('');
    console.log('考试选项更新完成，包含参与人数信息');
}



// 加载选中考试的分析数据
async function loadSelectedExamAnalysis() {
    const examSelect = document.getElementById('analysis-exam-select');
    const selectedExamId = examSelect?.value;

    console.log('=== 开始加载考试分析数据 ===');
    console.log('选中的考试ID:', selectedExamId);

    if (!selectedExamId) {
        console.log('没有选中考试，清空分析数据');
        clearAnalysisData();
        // 更新雷达图
        onExamSelectionChangeForRadar();
        return;
    }

    try {
        showLoading('正在加载分析数据...');
        console.log('调用API: TeacherAPI.getGradeAnalysis(' + selectedExamId + ')');

        const response = await TeacherAPI.getGradeAnalysis(selectedExamId);
        hideLoading();

        console.log('API响应:', response);
        console.log('响应成功状态:', response.success);
        console.log('响应数据:', response.data);

        if (response.success) {
            console.log('分析数据加载成功，开始显示数据');
            displayAnalysisData(response.data);
            // 更新雷达图
            onExamSelectionChangeForRadar();
        } else {
            console.error('API返回失败:', response.message);
            showNotification('加载分析数据失败：' + response.message, 'error');
            clearAnalysisData();
        }
    } catch (error) {
        hideLoading();
        console.error('调用API时发生异常:', error);
        console.error('异常堆栈:', error.stack);
        showNotification('加载分析数据失败，请重试', 'error');
        clearAnalysisData();
    }
}

// 显示分析数据
function displayAnalysisData(data) {
    console.log('显示分析数据:', data);

    // 检查是否有参与人数
    const participantCount = data.participantCount || 0;

    if (participantCount === 0) {
        // 显示无数据状态
        showNoAnalysisData(data.examTitle || '当前考试');
        return;
    }

    // 更新统计卡片
    document.getElementById('analysis-avg-score').textContent = data.averageScore || '0';
    document.getElementById('analysis-max-score').textContent = data.maxScore || '0';
    document.getElementById('analysis-pass-rate').textContent = (data.passRate || 0) + '%';
    document.getElementById('analysis-std-dev').textContent = data.standardDeviation || '0';

    // 显示分数分布图表
    displayScoreDistributionChart(data.scoreDistribution);

    // 显示错误率分析表格
    displayErrorAnalysisTable(data.errorAnalysis);
}

// 显示无分析数据状态
function showNoAnalysisData(examTitle) {
    // 清空统计卡片
    document.getElementById('analysis-avg-score').textContent = '--';
    document.getElementById('analysis-max-score').textContent = '--';
    document.getElementById('analysis-pass-rate').textContent = '--%';
    document.getElementById('analysis-std-dev').textContent = '--';

    // 显示无数据图表
    const chartContainer = document.getElementById('score-distribution-chart');
    if (chartContainer) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #7f8c8d;">
                <i class="fas fa-chart-bar" style="font-size: 64px; margin-bottom: 20px; color: #bdc3c7;"></i>
                <h4 style="margin-bottom: 10px; color: #34495e;">${examTitle}</h4>
                <p style="margin-bottom: 8px;">暂无学生提交成绩</p>
                <p style="font-size: 12px; margin: 0;">学生完成考试后才能查看成绩分析</p>
            </div>
        `;
        chartContainer.style.display = 'flex';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.justifyContent = 'center';
    }

    // 显示无数据错误率分析表格
    const errorTable = document.querySelector('#error-analysis-table tbody');
    if (errorTable) {
        errorTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-users-slash" style="font-size: 32px; margin-bottom: 10px; color: #bdc3c7; display: block;"></i>
                    暂无学生答题数据，无法进行错误率分析
                </td>
            </tr>
        `;
    }
}

// 清空分析数据
function clearAnalysisData() {
    document.getElementById('analysis-avg-score').textContent = '--';
    document.getElementById('analysis-max-score').textContent = '--';
    document.getElementById('analysis-pass-rate').textContent = '--%';
    document.getElementById('analysis-std-dev').textContent = '--';

    // 清空图表
    const chartContainer = document.getElementById('score-distribution-chart');
    if (chartContainer) {
        chartContainer.innerHTML = '选择考试后显示成绩分布图表';
        chartContainer.style.display = 'flex';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.justifyContent = 'center';
        chartContainer.style.color = '#7f8c8d';
    }

    // 清空错误率分析表格
    const errorTable = document.querySelector('#error-analysis-table tbody');
    if (errorTable) {
        errorTable.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    选择考试后显示错误率分析
                </td>
            </tr>
        `;
    }
}

// 显示分数分布图表
function displayScoreDistributionChart(distribution) {
    const chartContainer = document.getElementById('score-distribution-chart');
    if (!chartContainer || !distribution) return;

    const ranges = ['90-100', '80-89', '70-79', '60-69', '0-59'];
    const colors = ['#27ae60', '#2ecc71', '#f39c12', '#e67e22', '#e74c3c'];
    const labels = ['优秀', '良好', '中等', '及格', '不及格'];

    let chartHtml = '<div style="padding: 20px;">';
    chartHtml += '<h4 style="text-align: center; margin-bottom: 20px; color: #2c3e50;">成绩分布图</h4>';
    chartHtml += '<div style="display: flex; align-items: end; justify-content: space-around; height: 200px; border-bottom: 2px solid #34495e; padding: 0 20px; position: relative;">';

    const maxCount = Math.max(...ranges.map(range => distribution[range] || 0));
    const totalCount = ranges.reduce((sum, range) => sum + (distribution[range] || 0), 0);

    ranges.forEach((range, index) => {
        const count = distribution[range] || 0;
        const height = maxCount > 0 ? (count / maxCount) * 160 : 0;
        const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : 0;

        chartHtml += `
            <div style="display: flex; flex-direction: column; align-items: center; margin: 0 8px; position: relative; cursor: pointer;"
                 title="${labels[index]}: ${count}人 (${percentage}%)">
                <div style="width: 45px; background: linear-gradient(to top, ${colors[index]}, ${colors[index]}88);
                           height: ${height}px; border-radius: 6px 6px 0 0; transition: all 0.3s ease;
                           box-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative;">
                    <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%);
                                             color: white; font-size: 11px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">${count}</div>
                    <div style="position: absolute; top: 5px; left: 50%; transform: translateX(-50%);
                                             color: white; font-size: 9px; font-weight: 500; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">${percentage}%</div>
                </div>
                <div style="font-size: 11px; margin-top: 8px; color: #2c3e50; text-align: center; font-weight: 500;">${range}</div>
                <div style="font-size: 9px; color: #7f8c8d; text-align: center;">${labels[index]}</div>
            </div>
        `;
    });

    chartHtml += '</div>';
    chartHtml += '<div style="text-align: center; margin-top: 15px; font-size: 12px; color: #7f8c8d;">分数区间 (总参与人数: ' + totalCount + ')</div>';

    // 添加图例
    chartHtml += '<div style="display: flex; justify-content: center; margin-top: 15px; gap: 15px; flex-wrap: wrap;">';
    ranges.forEach((range, index) => {
        chartHtml += `
            <div style="display: flex; align-items: center; gap: 5px;">
                <div style="width: 12px; height: 12px; background: ${colors[index]}; border-radius: 2px;"></div>
                <span style="font-size: 11px; color: #2c3e50;">${range} (${labels[index]})</span>
            </div>
        `;
    });
    chartHtml += '</div>';

    chartHtml += '</div>';

    chartContainer.innerHTML = chartHtml;
    chartContainer.style.display = 'block';
    chartContainer.style.alignItems = 'initial';
    chartContainer.style.justifyContent = 'initial';
    chartContainer.style.color = 'initial';
}

// 显示错误率分析表格
function displayErrorAnalysisTable(errorAnalysis) {
    const tbody = document.querySelector('#error-analysis-table tbody');
    if (!tbody) return;

    if (!errorAnalysis || errorAnalysis.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    暂无错误率分析数据
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = errorAnalysis.map((item, index) => {
        const errorRate = item.errorRate || 0;
        const rateClass = errorRate > 50 ? 'error-rate-high' : errorRate > 30 ? 'error-rate-medium' : 'error-rate-low';

        return `
        <tr>
            <td>第${item.questionNumber || (index + 1)}题</td>
            <td>${item.questionType || '选择题'}</td>
            <td>${item.knowledgePoint || '未分类'}</td>
            <td>
                <div class="error-rate-bar">
                    <div class="error-rate-progress">
                        <div class="error-rate-fill ${rateClass}" style="width: ${errorRate}%;"></div>
                    </div>
                    <span style="font-weight: bold; color: #2c3e50; min-width: 40px;">${errorRate}%</span>
                </div>
            </td>
            <td>${item.commonErrors || '无'}</td>
        </tr>
        `;
    }).join('');
}

async function loadImprovementData() {
    try {
        // 加载课程列表
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        }

        // 更新课程选择下拉框
        updateImprovementCourseSelect();

        // 设置分析范围变化事件
        setupImprovementEvents();

        console.log('教学改进建议页面数据加载完成');
    } catch (error) {
        console.error('加载教学改进建议页面数据失败:', error);
        showNotification('加载页面数据失败', 'error');
    }
}

// ===============================
// 我的课程功能
// ===============================

async function loadMyCoursesData() {
    try {
        console.log('=== 加载我的课程数据 ===');
        console.log('当前课程数据:', currentCourses);

        // 始终重新加载课程列表，确保数据最新
        console.log('重新加载课程列表...');
            await loadCourseList();

        console.log('加载后的课程数据:', currentCourses);

        // 显示课程列表
        displayCoursesList();

        // 设置搜索和过滤功能
        setupCoursesSearchAndFilter();

        console.log('我的课程页面数据加载完成，课程数量:', currentCourses.length);
    } catch (error) {
        console.error('加载我的课程页面数据失败:', error);
        showNotification('加载页面数据失败', 'error');
    }
}

function displayCoursesList(courses) {
    const coursesToDisplay = courses || currentCourses || [];
    const coursesGrid = document.getElementById('courses-grid');

    console.log('=== 显示课程列表 ===');
    console.log('传入的courses参数:', courses);
    console.log('currentCourses变量:', currentCourses);
    console.log('最终要显示的课程:', coursesToDisplay);

    if (!coursesGrid) {
        console.error('找不到courses-grid元素');
        return;
    }

    if (coursesToDisplay.length === 0) {
        console.log('没有课程要显示');
        coursesGrid.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-book" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无课程</p>
                <p>点击"新建课程"开始创建您的第一门课程</p>
            </div>
        `;
        return;
    }

    console.log('开始渲染课程列表，课程数量:', coursesToDisplay.length);

    // 改为网格卡片布局，既美观又紧凑
    coursesGrid.innerHTML = `
        <div class="courses-grid-container">
            ${coursesToDisplay.map(course => {
                const statusClass = course.status === 'active' ? 'status-active' :
                                   course.status === 'completed' ? 'status-completed' : 'status-inactive';
                const statusText = course.status === 'active' ? '进行中' :
                                  course.status === 'completed' ? '已完成' : '已停用';

                return `
                    <div class="course-card-compact" data-course-id="${course.id}">
                        <div class="course-card-header">
                            <div class="course-title-section">
                                <h4 class="course-title">${course.name || '未命名课程'}</h4>
                                <div class="course-code">${course.courseCode || 'N/A'}</div>
                            </div>
                            <div class="course-status-section">
                                <span class="course-status ${statusClass}">${statusText}</span>
                            </div>
                        </div>

                        <div class="course-card-body">
                            <div class="course-description">${course.description || '暂无课程描述'}</div>

                            <div class="course-stats">
                                <div class="stat-item">
                                    <div class="stat-number">${course.currentStudents || 0}</div>
                                    <div class="stat-label">学生</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">${course.credit || 0}</div>
                                    <div class="stat-label">学分</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number">${course.hours || 0}</div>
                                    <div class="stat-label">学时</div>
                                </div>
                            </div>

                            <div class="course-details">
                                <div class="detail-row">
                                    <span class="detail-label">学期:</span>
                                    <span class="detail-value">${course.semester || '未设置'} ${course.academicYear || ''}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">时间:</span>
                                    <span class="detail-value">${course.classTime || '未设置'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">地点:</span>
                                    <span class="detail-value">${course.classLocation || '未设置'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="course-card-footer">
                            <div class="course-actions">
                                <button class="btn btn-sm btn-primary" onclick="viewCourseStudents(${course.id})" title="学生管理">
                                    <i class="fas fa-users"></i> 学生
                                </button>
                                <button class="btn btn-sm btn-success" onclick="editCourse(${course.id})" title="编辑课程">
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-info" onclick="viewCourseAnalytics(${course.id})" title="课程分析">
                                    <i class="fas fa-chart-line"></i> 分析
                                </button>
                                <button class="btn btn-sm btn-warning" onclick="manageCourseExams(${course.id})" title="考试管理">
                                    <i class="fas fa-file-alt"></i> 考试
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // 调试信息：确保按钮事件正确绑定
    console.log('课程列表已渲染，课程数量:', coursesToDisplay.length);
    coursesToDisplay.forEach(course => {
        console.log(`课程 ${course.name} (ID: ${course.id}) 的学生按钮已创建`);
    });
}

function setupCoursesSearchAndFilter() {
    const searchInput = document.getElementById('course-search');
    const filterSelect = document.getElementById('course-filter');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterCourses();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            filterCourses();
        });
    }
}

function filterCourses() {
    const searchTerm = document.getElementById('course-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('course-filter')?.value || '';

    let filteredCourses = currentCourses || [];

    // 按搜索关键词过滤
    if (searchTerm) {
        filteredCourses = filteredCourses.filter(course =>
            course.name?.toLowerCase().includes(searchTerm) ||
            course.courseCode?.toLowerCase().includes(searchTerm) ||
            course.description?.toLowerCase().includes(searchTerm)
        );
    }

    // 按状态过滤
    if (statusFilter) {
        filteredCourses = filteredCourses.filter(course => course.status === statusFilter);
    }

    displayCoursesList(filteredCourses);
}

function refreshMyCourses() {
    showLoading('正在刷新课程列表...');
    loadCourseList().then(() => {
        displayCoursesList();
        hideLoading();
        showNotification('课程列表已刷新', 'success');
    }).catch(error => {
        hideLoading();
        console.error('刷新课程列表失败:', error);
        showNotification('刷新失败，请重试', 'error');
    });
}

async function viewCourseStudents(courseId) {
    try {
        console.log('=== 查看课程学生 ===');
        console.log('课程ID:', courseId);
        console.log('当前课程列表:', currentCourses);

        showLoading('正在加载学生信息...');

        // 获取课程信息
        const course = currentCourses.find(c => c.id === courseId);
        console.log('找到的课程:', course);

        if (!course) {
            console.warn('课程信息不存在，课程ID:', courseId);
            showNotification('课程信息不存在', 'error');
            hideLoading();
            return;
        }

        // 获取学生列表
        console.log('正在获取学生列表...');
        const result = await TeacherAPI.getCourseStudents(courseId);
        console.log('API响应:', result);
        hideLoading();

        if (result.success) {
            console.log('学生列表:', result.data);
            showStudentManagementModal(course, result.data);
        } else {
            console.error('获取学生列表失败:', result.message);
            showNotification(result.message || '获取学生列表失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('获取学生列表失败:', error);
        showNotification('获取学生列表失败，请重试', 'error');
    }
}

function showStudentManagementModal(course, students) {
    console.log('=== 显示学生管理模态框 ===');
    console.log('课程:', course);
    console.log('学生数量:', students.length);
    console.log('学生列表:', students);

    // 创建学生管理模态框
    const modalHtml = `
        <div class="course-modal-overlay show" id="student-management-modal">
            <div class="course-modal-container" style="max-width: 900px; max-height: 80vh;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-users"></i> 学生管理 - ${course.name}</h3>
                    </div>
                    <button class="modal-close-btn" onclick="closeStudentManagementModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body" style="max-height: 600px; overflow-y: auto;">
                    <div class="student-management-header" style="margin-bottom: 20px;">
                        <div class="course-info-summary" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 14px;">
                                <div><strong>课程代码：</strong>${course.courseCode}</div>
                                <div><strong>学生总数：</strong>${students.length}人</div>
                                <div><strong>最大容量：</strong>${course.maxStudents || '无限制'}</div>
                            </div>
                        </div>

                        <div class="student-actions" style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button class="course-btn course-btn-primary" onclick="createStudentGroup(${course.id})">
                                <i class="fas fa-users"></i> 创建分组
                            </button>
                            <button class="course-btn course-btn-primary" onclick="viewStudentGroups(${course.id})" style="background: #17a2b8;">
                                <i class="fas fa-layer-group"></i> 查看分组
                            </button>
                            <button class="course-btn course-btn-warning" onclick="exportStudentList(${course.id})">
                                <i class="fas fa-download"></i> 导出名单
                            </button>
                        </div>
                    </div>

                    <div class="students-list">
                        ${students.length === 0 ? `
                            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                                <i class="fas fa-user-plus" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                                <p>暂无学生</p>
                                <p>学生需要通过课程代码加入课程</p>
                            </div>
                        ` : `
                            <div class="students-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                                ${students.map(student => `
                                    <div class="student-card" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px;">
                                        <div class="student-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <div>
                                                <h4 style="margin: 0; color: #2c3e50;">${student.realName}</h4>
                                                <div style="font-size: 12px; color: #6c757d;">${student.studentId || 'N/A'}</div>
                                            </div>
                                            <div class="student-actions" style="display: flex; gap: 5px;">
                                                <button class="course-btn course-btn-primary" style="padding: 4px 8px; font-size: 12px;" onclick="viewStudentProgress(${student.id})" title="学习进度">
                                                    <i class="fas fa-chart-line"></i>
                                                </button>
                                                <button class="course-btn course-btn-primary" style="padding: 4px 8px; font-size: 12px; background: #17a2b8;" onclick="assignToGroup(${student.id}, ${course.id})" title="分配到组">
                                                    <i class="fas fa-users"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="student-info" style="font-size: 13px;">
                                            <div><strong>班级：</strong>${student.className || '未设置'}</div>
                                            <div><strong>专业：</strong>${student.major || '未设置'}</div>
                                            <div><strong>年级：</strong>${student.grade || '未设置'}</div>
                                            <div><strong>加入时间：</strong>${student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeStudentManagementModal()">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    console.log('模态框已创建并添加到DOM中');

    // 检查模态框是否成功添加
    const modal = document.getElementById('student-management-modal');
    console.log('模态框DOM元素:', modal);

    if (modal) {
        console.log('模态框创建成功');
        // 模态框已经有show类，确保正确显示
        modal.style.display = 'flex';
        modal.style.zIndex = '9999';

        // 添加点击背景关闭功能
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeStudentManagementModal();
            }
        });
    } else {
        console.error('模态框创建失败');
    }
}

function closeStudentManagementModal() {
    const modal = document.getElementById('student-management-modal');
    if (modal) {
        modal.remove();
    }
}

// 全局测试函数 - 用于调试学生按钮功能
window.testStudentButton = function() {
    console.log('=== 测试学生按钮功能 ===');
    console.log('当前课程数据:', currentCourses);
    console.log('课程数量:', currentCourses ? currentCourses.length : 0);

    if (!currentCourses || currentCourses.length === 0) {
        console.error('没有课程数据！');
        showNotification('没有课程数据，请先创建课程', 'error');
        return;
    }

    const firstCourse = currentCourses[0];
    console.log('使用第一个课程进行测试:', firstCourse);
    console.log('课程ID:', firstCourse.id);
    console.log('课程名称:', firstCourse.name);

    // 直接调用学生按钮功能
    viewCourseStudents(firstCourse.id);
};

// 另一个测试函数 - 强制刷新课程数据
window.refreshCourseData = async function() {
    console.log('=== 强制刷新课程数据 ===');
    try {
        showLoading('正在刷新课程数据...');
        await loadCourseList();
        console.log('刷新后的课程数据:', currentCourses);
        hideLoading();
        showNotification('课程数据已刷新', 'success');

        // 如果在我的课程页面，重新显示列表
        const myCoursesSection = document.getElementById('my-courses');
        if (myCoursesSection && !myCoursesSection.classList.contains('hidden-section')) {
            displayCoursesList();
        }
    } catch (error) {
        hideLoading();
        console.error('刷新失败:', error);
        showNotification('刷新失败: ' + error.message, 'error');
    }
};

function viewCourseAnalytics(courseId) {
    // 跳转到成绩分析页面，并设置当前课程
    showSection('grade-analysis');

    // 延迟设置课程选择，确保页面已加载
    setTimeout(() => {
        const courseSelect = document.getElementById('analysis-course-select');
        if (courseSelect) {
            courseSelect.value = courseId;
            // 触发课程变化事件
            const event = new Event('change');
            courseSelect.dispatchEvent(event);
        }
    }, 100);
}

function manageCourseExams(courseId) {
    // 跳转到测评管理页面，并设置当前课程
    showSection('test-manage');

    // 延迟设置课程选择，确保页面已加载
    setTimeout(() => {
        const courseSelect = document.getElementById('manage-course-select');
        if (courseSelect) {
            courseSelect.value = courseId;
            // 触发课程变化事件
            const event = new Event('change');
            courseSelect.dispatchEvent(event);
        }
    }, 100);
}

// 创建学生分组
function createStudentGroup(courseId) {
    // 隐藏学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'none';
    }

    // 创建分组模态框
    const modalHtml = `
        <div class="course-modal-overlay show" id="create-group-modal">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-users"></i> 创建学生分组</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="course-btn course-btn-secondary" onclick="backToStudentManagement()" title="返回学生管理">
                            <i class="fas fa-arrow-left"></i> 返回
                        </button>
                    </div>
                </div>

                <div class="course-modal-body">
                    <form id="create-group-form">
                        <div class="form-group">
                            <label>分组名称 <span class="required">*</span></label>
                            <input type="text" id="group-name" class="form-input" placeholder="例如：第1组" required>
                        </div>

                        <div class="form-group">
                            <label>分组描述</label>
                            <textarea id="group-description" class="form-input" rows="3" placeholder="可选：描述分组特点或教学方法"></textarea>
                        </div>

                        <div class="form-group">
                            <label>教学策略</label>
                            <select id="group-strategy" class="form-select">
                                <option value="">请选择教学策略</option>
                                <option value="基础强化">基础强化 - 重点巩固基础知识</option>
                                <option value="能力提升">能力提升 - 培养应用和分析能力</option>
                                <option value="创新探索">创新探索 - 鼓励创新思维和深度学习</option>
                                <option value="个性化指导">个性化指导 - 针对性辅导</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>最大人数</label>
                            <input type="number" id="group-max-size" class="form-input" placeholder="例如：6" min="1" max="20" value="6">
                        </div>
                    </form>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeCreateGroupModal()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button class="course-btn course-btn-primary" onclick="saveStudentGroup(${courseId})">
                        <i class="fas fa-save"></i> 创建分组
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 返回学生管理界面
function backToStudentManagement() {
    // 关闭创建分组界面
    const createModal = document.getElementById('create-group-modal');
    if (createModal) {
        createModal.remove();
    }

    // 显示学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

function closeCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    if (modal) {
        modal.remove();
    }

    // 恢复学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

async function saveStudentGroup(courseId) {
    const groupName = document.getElementById('group-name').value.trim();
    const groupDescription = document.getElementById('group-description').value.trim();
    const groupStrategy = document.getElementById('group-strategy').value;
    const maxSize = document.getElementById('group-max-size').value;

    if (!groupName) {
        showNotification('请输入分组名称', 'warning');
        return;
    }

    try {
        showLoading('正在创建分组...');

        const requestData = {
            groupName: groupName,
            description: groupDescription,
            teachingStrategy: groupStrategy,
            maxSize: parseInt(maxSize) || 6
        };

        const response = await fetch(`/api/teacher/courses/${courseId}/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showNotification(`分组"${groupName}"创建成功！`, 'success');

            // 关闭创建分组界面并返回学生管理界面
            const createModal = document.getElementById('create-group-modal');
            if (createModal) {
                createModal.remove();
            }

            // 显示学生管理界面
            const studentModal = document.getElementById('student-management-modal');
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
        } else {
            showNotification(result.message || '创建分组失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('创建分组失败:', error);
        showNotification('创建分组失败，请重试', 'error');
    }
}

// 查看学生分组
async function viewStudentGroups(courseId) {
    try {
        // 隐藏学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'none';
        }

        showLoading('正在加载分组信息...');

        // 获取分组列表
        const response = await fetch(`/api/teacher/courses/${courseId}/groups`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showStudentGroupsModal(courseId, result.data);
        } else {
            showNotification(result.message || '获取分组列表失败', 'error');

            // 恢复学生管理界面
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
        }

    } catch (error) {
        hideLoading();
        console.error('获取分组列表失败:', error);
        showNotification('获取分组列表失败，请重试', 'error');

        // 恢复学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'flex';
        }
    }
}

function showStudentGroupsModal(courseId, groups) {
    // 创建分组查看模态框
    const modalHtml = `
        <div class="course-modal-overlay show" id="view-groups-modal">
            <div class="course-modal-container" style="max-width: 1000px; max-height: 80vh;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-layer-group"></i> 学生分组管理</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="course-btn course-btn-secondary" onclick="backToStudentManagementFromGroups()" title="返回学生管理">
                            <i class="fas fa-arrow-left"></i> 返回
                        </button>
                    </div>
                </div>

                <div class="course-modal-body" style="max-height: 600px; overflow-y: auto;">
                    <div class="groups-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 14px; color: #666;">
                            当前共有 <strong>${groups.length}</strong> 个分组
                        </div>
                        <button class="course-btn course-btn-primary" onclick="createStudentGroupFromGroups(${courseId})">
                            <i class="fas fa-plus"></i> 新建分组
                        </button>
                    </div>

                    <div id="groups-list">
                        ${groups.length === 0 ? `
                            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                                <i class="fas fa-users" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                                <p>暂无分组</p>
                                <p>点击"新建分组"开始创建学生分组</p>
                            </div>
                        ` : `
                            <div class="groups-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                                ${groups.map(group => `
                                    <div class="group-card" style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px;">
                                        <div class="group-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                            <div>
                                                <h4 style="margin: 0; color: #2c3e50;">${group.groupName}</h4>
                                                <div style="font-size: 12px; color: #6c757d; margin-top: 5px;">
                                                    ${group.teachingStrategy ? `教学策略: ${group.teachingStrategy}` : ''}
                                                </div>
                                            </div>
                                            <div class="group-actions" style="display: flex; gap: 5px;">
                                                <button class="course-btn course-btn-success" onclick="manageGroupMembers(${courseId}, ${group.id})" title="管理成员">
                                                    <i class="fas fa-users"></i>
                                                </button>
                                                <button class="course-btn course-btn-danger" onclick="deleteGroup(${courseId}, ${group.id})" title="删除分组">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>

                                        <div class="group-info" style="margin-bottom: 15px;">
                                            <div style="font-size: 13px; color: #666;">
                                                <div><strong>人数：</strong>${group.currentSize}/${group.maxSize}</div>
                                                <div><strong>创建时间：</strong>${group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}</div>
                                                ${group.description ? `<div><strong>描述：</strong>${group.description}</div>` : ''}
                                            </div>
                                        </div>

                                        <div class="group-members">
                                            <h6 style="margin-bottom: 10px; color: #495057;">成员列表:</h6>
                                            ${group.members.length === 0 ? `
                                                <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
                                                    <i class="fas fa-user-plus"></i> 暂无成员
                                                </div>
                                            ` : `
                                                <div class="members-list" style="max-height: 150px; overflow-y: auto;">
                                                    ${group.members.map(member => `
                                                        <div class="member-item" style="display: flex; justify-content: between; align-items: center; padding: 5px 0; border-bottom: 1px solid #eee;">
                                                            <div style="flex: 1;">
                                                                <span style="font-weight: 500;">${member.studentName}</span>
                                                                <small style="color: #666; margin-left: 10px;">${member.studentId}</small>
                                                            </div>
                                                            <button class="course-btn course-btn-outline-danger" onclick="removeFromGroup(${courseId}, ${group.id}, ${member.id})" title="移除">
                                                                <i class="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            `}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeViewGroupsModal()">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 从分组管理界面创建新分组
function createStudentGroupFromGroups(courseId) {
    // 关闭分组查看界面
    const groupsModal = document.getElementById('view-groups-modal');
    if (groupsModal) {
        groupsModal.remove();
    }

    // 调用创建分组函数（注意：此时学生管理界面已经隐藏了）
    createStudentGroup(courseId);
}

// 从分组管理返回学生管理界面
function backToStudentManagementFromGroups() {
    // 关闭分组查看界面
    const groupsModal = document.getElementById('view-groups-modal');
    if (groupsModal) {
        groupsModal.remove();
    }

    // 显示学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

function closeViewGroupsModal() {
    const modal = document.getElementById('view-groups-modal');
    if (modal) {
        modal.remove();
    }

    // 恢复学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

// 管理分组成员
async function manageGroupMembers(courseId, groupId) {
    try {
        // 隐藏当前界面（可能是学生管理界面或分组查看界面）
        const studentModal = document.getElementById('student-management-modal');
        const groupsModal = document.getElementById('view-groups-modal');
        if (studentModal) {
            studentModal.style.display = 'none';
        }
        if (groupsModal) {
            groupsModal.style.display = 'none';
        }

        showLoading('正在加载数据...');

        // 获取课程学生列表
        const studentsResponse = await fetch(`/api/teacher/courses/${courseId}/students`, {
            method: 'GET',
            credentials: 'include'
        });

        const studentsResult = await studentsResponse.json();

        if (!studentsResult.success) {
            hideLoading();
            showNotification(studentsResult.message || '获取学生列表失败', 'error');
            return;
        }

        // 获取当前分组信息
        const groupsResponse = await fetch(`/api/teacher/courses/${courseId}/groups`, {
            method: 'GET',
            credentials: 'include'
        });

        const groupsResult = await groupsResponse.json();
        hideLoading();

        if (!groupsResult.success) {
            showNotification(groupsResult.message || '获取分组信息失败', 'error');
            return;
        }

        const currentGroup = groupsResult.data.find(g => g.id === groupId);
        if (!currentGroup) {
            showNotification('分组不存在', 'error');
            return;
        }

        showMemberManagementModal(courseId, groupId, currentGroup, studentsResult.data);

    } catch (error) {
        hideLoading();
        console.error('加载数据失败:', error);
        showNotification('加载数据失败，请重试', 'error');
    }
}

function showMemberManagementModal(courseId, groupId, group, allStudents) {
    // 获取已分组的学生ID
    const assignedStudentIds = group.members.map(m => m.studentId);

    // 过滤出未分组的学生
    const unassignedStudents = allStudents.filter(student => !assignedStudentIds.includes(student.id));

    const modalHtml = `
        <div class="course-modal-overlay show" id="member-management-modal">
            <div class="course-modal-container" style="max-width: 800px; max-height: 80vh;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-users"></i> 管理分组成员 - ${group.groupName}</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="course-btn course-btn-secondary" onclick="backFromMemberManagement(${courseId})" title="返回上级">
                            <i class="fas fa-arrow-left"></i> 返回
                        </button>
                    </div>
                </div>

                <div class="course-modal-body" style="max-height: 600px; overflow-y: auto;">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>未分组学生 (${unassignedStudents.length})</h6>
                            <div class="students-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px;">
                                ${unassignedStudents.length === 0 ? `
                                    <div style="text-align: center; padding: 20px; color: #999;">
                                        <i class="fas fa-user-check"></i> 所有学生已分组
                                    </div>
                                ` : `
                                    ${unassignedStudents.map(student => `
                                        <div class="student-item" style="display: flex; justify-content: between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                                            <div style="flex: 1;">
                                                <span>${student.realName}</span>
                                                <small style="color: #666; margin-left: 10px;">${student.studentId}</small>
                                            </div>
                                            <button class="course-btn course-btn-success" onclick="addToGroup(${courseId}, ${groupId}, ${student.id})" title="加入分组">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                        </div>

                        <div class="col-md-6">
                            <h6>当前分组成员 (${group.members.length}/${group.maxSize})</h6>
                            <div class="members-list" style="max-height: 400px; overflow-y: auto; border: 1px solid #dee2e6; border-radius: 4px; padding: 10px;">
                                ${group.members.length === 0 ? `
                                    <div style="text-align: center; padding: 20px; color: #999;">
                                        <i class="fas fa-user-plus"></i> 暂无成员
                                    </div>
                                ` : `
                                    ${group.members.map(member => `
                                        <div class="member-item" style="display: flex; justify-content: between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                                            <div style="flex: 1;">
                                                <span>${member.studentName}</span>
                                                <small style="color: #666; margin-left: 10px;">${member.studentId}</small>
                                            </div>
                                            <button class="course-btn course-btn-outline-danger" onclick="removeFromGroup(${courseId}, ${groupId}, ${member.id})" title="移除">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeMemberManagementModal()">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 添加点击背景关闭功能
    const modal = document.getElementById('member-management-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeMemberManagementModal();
        }
    });
}

// 刷新成员管理界面（不隐藏背景界面）
async function refreshMemberManagement(courseId, groupId) {
    try {
        showLoading('正在刷新数据...');

        // 获取课程学生列表
        const studentsResponse = await fetch(`/api/teacher/courses/${courseId}/students`, {
            method: 'GET',
            credentials: 'include'
        });

        const studentsResult = await studentsResponse.json();

        if (!studentsResult.success) {
            hideLoading();
            showNotification(studentsResult.message || '获取学生列表失败', 'error');
            return;
        }

        // 获取当前分组信息
        const groupsResponse = await fetch(`/api/teacher/courses/${courseId}/groups`, {
            method: 'GET',
            credentials: 'include'
        });

        const groupsResult = await groupsResponse.json();
        hideLoading();

        if (!groupsResult.success) {
            showNotification(groupsResult.message || '获取分组信息失败', 'error');
            return;
        }

        const currentGroup = groupsResult.data.find(g => g.id === groupId);
        if (!currentGroup) {
            showNotification('分组不存在', 'error');
            return;
        }

        // 直接显示界面，不隐藏背景
        showMemberManagementModal(courseId, groupId, currentGroup, studentsResult.data);

    } catch (error) {
        hideLoading();
        console.error('刷新数据失败:', error);
        showNotification('刷新数据失败，请重试', 'error');
    }
}

// 从成员管理返回上级界面
function backFromMemberManagement(courseId) {
    // 关闭成员管理界面
    const memberModal = document.getElementById('member-management-modal');
    if (memberModal) {
        memberModal.remove();
    }

    // 检查是否有分组查看界面（优先恢复分组界面）
    const groupsModal = document.getElementById('view-groups-modal');
    if (groupsModal) {
        groupsModal.style.display = 'flex';
    } else {
        // 如果没有分组界面，恢复学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'flex';
        }
    }
}

function closeMemberManagementModal() {
    const modal = document.getElementById('member-management-modal');
    if (modal) {
        modal.remove();
    }

    // 恢复之前的界面
    const groupsModal = document.getElementById('view-groups-modal');
    const studentModal = document.getElementById('student-management-modal');

    if (groupsModal) {
        groupsModal.style.display = 'flex';
    } else if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

// 添加学生到分组
async function addToGroup(courseId, groupId, studentId) {
    try {
        showLoading('正在添加学生...');

        const response = await fetch(`/api/teacher/courses/${courseId}/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                studentIds: [studentId]
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showNotification('学生添加成功', 'success');
            // 直接刷新当前成员管理界面
            const memberModal = document.getElementById('member-management-modal');
            if (memberModal) {
                memberModal.remove();
            }

            // 重新打开管理界面以显示更新后的数据（不隐藏背景界面）
            setTimeout(() => {
                // 获取数据并重新显示界面，但不隐藏背景
                refreshMemberManagement(courseId, groupId);
            }, 300);
        } else {
            showNotification(result.message || '添加学生失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('添加学生失败:', error);
        showNotification('添加学生失败，请重试', 'error');
    }
}

// 从分组中移除学生
async function removeFromGroup(courseId, groupId, memberId) {
    if (!confirm('确定要移除该学生吗？')) {
        return;
    }

    try {
        showLoading('正在移除学生...');

        const response = await fetch(`/api/teacher/courses/${courseId}/groups/${groupId}/members/${memberId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showNotification('学生移除成功', 'success');
            // 直接刷新当前成员管理界面
            const memberModal = document.getElementById('member-management-modal');
            if (memberModal) {
                memberModal.remove();
            }

            // 重新打开管理界面以显示更新后的数据（不隐藏背景界面）
            setTimeout(() => {
                // 获取数据并重新显示界面，但不隐藏背景
                refreshMemberManagement(courseId, groupId);
            }, 300);
        } else {
            showNotification(result.message || '移除学生失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('移除学生失败:', error);
        showNotification('移除学生失败，请重试', 'error');
    }
}

// 删除分组
async function deleteGroup(courseId, groupId) {
    if (!confirm('确定要删除该分组吗？这将同时移除所有分组成员。')) {
        return;
    }

    try {
        showLoading('正在删除分组...');

        const response = await fetch(`/api/teacher/courses/${courseId}/groups/${groupId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showNotification('分组删除成功', 'success');
            // 刷新分组列表
            viewStudentGroups(courseId);
        } else {
            showNotification(result.message || '删除分组失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('删除分组失败:', error);
        showNotification('删除分组失败，请重试', 'error');
    }
}

// 分配学生到分组（从学生管理界面调用）
async function assignToGroup(studentId, courseId = null) {
    try {
        // 如果没有courseId，尝试从当前上下文获取
        if (!courseId) {
            showNotification('请从课程管理界面访问此功能', 'warning');
            return;
        }

        // 隐藏学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'none';
        }

        showLoading('正在加载分组信息...');

        // 获取课程分组列表
        const groupsResponse = await fetch(`/api/teacher/courses/${courseId}/groups`, {
            method: 'GET',
            credentials: 'include'
        });

        const groupsResult = await groupsResponse.json();
        hideLoading();

        if (!groupsResult.success) {
            showNotification(groupsResult.message || '获取分组列表失败', 'error');
            // 恢复学生管理界面
            const studentModal = document.getElementById('student-management-modal');
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
            return;
        }

        const groups = groupsResult.data;

        if (groups.length === 0) {
            showNotification('暂无可用分组，请先创建分组', 'warning');
            // 恢复学生管理界面
            const studentModal = document.getElementById('student-management-modal');
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
            return;
        }

        // 过滤出未满员的分组
        const availableGroups = groups.filter(group => group.currentSize < group.maxSize);

        if (availableGroups.length === 0) {
            showNotification('所有分组已满员，请增加分组容量或创建新分组', 'warning');
            // 恢复学生管理界面
            const studentModal = document.getElementById('student-management-modal');
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
            return;
        }

        showAssignToGroupModal(studentId, courseId, availableGroups);

    } catch (error) {
        hideLoading();
        console.error('加载分组信息失败:', error);
        showNotification('加载分组信息失败，请重试', 'error');
        // 恢复学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'flex';
        }
    }
}

function showAssignToGroupModal(studentId, courseId, groups) {
    const modalHtml = `
        <div class="course-modal-overlay show" id="assign-to-group-modal">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-users"></i> 分配学生到分组</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="course-btn course-btn-secondary" onclick="backToStudentManagementFromAssign()" title="返回学生管理">
                            <i class="fas fa-arrow-left"></i> 返回
                        </button>
                    </div>
                </div>

                <div class="course-modal-body">
                    <div class="form-group">
                        <label style="margin-bottom: 10px; font-weight: bold;">选择分组：</label>
                        <div class="groups-selection">
                            ${groups.map(group => `
                                <div class="group-option" style="margin-bottom: 10px; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; cursor: pointer;"
                                     onclick="selectGroup(${group.id})">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <div style="font-weight: bold; margin-bottom: 5px;">${group.groupName}</div>
                                            <div style="font-size: 12px; color: #666;">
                                                ${group.description || '无描述'}
                                            </div>
                                            ${group.teachingStrategy ? `
                                                <div style="font-size: 12px; color: #007bff; margin-top: 3px;">
                                                    <i class="fas fa-lightbulb"></i> ${group.teachingStrategy}
                                                </div>
                                            ` : ''}
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 14px; font-weight: bold;">
                                                ${group.currentSize}/${group.maxSize}
                                            </div>
                                            <div style="font-size: 12px; color: #666;">
                                                ${group.maxSize - group.currentSize} 个空位
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeAssignToGroupModal()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 添加点击背景关闭功能
    const modal = document.getElementById('assign-to-group-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAssignToGroupModal();
        }
    });

    // 存储学生ID和课程ID供后续使用
    window.assignToGroupData = { studentId, courseId };
}

// 从分配学生界面返回学生管理
function backToStudentManagementFromAssign() {
    // 关闭分配界面
    const assignModal = document.getElementById('assign-to-group-modal');
    if (assignModal) {
        assignModal.remove();
    }

    // 显示学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }

    delete window.assignToGroupData;
}

function closeAssignToGroupModal() {
    const modal = document.getElementById('assign-to-group-modal');
    if (modal) {
        modal.remove();
    }

    // 恢复学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }

    delete window.assignToGroupData;
}

function selectGroup(groupId) {
    const data = window.assignToGroupData;
    if (!data) return;

    // 高亮选中的分组
    const options = document.querySelectorAll('.group-option');
    options.forEach(option => {
        option.style.backgroundColor = '#f8f9fa';
        option.style.borderColor = '#dee2e6';
    });

    const selectedOption = document.querySelector(`[onclick="selectGroup(${groupId})"]`);
    if (selectedOption) {
        selectedOption.style.backgroundColor = '#e3f2fd';
        selectedOption.style.borderColor = '#2196f3';
    }

    // 执行分配
    assignStudentToGroup(data.studentId, data.courseId, groupId);
}

async function assignStudentToGroup(studentId, courseId, groupId) {
    try {
        showLoading('正在分配学生...');

        const response = await fetch(`/api/teacher/courses/${courseId}/groups/${groupId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                studentIds: [studentId]
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            showNotification('学生分配成功！', 'success');
            closeAssignToGroupModal();
        } else {
            showNotification(result.message || '分配失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('分配学生失败:', error);
        showNotification('分配学生失败，请重试', 'error');
    }
}

// 查看学生学习进度
async function viewStudentProgress(studentId, courseId = null) {
    try {
        // 隐藏学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'none';
        }

        showLoading('正在加载学生进度...');

        const result = await TeacherAPI.getStudentProgress(studentId, courseId);
        hideLoading();

        if (result.success) {
            showStudentProgressModal(result.data);
        } else {
            showNotification(result.message || '获取学生进度失败', 'error');
            // 恢复学生管理界面
            if (studentModal) {
                studentModal.style.display = 'flex';
            }
        }

    } catch (error) {
        hideLoading();
        console.error('获取学生进度失败:', error);
        showNotification('获取学生进度失败，请重试', 'error');
        // 恢复学生管理界面
        const studentModal = document.getElementById('student-management-modal');
        if (studentModal) {
            studentModal.style.display = 'flex';
        }
    }
}

function showStudentProgressModal(progressData) {
    const student = progressData.studentInfo;
    const course = progressData.courseInfo;
    const courseProgress = progressData.courseProgress;
    const enrolledCourses = progressData.enrolledCourses;
    const examResults = progressData.examResults;

    const modalHtml = `
        <div class="course-modal-overlay show" id="student-progress-modal">
            <div class="course-modal-container" style="max-width: 900px; max-height: 85vh;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <h3><i class="fas fa-chart-line"></i> 学生学习进度 - ${student.realName}</h3>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="course-btn course-btn-secondary" onclick="backToStudentManagementFromProgress()" title="返回学生管理">
                            <i class="fas fa-arrow-left"></i> 返回
                        </button>
                    </div>
                </div>

                <div class="course-modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <!-- 学生基本信息 -->
                    <div class="progress-section" style="margin-bottom: 20px;">
                        <h6 style="color: #495057; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #007bff;">
                            <i class="fas fa-user"></i> 基本信息
                        </h6>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-item" style="margin-bottom: 10px;">
                                    <strong>学号：</strong>${student.studentId || 'N/A'}
                                </div>
                                <div class="info-item" style="margin-bottom: 10px;">
                                    <strong>班级：</strong>${student.className || 'N/A'}
                                </div>
                                <div class="info-item" style="margin-bottom: 10px;">
                                    <strong>年级：</strong>${student.grade || 'N/A'}
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-item" style="margin-bottom: 10px;">
                                    <strong>专业：</strong>${student.major || 'N/A'}
                                </div>
                                <div class="info-item" style="margin-bottom: 10px;">
                                    <strong>入学年份：</strong>${student.entranceYear || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    ${course && courseProgress ? `
                        <!-- 课程进度 -->
                        <div class="progress-section" style="margin-bottom: 20px;">
                            <h6 style="color: #495057; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #28a745;">
                                <i class="fas fa-book"></i> 课程进度 - ${course.name}
                            </h6>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="progress-card" style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #007bff;">${courseProgress.examCount}</div>
                                        <div style="font-size: 12px; color: #666;">参与考试</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="progress-card" style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">${courseProgress.averageScore}</div>
                                        <div style="font-size: 12px; color: #666;">平均分</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="progress-card" style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${courseProgress.maxScore}</div>
                                        <div style="font-size: 12px; color: #666;">最高分</div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="progress-card" style="text-align: center; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${Math.round(courseProgress.passRate * 100)}%</div>
                                        <div style="font-size: 12px; color: #666;">通过率</div>
                                    </div>
                                </div>
                            </div>
                            ${courseProgress.enrollmentDate ? `
                                <div style="margin-top: 15px; font-size: 14px; color: #666;">
                                    <i class="fas fa-calendar-alt"></i> 加入时间: ${new Date(courseProgress.enrollmentDate).toLocaleString()}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <!-- 所有课程 -->
                    <div class="progress-section" style="margin-bottom: 20px;">
                        <h6 style="color: #495057; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #17a2b8;">
                            <i class="fas fa-graduation-cap"></i> 已选课程 (${enrolledCourses.length})
                        </h6>
                        ${enrolledCourses.length === 0 ? `
                            <div style="text-align: center; padding: 20px; color: #999;">
                                <i class="fas fa-book-open"></i> 暂无选课记录
                            </div>
                        ` : `
                            <div class="courses-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                                ${enrolledCourses.map(course => `
                                    <div class="course-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                                        <div style="font-weight: bold; margin-bottom: 5px;">${course.name}</div>
                                        <div style="font-size: 14px; color: #666;">
                                            <div>课程代码: ${course.courseCode}</div>
                                            <div>任课教师: ${course.teacherName}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- 考试成绩 -->
                    <div class="progress-section" style="margin-bottom: 20px;">
                        <h6 style="color: #495057; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #dc3545;">
                            <i class="fas fa-chart-bar"></i> 考试成绩记录 (${examResults.length})
                        </h6>
                        ${examResults.length === 0 ? `
                            <div style="text-align: center; padding: 20px; color: #999;">
                                <i class="fas fa-clipboard-list"></i> 暂无考试记录
                            </div>
                        ` : `
                            <div class="exam-results-list" style="max-height: 300px; overflow-y: auto;">
                                ${examResults.map(exam => `
                                    <div class="exam-result-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 4px;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; margin-bottom: 2px;">${exam.examTitle}</div>
                                            <div style="font-size: 12px; color: #666;">
                                                ${exam.courseName} | ${exam.submittedAt ? new Date(exam.submittedAt).toLocaleString() : 'N/A'}
                                            </div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="font-size: 18px; font-weight: bold; color: ${exam.score >= 60 ? '#28a745' : '#dc3545'};">
                                                ${exam.score}/${exam.totalScore}
                                            </div>
                                            <div style="font-size: 12px; color: #666;">
                                                ${Math.round(exam.score / exam.totalScore * 100)}%
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>

                <div class="course-modal-actions">
                    <button class="course-btn course-btn-cancel" onclick="closeStudentProgressModal()">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 添加点击背景关闭功能
    const modal = document.getElementById('student-progress-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeStudentProgressModal();
        }
    });
}

// 从学习进度界面返回学生管理
function backToStudentManagementFromProgress() {
    // 关闭学习进度界面
    const progressModal = document.getElementById('student-progress-modal');
    if (progressModal) {
        progressModal.remove();
    }

    // 显示学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

function closeStudentProgressModal() {
    const modal = document.getElementById('student-progress-modal');
    if (modal) {
        modal.remove();
    }

    // 恢复学生管理界面
    const studentModal = document.getElementById('student-management-modal');
    if (studentModal) {
        studentModal.style.display = 'flex';
    }
}

// 导出学生名单
async function exportStudentList(courseId) {
    try {
        showLoading('正在导出学生名单...');

        const response = await fetch(`/api/teacher/courses/${courseId}/students/export`, {
            method: 'GET',
            credentials: 'include'
        });

        hideLoading();

        if (response.ok) {
            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = 'student_list.xlsx';
            if (contentDisposition && contentDisposition.includes('filename*=UTF-8\'\'')) {
                fileName = decodeURIComponent(contentDisposition.split('filename*=UTF-8\'\'')[1]);
            }

            // 创建blob并下载
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('学生名单导出成功！', 'success');
        } else {
            showNotification('导出失败，请重试', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('导出学生名单失败:', error);
        showNotification('导出失败，请重试', 'error');
    }
}

function updateImprovementCourseSelect() {
    const courseSelect = document.getElementById('improve-course-select');
    if (!courseSelect) return;

    courseSelect.innerHTML = '<option value="">请选择课程</option>';

    if (currentCourses && currentCourses.length > 0) {
        currentCourses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.courseCode})`;
            courseSelect.appendChild(option);
        });
    }
}

function setupImprovementEvents() {
    // 不需要处理分析范围，只保留课程选择功能
    // 课程选择下拉栏始终可见

    // 检查并显示"我的报告"按钮
    checkAndShowMyReportsButton();
}

// 检查并显示"我的报告"按钮
async function checkAndShowMyReportsButton() {
    try {
        const response = await fetch('/api/teaching-reports/list', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                showMyReportsButton();
                console.log(`发现 ${result.data.length} 个历史报告，显示"我的报告"按钮`);
            } else {
                // 即使没有历史报告，也显示按钮（点击时显示空状态）
                showMyReportsButton();
                console.log('没有历史报告，但仍显示"我的报告"按钮');
            }
        }
    } catch (error) {
        console.error('检查历史报告时出错:', error);
        // 发生错误时也显示按钮
        showMyReportsButton();
    }
}
function updateMaterialsTable() {
    console.log('开始更新资料表格, currentMaterials:', currentMaterials);
    const tbody = document.querySelector('#materials-table tbody');
    if (!tbody) {
        console.log('表格体元素未找到');
        return;
    }

    tbody.innerHTML = '';

    if (!currentMaterials || currentMaterials.length === 0) {
        console.log('没有资料数据，显示空状态');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                知识库暂无资料
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    // 按课程分组资料
    const groupedMaterials = {};
    console.log('当前资料列表:', currentMaterials);
    console.log('当前课程列表:', currentCourses);

    currentMaterials.forEach(material => {
        console.log(`原始资料数据:`, material);

        // 尝试多种可能的字段名
        const courseId = material.courseId || material.course_id || material.courseID ||
                        (material.course && material.course.id) ||
                        (material.Course && material.Course.id);

        console.log(`尝试获取courseId: courseId=${material.courseId}, course_id=${material.course_id}, courseID=${material.courseID}, course.id=${material.course?.id}`);
        console.log(`最终courseId: ${courseId} (${typeof courseId}), 是否为null/undefined: ${courseId == null}`);

        // 从全局课程列表中查找课程信息
        let courseInfo = null;
        if (currentCourses && currentCourses.length > 0) {
            console.log(`查找课程ID: ${courseId} (类型: ${typeof courseId})`);
            console.log('可用课程列表:', currentCourses.map(c => `${c.name}(id:${c.id}, 类型:${typeof c.id})`));

            courseInfo = currentCourses.find(course => {
                const match1 = course.id == courseId;
                const match2 = course.id === courseId;
                const match3 = String(course.id) === String(courseId);
                const match4 = Number(course.id) === Number(courseId);
                const anyMatch = match1 || match2 || match3 || match4;

                console.log(`课程 ${course.name}: id=${course.id}(${typeof course.id}) vs ${courseId}(${typeof courseId}) -> 松散:${match1}, 严格:${match2}, 字符串:${match3}, 数字:${match4}, 匹配:${anyMatch}`);

                return anyMatch;
            });

            console.log(`最终找到的课程:`, courseInfo);
        } else {
            console.warn('课程列表为空，无法查找课程信息');
        }

        const courseName = courseInfo ? courseInfo.name : '未知课程';
        console.log(`找到课程信息:`, courseInfo, `课程名称: ${courseName}`);

        // 如果courseId为null或undefined，使用'unknown'作为key
        const safeKey = courseId != null ? `${courseId}_${courseName}` : `unknown_${courseName}`;
        console.log(`生成的key: ${safeKey}`);

        const key = safeKey;

        if (!groupedMaterials[key]) {
            groupedMaterials[key] = {
                courseInfo: courseInfo,
                materials: []
            };
        }
        groupedMaterials[key].materials.push(material);
    });

    // 生成课程颜色
    const courseKeys = Object.keys(groupedMaterials);
    const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22',
        '#ad4e00', '#7f8c8d', '#27ae60', '#8e44ad',
        '#16a085', '#2980b9', '#d35400', '#c0392b'
    ];

    const courseColors = {};
    courseKeys.forEach((key, index) => {
        courseColors[key] = colors[index % colors.length];
    });

    // 遍历每个课程组
    Object.entries(groupedMaterials).forEach(([courseKey, courseGroup]) => {
        const color = courseColors[courseKey];
        const courseInfo = courseGroup.courseInfo;
        const courseMaterials = courseGroup.materials;
        const courseName = courseInfo ? courseInfo.name : '未知课程';
        const courseCode = courseInfo ? courseInfo.courseCode : '';

        // 按上传时间排序
        courseMaterials.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        // 为每个课程的资料添加相同的背景色
        courseMaterials.forEach((material, index) => {
            const row = document.createElement('tr');
            row.style.cssText = `background-color: ${color}20; border-left: 4px solid ${color};`;

            // 文件类型图标
            const typeIcon = getFileTypeIcon(material.originalName || material.filename);

            // 文件大小格式化
            const fileSize = formatFileSize(material.fileSize || 0);

            row.innerHTML = `
                <td style="position: relative;">
                    ${index === 0 ? `
                        <div style="
                            background: ${color};
                            color: white;
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 13px;
                            font-weight: 500;
                            display: inline-block;
                            margin-bottom: 4px;
                        ">
                            ${courseName}${courseCode ? ` (${courseCode})` : ''}
                        </div>
                    ` : ''}
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="${typeIcon}" style="color: ${color};"></i>
                        <span>${material.originalName || material.filename}</span>
                    </div>
                </td>
                <td>${formatDate(material.uploadedAt)}</td>
                <td>${fileSize}</td>
                <td>
                    <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-start;">
                        <button class="btn btn-sm btn-primary" onclick="downloadMaterial(${material.id})" title="下载文件">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${material.id})" title="删除资料">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    });
}

// 获取文件类型图标
function getFileTypeIcon(filename) {
    if (!filename) return 'fas fa-file';

    const ext = filename.toLowerCase().split('.').pop();
    switch(ext) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'doc':
        case 'docx': return 'fas fa-file-word';
        case 'xls':
        case 'xlsx': return 'fas fa-file-excel';
        case 'ppt':
        case 'pptx': return 'fas fa-file-powerpoint';
        case 'txt': return 'fas fa-file-alt';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'fas fa-file-image';
        case 'mp4':
        case 'avi':
        case 'mov': return 'fas fa-file-video';
        case 'mp3':
        case 'wav': return 'fas fa-file-audio';
        case 'zip':
        case 'rar': return 'fas fa-file-archive';
        case 'html':
        case 'css':
        case 'js': return 'fas fa-file-code';
        default: return 'fas fa-file';
    }
}

// 获取文件类型标签（带颜色）
function getTypeLabel(materialType) {
    const typeColors = {
        'COURSEWARE': { bg: '#4CAF50', text: 'white', label: 'PPT' },
        'DOCUMENT': { bg: '#2196F3', text: 'white', label: 'WORD' },
        'VIDEO': { bg: '#FF9800', text: 'white', label: 'VIDEO' },
        'AUDIO': { bg: '#9C27B0', text: 'white', label: 'AUDIO' },
        'IMAGE': { bg: '#00BCD4', text: 'white', label: 'IMAGE' },
        'PDF': { bg: '#F44336', text: 'white', label: 'PDF' },
        'OTHER': { bg: '#607D8B', text: 'white', label: 'OTHER' }
    };

    const color = typeColors[materialType] || typeColors['OTHER'];
    return `<span style="background: ${color.bg}; color: ${color.text}; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
        ${color.label}
    </span>`;
}

// 文件大小格式化已在line 1100定义，删除重复定义

// 下载资料
function downloadMaterial(materialId) {
    window.open(`/api/teacher/materials/${materialId}/download`, '_blank');
}

// 删除资料
async function deleteMaterial(materialId) {
    try {
        const confirmed = await showConfirmDialog(
            '删除资料',
            '确定要删除这个资料吗？删除后不可恢复！',
            '删除'
        );

        if (!confirmed) {
            return;
        }

        showLoading('正在删除资料...');

        // 调用API删除资料
        await TeacherAPI.deleteMaterial(materialId);

        hideLoading();
        showNotification('资料删除成功！', 'success');

        // 删除成功后，直接调用刷新资料函数
        console.log('删除成功，正在自动刷新资料列表...');
        await loadMaterialsData();
        console.log('资料列表刷新完成！');

    } catch (error) {
        hideLoading();
        console.error('删除资料失败:', error);
        showNotification('删除资料失败：' + error.message, 'error');
    }
}
function updateNoticesTable() {
    const tableBody = document.querySelector('#notices-table tbody');
    if (!tableBody) return;

    if (!currentNotices || currentNotices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #7f8c8d; padding: 40px;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    暂无通知记录
                </td>
            </tr>
        `;
        return;
    }

    // 只显示最新的3条通知
    const recentNotices = [...currentNotices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);

    tableBody.innerHTML = recentNotices.map(notice => {
        const courseName = notice.courseName || '未知课程';
        const courseCode = notice.courseCode || '未知代码';

        const statusText = notice.pushTime === 'scheduled' && notice.scheduledTime ?
                          (new Date(notice.scheduledTime) > new Date() ? '待推送' : '已推送') : '已推送';

        const statusClass = statusText === '待推送' ? 'status-pending' : 'status-sent';

        return `
            <tr>
                <td>
                    <div class="notice-title-only">${notice.title}</div>
                </td>
                <td>${formatDate(notice.createdAt)}</td>
                <td>
                    <div class="course-info">
                        <div class="course-name">${courseName}</div>
                        <div class="course-code">${courseCode}</div>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="viewNoticeDetail(${notice.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editNotice(${notice.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteNotice(${notice.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // 如果通知总数超过3条，显示查看全部通知的提示
    if (currentNotices.length > 3) {
        const viewAllRow = document.createElement('tr');
        viewAllRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 16px; border-top: 2px solid #f1f2f6;">
                <a href="#" onclick="loadNoticeHistory()" style="color: var(--primary-color); text-decoration: none; font-weight: 500;">
                    <i class="fas fa-list"></i> 查看全部通知 (${currentNotices.length} 条)
                </a>
            </td>
        `;
        tableBody.appendChild(viewAllRow);
    }
}

// 更新首页最新通知显示（只显示最新2条）
function updateDashboardRecentNotices() {
    const container = document.getElementById('recent-notices-container');
    const viewAllBtn = document.getElementById('view-all-notices-btn');
    if (!container) return;

    if (!allNotices || allNotices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无最新通知</p>
                <p>管理端发布通知后会在这里显示</p>
            </div>
        `;
        if (viewAllBtn) viewAllBtn.style.display = 'none';
        return;
    }

    // 取最新的2条通知
    const recentNotices = [...allNotices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

    const noticesHtml = recentNotices.map(notice => {
        const courseName = notice.courseName || '未知课程';
        const courseCode = notice.courseCode || '未知代码';
        const teacherName = notice.teacherName || '未知教师';
        const statusText = notice.pushTime === 'scheduled' ? '定时推送' : '立即推送';
        const statusClass = statusText === '待推送' ? 'status-pending' : 'status-sent';
        const truncatedContent = notice.content.length > 60 ? notice.content.substring(0, 60) + '...' : notice.content;

        // 计算推送时间：如果是定时推送且有推送时间，使用推送时间；否则使用创建时间
        const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime)
            ? notice.scheduledTime
            : notice.createdAt;

        return `
            <div class="recent-notice-card" onclick="viewTeacherNoticeDetail(${notice.id})">
                <div class="recent-notice-header">
                    <div class="recent-notice-title">${notice.title}</div>
                    <div class="recent-notice-time">${formatPushTime(pushTime)}</div>
                </div>
                <div class="recent-notice-content">${truncatedContent}</div>
                <div class="recent-notice-footer">
                    <div class="recent-notice-course">${courseName}(${courseCode})</div>
                    <div class="recent-notice-course">发布者：${teacherName}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="recent-notices-list">
            ${noticesHtml}
        </div>
    `;

    // 显示或隐藏"查看全部"按钮
    if (viewAllBtn) {
        if (allNotices.length > 2) {
            viewAllBtn.style.display = 'inline-flex';
            viewAllBtn.innerHTML = `<i class="fas fa-list"></i> 查看全部 (${allNotices.length})`;
        } else {
            viewAllBtn.style.display = 'none';
        }
    }
}

// 格式化短日期
function formatShortDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffTime = now - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return d.toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'});
    } else if (diffDays === 1) {
        return '昨天';
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return d.toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'});
    }
}

// 查看教师通知详情（用于首页显示的通知）
function viewTeacherNoticeDetail(noticeId) {
    const notice = currentNotices.find(n => n.id === noticeId);
    if (!notice) return;

    const targetText = notice.courseName ? `${notice.courseName}(${notice.courseCode})` : '指定课程';
    const teacherName = notice.teacherName || '未知教师';
    const pushTimeText = notice.pushTime === 'scheduled' ? '定时推送' : '立即推送';

    // 计算推送时间：如果是定时推送且有推送时间，使用推送时间；否则使用创建时间
    const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime)
        ? notice.scheduledTime
        : notice.createdAt;

    const modalHtml = `
        <div id="teacher-notice-detail-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: var(--primary-color);">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <h3>通知详情</h3>
                    </div>
                    <button id="close-teacher-notice-detail" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="notice-detail">
                        <div class="detail-row">
                            <label>标题：</label>
                            <span>${notice.title}</span>
                        </div>
                        <div class="detail-row">
                            <label>内容：</label>
                            <div class="notice-content">${notice.content}</div>
                        </div>
                        <div class="detail-row">
                            <label>课程：</label>
                            <span>${targetText}</span>
                        </div>
                        <div class="detail-row">
                            <label>发布者：</label>
                            <span>${teacherName}</span>
                        </div>
                        <div class="detail-row">
                            <label>推送方式：</label>
                            <span>${pushTimeText}${notice.pushTime === 'scheduled' && notice.scheduledTime ?
                                ` (${formatDateTime(notice.scheduledTime)})` : ''}</span>
                        </div>
                        <div class="detail-row">
                            <label>推送时间：</label>
                            <span>${formatPushTime(pushTime)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定关闭事件
    document.getElementById('close-teacher-notice-detail').addEventListener('click', function() {
        document.getElementById('teacher-notice-detail-modal').remove();
    });

    // 点击背景关闭
    document.getElementById('teacher-notice-detail-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// 查看通知详情（原有的函数，用于通知管理页面）
function viewNoticeDetail(noticeId) {
    const notice = currentNotices.find(n => n.id === noticeId);
    if (!notice) return;

    const targetText = notice.courseName ? `${notice.courseName}(${notice.courseCode})` : '指定课程';

    const pushTimeText = notice.pushTime === 'scheduled' ? '定时推送' : '立即推送';

    const modalHtml = `
        <div id="notice-detail-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: var(--primary-color);">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <h3>通知详情</h3>
                    </div>
                    <button id="close-notice-detail" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="notice-detail">
                        <div class="detail-row">
                            <label>标题：</label>
                            <span>${notice.title}</span>
                        </div>
                        <div class="detail-row">
                            <label>内容：</label>
                            <div class="notice-content">${notice.content}</div>
                        </div>
                        <div class="detail-row">
                            <label>课程：</label>
                            <span>${targetText}</span>
                        </div>
                        <div class="detail-row">
                            <label>推送方式：</label>
                            <span>${pushTimeText}</span>
                        </div>
                        ${notice.scheduledTime ? `
                        <div class="detail-row">
                            <label>推送时间：</label>
                            <span>${formatDate(notice.scheduledTime)}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <label>发布时间：</label>
                            <span>${formatDate(notice.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('notice-detail-modal');
    const closeBtn = document.getElementById('close-notice-detail');

    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 编辑通知
function editNotice(noticeId) {
    const notice = currentNotices.find(n => n.id === noticeId);
    if (!notice) return;

    // 检查通知状态，只允许编辑待推送的定时通知
    const isScheduled = notice.pushTime === 'scheduled' && notice.scheduledTime;
    const isPending = isScheduled && new Date(notice.scheduledTime) > new Date();

    if (!isPending) {
        showNotification('只能编辑待推送的定时通知', 'warning');
        return;
    }

    showEditNoticeModal(notice);
}

// 显示编辑通知模态框
function showEditNoticeModal(notice) {
    const modalHtml = `
        <div id="edit-notice-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 700px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: var(--primary-color);">
                            <i class="fas fa-edit"></i>
                        </div>
                        <h3>编辑通知</h3>
                    </div>
                    <button id="close-edit-notice" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <form id="edit-notice-form">
                        <div class="form-group">
                            <label for="edit-notice-title">标题：<span style="color: #e74c3c;">*</span></label>
                            <input type="text" id="edit-notice-title" class="form-input" value="${notice.title}" required style="width: 100%;">
                        </div>

                        <div class="form-group">
                            <label for="edit-notice-content">内容：<span style="color: #e74c3c;">*</span></label>
                            <textarea id="edit-notice-content" class="form-input" rows="6" required style="resize: none; width: 100%;">${notice.content}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="edit-notice-course">选择课程：<span style="color: #e74c3c;">*</span></label>
                            <select id="edit-notice-course" class="form-select" required style="width: 100%;">
                                <option value="">请选择课程</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="edit-notice-push-time">推送时间：</label>
                            <select id="edit-notice-push-time" class="form-select" onchange="handleEditPushTimeChange()" style="width: 100%;">
                                <option value="now">立即推送</option>
                                <option value="scheduled">定时推送</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="edit-notice-schedule-time">选择推送时间：</label>
                            <input type="datetime-local" id="edit-notice-schedule-time" class="form-input" style="width: 100%;">
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn btn-primary" onclick="updateNotice(${notice.id})">
                                <i class="fas fa-save"></i> 保存修改
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="closeEditNoticeModal()">
                                <i class="fas fa-times"></i> 取消
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 加载课程选项并设置当前值
    loadCoursesForEditNotice(notice.courseId);

    // 设置推送时间
    const pushTimeSelect = document.getElementById('edit-notice-push-time');
    pushTimeSelect.value = notice.pushTime || 'now';

    // 设置定时推送时间
    if (notice.scheduledTime) {
        const scheduleTimeInput = document.getElementById('edit-notice-schedule-time');
        const localTime = new Date(notice.scheduledTime);
        const localTimeString = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16);
        scheduleTimeInput.value = localTimeString;
    }

    // 初始化推送时间状态
    handleEditPushTimeChange();

    // 设置事件监听器
    const modal = document.getElementById('edit-notice-modal');
    const closeBtn = document.getElementById('close-edit-notice');

    closeBtn.addEventListener('click', closeEditNoticeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeEditNoticeModal();
    });
}

// 加载课程选项用于编辑通知
async function loadCoursesForEditNotice(selectedCourseId) {
    try {
        const response = await TeacherAPI.getCourses();
        if (response && response.success && response.data) {
            const courseSelect = document.getElementById('edit-notice-course');
            courseSelect.innerHTML = '<option value="">请选择课程</option>';

            response.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                if (course.id === selectedCourseId) {
                    option.selected = true;
                }
                courseSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载课程数据失败:', error);
    }
}

// 处理编辑模态框中的推送时间选择
function handleEditPushTimeChange() {
    const pushTime = document.getElementById('edit-notice-push-time').value;
    const scheduleTimeInput = document.getElementById('edit-notice-schedule-time');

    if (pushTime === 'scheduled') {
        scheduleTimeInput.disabled = false;
        scheduleTimeInput.required = true;
        // 设置最小时间为当前时间
        const now = new Date();
        const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        scheduleTimeInput.min = localTime.toISOString().slice(0, 16);
    } else {
        scheduleTimeInput.disabled = true;
        scheduleTimeInput.required = false;
        scheduleTimeInput.value = '';
    }
}

// 更新通知
async function updateNotice(noticeId) {
    try {
        const title = document.getElementById('edit-notice-title').value.trim();
        const content = document.getElementById('edit-notice-content').value.trim();
        const courseId = document.getElementById('edit-notice-course').value;
        const pushTime = document.getElementById('edit-notice-push-time').value;
        const scheduleTime = document.getElementById('edit-notice-schedule-time').value;

        if (!title || !content) {
            showNotification('请填写标题和内容', 'warning');
            return;
        }

        if (!courseId) {
            showNotification('请选择要发送的课程', 'warning');
            return;
        }

        // 验证定时推送时间
        if (pushTime === 'scheduled') {
            if (!scheduleTime) {
                showNotification('请选择推送时间', 'warning');
                return;
            }

            const selectedTime = new Date(scheduleTime);
            const now = new Date();
            if (selectedTime <= now) {
                showNotification('推送时间不能早于当前时间', 'warning');
                return;
            }
        }

        const noticeData = {
            title: title,
            content: content,
            targetType: 'COURSE',
            courseId: parseInt(courseId),
            pushTime: pushTime
        };

        // 如果是定时推送，添加推送时间
        if (pushTime === 'scheduled' && scheduleTime) {
            noticeData.scheduledTime = scheduleTime;
        }

        showLoading('正在更新通知...');

        const response = await fetch(`http://localhost:8080/api/teacher/notices/${noticeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(noticeData)
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            showNotification('通知更新成功！', 'success');
            closeEditNoticeModal();
            await loadNoticesData();
        } else {
            showNotification(result.message || '更新失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('更新通知失败:', error);
        showNotification('更新失败，请重试', 'error');
    }
}

// 关闭编辑通知模态框
function closeEditNoticeModal() {
    const modal = document.getElementById('edit-notice-modal');
    if (modal) {
        modal.remove();
    }
}

// 删除通知
async function deleteNotice(noticeId) {
    const notice = currentNotices.find(n => n.id === noticeId);
    if (!notice) return;

    const confirmed = await showConfirmDialog(
        '删除通知',
        `确定要删除通知"${notice.title}"吗？删除后不可恢复。`,
        '删除'
    );

    if (!confirmed) return;

    try {
        showLoading('正在删除通知...');

        const response = await fetch(`http://localhost:8080/api/teacher/notices/${noticeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            showNotification('通知删除成功', 'success');
            await loadNoticesData();
        } else {
            showNotification(result.message || '删除失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('删除通知失败:', error);
        showNotification('删除失败，请重试', 'error');
    }
}

// 预览通知
function previewNotice() {
    const title = document.getElementById('notice-title').value.trim();
    const content = document.getElementById('notice-content').value.trim();
    const targetSelect = document.getElementById('notice-target-select');
    const pushTime = document.getElementById('notice-push-time').value;
    const scheduleTime = document.getElementById('notice-schedule-time').value;

    if (!title || !content) {
        showNotification('请先填写标题和内容', 'warning');
        return;
    }

    const targetText = targetSelect.selectedOptions[0] ? targetSelect.selectedOptions[0].text : '请选择课程';

    const pushTimeText = pushTime === 'scheduled' ? '定时推送' : '立即推送';

    const modalHtml = `
        <div id="notice-preview-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: var(--accent-color);">
                            <i class="fas fa-eye"></i>
                        </div>
                        <h3>通知预览</h3>
                    </div>
                    <button id="close-notice-preview" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="notice-preview-content">
                        <div class="detail-row">
                            <label>标题：</label>
                            <span>${title}</span>
                        </div>
                        <div class="detail-row">
                            <label>内容：</label>
                            <div class="notice-content">${content}</div>
                        </div>
                        <div class="detail-row">
                            <label>课程：</label>
                            <span>${targetText}</span>
                        </div>
                        <div class="detail-row">
                            <label>推送方式：</label>
                            <span>${pushTimeText}</span>
                        </div>
                        ${scheduleTime ? `
                        <div class="detail-row">
                            <label>推送时间：</label>
                            <span>${formatDate(scheduleTime)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('notice-preview-modal');
    const closeBtn = document.getElementById('close-notice-preview');

    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// 显示所有教师通知
function showAllTeacherNotices() {
    console.log('showAllTeacherNotices 函数被调用');

    // 确保通知数据已加载
    if (!allNotices || allNotices.length === 0) {
        loadNoticesData().then(() => {
            showAllTeacherNoticesModal();
        });
    } else {
        showAllTeacherNoticesModal();
    }
}

// 显示所有教师通知的模态框
function showAllTeacherNoticesModal() {
    console.log('显示所有教师通知模态框，通知数量:', allNotices ? allNotices.length : 0);

    const modalHtml = `
        <div id="all-teacher-notices-modal" class="notice-history-modal show">
            <div class="notice-history-container">
                <div class="notice-history-header">
                    <div class="notice-history-title-section">
                        <div class="notice-history-icon">
                            <i class="fas fa-bell"></i>
                        </div>
                        <h3>所有通知</h3>
                    </div>
                    <button class="notice-history-close" onclick="hideAllTeacherNoticesModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notice-history-body">
                    <div class="notice-filters">
                        <div class="filter-group">
                            <label><i class="fas fa-search"></i>标题搜索</label>
                            <input type="text" id="teacher-notice-search-title" class="filter-input"
                                   placeholder="输入通知标题..." onkeyup="filterTeacherNotices()">
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-book"></i>课程筛选</label>
                            <select id="teacher-notice-filter-course" class="filter-select" onchange="filterTeacherNotices()">
                                <option value="">全部课程</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-user"></i>发布者筛选</label>
                            <select id="teacher-notice-filter-teacher" class="filter-select" onchange="filterTeacherNotices()">
                                <option value="">全部教师</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-sort"></i>时间排序</label>
                            <select id="teacher-notice-sort-time" class="filter-select" onchange="filterTeacherNotices()">
                                <option value="desc">最新优先</option>
                                <option value="asc">最旧优先</option>
                            </select>
                        </div>
                    </div>

                    <div class="notice-history-table-container">
                        <table class="notice-history-table">
                            <thead>
                                <tr>
                                    <th>标题</th>
                                    <th>课程</th>
                                    <th>发布者</th>
                                    <th>推送时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="teacher-notice-history-tbody">
                                <!-- 动态加载内容 -->
                            </tbody>
                        </table>
                    </div>

                    <div class="notice-history-pagination" id="teacher-notice-pagination">
                        <!-- 动态生成分页控件 -->
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 初始化筛选选项
    initTeacherNoticeFilters();

    // 初始化分页变量
    window.teacherNoticeCurrentPage = 1;
    window.teacherNoticePageSize = 10;
    window.teacherFilteredNotices = [...allNotices];

    // 显示通知列表
    filterTeacherNotices();

    // 绑定ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAllTeacherNoticesModal();
        }
    });
}

// 隐藏所有教师通知模态框
function hideAllTeacherNoticesModal() {
    const modal = document.getElementById('all-teacher-notices-modal');
    if (modal) {
        modal.remove();
    }
}

// 初始化教师通知筛选选项
function initTeacherNoticeFilters() {
    const courseSelect = document.getElementById('teacher-notice-filter-course');
    const teacherSelect = document.getElementById('teacher-notice-filter-teacher');

    if (!courseSelect || !teacherSelect || !allNotices) return;

    // 获取所有课程
    const courses = [...new Set(allNotices.map(notice =>
        notice.courseName ? `${notice.courseName}(${notice.courseCode})` : null
    ).filter(Boolean))];

    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
    });

    // 获取所有教师
    const teachers = [...new Set(allNotices.map(notice =>
        notice.teacherName || '未知教师'
    ))];

    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher;
        option.textContent = teacher;
        teacherSelect.appendChild(option);
    });
}

// 筛选教师通知
function filterTeacherNotices() {
    if (!allNotices) return;

    const titleFilter = document.getElementById('teacher-notice-search-title')?.value.toLowerCase() || '';
    const courseFilter = document.getElementById('teacher-notice-filter-course')?.value || '';
    const teacherFilter = document.getElementById('teacher-notice-filter-teacher')?.value || '';
    const sortOrder = document.getElementById('teacher-notice-sort-time')?.value || 'desc';

    // 筛选通知
    window.teacherFilteredNotices = allNotices.filter(notice => {
        const titleMatch = !titleFilter || notice.title.toLowerCase().includes(titleFilter);
        const courseMatch = !courseFilter ||
            (notice.courseName && `${notice.courseName}(${notice.courseCode})` === courseFilter);
        const teacherMatch = !teacherFilter ||
            (notice.teacherName || '未知教师') === teacherFilter;

        return titleMatch && courseMatch && teacherMatch;
    });

    // 排序
    window.teacherFilteredNotices.sort((a, b) => {
        const timeA = new Date(a.createdAt);
        const timeB = new Date(b.createdAt);
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    // 重置到第一页
    window.teacherNoticeCurrentPage = 1;

    // 更新显示
    updateTeacherNoticeTable();
    updateTeacherNoticePagination();
}

// 更新教师通知表格
function updateTeacherNoticeTable() {
    const tbody = document.getElementById('teacher-notice-history-tbody');
    if (!tbody || !window.teacherFilteredNotices) return;

    const startIndex = (window.teacherNoticeCurrentPage - 1) * window.teacherNoticePageSize;
    const endIndex = startIndex + window.teacherNoticePageSize;
    const pageNotices = window.teacherFilteredNotices.slice(startIndex, endIndex);

    if (pageNotices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    暂无符合条件的通知
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = pageNotices.map(notice => {
        const courseName = notice.courseName || '未知课程';
        const courseCode = notice.courseCode || '未知代码';
        const teacherName = notice.teacherName || '未知教师';

        // 计算推送时间
        const pushTime = (notice.pushTime === 'scheduled' && notice.scheduledTime)
            ? notice.scheduledTime
            : notice.createdAt;

        return `
            <tr>
                <td>
                    <div class="notice-title-cell">
                        <div class="notice-title-text">${notice.title}</div>
                    </div>
                </td>
                <td>${courseName}(${courseCode})</td>
                <td>${teacherName}</td>
                <td>${formatPushTime(pushTime)}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewTeacherNoticeDetail(${notice.id})">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 更新教师通知分页
function updateTeacherNoticePagination() {
    const container = document.getElementById('teacher-notice-pagination');
    if (!container || !window.teacherFilteredNotices) return;

    const totalPages = Math.ceil(window.teacherFilteredNotices.length / window.teacherNoticePageSize);
    const currentPage = window.teacherNoticeCurrentPage;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHtml = '';

    // 上一页按钮
    paginationHtml += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}"
                onclick="changeTeacherNoticePage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i> 上一页
        </button>
    `;

    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHtml += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}"
                        onclick="changeTeacherNoticePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHtml += '<span class="pagination-ellipsis">...</span>';
        }
    }

    // 下一页按钮
    paginationHtml += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}"
                onclick="changeTeacherNoticePage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
            下一页 <i class="fas fa-chevron-right"></i>
        </button>
    `;

    // 分页信息
    const startIndex = (currentPage - 1) * window.teacherNoticePageSize + 1;
    const endIndex = Math.min(currentPage * window.teacherNoticePageSize, window.teacherFilteredNotices.length);

    container.innerHTML = `
        <div class="pagination-info">
            显示第 ${startIndex} - ${endIndex} 条，共 ${window.teacherFilteredNotices.length} 条记录
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
            ${paginationHtml}
        </div>
    `;
}

// 切换教师通知页面
function changeTeacherNoticePage(page) {
    if (!window.teacherFilteredNotices) return;

    const totalPages = Math.ceil(window.teacherFilteredNotices.length / window.teacherNoticePageSize);
    if (page < 1 || page > totalPages) return;

    window.teacherNoticeCurrentPage = page;
    updateTeacherNoticeTable();
    updateTeacherNoticePagination();
}

// 格式化推送时间（精确到分钟）
function formatPushTime(dateString) {
    if (!dateString) return '未知时间';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '无效时间';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// 历史通知功能（保留原有功能，用于通知管理页面）
function loadNoticeHistory() {
    console.log('loadNoticeHistory 函数被调用');

    // 确保通知数据已加载
    if (!allNotices || allNotices.length === 0) {
        loadNoticesData().then(() => {
            showNoticeHistoryModal();
        });
    } else {
        showNoticeHistoryModal();
    }
}

function showNoticeHistoryModal() {
    console.log('显示历史通知模态框，通知数量:', allNotices ? allNotices.length : 0);

    const modalHtml = `
        <div id="notice-history-modal" class="notice-history-modal show">
            <div class="notice-history-container">
                <div class="notice-history-header">
                    <div class="notice-history-title-section">
                        <div class="notice-history-icon">
                            <i class="fas fa-history"></i>
                        </div>
                        <h3>历史通知</h3>
                    </div>
                    <button class="notice-history-close" onclick="hideNoticeHistoryModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="notice-history-body">
                    <div class="notice-filters">
                        <div class="filter-group">
                            <label><i class="fas fa-search"></i>标题搜索</label>
                            <input type="text" id="notice-search-title" class="filter-input"
                                   placeholder="输入通知标题..." onkeyup="filterNotices()">
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-book"></i>课程筛选</label>
                            <select id="notice-filter-course" class="filter-select" onchange="filterNotices()">
                                <option value="">全部课程</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-filter"></i>状态筛选</label>
                            <select id="notice-filter-status" class="filter-select" onchange="filterNotices()">
                                <option value="">全部状态</option>
                                <option value="sent">已推送</option>
                                <option value="pending">待推送</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label><i class="fas fa-sort"></i>时间排序</label>
                            <select id="notice-sort-time" class="filter-select" onchange="filterNotices()">
                                <option value="desc">最新优先</option>
                                <option value="asc">最旧优先</option>
                            </select>
                        </div>

                    </div>

                    <div class="notice-history-table-container">
                        <table class="notice-history-table">
                            <thead>
                                <tr>
                                    <th>标题</th>
                                    <th>课程</th>
                                    <th>发布时间</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="notice-history-tbody">
                                <!-- 动态加载内容 -->
                            </tbody>
                        </table>
                    </div>

                    <div class="notice-history-pagination" id="notice-pagination">
                        <!-- 动态生成分页控件 -->
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 确保模态框显示并居中
    const modal = document.getElementById('notice-history-modal');
    if (modal) {
        // 移除内联样式，让CSS类控制显示
        modal.style.display = '';
        // 确保show类已添加（HTML中已包含）
        modal.classList.add('show');
        console.log('模态框已添加到DOM并设置为显示');
    }

    // 加载课程下拉选项
    loadHistoryCoursesFilter();

    // 初始化通知列表
    initializeNoticeHistory();

    // 绑定模态框事件
    setupNoticeHistoryEvents();
}

function hideNoticeHistoryModal() {
    const modal = document.getElementById('notice-history-modal');
    if (modal) {
        modal.remove();
    }
}

function setupNoticeHistoryEvents() {
    const modal = document.getElementById('notice-history-modal');

    // 点击外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideNoticeHistoryModal();
        }
    });

    // ESC键关闭
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            hideNoticeHistoryModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

async function loadHistoryCoursesFilter() {
    try {
        const response = await fetch('http://localhost:8080/api/teacher/courses', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();
        if (result.success) {
            const courseSelect = document.getElementById('notice-filter-course');
            if (courseSelect) {
                courseSelect.innerHTML = '<option value="">全部课程</option>' +
                    result.data.map(course =>
                        `<option value="${course.id}">${course.courseName}(${course.courseCode})</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('加载课程列表失败:', error);
    }
}

function initializeNoticeHistory() {
    // 重置筛选条件
    filteredNotices = allNotices ? [...allNotices] : [];
    currentPage = 1;
    filterNotices();
}

function filterNotices() {
    const titleSearch = document.getElementById('notice-search-title')?.value.toLowerCase() || '';
    const courseFilter = document.getElementById('notice-filter-course')?.value || '';
    const statusFilter = document.getElementById('notice-filter-status')?.value || '';
    const sortOrder = document.getElementById('notice-sort-time')?.value || 'desc';

    // 应用筛选条件
    filteredNotices = (allNotices || []).filter(notice => {
        // 标题筛选
        if (titleSearch && !notice.title.toLowerCase().includes(titleSearch)) {
            return false;
        }

        // 课程筛选
        if (courseFilter && notice.courseId != courseFilter) {
            return false;
        }

        // 状态筛选
        if (statusFilter) {
            const isScheduled = notice.pushTime === 'scheduled' && notice.scheduledTime;
            const isPending = isScheduled && new Date(notice.scheduledTime) > new Date();
            const currentStatus = isPending ? 'pending' : 'sent';

            if (statusFilter !== currentStatus) {
                return false;
            }
        }

        return true;
    });

    // 排序
    filteredNotices.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    // 计算分页
    totalPages = Math.ceil(filteredNotices.length / pageSize);
    if (currentPage > totalPages) {
        currentPage = 1;
    }

    // 更新显示
    updateNoticeHistoryTable();
    updateNoticeHistoryPagination();
}

function updateNoticeHistoryTable() {
    const tbody = document.getElementById('notice-history-tbody');
    if (!tbody) return;

    if (filteredNotices.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #7f8c8d; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>
                    暂无符合条件的通知
                </td>
            </tr>
        `;
        return;
    }

    // 计算当前页的数据
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredNotices.length);
    const currentPageNotices = filteredNotices.slice(startIndex, endIndex);

    tbody.innerHTML = currentPageNotices.map(notice => {
        const courseName = notice.courseName || '未知课程';
        const courseCode = notice.courseCode || '未知代码';
        const statusText = notice.pushTime === 'scheduled' && notice.scheduledTime ?
                          (new Date(notice.scheduledTime) > new Date() ? '待推送' : '已推送') : '已推送';
        const statusClass = statusText === '待推送' ? 'status-pending' : 'status-sent';

        return `
            <tr>
                <td class="notice-title-cell">
                    <div class="notice-title-text">${notice.title}</div>
                </td>
                <td>
                    <div style="font-weight: 500;">${courseName}</div>
                    <div style="font-size: 12px; color: #7f8c8d;">${courseCode}</div>
                </td>
                <td>${formatDate(notice.createdAt)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-secondary" onclick="viewNoticeDetail(${notice.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editNotice(${notice.id})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteNotice(${notice.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateNoticeHistoryPagination() {
    const paginationContainer = document.getElementById('notice-pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const prevDisabled = currentPage === 1;
    const nextDisabled = currentPage === totalPages;

    // 计算显示的页码范围
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    let paginationHtml = `
        <button class="pagination-btn" ${prevDisabled ? 'disabled' : ''} onclick="goToNoticePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    // 生成页码按钮
    for (let i = startPage; i <= endPage; i++) {
        paginationHtml += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToNoticePage(${i})">
                ${i}
            </button>
        `;
    }

    paginationHtml += `
        <button class="pagination-btn" ${nextDisabled ? 'disabled' : ''} onclick="goToNoticePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
        <div class="pagination-info">
            第 ${currentPage} 页，共 ${totalPages} 页，${filteredNotices.length} 条记录
        </div>
    `;

    paginationContainer.innerHTML = paginationHtml;
}

function goToNoticePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    updateNoticeHistoryTable();
    updateNoticeHistoryPagination();
}

function clearNoticeFilters() {
    document.getElementById('notice-search-title').value = '';
    document.getElementById('notice-filter-course').value = '';
    document.getElementById('notice-filter-status').value = '';
    document.getElementById('notice-sort-time').value = 'desc';
    filterNotices();
}

// 初始化课程选择
function initializeCourseSelect() {
    const targetSelect = document.getElementById('notice-target-select');
    if (!targetSelect) return;

    // 课程选择始终启用且必填
    targetSelect.disabled = false;
    targetSelect.required = true;

    // 加载课程数据（如果还没有加载的话）
    if (targetSelect.options.length <= 1) {
        // 清空并加载课程选项
        targetSelect.innerHTML = '<option value="">请选择课程</option>';

        // 加载课程数据
        if (window.coursesData && window.coursesData.length > 0) {
            window.coursesData.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                targetSelect.appendChild(option);
            });
        } else {
            // 如果没有课程数据，从API加载
            loadCoursesForNotice();
        }
    }
}

// 加载课程数据用于通知发送
async function loadCoursesForNotice() {
    try {
        const response = await TeacherAPI.getCourses();
        if (response && response.success && response.data) {
            const targetSelect = document.getElementById('notice-target-select');
            // 保留现有的选项，只有在需要时才重新加载
            if (targetSelect.options.length <= 1) {
            targetSelect.innerHTML = '<option value="">请选择课程</option>';

            response.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                targetSelect.appendChild(option);
            });
            }

            // 存储课程数据供其他函数使用
            window.coursesData = response.data;
        }
    } catch (error) {
        console.error('加载课程数据失败:', error);
    }
}

// 处理推送时间选择
function handlePushTimeChange() {
    const pushTime = document.getElementById('notice-push-time').value;
    const scheduleTimeInput = document.getElementById('notice-schedule-time');

    // 推送时间输入框始终可见
    if (pushTime === 'scheduled') {
        // 定时推送时，时间选择是必需的
        scheduleTimeInput.disabled = false;
        scheduleTimeInput.required = true;
        // 设置最小时间为当前时间
        const now = new Date();
        const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        scheduleTimeInput.min = localTime.toISOString().slice(0, 16);
    } else {
        // 立即推送时，时间选择不是必需的，但仍然可见
        scheduleTimeInput.disabled = true;
        scheduleTimeInput.required = false;
        scheduleTimeInput.value = '';
    }
}

// 页面加载时设置事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 为推送时间选择添加事件监听器
    const pushTimeSelect = document.getElementById('notice-push-time');
    if (pushTimeSelect) {
        pushTimeSelect.addEventListener('change', handlePushTimeChange);
    }

    // 初始化通知表单状态
    if (document.getElementById('notice-target-select')) {
        // 加载课程数据用于通知发送
        loadCoursesForNotice();
        // 初始化表单状态
        initializeCourseSelect();
        handlePushTimeChange();
    }
});
function updateExamsTable() { /* 实现更新试卷表格 */ }
function updateExamStats(stats) { /* 实现更新考试统计 */ }
function clearNoticeForm() {
    // 清空表单字段
    document.getElementById('notice-title').value = '';
    document.getElementById('notice-content').value = '';
    document.getElementById('notice-target-select').value = '';
    document.getElementById('notice-push-time').value = 'now';
    document.getElementById('notice-schedule-time').value = '';

    // 重置表单状态
    initializeCourseSelect(); // 重置课程选择状态
    handlePushTimeChange(); // 重置推送时间状态
}
function clearExamForm() {
    // 重置题目类型选择
    document.getElementById('q-multiple-choice').checked = false;
    document.getElementById('q-multiple-choice-count').value = '';
    document.getElementById('q-fill-blank').checked = false;
    document.getElementById('q-fill-blank-count').value = '';
    document.getElementById('q-true-false').checked = false;
    document.getElementById('q-true-false-count').value = '';
    document.getElementById('q-answer').checked = false;
    document.getElementById('q-answer-count').value = '';

    // 重置自定义题型
    document.getElementById('q-custom').checked = false;
    document.getElementById('q-custom-requirement').value = '';
    document.getElementById('q-custom-count').value = '';

    // 重置难度分布
    document.getElementById('difficulty-easy').value = 30;
    document.getElementById('difficulty-easy-input').value = 30;
    document.getElementById('difficulty-medium').value = 50;
    document.getElementById('difficulty-medium-input').value = 50;
    document.getElementById('difficulty-hard').value = 20;
    document.getElementById('difficulty-hard-input').value = 20;

    // 重置考试时长和总分
    document.getElementById('exam-duration').value = 90;
    document.getElementById('exam-total-score').value = 100;

    // 清空特殊要求
    document.getElementById('exam-special-requirements').value = '';

    // 隐藏试卷预览
    const previewDiv = document.getElementById('exam-preview');
    if (previewDiv) {
        previewDiv.style.display = 'none';
    }

    // 清空选中的资料
    clearAllExamMaterials();
}

// 用户相关功能
async function loadCurrentUser() {
    try {
        // 检查登录状态
        const response = await fetch('http://localhost:8080/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
            // 未登录，跳转到主页
        window.location.href = 'index.html';
            return;
        }

        const userData = result.data;

        // 检查是否是教师角色
        if (userData.role !== 'teacher') {
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (userData.role === 'student') {
                window.location.href = 'student.html';
            } else {
                window.location.href = 'index.html';
            }
            return;
        }

        // 更新页面显示的用户名
        const usernameElement = document.getElementById('current-username');
        if (usernameElement) {
            usernameElement.textContent = userData.realName || userData.username || '教师';
        }

        // 更新页面显示的头像
        const avatarElement = document.getElementById('user-avatar');
        if (avatarElement) {
            if (userData.avatarUrl && userData.avatarUrl.trim() !== '') {
                avatarElement.innerHTML = `<img src="${userData.avatarUrl}" alt="用户头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            } else {
                avatarElement.innerHTML = '<i class="fas fa-chalkboard-teacher"></i>';
            }
        }

        // 保存用户信息到全局变量，并添加学生端那样的兼容性处理
        window.currentUser = userData;

        // 照搬学生端的兼容性处理：为了兼容性，添加userId字段
        if (window.currentUser.id && !window.currentUser.userId) {
            window.currentUser.userId = window.currentUser.id;
        }

        // 异步获取详细用户信息（不阻塞主流程）
        setTimeout(async () => {
            try {
                const detailResponse = await fetch('/api/auth/current-user', {
                    method: 'GET',
                    credentials: 'include'
                });
                const detailResult = await detailResponse.json();
                if (detailResult.success && detailResult.data) {
                    // 更新用户信息，包含teacherId
                    window.currentUser = {
                        ...userData,
                        teacherId: detailResult.data.teacherId,
                        studentId: detailResult.data.studentId
                    };
                    console.log('用户信息已更新（包含ID）:', window.currentUser);
                }
            } catch (detailError) {
                console.log('获取详细用户信息失败，继续使用基础信息:', detailError.message);
            }
        }, 100);

        console.log('当前用户（基础信息）:', userData);
    } catch (error) {
        console.error('加载用户信息失败:', error);
        window.location.href = 'index.html';
    }
}

// 获取当前用户信息
function getCurrentUser() {
    return window.currentUser;
}

// 设置修改密码模态框事件
function setupChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    const closeBtn = document.getElementById('close-password-modal');
    const cancelBtn = document.getElementById('cancel-password-change');
    const form = document.getElementById('change-password-form');

    // 关闭模态框
    closeBtn.addEventListener('click', hideChangePasswordModal);
    cancelBtn.addEventListener('click', hideChangePasswordModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideChangePasswordModal();
        }
    });

    // 表单提交
    form.addEventListener('submit', handleChangePassword);
}

// 显示修改密码模态框
function showChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    modal.classList.add('show');
    modal.style.display = 'flex';

    // 清空表单
    document.getElementById('change-password-form').reset();

    // 聚焦到第一个输入框
    setTimeout(() => {
        const firstInput = document.getElementById('current-password');
        if (firstInput) {
            firstInput.focus();
        }
    }, 300);
}

// 隐藏修改密码模态框
function hideChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');
    modal.classList.remove('show');

    // 延迟隐藏，等待动画完成
            setTimeout(() => {
        modal.style.display = 'none';
            }, 300);
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

        showLoading('正在修改密码...');

        // 这里应该调用API修改密码，暂时模拟成功
        await new Promise(resolve => setTimeout(resolve, 1000));

        hideLoading();
        showNotification('密码修改成功！', 'success');
        hideChangePasswordModal();

    } catch (error) {
        hideLoading();
        console.error('修改密码失败:', error);
        showNotification('修改密码失败，请稍后重试', 'error');
    }
}

// 处理用户下拉菜单中的退出登录
function handleLogout() {
    const modal = document.getElementById('logout-modal');
    modal.style.display = 'flex';
}

// ================== 上传资料模态框相关函数 ==================

// 显示上传资料模态框
function showUploadModal() {
    console.log('showUploadModal 被调用');
    const modal = document.getElementById('upload-material-modal');
    console.log('Modal element:', modal);

    if (!modal) {
        console.error('找不到上传模态框元素！');
                        console.error('找不到上传模态框元素！');
        return;
    }

    modal.classList.add('show');
    modal.style.display = 'flex';
    console.log('Modal 已显示');

    // 清空表单
    clearUploadModalForm();

    // 更新课程选择器
    updateModalCourseSelect();
}

// 确保函数在全局作用域中可访问
window.showUploadModal = showUploadModal;

// 隐藏上传资料模态框
function hideUploadModal() {
    const modal = document.getElementById('upload-material-modal');
    modal.classList.remove('show');

    // 延迟隐藏，等待动画完成
            setTimeout(() => {
        modal.style.display = 'none';
            }, 300);
}

// 设置上传模态框 - 使用标记避免重复设置
let uploadModalSetup = false;

function setupUploadModal() {
    if (uploadModalSetup) return; // 如果已经设置过，直接返回

    const modal = document.getElementById('upload-material-modal');
    const closeBtn = document.getElementById('close-upload-modal');
    const cancelBtn = document.getElementById('cancel-upload');
    const form = document.getElementById('upload-material-form');
    const fileUploadArea = document.getElementById('modal-file-upload-area');
    const fileInput = document.getElementById('modal-file-input');

    if (!modal || !closeBtn || !cancelBtn || !form || !fileUploadArea || !fileInput) {
        console.warn('上传模态框元素未找到，跳过设置');
        return;
    }

    // 关闭模态框事件
    closeBtn.addEventListener('click', hideUploadModal);
    cancelBtn.addEventListener('click', hideUploadModal);

    // 点击模态框外部关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideUploadModal();
        }
    });

    // 文件上传区域点击事件
    fileUploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // 文件选择事件
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const uploadArea = document.getElementById('modal-file-upload-area');
            const uploadPrompt = uploadArea.querySelector('.upload-prompt');
            uploadPrompt.innerHTML = `
                <i class="fas fa-file" style="color: var(--primary-color);"></i>
                <p style="color: var(--primary-color); font-weight: 500;">已选择文件: ${file.name}</p>
                <p class="upload-tips">文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
            `;
            uploadArea.style.borderColor = 'var(--primary-color)';
            uploadArea.style.background = 'rgba(52, 152, 219, 0.05)';
        }
    });

    // 表单提交事件
    form.addEventListener('submit', handleModalUpload);

    // 拖拽上传事件
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--primary-color)';
        fileUploadArea.style.background = 'rgba(52, 152, 219, 0.1)';
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '#fafafa';
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            // 触发change事件
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
        fileUploadArea.style.borderColor = '#ddd';
        fileUploadArea.style.background = '#fafafa';
    });

    uploadModalSetup = true; // 标记已设置
}

// 更新模态框中的课程选择器
async function updateModalCourseSelect() {
    try {
        const response = await fetch('/api/teacher/courses');
        const apiResponse = await response.json();

        if (apiResponse.success && apiResponse.data) {
            const select = document.getElementById('modal-material-course-select');
            select.innerHTML = '<option value="">请选择课程</option>';

            apiResponse.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('更新课程选择器失败:', error);
    }
}



// 清空模态框表单
function clearUploadModalForm() {
    console.log('clearUploadModalForm 被调用');

    const courseSelect = document.getElementById('modal-material-course-select');
    const typeSelect = document.getElementById('modal-material-type');
    const descriptionTextarea = document.getElementById('modal-material-description');
    const fileInput = document.getElementById('modal-file-input');
    const uploadArea = document.getElementById('modal-file-upload-area');

    console.log('Form elements:', {
        courseSelect, typeSelect, descriptionTextarea, fileInput, uploadArea
    });

    if (courseSelect) courseSelect.value = '';
    if (typeSelect) typeSelect.value = 'PPT';
    if (descriptionTextarea) descriptionTextarea.value = '';
    if (fileInput) fileInput.value = '';

    // 重置文件上传区域显示
    if (uploadArea) {
        const prompt = uploadArea.querySelector('.upload-prompt');
        if (prompt) {
            prompt.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>点击上传文件或拖拽文件至此区域</p>
                <p class="upload-tips">支持 PDF、Word、PPT、TXT、HTML 格式，单个文件不超过50MB</p>
            `;
        }
    }
}

// 处理模态框中的上传
async function handleModalUpload(e) {
    e.preventDefault();

    try {
        const courseId = document.getElementById('modal-material-course-select').value;
        const materialType = document.getElementById('modal-material-type').value;
        const description = document.getElementById('modal-material-description').value;
        const fileInput = document.getElementById('modal-file-input');

        // 表单验证
        if (!courseId) {
            showNotification('请选择课程', 'warning');
            return;
        }

        if (!fileInput.files[0]) {
            showNotification('请选择要上传的文件', 'warning');
            return;
        }

        const file = fileInput.files[0];

        // 文件大小验证
        if (file.size > 50 * 1024 * 1024) {
            showNotification('文件大小不能超过50MB', 'warning');
            return;
        }

        showLoading('正在上传资料...');

        // 创建FormData
        const formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('file', file);
        formData.append('materialType', materialType);
        formData.append('description', description);

        // 发送上传请求
        const apiResponse = await TeacherAPI.uploadFile(formData);

        hideLoading();

        if (apiResponse.success) {
            showNotification('资料上传成功！', 'success');
            hideUploadModal();

            // 刷新资料列表
            await loadMaterialsData();
        } else {
            showNotification('上传失败：' + (apiResponse.message || '未知错误'), 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('上传资料失败:', error);
        showNotification('上传失败，请稍后重试', 'error');
    }
}

// 页面加载完成后初始化（已在DOMContentLoaded中处理，此处移除重复调用）

// ===== 教学大纲历史功能 =====

// 当前选中的历史大纲数据
let currentHistoryOutline = null;

// 加载教学大纲历史记录
async function loadOutlineHistory() {
    try {
        console.log('开始加载教学大纲历史记录...');

        const modal = document.getElementById('outline-history-modal');
        if (!modal) {
            console.error('找不到历史记录模态框元素');
            showNotification('页面元素未找到，请刷新页面重试', 'error');
            return;
        }

        // 显示模态框
        modal.classList.add('show');
        modal.style.display = 'flex';
        console.log('模态框已显示');

        // 设置模态框事件监听器
        setupHistoryModalEvents();
        console.log('事件监听器设置完成');

        // 加载课程选择器
        console.log('开始加载课程选择器...');
        await updateHistoryCourseFilter();
        console.log('课程选择器加载完成');

        // 加载历史记录
        console.log('开始加载历史记录...');
        await refreshOutlineHistory();
        console.log('历史记录加载完成');

    } catch (error) {
        console.error('加载教学大纲历史记录失败:', error);
        showNotification('加载历史记录失败: ' + (error.message || '未知错误'), 'error');
    }
}

// 设置历史模态框事件监听器
function setupHistoryModalEvents() {
    try {
        console.log('开始设置历史模态框事件监听器...');

        const modal = document.getElementById('outline-history-modal');
        const closeBtn = document.getElementById('close-history-modal');
        const closeFooterBtn = document.getElementById('close-history');
        const courseFilter = document.getElementById('history-course-filter');

        console.log('DOM元素查找结果:', {
            modal: !!modal,
            closeBtn: !!closeBtn,
            closeFooterBtn: !!closeFooterBtn,
            courseFilter: !!courseFilter
        });

        // 检查必要的DOM元素
        if (!modal) {
            console.error('找不到历史模态框元素');
            return;
        }

        if (!courseFilter) {
            console.error('找不到课程筛选器元素');
            return;
        }

        // 安全地处理关闭按钮
        if (closeBtn) {
            // 移除旧的事件监听器
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            // 关闭模态框事件
            newCloseBtn.addEventListener('click', hideHistoryModal);
            console.log('头部关闭按钮事件设置完成');
        } else {
            console.warn('未找到头部关闭按钮元素');
        }

        // 安全地处理底部关闭按钮（这个元素可能不存在）
        if (closeFooterBtn) {
            const newCloseFooterBtn = closeFooterBtn.cloneNode(true);
            closeFooterBtn.parentNode.replaceChild(newCloseFooterBtn, closeFooterBtn);
            newCloseFooterBtn.addEventListener('click', hideHistoryModal);
            console.log('底部关闭按钮事件设置完成');
        } else {
            console.log('底部关闭按钮元素不存在（这是正常的）');
        }

        // 点击模态框外部关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideHistoryModal();
            }
        });
        console.log('模态框外部点击事件设置完成');

        // 课程筛选变化事件
        courseFilter.addEventListener('change', refreshOutlineHistory);
        console.log('课程筛选器事件设置完成');

        console.log('历史模态框事件监听器设置完成');

    } catch (error) {
        console.error('设置历史模态框事件监听器失败:', error);
        throw error;
    }
}

// 隐藏历史模态框
function hideHistoryModal() {
    const modal = document.getElementById('outline-history-modal');
    modal.classList.remove('show');
            setTimeout(() => {
        modal.style.display = 'none';
            }, 300);
}

// 更新历史记录的课程筛选器
async function updateHistoryCourseFilter() {
    try {
        console.log('开始更新课程筛选器...');

        const select = document.getElementById('history-course-filter');
        if (!select) {
            console.error('找不到课程筛选器元素');
            return;
        }

        console.log('调用API获取课程列表...');
        const response = await TeacherAPI.getCourses();
        console.log('课程API响应:', response);

        if (response && response.success && response.data) {
            console.log('找到课程数量:', response.data.length);

            select.innerHTML = '<option value="">所有课程</option>';

            response.data.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.name}（${course.courseCode || 'SE-0000'}）`;
                select.appendChild(option);
            });

            console.log('课程筛选器更新完成');
        } else {
            console.warn('获取课程列表失败或无数据:', response);
            select.innerHTML = '<option value="">所有课程</option>';
        }
    } catch (error) {
        console.error('更新课程选择器失败:', error);
        // 失败时至少保证有一个默认选项
        const select = document.getElementById('history-course-filter');
        if (select) {
            select.innerHTML = '<option value="">所有课程</option>';
        }
    }
}

// 刷新历史记录
async function refreshOutlineHistory() {
    const loadingDiv = document.getElementById('history-loading');
    const emptyDiv = document.getElementById('history-empty');
    const contentDiv = document.getElementById('history-content');

    try {
        console.log('开始刷新历史记录...');

        // 检查DOM元素是否存在
        if (!loadingDiv || !emptyDiv || !contentDiv) {
            console.error('缺少必要的DOM元素:', { loadingDiv: !!loadingDiv, emptyDiv: !!emptyDiv, contentDiv: !!contentDiv });
            showNotification('页面元素未找到，请刷新页面重试', 'error');
            return;
        }

        const courseFilterEl = document.getElementById('history-course-filter');
        const courseId = courseFilterEl ? courseFilterEl.value : '';
        console.log('课程筛选:', courseId || '所有课程');

        // 显示加载状态
        loadingDiv.style.display = 'block';
        emptyDiv.style.display = 'none';
        contentDiv.innerHTML = '';

        console.log('开始调用API获取历史记录...');

        // 获取历史记录
        const response = await TeacherAPI.getOutlineHistory(courseId || null);

        console.log('API响应:', response);

        // 确保隐藏加载状态
        loadingDiv.style.display = 'none';

        if (response && response.success) {
            if (response.data && response.data.length > 0) {
                console.log('找到历史记录数量:', response.data.length);
                displayHistoryList(response.data);
            } else {
                console.log('没有找到历史记录');
                emptyDiv.style.display = 'block';
            }
        } else {
            console.error('API调用失败:', response);
            emptyDiv.style.display = 'block';

            // 更新空状态显示的内容
            emptyDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f39c12; margin-bottom: 16px;"></i><br>
                <div style="font-size: 16px; margin-bottom: 8px;">获取教学大纲失败</div>
                <div style="font-size: 14px; color: #7f8c8d;">${response ? response.message || '请稍后重试' : '网络连接失败'}</div>
            `;

            showNotification(response ? response.message || '获取历史记录失败' : '网络连接失败', 'error');
        }

    } catch (error) {
        console.error('获取历史记录失败 - 完整错误:', error);

        // 确保隐藏加载状态
        if (loadingDiv) loadingDiv.style.display = 'none';

        // 显示错误状态
        if (emptyDiv) {
            emptyDiv.style.display = 'block';
            emptyDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #e74c3c; margin-bottom: 16px;"></i><br>
                <div style="font-size: 16px; margin-bottom: 8px;">加载失败</div>
                <div style="font-size: 14px; color: #7f8c8d;">${error.message || '请检查网络连接或联系管理员'}</div>
            `;
        }

        showNotification('获取历史记录失败: ' + (error.message || '未知错误'), 'error');
    }
}

// 显示历史记录列表
function displayHistoryList(outlines) {
    const contentDiv = document.getElementById('history-content');

    // 清空内容并设置容器样式
    contentDiv.innerHTML = '';
    contentDiv.style.cssText = `
        display: block;
        width: 100%;
        padding: 0;
        margin: 0;
        clear: both;
    `;

    outlines.forEach((outline, index) => {
        const createTime = formatDate(outline.createdAt);
        const courseName = outline.course ? outline.course.name : '未知课程';
        const courseCode = outline.course ? outline.course.courseCode : '';
        const previewContent = outline.teachingDesign ?
            outline.teachingDesign.substring(0, 100).replace(/[<>]/g, '') + '...' : '暂无内容';

        // 创建历史记录项元素
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.style.cssText = `
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 20px;
            margin-bottom: 20px;
                background: #fff;
                transition: all 0.3s ease;
                cursor: pointer;
            position: relative;
            display: block;
            width: 100%;
            box-sizing: border-box;
            clear: both;
            overflow: hidden;
        `;

        // 鼠标悬停效果
        historyItem.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            this.style.transform = 'translateY(-2px)';
        });

        historyItem.addEventListener('mouseleave', function() {
            this.style.boxShadow = 'none';
            this.style.transform = 'translateY(0)';
        });

        // 点击查看详情
        historyItem.addEventListener('click', function() {
            viewHistoryDetail(outline.id);
        });

        historyItem.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                <div style="flex: 1; min-width: 300px;">
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: 600;">
                            <i class="fas fa-file-alt" style="color: #3498db; margin-right: 8px;"></i>
                            ${courseName}${courseCode ? ` (${courseCode})` : ''}
                        </h4>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 13px; color: #7f8c8d; flex-wrap: wrap;">
                        <span><i class="fas fa-calendar-alt" style="margin-right: 4px;"></i> ${createTime}</span>
                        <span><i class="fas fa-list-ol" style="margin-right: 4px;"></i> 第 ${outlines.length - index} 版</span>
                        </div>
                    </div>
                <div class="btn-group" style="display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-primary history-btn-view" data-outline-id="${outline.id}" title="查看详情" style="min-width: 36px;">
                            <i class="fas fa-eye"></i>
                        </button>
                    <button class="btn btn-sm btn-accent history-btn-download" data-outline-id="${outline.id}" title="下载PDF" style="min-width: 36px;">
                        <i class="fas fa-file-pdf"></i>
                        </button>
                    <button class="btn btn-sm btn-success history-btn-apply" data-outline-id="${outline.id}" title="应用此大纲" style="min-width: 36px;">
                            <i class="fas fa-copy"></i>
                        </button>
                    <button class="btn btn-sm btn-danger history-btn-delete" data-outline-id="${outline.id}" data-course-name="${courseName.replace(/"/g, '&quot;')}" title="删除" style="min-width: 36px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #3498db; margin-top: 10px;">
                <div style="font-size: 13px; color: #5a6c7d; line-height: 1.6; word-wrap: break-word;">
                        ${previewContent}
                </div>
            </div>
        `;

        // 添加按钮事件监听器
        const viewBtn = historyItem.querySelector('.history-btn-view');
        const downloadBtn = historyItem.querySelector('.history-btn-download');
        const applyBtn = historyItem.querySelector('.history-btn-apply');
        const deleteBtn = historyItem.querySelector('.history-btn-delete');

        if (viewBtn) {
            viewBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                viewHistoryDetail(outline.id);
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                downloadHistoryOutline(outline.id);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                applyHistoryOutline(outline.id);
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteHistoryOutline(outline.id, courseName);
            });
        }

        // 添加到容器
        contentDiv.appendChild(historyItem);
    });
}

// 查看历史大纲详情
async function viewHistoryDetail(outlineId) {
    try {
        console.log('查看大纲详情，ID:', outlineId);
        showLoading('正在加载大纲详情...');

        // 从当前列表中查找大纲
        const response = await TeacherAPI.getOutlineHistory();
        hideLoading();

        if (response.success && response.data) {
            const outline = response.data.find(o => o.id === outlineId);
            if (outline) {
                console.log('找到大纲详情:', outline);
                currentHistoryOutline = outline;
                showOutlineDetailModal(outline);
            } else {
                console.error('未找到大纲，ID:', outlineId);
                showNotification('未找到大纲详情', 'error');
            }
        } else {
            console.error('获取大纲列表失败:', response);
            showNotification('获取大纲列表失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('获取大纲详情失败:', error);
        showNotification('获取大纲详情失败: ' + error.message, 'error');
    }
}

// 显示大纲详情模态框
function showOutlineDetailModal(outline) {
    console.log('显示大纲详情模态框:', outline);

    const modal = document.getElementById('outline-detail-modal');
    const titleEl = document.getElementById('outline-detail-title');
    const contentEl = document.getElementById('outline-detail-content');

    if (!modal || !titleEl || !contentEl) {
        console.error('缺少必要的DOM元素:', { modal: !!modal, titleEl: !!titleEl, contentEl: !!contentEl });
        showNotification('页面元素未找到，请刷新页面重试', 'error');
        return;
    }

    // 设置标题 - 使用提取的大纲标题
    const outlineTitle = extractOutlineTitle(outline.teachingDesign);
    const createTime = formatDate(outline.createdAt);
    const title = `${outlineTitle} - ${createTime}`;
    titleEl.textContent = title;
    console.log('设置标题:', title);

    // 设置内容
    const content = outline.teachingDesign || '暂无内容';
    console.log('大纲内容长度:', content.length);
    contentEl.innerHTML = parseMarkdown(content);

    // 显示模态框
    modal.classList.add('show');
    modal.style.display = 'flex';
    console.log('模态框已显示');

    // 设置详情模态框事件
    setupDetailModalEvents();
}

// 设置详情模态框事件
function setupDetailModalEvents() {
    try {
        console.log('开始设置详情模态框事件监听器...');

        const modal = document.getElementById('outline-detail-modal');
        const closeBtn = document.getElementById('close-detail-modal');
        const closeFooterBtn = document.getElementById('close-detail');

        console.log('详情模态框DOM元素查找结果:', {
            modal: !!modal,
            closeBtn: !!closeBtn,
            closeFooterBtn: !!closeFooterBtn
        });

        // 检查必要的DOM元素
        if (!modal) {
            console.error('找不到详情模态框元素');
            return;
        }

        // 安全地处理头部关闭按钮
        if (closeBtn) {
            // 移除旧的事件监听器
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            // 关闭事件
            newCloseBtn.addEventListener('click', hideDetailModal);
            console.log('详情模态框头部关闭按钮事件设置完成');
        } else {
            console.warn('未找到详情模态框头部关闭按钮元素');
        }

        // 安全地处理底部关闭按钮（这个元素可能不存在）
        if (closeFooterBtn) {
            const newCloseFooterBtn = closeFooterBtn.cloneNode(true);
            closeFooterBtn.parentNode.replaceChild(newCloseFooterBtn, closeFooterBtn);
            newCloseFooterBtn.addEventListener('click', hideDetailModal);
            console.log('详情模态框底部关闭按钮事件设置完成');
        } else {
            console.log('详情模态框底部关闭按钮元素不存在（这是正常的）');
        }

        // 点击模态框外部关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideDetailModal();
            }
        });
        console.log('详情模态框外部点击事件设置完成');

        console.log('详情模态框事件监听器设置完成');

    } catch (error) {
        console.error('设置详情模态框事件监听器失败:', error);
        throw error;
    }
}

// 隐藏详情模态框
function hideDetailModal() {
    const modal = document.getElementById('outline-detail-modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 应用历史大纲到当前编辑器
function applyHistoryOutline(outlineId) {
    if (currentHistoryOutline && currentHistoryOutline.id === outlineId) {
        // 将历史大纲内容应用到当前的大纲生成页面
        const resultDiv = document.getElementById('outline-result');
        const contentDiv = document.getElementById('outline-content');

        if (resultDiv && contentDiv) {
            displayOutlineResult(currentHistoryOutline);
            hideDetailModal();
            hideHistoryModal();

            // 切换到大纲生成页面
            showSection('outline');

            showNotification('历史大纲已应用到当前页面', 'success');
        } else {
            showNotification('请先进入教学大纲页面', 'warning');
        }
    } else {
        // 重新获取大纲数据
        viewHistoryDetail(outlineId).then(() => {
            applyHistoryOutline(outlineId);
        });
    }
}



// 应用当前预览的大纲（详情模态框中使用）
function applyCurrentOutline() {
    if (currentHistoryOutline) {
        console.log('应用当前预览的大纲:', currentHistoryOutline.id);
        applyHistoryOutline(currentHistoryOutline.id);
    } else {
        console.error('没有当前预览的大纲数据');
        showNotification('没有可应用的大纲数据', 'error');
    }
}

// 下载历史大纲
function downloadHistoryOutline(outlineId) {
    if (currentHistoryOutline && currentHistoryOutline.id === outlineId) {
        const content = currentHistoryOutline.teachingDesign || '暂无内容';

        // 使用AI凝练的原始标题作为文件名
        const originalTitle = extractOriginalOutlineTitle(content);
        // 清理文件名中的特殊字符
        const cleanTitle = originalTitle.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        const fileName = `${cleanTitle}.md`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('大纲下载成功', 'success');
    } else {
        // 重新获取大纲数据
        viewHistoryDetail(outlineId).then(() => {
            downloadHistoryOutline(outlineId);
        });
    }
}

// 当前生成的大纲数据（用于保存和下载）
let currentGeneratedOutline = null;

// 保存当前生成的大纲
function saveCurrentOutline() {
    if (!currentGeneratedOutline) {
        showNotification('没有可保存的大纲数据', 'error');
        return;
    }

    // 这里可以调用保存API
    console.log('保存大纲:', currentGeneratedOutline);
    showNotification('大纲保存功能开发中...', 'info');
}

// 下载当前生成的大纲为Markdown文件
function downloadCurrentOutline() {
    if (!currentGeneratedOutline) {
        // 如果是历史大纲预览
        if (currentHistoryOutline) {
            console.log('下载当前预览的大纲:', currentHistoryOutline.id);
            downloadHistoryOutline(currentHistoryOutline.id);
            return;
        }

        showNotification('没有可下载的大纲数据', 'error');
        return;
    }

    // 创建Markdown内容
    const markdownContent = createMarkdownContent(currentGeneratedOutline);

    // 创建下载链接
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentGeneratedOutline.courseName || '教学大纲'}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('大纲已下载为Markdown文件', 'success');
}

// 创建Markdown格式的内容
function createMarkdownContent(outlineData) {
    let markdown = '';

    // 添加标题
    markdown += `# ${outlineData.courseName || '教学大纲'}\n\n`;

    // 添加基本信息
    if (outlineData.hours) {
        markdown += `**学时：** ${outlineData.hours}学时\n\n`;
    }

    if (outlineData.requirements) {
        markdown += `**教学要求：** ${outlineData.requirements}\n\n`;
    }

    // 添加生成时间
    markdown += `**生成时间：** ${new Date().toLocaleString()}\n\n`;

    // 添加分隔线
    markdown += '---\n\n';

    // 添加大纲内容
    markdown += outlineData.content || '';

    // 如果有参考链接，添加到末尾
    if (outlineData.referenceLinks && outlineData.referenceLinks.length > 0) {
        markdown += '\n\n## 参考资料\n\n';
        outlineData.referenceLinks.forEach(link => {
            markdown += `- [${link.title}](${link.url})\n`;
        });
    }

    return markdown;
}

// 删除历史大纲
async function deleteHistoryOutline(outlineId, courseName) {
    try {
        console.log('开始删除大纲:', { outlineId, courseName });

        const confirmed = await showConfirmDialog(
            '删除教学大纲',
            `确定要删除课程"${courseName}"的这个教学大纲吗？\n\n此操作不可撤销！`,
            '删除'
        );

        if (!confirmed) {
            console.log('用户取消删除操作');
            return;
        }

        console.log('用户确认删除，开始调用API...');
        showLoading('正在删除大纲...');

        // 验证参数
        if (!outlineId) {
            throw new Error('大纲ID不能为空');
        }

        // 调用删除API
        console.log('调用 TeacherAPI.deleteOutline，参数:', outlineId);
        const response = await TeacherAPI.deleteOutline(outlineId);
        console.log('API响应:', response);

        hideLoading();

        if (response && response.success) {
            console.log('删除成功');
            showNotification('教学大纲删除成功', 'success');

            // 关闭详情模态框（如果打开的是被删除的大纲）
            if (currentHistoryOutline && currentHistoryOutline.id === outlineId) {
                console.log('关闭详情模态框');
                hideDetailModal();
                currentHistoryOutline = null;
            }

            // 刷新历史记录列表
            console.log('开始刷新历史记录列表');
            await refreshOutlineHistory();
        } else {
            const errorMsg = response ? response.message || '删除失败' : '服务器响应异常';
            console.error('删除失败:', errorMsg, response);
            showNotification(errorMsg, 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('删除大纲失败 - 完整错误信息:', error);
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        console.error('错误堆栈:', error.stack);

        // 根据错误类型显示不同的错误消息
        let errorMessage = '删除大纲时发生错误';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查网络连接';
        } else if (error.message.includes('404')) {
            errorMessage = '删除接口不存在，请联系管理员';
        } else if (error.message.includes('403') || error.message.includes('401')) {
            errorMessage = '没有删除权限，请联系管理员';
        } else if (error.message.includes('500')) {
            errorMessage = '服务器内部错误，请稍后重试';
        } else if (error.message) {
            errorMessage = `删除失败: ${error.message}`;
        }

        showNotification(errorMessage, 'error');
    }
}


// window.addEventListener('load', function() {
//     console.log('页面已加载完成，开始初始化...');
//     setupEventListeners();
//     initializeTeacherPage();
// });

// ==================== 调试工具函数 ====================

// 强制刷新所有数据（调试用）
async function forceRefreshMaterials(showSuccessNotification = true) {
    console.log('========== 强制刷新开始 ==========');

    // 清空所有缓存数据
    currentCourses = [];
    currentMaterials = [];

    try {
        showLoading('正在强制刷新数据...');

        // 强制重新加载课程数据
        console.log('1. 重新加载课程数据...');
        const coursesResponse = await TeacherAPI.getCourses();
        currentCourses = coursesResponse.data || [];
        console.log('课程数据:', currentCourses);

        // 强制重新加载资料数据
        console.log('2. 重新加载资料数据...');
        const materialsResponse = await TeacherAPI.getMaterials();
        currentMaterials = materialsResponse.data || [];
        console.log('资料数据:', currentMaterials);

        // 更新显示
        console.log('3. 更新表格显示...');
        updateMaterialsTable();

        hideLoading();
        console.log('========== 强制刷新完成 ==========');

        if (showSuccessNotification) {
            showNotification('数据刷新成功！', 'success');
        }

    } catch (error) {
        hideLoading();
        console.error('强制刷新失败:', error);
        showNotification('数据刷新失败', 'error');
    }
}

// 将函数绑定到全局，方便调试
window.forceRefreshMaterials = forceRefreshMaterials;

// 测试删除大纲功能（调试用）
window.testDeleteOutline = async function(outlineId) {
    console.log('=== 测试删除大纲功能 ===');
    console.log('测试参数:', outlineId);

    try {
        // 直接调用API测试
        console.log('1. 测试直接调用API...');
        const response = await TeacherAPI.deleteOutline(outlineId);
        console.log('API调用结果:', response);

        return response;
    } catch (error) {
        console.error('测试失败:', error);
        return { success: false, error: error.message };
    }
};

// 检查API连通性
window.checkAPIConnection = async function() {
    console.log('=== 检查API连通性 ===');
    try {
        console.log('测试获取课程列表...');
        const coursesResponse = await TeacherAPI.getCourses();
        console.log('课程API响应:', coursesResponse);

        console.log('测试获取大纲历史...');
        const outlinesResponse = await TeacherAPI.getOutlineHistory();
        console.log('大纲API响应:', outlinesResponse);

        return { success: true, message: 'API连接正常' };
    } catch (error) {
        console.error('API连接测试失败:', error);
        return { success: false, error: error.message };
    }
};



// 自定义确认对话框
function showConfirmDialog(title, message, confirmButtonText = '确定') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const okBtn = document.getElementById('confirm-ok-btn');

        // 设置内容
        titleElement.textContent = title;
        messageElement.textContent = message;
        okBtn.innerHTML = `<i class="fas fa-check"></i> ${confirmButtonText}`;

        // 显示模态框
        modal.classList.add('show');
        modal.style.display = 'flex';

        // 关闭函数
        const closeModal = (result) => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            resolve(result);
        };

        // 事件处理函数
        const cancelHandler = () => closeModal(false);
        const okHandler = () => closeModal(true);

        // 移除之前的事件监听器（如果有）
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        okBtn.replaceWith(okBtn.cloneNode(true));

        // 重新获取元素引用
        const newCancelBtn = document.getElementById('confirm-cancel-btn');
        const newOkBtn = document.getElementById('confirm-ok-btn');

        // 添加新的事件监听器
        newCancelBtn.addEventListener('click', cancelHandler);
        newOkBtn.addEventListener('click', okHandler);

        // ESC键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escHandler);
                closeModal(false);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 点击背景关闭
        const backdropHandler = (e) => {
            if (e.target === modal) {
                modal.removeEventListener('click', backdropHandler);
                closeModal(false);
            }
        };
        modal.addEventListener('click', backdropHandler);
    });
}

// ===================== 注销账户功能 =====================

// 显示注销账户模态框
function showDeleteAccountModal() {
    console.log('显示注销账户模态框');
    const modal = document.getElementById('delete-account-modal');

    if (!modal) {
        console.error('找不到注销账户模态框');
        showNotification('页面元素异常，请刷新页面重试', 'error');
        return;
    }

    // 清空表单
    const passwordInput = document.getElementById('delete-account-password');
    const confirmCheckbox = document.getElementById('delete-account-confirm');

    if (passwordInput) passwordInput.value = '';
    if (confirmCheckbox) confirmCheckbox.checked = false;

    // 显示模态框
    modal.classList.add('show');
    modal.style.display = 'flex';

    // 设置事件监听器
    setupDeleteAccountModalEvents();
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

// 设置注销账户模态框事件监听器
function setupDeleteAccountModalEvents() {
    const modal = document.getElementById('delete-account-modal');
    const closeBtn = document.getElementById('close-delete-account-modal');
    const cancelBtn = document.getElementById('cancel-delete-account');
    const form = document.getElementById('delete-account-form');

    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.onclick = hideDeleteAccountModal;
    }

    // 取消按钮事件
    if (cancelBtn) {
        cancelBtn.onclick = hideDeleteAccountModal;
    }

    // 表单提交事件
    if (form) {
        form.onsubmit = handleDeleteAccount;
    }

    // 点击背景关闭
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                hideDeleteAccountModal();
            }
        };
    }

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            hideDeleteAccountModal();
        }
    });
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
        const finalConfirm = await showConfirmDialog(
            '最后确认',
            '此操作将永久删除您的账户和所有相关数据，且无法恢复！\n\n确定要继续吗？',
            '确认注销'
        );

        if (!finalConfirm) {
            return;
        }

        console.log('开始注销账户流程...');
        showLoading('正在注销账户，请稍候...');

        // 调用删除账户API
        const response = await TeacherAPI.deleteAccount(password);

        hideLoading();

        if (response && response.success) {
            console.log('账户注销成功');
            showNotification('账户注销成功，页面将自动跳转...', 'success');

            // 关闭模态框
            hideDeleteAccountModal();

            // 延迟2秒后跳转到首页
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);

        } else {
            const errorMsg = response ? response.message || '注销失败' : '服务器响应异常';
            console.error('注销失败:', errorMsg, response);
            showNotification(errorMsg, 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('注销账户时发生错误:', error);

        let errorMessage = '注销账户时发生错误';
        if (error.message.includes('Failed to fetch')) {
            errorMessage = '网络连接失败，请检查网络连接';
        } else if (error.message.includes('403') || error.message.includes('401')) {
            errorMessage = '密码验证失败，请检查密码是否正确';
        } else if (error.message.includes('500')) {
            errorMessage = '服务器内部错误，请稍后重试';
        } else if (error.message) {
            errorMessage = `注销失败: ${error.message}`;
        }

        showNotification(errorMessage, 'error');
    }
}

// 返回试卷生成页面
function returnToExamGeneration() {
    // 隐藏试卷预览
    const previewDiv = document.getElementById('exam-preview');
    if (previewDiv) {
        previewDiv.style.display = 'none';
    }

    // 清理全局状态
    window.currentExam = null;

    // 重新加载试卷生成页面数据
    loadExamGenerationData();

    showNotification('已返回试卷生成页面', 'info');
}

// 试卷操作函数
async function editExam(examId) {
    // 如果传入了examId，使用它；否则使用当前试卷
    if (examId && examId !== window.currentExam?.id) {
        // 如果examId与当前试卷不匹配，需要先加载试卷数据
        try {
            showLoading('正在加载试卷数据...');
            const response = await TeacherAPI.getExamDetail(examId);
            hideLoading();

            if (response.success) {
                window.currentExam = response.data;
                // 显示试卷预览页面
                displayExamPreview(response.data);
                showSection('gen-test');
            } else {
                showNotification('加载试卷数据失败', 'error');
                return;
            }
        } catch (error) {
            hideLoading();
            console.error('加载试卷数据失败:', error);
            showNotification('加载失败，请重试', 'error');
            return;
        }
    }

    if (!window.currentExam) {
        showNotification('没有可编辑的试卷', 'warning');
        return;
    }

    // 获取原始内容
    let currentContent = window.currentExam.originalContent || generateMarkdownFromQuestions(window.currentExam.questions);

    // 创建编辑界面
    const previewDiv = document.getElementById('exam-preview');

    // 设置编辑模式的页面标题和按钮
    previewDiv.innerHTML = `
        <div class="card-header">
            <i class="fas fa-edit"></i> 试卷编辑
            <div class="card-actions">
                <button class="btn btn-sm btn-secondary" onclick="displayExamPreview(window.currentExam)">
                    <i class="fas fa-eye"></i> 预览
                </button>
                <button class="btn btn-sm btn-primary" onclick="publishExam(${window.currentExam.id})">
                    <i class="fas fa-paper-plane"></i> 发布
                </button>
                <button class="btn btn-sm btn-secondary" onclick="exportExam()">
                    <i class="fas fa-download"></i> 导出
                </button>
            </div>
        </div>
        <div id="exam-content" style="padding: 24px;">
            <!-- 动态生成的编辑内容 -->
        </div>
    `;

    const editContainer = document.createElement('div');
    editContainer.className = 'exam-edit-container';

    // 创建Markdown编辑器
    const textarea = document.createElement('textarea');
    textarea.className = 'exam-edit-textarea';
    textarea.value = currentContent;
    textarea.placeholder = '在此输入Markdown格式的试卷内容...';

    // 创建预览区域
    const previewContent = document.createElement('div');
    previewContent.className = 'exam-edit-preview';

    // 实时预览功能
    function updatePreview() {
        const markdown = textarea.value.trim();
        if (!markdown) {
            previewContent.innerHTML = `
                <div style="color: #95a5a6; text-align: center; padding: 50px; font-style: italic;">
                    开始编辑以查看预览...
                </div>
            `;
            return;
        }

        try {
            // 解析Markdown并渲染预览
            const examData = parseExamMarkdownToData(markdown);
            renderExamPreviewFromData(examData, previewContent);
        } catch (error) {
            console.error('Markdown解析失败:', error);
            previewContent.innerHTML = `
                <div style="color: #e74c3c; text-align: center; padding: 50px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    预览解析失败<br>
                    <small style="font-size: 12px; margin-top: 5px; display: block;">${error.message}</small>
                </div>
            `;
        }
    }

    textarea.addEventListener('input', updatePreview);
    updatePreview(); // 初始预览

    // 添加标签
    const leftLabel = document.createElement('div');
    leftLabel.className = 'edit-label';
    leftLabel.innerHTML = '<i class="fas fa-edit"></i> Markdown编辑器';

    const rightLabel = document.createElement('div');
    rightLabel.className = 'edit-label';
    rightLabel.innerHTML = '<i class="fas fa-eye"></i> 实时预览';

    // 组装编辑界面
    const leftPanel = document.createElement('div');
    leftPanel.className = 'exam-edit-panel';
    leftPanel.appendChild(leftLabel);
    leftPanel.appendChild(textarea);

    const rightPanel = document.createElement('div');
    rightPanel.className = 'exam-edit-panel';
    rightPanel.appendChild(rightLabel);
    rightPanel.appendChild(previewContent);

    editContainer.appendChild(leftPanel);
    editContainer.appendChild(rightPanel);

    // 创建按钮组（在编辑容器外面）
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'form-actions';
    buttonGroup.style.cssText = `
        margin-top: 20px;
        display: flex;
        gap: 12px;
        justify-content: center;
        padding: 16px 0;
    `;

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> 取消';
    cancelBtn.onclick = function() {
        // 重新显示原始的试卷预览格式
        displayExamPreview(window.currentExam);
    };

    // 保存按钮
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存修改';
    saveBtn.onclick = async function() {
        const newMarkdown = textarea.value;

        try {
            showLoading('正在保存修改...');

            // 调用后端API保存修改
            const response = await TeacherAPI.updateExam(window.currentExam.id, newMarkdown);

            hideLoading();

            if (response.success) {
                // 保存成功后，获取更新后的试卷数据
                const examDetailResponse = await TeacherAPI.getExamDetail(window.currentExam.id);
                if (examDetailResponse.success) {
                    window.currentExam = examDetailResponse.data;
                    window.currentExam.originalContent = newMarkdown;
                    displayExamPreview(window.currentExam);
                } else {
                    // 如果获取详情失败，只更新本地内容
                    window.currentExam.originalContent = newMarkdown;
                    displayExamPreview(window.currentExam);
                }
                showNotification('试卷修改保存成功！', 'success');
            } else {
                showNotification('保存失败：' + (response.message || '未知错误'), 'error');
            }

        } catch (error) {
            hideLoading();
            console.error('保存试卷修改失败:', error);
            showNotification('保存失败，请重试', 'error');
        }
    };

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(saveBtn);

    // 将编辑容器和按钮组添加到内容区域
    const contentDiv = document.getElementById('exam-content');
    contentDiv.appendChild(editContainer);
    contentDiv.appendChild(buttonGroup);

    // 聚焦到编辑器
    textarea.focus();
}

async function publishExam(examId) {
    // 如果传入了examId，使用它；否则使用当前试卷
    if (examId && examId !== window.currentExam?.id) {
        // 如果examId与当前试卷不匹配，需要先加载试卷数据
        try {
            showLoading('正在加载试卷数据...');
            const response = await TeacherAPI.getExamDetail(examId);
            hideLoading();

            if (response.success) {
                window.currentExam = response.data;
            } else {
                showNotification('加载试卷数据失败', 'error');
                return;
            }
        } catch (error) {
            hideLoading();
            console.error('加载试卷数据失败:', error);
            showNotification('加载失败，请重试', 'error');
            return;
        }
    }

    if (!window.currentExam) {
        showNotification('没有可发布的试卷', 'warning');
        return;
    }

    try {
        showLoading('正在发布试卷...');
        const response = await TeacherAPI.publishExam(window.currentExam.id, {
            publishTime: new Date().toISOString()
        });

        hideLoading();

        if (response.success) {
            showNotification(`试卷"${window.currentExam.title}"发布成功！学生现在可以参加考试了。`, 'success');
            window.currentExam.isPublished = true;
        } else {
            showNotification('发布失败：' + (response.message || '未知错误'), 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('发布试卷失败:', error);
        showNotification('发布失败，请重试', 'error');
    }
}

async function exportExam() {
    if (!window.currentExam) {
        showNotification('没有可导出的试卷', 'warning');
        return;
    }

    try {
        // 生成试卷Markdown内容
        const examMarkdown = generateExamMarkdown(window.currentExam);

        // 创建并下载文件
        const blob = new Blob([examMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${window.currentExam.title || '试卷'}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showNotification('试卷导出成功！', 'success');

    } catch (error) {
        console.error('导出试卷失败:', error);
        showNotification('导出失败，请重试', 'error');
    }
}

// 加载试卷列表
async function loadExamList() {
    try {
        // 检查TeacherAPI是否可用
        if (typeof TeacherAPI === 'undefined' || typeof TeacherAPI.getExamList !== 'function') {
            console.error('TeacherAPI未正确加载，稍后重试...');
            setTimeout(loadExamList, 1000);
            return;
        }

        showLoading('正在加载试卷列表...');

        // 获取当前教师ID (从登录状态获取)
        const teacherId = await getUserId(); // 从session获取当前教师ID

        if (!teacherId) {
            throw new Error('未获取到教师ID，请重新登录');
        }

        // 获取筛选参数
        const status = document.getElementById('exam-status-filter')?.value;
        const search = document.getElementById('exam-search-input')?.value?.trim();

        const response = await TeacherAPI.getExamList(teacherId, status, search);

        hideLoading();

        if (response.success) {
            displayExamList(response.data);
        } else {
            showNotification(response.message || '加载试卷列表失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('加载试卷列表失败:', error);
        showNotification('加载试卷列表失败，请重试', 'error');
    }
}

// 显示试卷列表
function displayExamList(examList) {
    const tbody = document.querySelector('#exams-table tbody');
    if (!tbody) {
        console.error('试卷表格不存在');
        return;
    }

    // 清空现有内容
    tbody.innerHTML = '';

    if (!examList || examList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-file-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <div>暂无试卷数据</div>
                </td>
            </tr>
        `;
        return;
    }

    examList.forEach(exam => {
        const row = document.createElement('tr');

        // 判断是否是定时发布的试卷
        const isScheduled = exam.startTime && new Date(exam.startTime) > new Date() && !exam.isPublished;
        const isScheduledAndReady = exam.startTime && new Date(exam.startTime) <= new Date() && exam.isPublished;

        // 生成状态显示
        let statusDisplay = '';
        let publishTimeDisplay = '';

        if (isScheduled) {
            statusDisplay = `
                <span class="status-badge" style="background-color: #fff3cd; color: #856404;">
                    <i class="fas fa-clock"></i> 等待发布
                </span>
            `;
            publishTimeDisplay = `
                <div style="font-size: 12px;">
                    <div style="color: #666;">预定时间:</div>
                    <div style="color: #e74c3c; font-weight: 500;">${formatDateTime(new Date(exam.startTime))}</div>
                </div>
            `;
        } else if (isScheduledAndReady) {
            statusDisplay = `
                <span class="status-badge status-${exam.status?.toLowerCase() || 'published'}">
                    ${getStatusText(exam.status)}
                </span>
                <div style="font-size: 11px; color: #27ae60; margin-top: 2px;">
                    <i class="fas fa-robot"></i> 定时发布
                </div>
            `;
            publishTimeDisplay = exam.publishTime || '未发布';
        } else {
            statusDisplay = `
                <span class="status-badge status-${exam.status?.toLowerCase() || 'draft'}">
                    ${getStatusText(exam.status)}
                </span>
            `;
            publishTimeDisplay = exam.publishTime || '未发布';
        }

        // 根据状态决定按钮是否可用
        const isReadonly = exam.status === 'PUBLISHED' || exam.status === 'ONGOING' || exam.status === 'FINISHED' || isScheduled;
        const cannotDelete = isReadonly || exam.participantCount > 0;

        row.innerHTML = `
            <td>
                <div class="exam-title">
                    <strong>${exam.title || '未命名试卷'}</strong>
                    <div class="exam-subtitle">${exam.courseName || '未知课程'}</div>
                    ${isScheduled ? '<div style="font-size: 11px; color: #f39c12; margin-top: 2px;"><i class="fas fa-calendar-alt"></i> 已设置定时发布</div>' : ''}
                </div>
            </td>
            <td>${exam.questionCount || 0}</td>
            <td>${exam.duration || 0}分钟</td>
            <td>${statusDisplay}</td>
            <td>${exam.participantCount || 0}</td>
            <td style="font-size: 13px;">${publishTimeDisplay}</td>
            <td>${exam.totalScore || 0}分</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-accent" onclick="showExamPreviewModal(${exam.id})" title="查看">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadExam(${exam.id})" title="下载">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showExamEditModal(${exam.id})" title="编辑"
                            ${isReadonly ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                    ${isScheduled ?
                        `<button class="btn btn-sm btn-warning" onclick="cancelScheduledPublish(${exam.id})" title="取消定时发布">
                            <i class="fas fa-calendar-times"></i>
                        </button>` :
                        `<button class="btn btn-sm btn-success" onclick="showPublishExamWithModal(${exam.id})"
                                title="发布" ${isReadonly ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fas fa-paper-plane"></i>
                        </button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="deleteExam(${exam.id})"
                            title="删除" ${cannotDelete ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        'DRAFT': '草稿',
        'PUBLISHED': '已发布',
        'ONGOING': '进行中',
        'FINISHED': '已结束'
    };
    return statusMap[status] || '未知';
}

// 预览试卷
async function previewExam(examId) {
    try {
        showLoading('正在加载试卷详情...');

        const response = await TeacherAPI.getExamDetail(examId);

        hideLoading();

        if (response.success) {
            displayExamPreview(response.data);
            // 切换到试卷预览页面
            showSection('exam-preview');
        } else {
            showNotification(response.message || '加载试卷详情失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('预览试卷失败:', error);
        showNotification('预览试卷失败，请重试', 'error');
    }
}

// 编辑试卷（此函数已在前面定义，这里移除重复定义）

// 显示发布试卷模态框
async function showPublishExamWithModal(examId) {
    try {
        // 先获取试卷信息
        const response = await TeacherAPI.getExamDetail(examId);

        if (response.success && response.data) {
            const exam = response.data;

            // 检查试卷状态，如果已发布则不允许再发布
            if (exam.isPublished) {
                showNotification('该试卷已经发布，无法重复发布', 'warning');
                return;
            }
            // 填充试卷信息到模态框
            document.getElementById('exam-title-display').textContent = exam.title || '-';

            // 显示课程信息：课程名（课程号）
            const courseDisplay = exam.courseName && exam.courseCode ?
                `${exam.courseName}（${exam.courseCode}）` :
                (exam.courseName || '-');
            document.getElementById('exam-course-display').textContent = courseDisplay;

            // 存储examId供后续使用
            document.getElementById('publish-exam-modal').setAttribute('data-exam-id', examId);

            // 显示模态框
            showPublishExamModal();
        } else {
            showNotification('获取试卷信息失败', 'error');
        }

    } catch (error) {
        console.error('获取试卷信息失败:', error);
        showNotification('获取试卷信息失败', 'error');
    }
}

// 下载试卷
async function downloadExam(examId) {
    try {
        showLoading('正在下载试卷...');

        const response = await TeacherAPI.getExamDetail(examId);

        hideLoading();

        if (response.success && response.data) {
            const examData = response.data;

            // 生成试卷Markdown内容
            const examMarkdown = generateExamMarkdown(examData);

            // 创建并下载文件
            const blob = new Blob([examMarkdown], { type: 'text/markdown;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${examData.title || '试卷'}.md`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('试卷下载成功！', 'success');
        } else {
            showNotification(response.message || '获取试卷详情失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('下载试卷失败:', error);
        showNotification('下载试卷失败，请重试', 'error');
    }
}

// 删除试卷
async function deleteExam(examId) {
    try {
        // 获取试卷详情以显示更详细的确认信息
        const examResponse = await TeacherAPI.getExamDetail(examId);
        let confirmMessage = '确定要删除这份试卷吗？删除后将无法恢复。';

        if (examResponse.success && examResponse.data) {
            const exam = examResponse.data;
            if (exam.isPublished) {
                // 已发布的试卷提供更详细的警告信息
                confirmMessage = '这是一份已发布的试卷，删除后将影响所有相关的考试记录和学生答题数据。\n\n确定要删除吗？此操作不可撤销。';
            }
        }

        const confirmed = await showConfirmDialog(
            '删除试卷',
            confirmMessage,
            '删除'
        );

        if (!confirmed) return;

        showLoading('正在删除试卷...');

        const response = await TeacherAPI.deleteExam(examId);

        hideLoading();

        if (response.success) {
            showNotification('试卷删除成功！', 'success');
            // 重新加载试卷列表和统计数据
            await loadExamList();
            await refreshExamStats();
        } else {
            showNotification(response.message || '删除试卷失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('删除试卷失败:', error);
        showNotification('删除试卷失败，请重试', 'error');
    }
}

// 搜索试卷
function searchExams() {
    loadExamList(); // 重新加载列表，会自动应用搜索参数
}

// 筛选试卷状态
function filterExamsByStatus() {
    loadExamList(); // 重新加载列表，会自动应用筛选参数
}

// 获取当前教师ID的辅助函数
async function getUserId() {
    try {
        const response = await fetch('/api/auth/current-user', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success && result.data) {
            const userData = result.data;
            console.log('当前用户信息:', userData);
            if (userData.role === 'teacher') {
                // 如果有直接的teacherId就使用，否则使用userId
                const teacherId = userData.teacherId || userData.userId;
                console.log('获取到的教师ID:', teacherId);
                return teacherId;
            } else {
                console.error('当前用户不是教师角色:', userData.role);
            }
        }
        throw new Error('未获取到有效的教师ID');
    } catch (error) {
        console.error('获取用户ID失败:', error);
        // 不再使用localStorage，完全依赖服务器端session
        return null;
    }
}

// 刷新考试统计数据
async function refreshExamStats() {
    try {
        // 获取当前教师ID
        const teacherId = await getUserId();
        if (!teacherId) {
            console.error('未获取到教师ID，无法刷新统计数据');
            return;
        }

        // 获取最新的统计数据
        const statsResponse = await TeacherAPI.getExamStats(teacherId);
        if (statsResponse.success) {
            const stats = statsResponse.data || {};
            updateExamStatsCards(stats);
            console.log('统计数据已刷新:', stats);
        } else {
            console.error('获取统计数据失败:', statsResponse.message);
        }
    } catch (error) {
        console.error('刷新统计数据失败:', error);
    }
}

// 更新考试统计卡片
function updateExamStatsCards(stats) {
    // 更新待发布试卷数
    const draftElement = document.getElementById('stat-draft-exams');
    if (draftElement) {
        draftElement.textContent = stats.draftExamCount || '0';
    }

    // 更新进行中考试数
    const ongoingElement = document.getElementById('stat-ongoing-exams');
    if (ongoingElement) {
        ongoingElement.textContent = stats.ongoingExamCount || '0';
    }

    // 更新已结束考试数
    const pendingElement = document.getElementById('stat-pending-grades');
    if (pendingElement) {
        pendingElement.textContent = stats.pendingGradeCount || '0';
    }

    // 更新本月考试数
    const monthlyElement = document.getElementById('stat-monthly-exams');
    if (monthlyElement) {
        monthlyElement.textContent = stats.monthlyExamCount || '0';
    }
}

// 生成试卷Markdown内容
function generateExamMarkdown(examData) {
    const questionsMarkdown = examData.questions ? examData.questions.map((question, index) => {
        // 解析选项（可能是JSON字符串）
        let options = [];
        if (question.options) {
            try {
                options = typeof question.options === 'string' ?
                    JSON.parse(question.options) : question.options;
            } catch (e) {
                options = [];
            }
        }

        let questionText = `### 题目${index + 1}（${question.type || 'multiple-choice'}）\n\n`;
        questionText += `**题目内容**：${question.content || '题目内容'}\n\n`;

        if (options.length > 0) {
            questionText += `**选项**：\n`;
            options.forEach((option, i) => {
                questionText += `${String.fromCharCode(65 + i)}. ${option}\n`;
            });
            questionText += '\n';
        }

        questionText += `**正确答案**：${question.answer || 'A'}\n\n`;

        if (question.explanation) {
            questionText += `**解析**：${question.explanation}\n\n`;
        }

        questionText += `**分值建议**：${question.score || 2}分\n\n`;

        // 添加知识点信息（如果有的话）
        if (question.knowledgePoint) {
            questionText += `**知识点**：${question.knowledgePoint}\n\n`;
        }

        questionText += '---\n\n';

        return questionText;
    }).join('') : '';

    return `# ${examData.title || 'AI生成试卷'}

**考试时长**：${examData.duration || 0}分钟
**总分设置**：${examData.totalScore || 0}分
**题目数量**：${examData.questions ? examData.questions.length : 0}题

---

${questionsMarkdown}

---

*本试卷由智囊WisdomEdu系统生成*
`;
}

// 从题目数据生成Markdown内容
function generateMarkdownFromQuestions(questions) {
    if (!questions || questions.length === 0) {
        return '# 试卷内容\n\n暂无题目数据';
    }

    const questionsMarkdown = questions.map((question, index) => {
        let options = [];
        if (question.options) {
            try {
                options = typeof question.options === 'string' ?
                    JSON.parse(question.options) : question.options;
            } catch (e) {
                options = [];
            }
        }

        let questionText = `### 题目${index + 1}（${question.type || 'multiple-choice'}）\n\n`;
        questionText += `**题目内容**：${question.content || '题目内容'}\n\n`;

        if (options.length > 0) {
            questionText += `**选项**：\n`;
            options.forEach((option, i) => {
                questionText += `${String.fromCharCode(65 + i)}. ${option}\n`;
            });
            questionText += '\n';
        }

        questionText += `**正确答案**：${question.answer || 'A'}\n\n`;

        if (question.explanation) {
            questionText += `**解析**：${question.explanation}\n\n`;
        }

        questionText += `**分值建议**：${question.score || 2}分\n\n`;

        // 添加知识点信息（如果有的话）
        if (question.knowledgePoint) {
            questionText += `**知识点**：${question.knowledgePoint}\n\n`;
        }

        questionText += '---\n\n';

        return questionText;
    }).join('');

    return questionsMarkdown;
}

// 解析试卷Markdown为HTML预览（与试卷预览样式一致）
// 解析Markdown为HTML（用于试卷生成界面）
function parseExamMarkdown(markdown) {
    if (!markdown) return '<p style="color: #999;">请输入试卷内容</p>';

    // 按题目分割（使用 ### 作为分隔符）
    const questionBlocks = markdown.split(/^### /gm);

    if (questionBlocks.length < 2) {
        // 如果没有找到题目格式，返回简单的HTML预览
        return `<div style="padding: 20px; color: #666; text-align: center;">
            <p>请按照标准格式输入试卷内容</p>
            <p>格式示例：</p>
            <pre style="text-align: left; background: #f5f5f5; padding: 10px; border-radius: 4px;">
### 题目1（multiple-choice）

**题目内容**：您的题目内容

**选项**：
A. 选项A
B. 选项B
C. 选项C
D. 选项D

**正确答案**：A

**解析**：您的解析内容

**分值建议**：20分
            </pre>
        </div>`;
    }

    let questionsHtml = '';

    // 从第二个元素开始处理（第一个是标题部分）
    for (let i = 1; i < questionBlocks.length; i++) {
        const block = '### ' + questionBlocks[i];
        const questionHtml = parseQuestionBlock(block, i);
        if (questionHtml) {
            questionsHtml += questionHtml;
        }
    }

    return `<div class="exam-questions">${questionsHtml}</div>`;
}

// 解析Markdown为数据对象（用于试卷编辑模态框）
function parseExamMarkdownToData(markdown) {
    if (!markdown) return { questions: [] };

    // 按题目分割（使用 ### 作为分隔符）
    const questionBlocks = markdown.split(/^### /gm);

    if (questionBlocks.length < 2) {
        return { questions: [] };
    }

    const questions = [];

    // 从第二个元素开始处理（第一个是标题部分）
    for (let i = 1; i < questionBlocks.length; i++) {
        const block = '### ' + questionBlocks[i];
        const questionData = parseQuestionBlockToData(block, i);
        if (questionData) {
            questions.push(questionData);
        }
    }

    return { questions: questions };
}

// 解析单个题目块为数据对象
function parseQuestionBlockToData(block, questionIndex) {
    try {
        // 提取题目标题和类型
        const titleMatch = block.match(/^### (.+)$/m);
        if (!titleMatch) return null;

        const title = titleMatch[1];

        // 提取题目内容
        const contentMatch = block.match(/\*\*题目内容\*\*：(.+?)(?=\n\*\*|$)/s);
        const content = contentMatch ? contentMatch[1].trim() : '题目内容未找到';

        // 提取选项 - 精确匹配选项部分，避免包含答案和解析
        const optionsMatch = block.match(/\*\*选项\*\*：\s*\n((?:[A-Z]\.\s*.+\n?)*?)(?=\n\*\*正确答案\*\*|\n\*\*解析\*\*|\n\*\*分值建议\*\*|$)/s);
        let options = [];
        if (optionsMatch) {
            const optionsText = optionsMatch[1];
            console.log('原始选项文本:', optionsText);
            // 按行分割，并过滤掉空行
            const lines = optionsText.split('\n').filter(line => line.trim() && /^[A-Z]\.\s*.+/.test(line.trim()));
            options = lines.map(line => {
                const trimmed = line.trim();
                console.log('处理选项行:', trimmed);
                // 匹配开头的单个字母加点和空格，然后保留其余内容
                const match = trimmed.match(/^([A-Z])\.\s*(.+)$/);
                if (match) {
                    console.log('选项匹配成功:', match[2]);
                    return match[2]; // 返回选项内容部分
                }
                return trimmed; // 如果匹配失败，返回原内容
            });
        }
        console.log('解析后的选项数组:', options);

        // 提取答案
        const answerMatch = block.match(/\*\*正确答案\*\*：(.+?)(?=\n\*\*|$)/s);
        const correctAnswer = answerMatch ? answerMatch[1].trim() : 'N/A';

        // 提取解析
        const explanationMatch = block.match(/\*\*解析\*\*：(.+?)(?=\n\*\*|$)/s);
        const explanation = explanationMatch ? explanationMatch[1].trim() : null;

        // 提取分值
        const scoreMatch = block.match(/\*\*分值建议\*\*：(\d+)分/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 10;

        // 提取知识点（如果有的话）
        const knowledgePointMatch = block.match(/\*\*知识点\*\*：([^\n]+)/);
        const knowledgePoint = knowledgePointMatch ? knowledgePointMatch[1].trim() : null;

        return {
            title: title,
            content: content,
            questionText: content,
            options: options,
            correctAnswer: correctAnswer,
            answer: correctAnswer,
            explanation: explanation,
            analysis: explanation,
            score: score,
            knowledgePoint: knowledgePoint
        };

    } catch (error) {
        console.error('解析题目块失败:', error);
        return null;
    }
}

// 解析单个题目块（保留原函数用于其他地方）
function parseQuestionBlock(block, questionIndex) {
    try {
        // 提取题目标题和类型
        const titleMatch = block.match(/^### (.+)$/m);
        if (!titleMatch) return null;

        const title = titleMatch[1];

        // 提取题目内容
        const contentMatch = block.match(/\*\*题目内容\*\*：(.+?)(?=\n\*\*|$)/s);
        const content = contentMatch ? contentMatch[1].trim() : '题目内容未找到';

        // 提取选项 - 精确匹配选项部分，避免包含答案和解析
        const optionsMatch = block.match(/\*\*选项\*\*：\s*\n((?:[A-Z]\.\s*.+\n?)*?)(?=\n\*\*正确答案\*\*|\n\*\*解析\*\*|\n\*\*分值建议\*\*|$)/s);
        let optionsHtml = '';
        if (optionsMatch) {
            const optionsText = optionsMatch[1];
            // 按行分割，并过滤掉空行
            const lines = optionsText.split('\n').filter(line => line.trim() && /^[A-Z]\.\s*.+/.test(line.trim()));
            const options = lines.map(line => {
                const trimmed = line.trim();
                // 匹配开头的单个字母加点和空格，然后保留其余内容
                const match = trimmed.match(/^([A-Z])\.\s*(.+)$/);
                if (match) {
                    return { label: match[1], content: match[2] }; // 返回标签和内容
                }
                return { label: 'X', content: trimmed }; // 如果匹配失败，返回原内容
            });

            optionsHtml = `
                <div class="question-options">
                    ${options.map((option) => {
                        return `<p><span style="font-weight: 500; color: #3498db; margin-right: 8px;">${option.label}.</span>${formatTeacherMarkdown(option.content)}</p>`;
                    }).join('')}
                </div>
            `;
        }

        // 提取答案
        const answerMatch = block.match(/\*\*正确答案\*\*：(.+?)(?=\n\*\*|$)/s);
        const answer = answerMatch ? answerMatch[1].trim() : 'N/A';

        // 提取解析
        const explanationMatch = block.match(/\*\*解析\*\*：(.+?)(?=\n\*\*|$)/s);
        const explanation = explanationMatch ? explanationMatch[1].trim() : null;

        // 提取分值
        const scoreMatch = block.match(/\*\*分值建议\*\*：(\d+)分/);
        const score = scoreMatch ? scoreMatch[1] : '2';

        // 提取知识点（如果有的话）
        const knowledgePointMatch = block.match(/\*\*知识点\*\*：([^\n]+)/);
        const knowledgePoint = knowledgePointMatch ? knowledgePointMatch[1].trim() : null;

        // 生成HTML结构（与displayExamPreview一致）
        return `
            <div class="question-item">
                <h4>第${questionIndex}题 (${score}分)
                    ${knowledgePoint ? `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">知识点：${knowledgePoint}</span>` : ''}
                </h4>
                <div class="question-content">${formatTeacherMarkdown(content)}</div>
                ${optionsHtml}
                <div class="question-answer" style="margin-bottom: 15px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
                    <span style="font-weight: 600; color: #155724;">参考答案：</span>
                    <div style="color: #155724; margin-top: 8px;">${formatTeacherMarkdown(answer)}</div>
                </div>
                ${explanation ? `
                    <div class="question-explanation" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px;">
                        <span style="font-weight: 600; color: #0c5460;">解析：</span>
                        <div style="color: #0c5460; line-height: 1.6; margin-top: 8px;">${formatTeacherMarkdown(explanation)}</div>
                    </div>
                ` : ''}
            </div>
        `;

    } catch (error) {
        console.error('解析题目块失败:', error);
        return `<div class="question-item" style="color: #e74c3c; padding: 16px;">
            <p>题目${questionIndex}解析失败，请检查格式</p>
        </div>`;
    }
}

// 显示发布试卷模态框
function showPublishExamModal() {
    const modal = document.getElementById('publish-exam-modal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';

        // 重置表单状态
        resetPublishExamForm();

        // 绑定事件监听器
        setupPublishExamModalEvents();
    }
}

// 隐藏发布试卷模态框
function hidePublishExamModal() {
    const modal = document.getElementById('publish-exam-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';

        // 移除事件监听器
        cleanupPublishExamModalEvents();
    }
}

// 重置发布表单状态
function resetPublishExamForm() {
    // 默认选中立即发布
    document.getElementById('publish-immediately').checked = true;
    document.getElementById('schedule-publish').checked = false;

    // 设置默认考试开始时间（明天上午9点）
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(9, 0, 0, 0);
    document.getElementById('exam-start-time').value = startTime.toISOString().slice(0, 16);



    // 更新UI状态
    updatePublishOptionStates();
}

// 设置发布模态框事件监听器
function setupPublishExamModalEvents() {
    // 关闭按钮
    const closeBtn = document.getElementById('close-publish-modal');
    const confirmBtn = document.getElementById('confirm-publish');

    if (closeBtn) closeBtn.addEventListener('click', hidePublishExamModal);
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirmPublish);

    // 选项切换
    const immediatelyChk = document.getElementById('publish-immediately');
    const scheduleChk = document.getElementById('schedule-publish');

    if (immediatelyChk) {
        immediatelyChk.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('schedule-publish').checked = false;
            } else {
                // 如果取消选中立即发布，自动选中定时发布
                document.getElementById('schedule-publish').checked = true;
            }
            updatePublishOptionStates();
        });
    }

    if (scheduleChk) {
        scheduleChk.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('publish-immediately').checked = false;
            } else {
                // 如果取消选中定时发布，自动选中立即发布
                document.getElementById('publish-immediately').checked = true;
            }
            updatePublishOptionStates();
        });
    }

    // 点击选项区域切换选择
    const options = document.querySelectorAll('.publish-option');
    options.forEach(option => {
        option.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = option.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
    });

    // ESC键关闭
    document.addEventListener('keydown', handlePublishModalEscape);

    // 点击背景关闭
    const modal = document.getElementById('publish-exam-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hidePublishExamModal();
            }
        });
    }
}

// 清理事件监听器
function cleanupPublishExamModalEvents() {
    document.removeEventListener('keydown', handlePublishModalEscape);
}

// 处理ESC键
function handlePublishModalEscape(e) {
    if (e.key === 'Escape') {
        hidePublishExamModal();
    }
}

// 更新发布选项状态
function updatePublishOptionStates() {
    const immediately = document.getElementById('publish-immediately').checked;
    const schedule = document.getElementById('schedule-publish').checked;
    const scheduleSettings = document.getElementById('schedule-settings');
    const examStartTimeInput = document.getElementById('exam-start-time');

    // 更新选项的视觉状态
    const immediatelyOption = document.getElementById('publish-immediately').closest('.publish-option');
    const scheduleOption = document.getElementById('schedule-publish').closest('.publish-option');

    if (immediately) {
        immediatelyOption.classList.add('selected');
        scheduleOption.classList.remove('selected');
        // 禁用时间选择
        examStartTimeInput.disabled = true;
        scheduleSettings.classList.add('disabled');
    } else if (schedule) {
        immediatelyOption.classList.remove('selected');
        scheduleOption.classList.add('selected');
        // 启用时间选择
        examStartTimeInput.disabled = false;
        scheduleSettings.classList.remove('disabled');
    } else {
        immediatelyOption.classList.remove('selected');
        scheduleOption.classList.remove('selected');
        // 禁用时间选择
        examStartTimeInput.disabled = true;
        scheduleSettings.classList.add('disabled');
    }
}

// 处理确认发布
async function handleConfirmPublish() {
    try {
        const modal = document.getElementById('publish-exam-modal');
        const examId = modal.getAttribute('data-exam-id');

        if (!examId) {
            showNotification('试卷ID不存在', 'error');
            return;
        }

        const immediately = document.getElementById('publish-immediately').checked;
        const schedule = document.getElementById('schedule-publish').checked;

        if (!immediately && !schedule) {
            showNotification('请选择发布方式', 'warning');
            return;
        }

        const publishData = {};

        if (immediately) {
            publishData.publishType = 'IMMEDIATE';
            // 立即发布时，考试也立即开始（不设置具体时间）
        } else if (schedule) {
            const examStartTime = document.getElementById('exam-start-time').value;

            if (!examStartTime) {
                showNotification('请选择考试开始时间', 'warning');
                return;
            }

            publishData.publishType = 'SCHEDULED';
            publishData.startTime = examStartTime;
            // 结束时间由后端根据考试时长自动计算
        }

        showLoading('正在发布试卷...');

        const response = await TeacherAPI.publishExam(examId, publishData);

        hideLoading();

        if (response.success) {
            showNotification('试卷发布成功！', 'success');
            hidePublishExamModal();
            // 重新加载试卷列表和统计数据
            await loadExamList();
            await refreshExamStats();
        } else {
            showNotification(response.message || '发布试卷失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('发布试卷失败:', error);
        showNotification('发布试卷失败，请重试', 'error');
    }
}

// ============= 知识库管理功能 =============

// 知识库页面数据加载
async function loadKnowledgeData() {
    try {
        showLoading('加载知识库数据中...');

        // 直接调用知识库专用的课程API来获取包含统计数据的课程信息
        const response = await fetch('/api/teacher/knowledge/courses', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                knowledgeCurrentCourses = result.data;
                console.log('知识库模块获取到的课程数据:', knowledgeCurrentCourses);
            } else {
                console.error('获取知识库课程数据失败:', result.message);
                showNotification('获取知识库课程数据失败: ' + result.message, 'error');
                // fallback到通用课程数据
                if (currentCourses.length === 0) {
                    await loadCourseList();
                }
                knowledgeCurrentCourses = currentCourses.slice();
            }
        } else {
            console.error('调用知识库课程API失败:', response.statusText);
            // fallback到通用课程数据
            if (currentCourses.length === 0) {
                await loadCourseList();
            }
            knowledgeCurrentCourses = currentCourses.slice();
        }

        // 加载知识库健康状态
        try {
            const healthResponse = await fetch('/api/teacher/knowledge/health', {
                method: 'GET',
                credentials: 'include'
            });

            if (healthResponse.ok) {
                const healthResult = await healthResponse.json();
                console.log('知识库健康状态:', healthResult);
            }
        } catch (error) {
            console.warn('获取知识库健康状态失败:', error);
        }

        await updateKnowledgeUI();

        hideLoading();

    } catch (error) {
        hideLoading();
        console.error('加载知识库数据失败:', error);
        showNotification('加载知识库数据失败，请重试', 'error');
    }
}

// 更新知识库UI
async function updateKnowledgeUI() {
    updateKnowledgeStatsCards();
    updateKnowledgeCourseFilter();
    updateKnowledgeList();
    await updateRecentDocumentsTable();
}

// 更新知识库统计卡片
function updateKnowledgeStatsCards() {
    let knowledgeBaseCount = 0; // 有知识库数据的课程数量
    let totalFiles = 0;         // 总文档数量
    let totalChunks = 0;        // 总知识块数量
    let totalSize = 0;          // 总文件大小

    knowledgeCurrentCourses.forEach(course => {
        if (course.knowledgeStats) {
            // 如果课程有知识库数据（文档数量大于0），则计入知识库数量
            if (course.knowledgeStats.fileCount > 0) {
                knowledgeBaseCount++;
            }

            // 累计统计数据
            totalFiles += course.knowledgeStats.fileCount || 0;
            totalChunks += course.knowledgeStats.totalChunks || 0;
            totalSize += course.knowledgeStats.totalSize || 0;
        }
    });

    // 更新统计卡片
    document.getElementById('knowledge-base-count').textContent = knowledgeBaseCount;
    document.getElementById('total-chunks').textContent = totalChunks;
    document.getElementById('total-files').textContent = totalFiles;
    document.getElementById('total-size').textContent = formatFileSize(totalSize);
}

// 更新课程过滤器
function updateKnowledgeCourseFilter() {
    const filterSelect = document.getElementById('knowledge-course-filter');
    if (!filterSelect) return;

    // 清空现有选项
    filterSelect.innerHTML = '<option value="">全部课程</option>';

    // 使用当前教师的课程数据，如果知识库课程数据为空，则使用全局课程数据
    const coursesToUse = knowledgeCurrentCourses.length > 0 ? knowledgeCurrentCourses : currentCourses;

    // 添加课程选项
    coursesToUse.forEach(course => {
        const option = document.createElement('option');
        option.value = course.id;
        option.textContent = `${course.name} (${course.courseCode || course.code || ''})`;
        filterSelect.appendChild(option);
    });
}

// 知识库轮播相关变量
let knowledgeCarouselIndex = 0;
let knowledgeCarouselInitialized = false;

// 更新知识库列表
function updateKnowledgeList() {
    const container = document.getElementById('knowledge-list-container');
    if (!container) return;

    if (knowledgeCurrentCourses.length === 0) {
        container.innerHTML = `
            <div class="knowledge-carousel-wrapper">
                <div class="knowledge-carousel-track">
                    <div class="knowledge-empty-state">
                        <i class="fas fa-database" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                        <p>暂无知识库数据</p>
                        <p>上传文档后这里会显示知识库信息</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // 构建轮播HTML
    let trackHtml = '';
    let indicatorsHtml = '';

    knowledgeCurrentCourses.forEach((course, index) => {
        const stats = course.knowledgeStats || {};
        trackHtml += `
            <div class="knowledge-course-item">
                <div class="course-header">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0; color: #2c3e50;">${course.name}</h4>
                            <p style="margin: 4px 0 0 0; color: #7f8c8d; font-size: 14px;">课程号: ${course.courseCode}</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-sm btn-info" onclick="testKnowledgeSearch(${course.id}, '${course.name}')">
                                <i class="fas fa-search"></i> 测试搜索
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="viewKnowledgeChunks(${course.id}, '${course.name}')">
                                <i class="fas fa-list"></i> 查看知识块
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteKnowledgeBase(${course.id}, '${course.name}')">
                                <i class="fas fa-trash"></i> 清空知识库
                            </button>
                        </div>
                    </div>
                </div>
                <div class="course-stats">
                    <div class="stat-item">
                        <div style="font-size: 24px; font-weight: bold; color: #3498db;">${stats.fileCount || 0}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">文档数量</div>
                    </div>
                    <div class="stat-item">
                        <div style="font-size: 24px; font-weight: bold; color: #27ae60;">${stats.totalChunks || 0}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">知识块</div>
                    </div>
                    <div class="stat-item">
                        <div style="font-size: 24px; font-weight: bold; color: #8e44ad;">${stats.processedChunks || 0}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">已向量化</div>
                    </div>
                    <div class="stat-item">
                        <div style="font-size: 24px; font-weight: bold; color: #e74c3c;">${formatFileSize(stats.totalSize || 0)}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">总大小</div>
                    </div>
                </div>
            </div>
        `;
    });

    // 生成指示器（在循环外处理）
    if (knowledgeCurrentCourses.length === 1) {
        // 单个课程时显示不可点击的蓝点
        indicatorsHtml = `
            <div class="carousel-indicator active single-course" aria-label="当前课程"></div>
        `;
    } else {
        // 多个课程时显示可点击的指示器
        knowledgeCurrentCourses.forEach((course, index) => {
            indicatorsHtml += `
                <button class="carousel-indicator ${index === knowledgeCarouselIndex ? 'active' : ''}"
                        onclick="goToKnowledgeSlide(${index})"
                        aria-label="课程 ${index + 1}"></button>
            `;
        });
    }

    // 构建完整的轮播HTML
    const carouselHtml = `
        <div class="knowledge-carousel-wrapper">
            <div class="knowledge-carousel-track" id="knowledge-carousel-track">
                ${trackHtml}
            </div>
            ${knowledgeCurrentCourses.length > 1 ? `
                <button class="carousel-nav prev" onclick="prevKnowledgeSlide()" aria-label="上一个课程">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-nav next" onclick="nextKnowledgeSlide()" aria-label="下一个课程">
                    <i class="fas fa-chevron-right"></i>
                </button>
            ` : ''}
        </div>
        <div class="knowledge-carousel-indicators" id="knowledge-carousel-indicators">
            ${indicatorsHtml}
        </div>
    `;

    container.innerHTML = carouselHtml;

    // 初始化轮播
    initKnowledgeCarousel();
}

// 初始化知识库轮播
function initKnowledgeCarousel() {
    const container = document.getElementById('knowledge-list-container');
    if (!container) return;

    // 重置轮播索引
    knowledgeCarouselIndex = 0;
    updateKnowledgeCarouselPosition();

    // 只有多个课程时才添加滚轮事件监听
    if (knowledgeCurrentCourses.length > 1) {
        if (!knowledgeCarouselInitialized) {
            container.addEventListener('wheel', handleKnowledgeCarouselWheel, { passive: false });
            knowledgeCarouselInitialized = true;
        }
    } else {
        // 单个课程时移除滚轮事件监听
        if (knowledgeCarouselInitialized) {
            container.removeEventListener('wheel', handleKnowledgeCarouselWheel);
            knowledgeCarouselInitialized = false;
        }
    }
}

// 处理滚轮事件
function handleKnowledgeCarouselWheel(event) {
    if (knowledgeCurrentCourses.length <= 1) return;

    event.preventDefault();

    // 防抖处理
    if (window.knowledgeWheelTimeout) {
        clearTimeout(window.knowledgeWheelTimeout);
    }

    window.knowledgeWheelTimeout = setTimeout(() => {
        if (event.deltaY > 0) {
            // 向下滚动，显示下一个课程
            nextKnowledgeSlide();
        } else {
            // 向上滚动，显示上一个课程
            prevKnowledgeSlide();
        }
    }, 50);
}

// 下一个课程
function nextKnowledgeSlide() {
    if (knowledgeCurrentCourses.length <= 1) return;

    knowledgeCarouselIndex = (knowledgeCarouselIndex + 1) % knowledgeCurrentCourses.length;
    updateKnowledgeCarouselPosition();
    updateKnowledgeCarouselIndicators();
}

// 上一个课程
function prevKnowledgeSlide() {
    if (knowledgeCurrentCourses.length <= 1) return;

    knowledgeCarouselIndex = (knowledgeCarouselIndex - 1 + knowledgeCurrentCourses.length) % knowledgeCurrentCourses.length;
    updateKnowledgeCarouselPosition();
    updateKnowledgeCarouselIndicators();
}

// 跳转到指定课程
function goToKnowledgeSlide(index) {
    if (knowledgeCurrentCourses.length <= 1 || index < 0 || index >= knowledgeCurrentCourses.length) return;

    knowledgeCarouselIndex = index;
    updateKnowledgeCarouselPosition();
    updateKnowledgeCarouselIndicators();
}

// 更新轮播位置
function updateKnowledgeCarouselPosition() {
    const track = document.getElementById('knowledge-carousel-track');
    if (!track) return;

    const translateX = -knowledgeCarouselIndex * 100;
    track.style.transform = `translateX(${translateX}%)`;
}

// 更新指示器状态
function updateKnowledgeCarouselIndicators() {
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        if (index === knowledgeCarouselIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// 更新最近文档表格
async function updateRecentDocumentsTable() {
    const tbody = document.querySelector('#recent-documents-table tbody');
    if (!tbody) return;

    try {
        // 获取最近上传的文档
        const response = await fetch('/api/teacher/knowledge/recent-documents', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                let html = '';
                result.data.forEach(doc => {
                    // 格式化时间到分钟
                    const uploadTime = new Date(doc.uploadTime).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                    // 处理状态显示
                    const statusText = doc.processed ? '已完成' : '处理中';
                    const statusClass = doc.processed ? 'badge-success' : 'badge-warning';

                    html += `
                        <tr>
                            <td title="${doc.originalName}">${doc.originalName}</td>
                            <td title="${doc.courseDisplay || doc.courseName + ' (' + doc.courseCode + ')'}">${doc.courseDisplay || doc.courseName + ' (' + doc.courseCode + ')'}</td>
                            <td title="${uploadTime}">${uploadTime}</td>
                            <td title="${doc.chunksCount || 0} 个">${doc.chunksCount || 0} 个</td>
                            <td title="${statusText}"><span class="badge ${statusClass}">${statusText}</span></td>
                            <td>
                                <button class="btn btn-sm btn-primary" onclick="downloadDocument(${doc.id})" title="下载">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id}, '${doc.originalName}')" title="删除">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; padding: 24px; color: #7f8c8d;">
                            <i class="fas fa-file-alt" style="font-size: 32px; margin-bottom: 12px; color: #bdc3c7;"></i>
                            <br>暂无最近上传的文档
                            <br>上传文档后会在这里显示
                        </td>
                    </tr>
                `;
            }
        } else {
            console.error('获取最近文档失败:', response.statusText);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 24px; color: #e74c3c;">
                        获取最近文档失败，请稍后重试
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('获取最近文档出错:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 24px; color: #e74c3c;">
                    获取最近文档失败，请稍后重试
                </td>
            </tr>
        `;
    }
}

// 显示知识库上传模态框
async function showKnowledgeUploadModal() {
    const modal = document.getElementById('knowledge-upload-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.add('show');

    // 确保课程数据已加载
    if (currentCourses.length === 0) {
        try {
            await loadCourseList();
        } catch (error) {
            console.warn('加载课程列表失败，将显示空列表:', error);
        }
    }

    // 加载课程选项
    updateKnowledgeUploadCourseSelects();

    // 重置表单
    resetKnowledgeUploadForm();
}

// 隐藏知识库上传模态框
function hideKnowledgeUploadModal() {
    const modal = document.getElementById('knowledge-upload-modal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 设置知识库上传模态框事件
function setupKnowledgeUploadModal() {
    // 关闭按钮
    const closeBtn = document.getElementById('close-knowledge-upload-modal');
    const cancelSingleBtn = document.getElementById('cancel-knowledge-upload');
    const cancelBatchBtn = document.getElementById('cancel-batch-upload');

    if (closeBtn) {
        closeBtn.removeEventListener('click', hideKnowledgeUploadModal);
        closeBtn.addEventListener('click', hideKnowledgeUploadModal);
    }
    if (cancelSingleBtn) {
        cancelSingleBtn.removeEventListener('click', hideKnowledgeUploadModal);
        cancelSingleBtn.addEventListener('click', hideKnowledgeUploadModal);
    }
    if (cancelBatchBtn) {
        cancelBatchBtn.removeEventListener('click', hideKnowledgeUploadModal);
        cancelBatchBtn.addEventListener('click', hideKnowledgeUploadModal);
    }

    // 标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        // 移除现有的事件监听器
        btn.removeEventListener('click', btn._tabClickHandler);

        // 创建新的事件处理函数
        btn._tabClickHandler = function() {
            const tabId = this.dataset.tab;
            switchKnowledgeTab(tabId);
        };

        // 添加新的事件监听器
        btn.addEventListener('click', btn._tabClickHandler);
    });

    // 文件上传区域点击
    const singleUploadArea = document.getElementById('knowledge-file-upload-area');
    const batchUploadArea = document.getElementById('batch-file-upload-area');
    const singleFileInput = document.getElementById('knowledge-file-input');
    const batchFileInput = document.getElementById('batch-file-input');

    if (singleUploadArea && singleFileInput) {
        // 移除现有的事件监听器
        singleUploadArea.removeEventListener('click', singleUploadArea._clickHandler);
        singleFileInput.removeEventListener('change', handleSingleFileSelect);

        // 创建新的点击处理函数
        singleUploadArea._clickHandler = () => singleFileInput.click();

        // 添加新的事件监听器
        singleUploadArea.addEventListener('click', singleUploadArea._clickHandler);
        singleFileInput.addEventListener('change', handleSingleFileSelect);
    }

    if (batchUploadArea && batchFileInput) {
        // 移除现有的事件监听器
        batchUploadArea.removeEventListener('click', batchUploadArea._clickHandler);
        batchFileInput.removeEventListener('change', handleBatchFileSelect);

        // 创建新的点击处理函数
        batchUploadArea._clickHandler = () => batchFileInput.click();

        // 添加新的事件监听器
        batchUploadArea.addEventListener('click', batchUploadArea._clickHandler);
        batchFileInput.addEventListener('change', handleBatchFileSelect);
    }

    // 表单提交
    const singleForm = document.getElementById('knowledge-single-upload-form');
    const batchForm = document.getElementById('knowledge-batch-upload-form');

    if (singleForm) {
        singleForm.removeEventListener('submit', handleSingleUpload);
        singleForm.addEventListener('submit', handleSingleUpload);
    }
    if (batchForm) {
        batchForm.removeEventListener('submit', handleBatchUpload);
        batchForm.addEventListener('submit', handleBatchUpload);
    }
}

// 切换知识库上传标签页
function switchKnowledgeTab(tabId) {
    // 更新按钮状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active');
        }
    });

    // 显示对应内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
}

// 更新知识库上传课程选择器
function updateKnowledgeUploadCourseSelects() {
    console.log('更新知识库上传课程选择器...');
    const singleSelect = document.getElementById('knowledge-course-select');
    const batchSelect = document.getElementById('batch-course-select');

    [singleSelect, batchSelect].forEach(select => {
        if (!select) {
            console.warn('课程选择器元素未找到:', select);
            return;
        }

        select.innerHTML = '<option value="">请选择课程</option>';

        // 优先使用全局课程数据，确保数据可用性
        const coursesToUse = currentCourses.length > 0 ? currentCourses : knowledgeCurrentCourses;
        console.log('可用的课程数据:', coursesToUse);

        if (coursesToUse.length === 0) {
            console.warn('没有可用的课程数据');
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '暂无课程数据';
            option.disabled = true;
            select.appendChild(option);
            return;
        }

        coursesToUse.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.name} (${course.courseCode || course.code || 'SE-0000'})`;
            select.appendChild(option);
            console.log('添加课程选项:', course.name, course.id);
        });
    });
}

// 重置知识库上传表单
function resetKnowledgeUploadForm() {
    // 切换到单文档上传标签
    switchKnowledgeTab('single-upload');

    // 清空表单
    const singleForm = document.getElementById('knowledge-single-upload-form');
    const batchForm = document.getElementById('knowledge-batch-upload-form');

    if (singleForm) singleForm.reset();
    if (batchForm) batchForm.reset();

    // 隐藏文件预览
    const singlePreview = document.getElementById('single-file-preview');
    const batchPreview = document.getElementById('batch-files-preview');
    const processing = document.getElementById('knowledge-processing');

    if (singlePreview) singlePreview.style.display = 'none';
    if (batchPreview) batchPreview.style.display = 'none';
    if (processing) processing.style.display = 'none';
}

// 处理单文件选择
function handleSingleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['txt', 'doc', 'docx', 'pdf', 'html', 'htm'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        showNotification('不支持的文件类型。支持的格式：TXT、DOC、DOCX、PDF、HTML', 'error');
        event.target.value = '';
        return;
    }

    // 验证文件大小（50MB限制）
    if (file.size > 50 * 1024 * 1024) {
        showNotification('文件大小不能超过50MB', 'error');
        event.target.value = '';
        return;
    }

    // 显示文件预览
    const preview = document.getElementById('single-file-preview');
    const fileName = document.getElementById('single-file-name');
    const fileSize = document.getElementById('single-file-size');

    if (preview && fileName && fileSize) {
        fileName.textContent = file.name;
        fileSize.textContent = `(${formatFileSize(file.size)})`;
        preview.style.display = 'block';
    }
}

// 处理批量文件选择
function handleBatchFileSelect(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // 验证文件
    const allowedTypes = ['txt', 'doc', 'docx', 'pdf', 'html', 'htm'];
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (allowedTypes.includes(fileExtension) && file.size <= 50 * 1024 * 1024) {
            validFiles.push(file);
        } else {
            invalidFiles.push(file.name);
        }
    });

    if (invalidFiles.length > 0) {
        showNotification(`以下文件不符合要求：${invalidFiles.join(', ')}`, 'warning');
    }

    if (validFiles.length === 0) {
        event.target.value = '';
        return;
    }

    // 显示文件列表
    const preview = document.getElementById('batch-files-preview');
    const fileCount = document.getElementById('batch-file-count');
    const fileList = document.getElementById('batch-file-list');

    if (preview && fileCount && fileList) {
        fileCount.textContent = validFiles.length;

        let listHtml = '';
        validFiles.forEach((file, index) => {
            listHtml += `
                <div class="file-item" style="display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid #e9ecef;">
                    <i class="fas fa-file-alt" style="color: #007bff;"></i>
                    <span style="flex: 1;">${file.name}</span>
                    <span style="color: #6c757d; font-size: 12px;">(${formatFileSize(file.size)})</span>
                    <button class="btn btn-sm btn-danger" onclick="removeBatchFile(${index})" style="margin-left: 8px;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });

        fileList.innerHTML = listHtml;
        preview.style.display = 'block';
    }
}

// 移除单个文件
function removeSingleFile() {
    const fileInput = document.getElementById('knowledge-file-input');
    const preview = document.getElementById('single-file-preview');

    if (fileInput) fileInput.value = '';
    if (preview) preview.style.display = 'none';
}

// 处理单文档上传
async function handleSingleUpload(event) {
    event.preventDefault();

    if (isProcessingFiles) {
        showNotification('正在处理其他文件，请稍候...', 'warning');
        return;
    }

    const formData = new FormData();
    const courseId = document.getElementById('knowledge-course-select').value;
    const file = document.getElementById('knowledge-file-input').files[0];
    const description = document.getElementById('knowledge-description').value;

    if (!courseId) {
        showNotification('请选择课程', 'warning');
        return;
    }

    if (!file) {
        showNotification('请选择文件', 'warning');
        return;
    }

    formData.append('courseId', courseId);
    formData.append('file', file);
    if (description) {
        formData.append('description', description);
    }

    try {
        isProcessingFiles = true;
        showKnowledgeProcessing('单文档上传');

        const response = await fetch('/api/teacher/knowledge/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification('文档上传并处理成功！', 'success');
            hideKnowledgeUploadModal();
            refreshKnowledgeData();
        } else {
            showNotification(result.message || '文档处理失败', 'error');
        }

    } catch (error) {
        console.error('上传失败:', error);
        showNotification('上传失败，请重试', 'error');
    } finally {
        isProcessingFiles = false;
        hideKnowledgeProcessing();
    }
}

// 处理批量上传
async function handleBatchUpload(event) {
    event.preventDefault();

    if (isProcessingFiles) {
        showNotification('正在处理其他文件，请稍候...', 'warning');
        return;
    }

    const formData = new FormData();
    const courseId = document.getElementById('batch-course-select').value;
    const files = document.getElementById('batch-file-input').files;

    if (!courseId) {
        showNotification('请选择课程', 'warning');
        return;
    }

    if (!files.length) {
        showNotification('请选择文件', 'warning');
        return;
    }

    formData.append('courseId', courseId);
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });

    try {
        isProcessingFiles = true;
        showKnowledgeProcessing('批量上传');

        const response = await fetch('/api/teacher/knowledge/batch-upload', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showNotification('批量上传完成！', 'success');
            hideKnowledgeUploadModal();
            refreshKnowledgeData();
        } else {
            showNotification(result.message || '批量上传失败', 'error');
        }

    } catch (error) {
        console.error('批量上传失败:', error);
        showNotification('批量上传失败，请重试', 'error');
    } finally {
        isProcessingFiles = false;
        hideKnowledgeProcessing();
    }
}

// 显示知识库处理进度
function showKnowledgeProcessing(type) {
    // 隐藏表单内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    // 显示处理进度
    const processing = document.getElementById('knowledge-processing');
    if (processing) {
        processing.style.display = 'block';

        // 更新处理状态
        const status = document.getElementById('processing-status');
        if (status) {
            status.textContent = `正在进行${type}，请稍候...`;
        }

        // 模拟进度更新
        simulateProcessingProgress();
    }
}

// 隐藏知识库处理进度
function hideKnowledgeProcessing() {
    const processing = document.getElementById('knowledge-processing');
    if (processing) {
        processing.style.display = 'none';
    }

    // 显示表单内容
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.classList.contains('active')) {
            content.style.display = 'block';
        }
    });
}

// 模拟处理进度
function simulateProcessingProgress() {
    const progressBar = document.getElementById('processing-progress');
    const stepElement = document.getElementById('processing-step');
    const infoElement = document.getElementById('processing-info');

    if (!progressBar || !stepElement || !infoElement) return;

    const steps = [
        { progress: 25, step: '步骤 1/4: 文档上传', info: '正在上传文档到服务器...' },
        { progress: 50, step: '步骤 2/4: 文本提取', info: '正在提取文档内容...' },
        { progress: 75, step: '步骤 3/4: 智能分块', info: '正在进行智能文本分块...' },
        { progress: 100, step: '步骤 4/4: 向量化存储', info: '正在生成向量并存储到知识库...' }
    ];

    let currentStep = 0;

    const updateStep = () => {
        if (currentStep >= steps.length || !isProcessingFiles) return;

        const step = steps[currentStep];
        progressBar.style.width = step.progress + '%';
        stepElement.textContent = step.step;
        infoElement.textContent = step.info;

        currentStep++;

        if (currentStep < steps.length) {
            setTimeout(updateStep, 1500);
        }
    };

    updateStep();
}



// 删除知识库
async function deleteKnowledgeBase(courseId, courseName) {
    const confirmed = await showConfirmDialog(
        '确认删除知识库',
        `确定要删除课程"${courseName}"的所有知识库数据吗？\n\n此操作将永久删除：\n• 所有上传的文档\n• 文本分块数据\n• 向量数据\n\n此操作无法撤销！`,
        '确认删除'
    );

    if (!confirmed) return;

    try {
        showLoading('正在删除知识库...');

        const response = await fetch(`/api/teacher/knowledge/${courseId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        hideLoading();

        if (result.success) {
            showNotification('知识库删除成功', 'success');
            refreshKnowledgeData();
        } else {
            showNotification(result.message || '删除失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('删除知识库失败:', error);
        showNotification('删除知识库失败，请重试', 'error');
    }
}

// 刷新知识库数据
async function refreshKnowledgeData() {
    await loadKnowledgeData();
    showNotification('知识库数据已刷新', 'success');
}

// 过滤知识库（按课程）
function filterKnowledgeByCourse() {
    const selectedCourseId = document.getElementById('knowledge-course-filter').value;

    if (!selectedCourseId) {
        // 显示所有课程
        updateKnowledgeList();
        return;
    }

    // 只显示选中的课程
    const selectedCourse = knowledgeCurrentCourses.find(course => course.id == selectedCourseId);
    if (selectedCourse) {
        const originalCourses = knowledgeCurrentCourses;
        knowledgeCurrentCourses = [selectedCourse];
        updateKnowledgeList();
        knowledgeCurrentCourses = originalCourses;
    }
}

// 搜索知识库
function searchKnowledge() {
    const query = document.getElementById('knowledge-search').value.toLowerCase().trim();

    if (!query) {
        updateKnowledgeList();
        return;
    }

    // 简单的客户端搜索
    const filteredCourses = knowledgeCurrentCourses.filter(course =>
        course.name.toLowerCase().includes(query) ||
        course.courseCode.toLowerCase().includes(query)
    );

    const originalCourses = knowledgeCurrentCourses;
    knowledgeCurrentCourses = filteredCourses;
    updateKnowledgeList();
    knowledgeCurrentCourses = originalCourses;
}

// 下载文档
function downloadDocument(documentId) {
    if (!documentId) {
        showNotification('文档ID无效', 'error');
        return;
    }

    // 直接打开下载链接
    window.open(`/api/teacher/knowledge/document/${documentId}/download`, '_blank');
}

// 删除文档
async function deleteDocument(documentId, fileName) {
    if (!documentId) {
        showNotification('文档ID无效', 'error');
        return;
    }

    // 确认删除
    const confirmed = await showConfirmDialog(
        '删除文档',
        `确定要删除文档"${fileName}"吗？\n删除后将无法恢复，同时会清除相关的知识库数据。`,
        '删除'
    );

    if (!confirmed) {
        return;
    }

    try {
        showLoading('正在删除文档...');

        const response = await fetch(`/api/teacher/knowledge/document/${documentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('文档删除成功', 'success');
            // 刷新文档列表
            await updateRecentDocumentsTable();
            // 刷新知识库数据
            await refreshKnowledgeData();
        } else {
            showNotification(result.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除文档失败:', error);
        showNotification('删除失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

// 显示所有文档
async function showAllDocuments() {
    try {
        showLoading('正在加载所有文档...');

        const response = await fetch('/api/teacher/knowledge/all-documents', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showAllDocumentsModal(result.data);
            } else {
                showNotification(result.message || '获取文档失败', 'error');
            }
        } else {
            showNotification('获取文档失败，请重试', 'error');
        }
    } catch (error) {
        console.error('获取所有文档失败:', error);
        showNotification('获取文档失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

// 显示所有文档模态框
function showAllDocumentsModal(documents) {
    // 保存原始数据用于搜索和筛选
    window.allDocumentsData = documents;

    // 创建模态框HTML
    const modalHtml = `
        <div id="all-documents-modal" class="course-modal-overlay">
            <div class="course-modal-container" style="max-width: 1200px; width: 95%; height: 80vh; display: flex; flex-direction: column;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h3>所有知识库文档</h3>
                    </div>
                    <button id="close-all-documents-modal" class="modal-close-btn" onclick="hideAllDocumentsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <!-- 搜索和筛选区域 -->
                    <div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
                        <div style="display: flex; gap: 16px; align-items: end; flex-wrap: wrap;">
                            <div class="course-form-group" style="flex: 1; min-width: 200px; margin-bottom: 0;">
                                <label class="course-form-label" style="margin-bottom: 4px;">
                                    <i class="fas fa-search"></i>
                                    搜索文档名称
                                </label>
                                <input type="text" id="document-search-input" class="course-form-input" placeholder="输入文档名称进行搜索..." onkeyup="filterAllDocuments()">
                            </div>
                            <div class="course-form-group" style="flex: 0 0 180px; margin-bottom: 0;">
                                <label class="course-form-label" style="margin-bottom: 4px;">
                                    <i class="fas fa-filter"></i>
                                    按课程筛选
                                </label>
                                <select id="document-course-filter" class="course-form-input" onchange="filterAllDocuments()">
                                    <option value="">所有课程</option>
                                </select>
                            </div>
                            <div class="course-form-group" style="flex: 0 0 120px; margin-bottom: 0;">
                                <label class="course-form-label" style="margin-bottom: 4px;">
                                    <i class="fas fa-tasks"></i>
                                    状态筛选
                                </label>
                                <select id="document-status-filter" class="course-form-input" onchange="filterAllDocuments()">
                                    <option value="">所有状态</option>
                                    <option value="processed">已完成</option>
                                    <option value="processing">处理中</option>
                                </select>
                            </div>

                        </div>
                        <div style="margin-top: 12px; font-size: 14px; color: #6c757d; display: flex; justify-content: between; align-items: center;">
                            <span>共找到 <span id="documents-count">${documents.length}</span> 个文档</span>
                        </div>
                    </div>

                    <!-- 表格区域 -->
                    <div style="flex: 1; overflow: hidden; border: 1px solid #e9ecef; border-radius: 8px;">
                        <div style="height: 100%; overflow-y: auto;">
                            <table class="table" style="margin-bottom: 0;">
                                <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                                    <tr>
                                        <th style="width: 25%;">文档名称</th>
                                        <th style="width: 25%;">课程</th>
                                        <th style="width: 15%;">上传时间</th>
                                        <th style="width: 10%;">知识块数</th>
                                        <th style="width: 10%;">处理状态</th>
                                        <th style="width: 15%;">操作</th>
                                    </tr>
                                </thead>
                                <tbody id="all-documents-table-body">
                                    ${generateAllDocumentsTableRows(documents)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    `;

    // 移除已存在的模态框
    const existingModal = document.getElementById('all-documents-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 添加新模态框
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 显示模态框
    setTimeout(() => {
        const modal = document.getElementById('all-documents-modal');
        if (modal) {
            modal.style.display = 'flex';
            modal.classList.add('show');

            // 添加键盘事件监听
            document.addEventListener('keydown', handleAllDocumentsModalKeydown);

            // 添加背景点击事件
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    hideAllDocumentsModal();
                }
            });
        }
    }, 10);

    // 初始化课程筛选选项
    initializeDocumentCourseFilter(documents);
}

// 生成所有文档表格行
function generateAllDocumentsTableRows(documents) {
    if (!documents || documents.length === 0) {
        return `
            <tr>
                <td colspan="6" style="text-align: center; padding: 24px; color: #7f8c8d;">
                    <i class="fas fa-file-alt" style="font-size: 32px; margin-bottom: 12px; color: #bdc3c7;"></i>
                    <br>暂无文档数据
                </td>
            </tr>
        `;
    }

    return documents.map(doc => {
        // 格式化时间到分钟
        const uploadTime = new Date(doc.uploadTime).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 处理状态显示
        const statusText = doc.processed ? '已完成' : '处理中';
        const statusClass = doc.processed ? 'badge-success' : 'badge-warning';

        return `
            <tr>
                <td title="${doc.originalName}">${doc.originalName}</td>
                <td title="${doc.courseDisplay || doc.courseName + ' (' + doc.courseCode + ')'}">${doc.courseDisplay || doc.courseName + ' (' + doc.courseCode + ')'}</td>
                <td title="${uploadTime}">${uploadTime}</td>
                <td title="${doc.chunksCount || 0} 个">${doc.chunksCount || 0} 个</td>
                <td title="${statusText}"><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="downloadDocument(${doc.id})" title="下载">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDocument(${doc.id}, '${doc.originalName}')" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// 隐藏所有文档模态框
function hideAllDocumentsModal() {
    const modal = document.getElementById('all-documents-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);

        // 移除键盘事件监听
        document.removeEventListener('keydown', handleAllDocumentsModalKeydown);
    }
}

// 处理所有文档模态框的键盘事件
function handleAllDocumentsModalKeydown(e) {
    if (e.key === 'Escape') {
        hideAllDocumentsModal();
    }
}

// 初始化文档课程筛选器
function initializeDocumentCourseFilter(documents) {
    const courseFilter = document.getElementById('document-course-filter');
    if (!courseFilter || !documents) return;

    // 获取唯一的课程列表
    const courses = new Set();
    documents.forEach(doc => {
        const courseDisplay = doc.courseDisplay || `${doc.courseName} (${doc.courseCode})`;
        courses.add(courseDisplay);
    });

    // 清空并重新填充选项
    courseFilter.innerHTML = '<option value="">所有课程</option>';
    [...courses].sort().forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseFilter.appendChild(option);
    });
}

// 筛选所有文档
function filterAllDocuments() {
    const searchInput = document.getElementById('document-search-input');
    const courseFilter = document.getElementById('document-course-filter');
    const statusFilter = document.getElementById('document-status-filter');
    const tableBody = document.getElementById('all-documents-table-body');
    const countElement = document.getElementById('documents-count');

    if (!searchInput || !courseFilter || !statusFilter || !tableBody || !window.allDocumentsData) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCourse = courseFilter.value;
    const selectedStatus = statusFilter.value;

    // 筛选文档
    const filteredDocuments = window.allDocumentsData.filter(doc => {
        // 文档名称搜索
        const nameMatch = !searchTerm || doc.originalName.toLowerCase().includes(searchTerm);

        // 课程筛选
        const courseDisplay = doc.courseDisplay || `${doc.courseName} (${doc.courseCode})`;
        const courseMatch = !selectedCourse || courseDisplay === selectedCourse;

        // 状态筛选
        let statusMatch = true;
        if (selectedStatus) {
            if (selectedStatus === 'processed') {
                statusMatch = doc.processed === true;
            } else if (selectedStatus === 'processing') {
                statusMatch = doc.processed === false;
            }
        }

        return nameMatch && courseMatch && statusMatch;
    });

    // 更新表格内容
    tableBody.innerHTML = generateAllDocumentsTableRows(filteredDocuments);

    // 更新计数
    if (countElement) {
        countElement.textContent = filteredDocuments.length;
    }
}

// 清除所有文档筛选器
function clearAllDocumentFilters() {
    const searchInput = document.getElementById('document-search-input');
    const courseFilter = document.getElementById('document-course-filter');
    const statusFilter = document.getElementById('document-status-filter');

    if (searchInput) searchInput.value = '';
    if (courseFilter) courseFilter.value = '';
    if (statusFilter) statusFilter.value = '';

    // 重新筛选
    filterAllDocuments();
}

// 显示定时发布模态框
function showScheduleModal() {
    // 获取当前考试列表中的未发布试卷
    showScheduleExamModal();
}

// 显示定时发布选择试卷模态框
async function showScheduleExamModal() {
    try {
        const userId = await getUserId();
        const examList = await TeacherAPI.getExamList(userId, 'DRAFT');

        if (!examList.success || examList.data.length === 0) {
            showNotification('没有可以定时发布的试卷', 'warning');
            return;
        }

        // 创建试卷选择模态框
        const modal = document.createElement('div');
        modal.className = 'course-modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: rgba(52, 152, 219, 0.1);">
                            <i class="fas fa-calendar-plus" style="color: #3498db;"></i>
                        </div>
                        <h3>选择要定时发布的试卷</h3>
                    </div>
                    <button id="close-schedule-modal" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="exam-selection-list" style="max-height: 400px; overflow-y: auto;">
                        ${examList.data.map(exam => `
                            <div class="exam-item" style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease;"
                                 onclick="selectExamForSchedule(${exam.id}, '${exam.title}', '${exam.courseName}')">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <h4 style="margin: 0 0 5px 0; color: #2c3e50;">${exam.title}</h4>
                                        <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
                                            <i class="fas fa-book"></i> ${exam.courseName} |
                                            <i class="fas fa-clock"></i> ${exam.duration || 90}分钟 |
                                            <i class="fas fa-star"></i> ${exam.totalScore || 100}分
                                        </p>
                                    </div>
                                    <div>
                                        <span class="badge badge-secondary">草稿</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="course-modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideScheduleModal()">
                        <i class="fas fa-times"></i> 取消
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置关闭事件
        modal.querySelector('#close-schedule-modal').onclick = () => hideScheduleModal();
        modal.onclick = (e) => {
            if (e.target === modal) hideScheduleModal();
        };

        // 样式处理
        modal.querySelectorAll('.exam-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = '#f8f9fa';
                item.style.borderColor = '#3498db';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = '';
                item.style.borderColor = '#e9ecef';
            });
        });

        window.currentScheduleModal = modal;

    } catch (error) {
        console.error('加载试卷列表失败:', error);
        showNotification('加载试卷列表失败', 'error');
    }
}

// 选择试卷进行定时发布
function selectExamForSchedule(examId, examTitle, courseName) {
    hideScheduleModal();
    showScheduleTimeModal(examId, examTitle, courseName);
}

// 显示定时发布时间设置模态框
function showScheduleTimeModal(examId, examTitle, courseName) {
    const modal = document.createElement('div');
    modal.className = 'course-modal-overlay';
    modal.style.display = 'flex';

    // 获取当前时间，并设置为一小时后
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const defaultStartTime = oneHourLater.toISOString().slice(0, 16);

    modal.innerHTML = `
        <div class="course-modal-container" style="max-width: 500px;">
            <div class="course-modal-header">
                <div class="modal-title-section">
                    <div class="modal-icon" style="background: rgba(46, 204, 113, 0.1);">
                        <i class="fas fa-clock" style="color: #2ecc71;"></i>
                    </div>
                    <h3>设置定时发布</h3>
                </div>
                <button id="close-schedule-time-modal" class="modal-close-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="course-modal-body">
                <div class="exam-info-card" style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div class="exam-info-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span class="exam-info-label" style="color: #7f8c8d;">课程：</span>
                        <span style="font-weight: 500;">${courseName}</span>
                    </div>
                    <div class="exam-info-item" style="display: flex; justify-content: space-between;">
                        <span class="exam-info-label" style="color: #7f8c8d;">试卷：</span>
                        <span style="font-weight: 500;">${examTitle}</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="course-form-label" style="display: block; margin-bottom: 8px; font-weight: 500;">
                        <i class="fas fa-calendar-alt"></i> 考试开始时间：
                    </label>
                    <input type="datetime-local" id="schedule-start-time" class="course-form-input"
                           style="width: 100%;" value="${defaultStartTime}" min="${now.toISOString().slice(0, 16)}">
                    <small style="color: #7f8c8d; display: block; margin-top: 5px;">
                        <i class="fas fa-info-circle"></i> 试卷将在指定时间自动发布给学生
                    </small>
                </div>

                <div class="form-group" style="margin-top: 20px;">
                    <label class="course-form-label" style="display: block; margin-bottom: 8px; font-weight: 500;">
                        <i class="fas fa-clock"></i> 考试持续时间：
                    </label>
                    <select id="schedule-duration" class="course-form-input" style="width: 100%;">
                        <option value="60">60分钟</option>
                        <option value="90" selected>90分钟</option>
                        <option value="120">120分钟</option>
                        <option value="150">150分钟</option>
                        <option value="180">180分钟</option>
                        <option value="custom">自定义</option>
                    </select>
                </div>

                <div class="form-group" id="custom-duration-group" style="margin-top: 15px; display: none;">
                    <label class="course-form-label" style="display: block; margin-bottom: 8px; font-weight: 500;">
                        自定义时长（分钟）：
                    </label>
                    <input type="number" id="custom-duration" class="course-form-input"
                           style="width: 100%;" min="30" max="300" value="90">
                </div>

                <div class="alert alert-info" style="background: #e8f4f8; color: #0c5460; padding: 12px; border-radius: 6px; margin-top: 20px;">
                    <i class="fas fa-lightbulb"></i>
                    <strong>温馨提示：</strong>试卷将在指定时间自动发布，学生可以立即开始考试。请确保时间设置正确。
                </div>
            </div>

            <div class="course-modal-footer">
                <button type="button" class="btn btn-secondary" onclick="hideScheduleTimeModal()">
                    <i class="fas fa-times"></i> 取消
                </button>
                <button type="button" class="btn btn-success" onclick="confirmSchedulePublish(${examId})">
                    <i class="fas fa-calendar-check"></i> 确认定时发布
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 设置事件监听器
    modal.querySelector('#close-schedule-time-modal').onclick = () => hideScheduleTimeModal();
    modal.onclick = (e) => {
        if (e.target === modal) hideScheduleTimeModal();
    };

    // 处理自定义时长选择
    modal.querySelector('#schedule-duration').onchange = function() {
        const customGroup = modal.querySelector('#custom-duration-group');
        if (this.value === 'custom') {
            customGroup.style.display = 'block';
        } else {
            customGroup.style.display = 'none';
        }
    };

    window.currentScheduleTimeModal = modal;
}

// 确认定时发布
async function confirmSchedulePublish(examId) {
    try {
        const startTimeInput = document.getElementById('schedule-start-time');
        const durationSelect = document.getElementById('schedule-duration');
        const customDurationInput = document.getElementById('custom-duration');

        const startTime = startTimeInput.value;
        if (!startTime) {
            showNotification('请选择考试开始时间', 'warning');
            return;
        }

        // 验证时间不能是过去的时间
        const selectedTime = new Date(startTime);
        const now = new Date();
        if (selectedTime <= now) {
            showNotification('考试开始时间不能早于当前时间', 'warning');
            return;
        }

        // 获取考试时长
        let duration = parseInt(durationSelect.value);
        if (durationSelect.value === 'custom') {
            duration = parseInt(customDurationInput.value);
            if (!duration || duration < 30 || duration > 300) {
                showNotification('自定义时长必须在30-300分钟之间', 'warning');
                return;
            }
        }

        // 计算结束时间
        const endTime = new Date(selectedTime.getTime() + duration * 60 * 1000);

        const confirmed = await showConfirmDialog(
            '确认定时发布',
            `试卷将在 ${formatDateTime(selectedTime)} 自动发布，并在 ${formatDateTime(endTime)} 结束。\n\n确定要设置定时发布吗？`,
            '确认发布'
        );

        if (!confirmed) return;

        showLoading('正在设置定时发布...');

        const response = await TeacherAPI.publishExam(examId, {
            startTime: startTime,
            duration: duration
        });

        hideLoading();

        if (response.success) {
            showNotification('定时发布设置成功！试卷将在指定时间自动发布', 'success');
            hideScheduleTimeModal();
            // 刷新试卷列表
            await loadExamList();
        } else {
            showNotification('定时发布设置失败：' + response.message, 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('定时发布设置失败:', error);
        showNotification('定时发布设置失败，请重试', 'error');
    }
}

// 隐藏定时发布模态框
function hideScheduleModal() {
    if (window.currentScheduleModal) {
        document.body.removeChild(window.currentScheduleModal);
        window.currentScheduleModal = null;
    }
}

// 隐藏定时发布时间设置模态框
function hideScheduleTimeModal() {
    if (window.currentScheduleTimeModal) {
        document.body.removeChild(window.currentScheduleTimeModal);
        window.currentScheduleTimeModal = null;
    }
}

// 取消定时发布
async function cancelScheduledPublish(examId) {
    try {
        const confirmed = await showConfirmDialog(
            '取消定时发布',
            '确定要取消该试卷的定时发布设置吗？\n\n取消后试卷将回到草稿状态，您可以重新设置发布时间。',
            '确认取消'
        );

        if (!confirmed) return;

        showLoading('正在取消定时发布...');

        // 调用API取消定时发布
        const response = await TeacherAPI.publishExam(examId, {
            cancelSchedule: true
        });

        hideLoading();

        if (response.success) {
            showNotification('定时发布已取消', 'success');
            // 刷新试卷列表
            await loadExamList();
        } else {
            showNotification('取消定时发布失败：' + response.message, 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('取消定时发布失败:', error);
        showNotification('取消定时发布失败，请重试', 'error');
    }
}



async function autoGradeAll() {
    try {
        // 获取选中的试卷
        const checkedBoxes = document.querySelectorAll('.grade-checkbox:checked');
        const visibleCheckedBoxes = Array.from(checkedBoxes).filter(checkbox =>
            checkbox.closest('tr').style.display !== 'none'
        );

        if (visibleCheckedBoxes.length > 0) {
            // 批量处理选中的试卷
            const confirmed = await showConfirmDialog(
                'DeepSeek智能评分',
                `确定要使用DeepSeek对选中的 ${visibleCheckedBoxes.length} 份试卷进行智能评分吗？\n\n智能评分将：\n• 分析学生答案的完整性和准确性\n• 提供详细的评分理由和建议\n• 自动计算合理的得分\n• 生成个性化反馈`,
                '开始智能评分'
            );
            if (!confirmed) return;

            showLoading(`正在使用DeepSeek批量智能评分 ${visibleCheckedBoxes.length} 份试卷...`);

            let successCount = 0;
            let errorCount = 0;

            for (const checkbox of visibleCheckedBoxes) {
                try {
                    const resultId = checkbox.value;
                    const response = await fetch('/api/teacher/grades/ai-grade-exam', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ resultId: resultId })
                    });

                    const result = await response.json();
                    if (result.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`AI批改试卷${checkbox.value}失败:`, error);
                }
            }

            hideLoading();

            if (successCount > 0) {
                showNotification(`批量AI评分完成，成功处理 ${successCount} 份试卷${errorCount > 0 ? `，失败 ${errorCount} 份` : ''}`, 'success');
                loadGradeList(); // 刷新列表
            } else {
                showNotification('批量AI评分失败，请重试', 'error');
            }

        } else {
            // 原有逻辑：如果没有选中试卷，询问考试批改
        const examFilter = document.getElementById('grade-exam-filter');
        const selectedExamId = examFilter?.value;

        if (!selectedExamId) {
                showNotification('请先选择要批改的考试或勾选要批改的试卷', 'warning');
            return;
        }

        const confirmed = await showConfirmDialog(
            'DeepSeek智能评分',
            '确定要使用DeepSeek对所选考试的非选择题进行智能评分吗？\n\n智能评分将：\n• 分析学生答案的完整性和准确性\n• 提供详细的评分理由和建议\n• 自动计算合理的得分\n• 生成个性化反馈',
            '开始智能评分'
        );
        if (!confirmed) return;

        showLoading('正在使用DeepSeek进行智能评分...');
        const response = await TeacherAPI.batchAutoGrade(selectedExamId);
        hideLoading();

        if (response.success) {
            showNotification(response.message, 'success');
            loadGradeList(); // 刷新列表
        } else {
            showNotification('批改失败：' + response.message, 'error');
            }
        }
    } catch (error) {
        hideLoading();
        console.error('批量批改失败:', error);
        showNotification('批改失败，请重试', 'error');
    }
}

async function exportAnalysisReport() {
    try {
        const examSelect = document.getElementById('analysis-exam-select');
        const selectedExamId = examSelect?.value;

        if (!selectedExamId) {
            showNotification('请先选择要导出分析报告的考试', 'warning');
            return;
        }

        // 获取考试名称
        const examName = examSelect.options[examSelect.selectedIndex].text;

        showLoading('正在生成分析报告...');

        // 调用API导出报告
        const response = await fetch(`/api/teacher/analysis/${selectedExamId}/export`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`导出失败: ${response.status}`);
        }

        // 获取文件数据
        const blob = await response.blob();

        // 生成文件名
        const timestamp = new Date().toLocaleDateString('zh-CN').replace(/\//g, '');
        const fileName = `成绩分析报告_${examName}_${timestamp}.pdf`;

        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        hideLoading();
        showNotification('分析报告导出成功', 'success');

    } catch (error) {
        hideLoading();
        console.error('导出分析报告失败:', error);
        showNotification('导出失败，请重试', 'error');
    }
}

async function generateImprovements() {
    try {
        const courseId = document.getElementById('improve-course-select').value;

        // 验证输入
        if (!courseId) {
            showNotification('请选择要分析的课程', 'warning');
            return;
        }

        // 检查是否启用了联网搜索
        const webSearchEnabled = document.getElementById('enable-web-search-improve').checked;

        if (webSearchEnabled) {
            // 获取课程名称
            const courseSelect = document.getElementById('improve-course-select');
            const courseName = courseSelect.options[courseSelect.selectedIndex].text;

            // 智能生成搜索查询
            const searchQuery = generateSmartSearchQuery(courseName, '教学改进建议', 'improvement');

            // 显示确认对话框
            const confirmed = await showWebSearchConfirmDialog('教学改进建议', searchQuery);
            if (!confirmed) {
                return;
            }

            // 执行联网搜索生成
            await generateImprovementsWithWebSearch(courseId, courseName, searchQuery);
        } else {
            showLoading('正在分析数据并生成改进建议，请稍候...');

            // 固定使用单个课程分析
            const scope = 'COURSE';
            const response = await TeacherAPI.generateImprovements(scope, courseId);

            hideLoading();

            if (response.success) {
                displayImprovements(response.data.improvements, scope, courseId);
                showNotification('教学改进建议生成成功', 'success');

                // 自动保存报告到数据库
                await autoSaveReportToDatabase();

            } else {
                showNotification(response.message || '生成改进建议失败', 'error');
            }
        }

    } catch (error) {
        hideLoading();
        console.error('生成改进建议失败:', error);
        showNotification('生成改进建议失败，请重试', 'error');
    }
}

function displayImprovements(improvements, scope, courseId) {
    const container = document.getElementById('improvements-content');

    // 获取课程名称的显示文本
    let courseText = '';
    if (courseId) {
        const courseSelect = document.getElementById('improve-course-select');
        const selectedOption = courseSelect.querySelector(`option[value="${courseId}"]`);
        courseText = selectedOption ? selectedOption.textContent : '未知课程';
    }

    // 生成显示内容
    container.innerHTML = `
        <div class="improvements-header" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h6 style="margin: 0; color: #007bff; font-weight: bold;">
                        <i class="fas fa-chart-line"></i> AI智能分析报告
                    </h6>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">
                        分析课程：${courseText || '未选择课程'}
                    </p>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-primary" onclick="copyImprovements()" title="复制内容">
                        <i class="fas fa-copy"></i> 复制
                    </button>
                </div>
            </div>
        </div>

        <div class="improvements-content" style="background: white; padding: 24px; border-radius: 8px; border: 1px solid #e9ecef; line-height: 1.6;">
            ${formatImprovementsContent(improvements)}
        </div>

        <div class="improvements-footer" style="margin-top: 20px; text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <i class="fas fa-info-circle"></i>
                以上建议由AI智能分析生成，请结合实际教学情况参考使用
            </p>
        </div>
    `;

    // 保存当前建议内容，用于导出
    window.currentImprovements = {
        content: improvements,
        scope: scope,
        courseId: courseId,
        scopeText: '单个课程',
        courseText: courseText,
        generatedAt: new Date().toLocaleString()
    };

    // 显示"我的报告"按钮
    showMyReportsButton();
}

function formatImprovementsContent(content) {
    if (!content) return '<p>暂无改进建议</p>';

    // 使用Marked.js进行专业的Markdown解析
    if (typeof marked !== 'undefined') {
        try {
            // 配置Marked.js选项，专门针对教学改进建议优化
            marked.setOptions({
                breaks: true,        // 支持单行换行
                gfm: true,          // GitHub风格Markdown
                sanitize: false,    // 信任内容
                smartLists: true,   // 智能列表处理
                smartypants: false, // 保持原始引号
                headerIds: false,   // 不生成header id
                mangle: false       // 不混淆邮箱地址
            });

            // 预处理内容，确保格式正确
            let processedContent = content;

            // 确保表格格式正确（如果有的话）
            processedContent = processedContent.replace(/\|([^|\n]+)\|/g, function(match, content) {
                // 简单的表格格式检查和修复
                return match;
            });

            // 使用Marked.js解析
            let html = marked.parse(processedContent);

            // 后处理：添加专门的样式
            html = html.replace(/<h1>/g, '<h1 style="color: #e74c3c; margin: 32px 0 20px 0; font-size: 24px; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; font-weight: bold;">');
            html = html.replace(/<h2>/g, '<h2 style="color: #2980b9; margin: 28px 0 16px 0; font-size: 22px; border-bottom: 2px solid #3498db; padding-bottom: 8px; font-weight: bold;">');
            html = html.replace(/<h3>/g, '<h3 style="color: #2c3e50; margin: 24px 0 12px 0; font-size: 20px; font-weight: bold;">');
            html = html.replace(/<h4>/g, '<h4 style="color: #34495e; margin: 20px 0 10px 0; font-size: 18px; font-weight: bold;">');
            html = html.replace(/<h5>/g, '<h5 style="color: #7f8c8d; margin: 16px 0 8px 0; font-size: 16px; font-weight: 600;">');
            html = html.replace(/<h6>/g, '<h6 style="color: #95a5a6; margin: 14px 0 6px 0; font-size: 14px; font-weight: 600;">');

            // 段落样式
            html = html.replace(/<p>/g, '<p style="margin: 15px 0; line-height: 1.7; color: #2c3e50;">');

            // 列表样式
            html = html.replace(/<ul>/g, '<ul style="margin: 16px 0; padding-left: 24px; color: #2c3e50;">');
            html = html.replace(/<ol>/g, '<ol style="margin: 16px 0; padding-left: 24px; color: #2c3e50;">');
            html = html.replace(/<li>/g, '<li style="margin: 8px 0; line-height: 1.6;">');

            // 强调样式
            html = html.replace(/<strong>/g, '<strong style="color: #2c3e50; font-weight: 700;">');
            html = html.replace(/<em>/g, '<em style="color: #7f8c8d; font-style: italic;">');

            // 代码样式
            html = html.replace(/<code>/g, '<code style="background: #f1f2f6; color: #e74c3c; padding: 3px 6px; border-radius: 4px; font-family: Monaco, Consolas, monospace; font-size: 13px;">');
            html = html.replace(/<pre>/g, '<pre style="background: #2d3748; color: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; font-family: Monaco, Consolas, monospace; font-size: 13px; line-height: 1.5;">');

            // 引用样式
            html = html.replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid #3498db; margin: 16px 0; padding: 12px 16px; background: #f8f9fa; color: #2c3e50; font-style: italic; border-radius: 0 4px 4px 0;">');

            // 分隔线样式
            html = html.replace(/<hr>/g, '<hr style="border: none; height: 2px; background: linear-gradient(to right, #3498db, transparent); margin: 32px 0;">');

            // 表格样式（如果有的话）
            html = html.replace(/<table>/g, '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">');
            html = html.replace(/<th>/g, '<th style="background: #3498db; color: white; padding: 12px; text-align: left; font-weight: 600;">');
            html = html.replace(/<td>/g, '<td style="padding: 12px; border-bottom: 1px solid #e9ecef; color: #2c3e50;">');
            html = html.replace(/<tr>/g, '<tr style="transition: background-color 0.2s;">');

            // 链接样式
            html = html.replace(/<a href="/g, '<a style="color: #3498db; text-decoration: none; border-bottom: 1px dotted #3498db;" href="');

            return html;

        } catch (error) {
            console.error('Marked.js解析教学改进建议失败:', error);
            // 如果Marked.js解析失败，回退到简单处理
            return formatImprovementsFallback(content);
        }
    } else {
        console.warn('Marked.js未加载，使用简单格式化');
        // 如果Marked.js不可用，使用简单的格式化
        return formatImprovementsFallback(content);
    }
}

// 备用的简单格式化函数
function formatImprovementsFallback(content) {
    let formatted = content;

    // 处理标题
    formatted = formatted.replace(/^# (.*$)/gim, '<h1 style="color: #e74c3c; margin: 32px 0 20px 0; font-size: 24px; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; font-weight: bold;">$1</h1>');
    formatted = formatted.replace(/^## (.*$)/gim, '<h2 style="color: #2980b9; margin: 28px 0 16px 0; font-size: 22px; border-bottom: 2px solid #3498db; padding-bottom: 8px; font-weight: bold;">$1</h2>');
    formatted = formatted.replace(/^### (.*$)/gim, '<h3 style="color: #2c3e50; margin: 24px 0 12px 0; font-size: 20px; font-weight: bold;">$1</h3>');
    formatted = formatted.replace(/^#### (.*$)/gim, '<h4 style="color: #34495e; margin: 20px 0 10px 0; font-size: 18px; font-weight: bold;">$1</h4>');

    // 处理粗体和斜体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #2c3e50; font-weight: 700;">$1</strong>');
    formatted = formatted.replace(/\*(.*?)\*/g, '<em style="color: #7f8c8d; font-style: italic;">$1</em>');

    // 处理代码
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #f1f2f6; color: #e74c3c; padding: 3px 6px; border-radius: 4px; font-family: Monaco, Consolas, monospace; font-size: 13px;">$1</code>');

    // 处理列表
    formatted = formatted.replace(/^- (.*$)/gm, '<li style="margin: 8px 0; line-height: 1.6; color: #2c3e50;">$1</li>');
    formatted = formatted.replace(/^  - (.*$)/gm, '<li style="margin: 5px 0; margin-left: 20px; line-height: 1.6; color: #2c3e50; list-style-type: circle;">$1</li>');
    formatted = formatted.replace(/^(\d+)\. (.*$)/gm, '<li style="margin: 10px 0; line-height: 1.6; color: #2c3e50; list-style-type: decimal;">$2</li>');

    // 将连续的li标签包装在ul或ol中
    formatted = formatted.replace(/(<li[^>]*>.*?<\/li>[\s]*)+/g, function(match) {
        if (match.includes('list-style-type: decimal')) {
            return '<ol style="margin: 16px 0; padding-left: 24px; color: #2c3e50;">' + match + '</ol>';
        } else {
            return '<ul style="margin: 16px 0; padding-left: 24px; color: #2c3e50;">' + match + '</ul>';
        }
    });

    // 处理段落
    formatted = formatted.replace(/\n\n/g, '</p><p style="margin: 15px 0; line-height: 1.7; color: #2c3e50;">');
    formatted = formatted.replace(/\n/g, '<br>');

    // 添加段落标签
    if (formatted && !formatted.startsWith('<')) {
        formatted = '<p style="margin: 15px 0; line-height: 1.7; color: #2c3e50;">' + formatted + '</p>';
    }

    return formatted;
}

function copyImprovements() {
    if (!window.currentImprovements) {
        showNotification('没有可复制的内容', 'warning');
        return;
    }

    const textContent = `智能教学改进建议报告

分析范围：${window.currentImprovements.scopeText}${window.currentImprovements.courseText ? ' - ' + window.currentImprovements.courseText : ''}
生成时间：${window.currentImprovements.generatedAt}

${window.currentImprovements.content}

---
本报告由智囊WisdomEdu智能教学系统基于DeepSeek AI模型生成
`;

    navigator.clipboard.writeText(textContent).then(() => {
        showNotification('内容已复制到剪贴板', 'success');
    }).catch(() => {
        showNotification('复制失败，请手动选择复制', 'error');
    });
}

function exportImprovements() {
    if (!window.currentImprovements) {
        showNotification('请先生成改进建议', 'warning');
        return;
    }

    try {
        // 生成文件名
        const now = new Date();
        const dateStr = now.getFullYear() +
                       String(now.getMonth() + 1).padStart(2, '0') +
                       String(now.getDate()).padStart(2, '0') + '_' +
                       String(now.getHours()).padStart(2, '0') +
                       String(now.getMinutes()).padStart(2, '0');

        let fileName = `教学改进建议_${window.currentImprovements.scopeText}`;
        if (window.currentImprovements.courseText) {
            fileName += `_${window.currentImprovements.courseText}`;
        }
        fileName += `_${dateStr}.pdf`;

        // 显示生成提示
        showNotification('正在生成PDF，请稍候...', 'info');

        // 生成PDF
        generateChinesePDF(fileName);

    } catch (error) {
        console.error('导出PDF失败:', error);
        showNotification('导出PDF失败，请重试', 'error');
    }
}

// 生成支持中文的PDF
async function generateChinesePDF(fileName) {
    try {
        // 创建临时的HTML容器
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '794px'; // A4宽度（像素）
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.padding = '40px';
        tempContainer.style.fontFamily = 'Microsoft YaHei, SimSun, sans-serif';
        tempContainer.style.fontSize = '14px';
        tempContainer.style.lineHeight = '1.6';
        tempContainer.style.color = '#333';

        // 生成HTML内容
        const htmlContent = generateReportHTML();
        tempContainer.innerHTML = htmlContent;

        // 添加到页面
        document.body.appendChild(tempContainer);

        // 使用html2canvas生成图片
        const canvas = await html2canvas(tempContainer, {
            scale: 2, // 提高清晰度
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 794,
            height: tempContainer.scrollHeight
        });

        // 移除临时容器
        document.body.removeChild(tempContainer);

        // 创建PDF
        const { jsPDF } = window.jspdf;
        const imgData = canvas.toDataURL('image/png');

        // 计算PDF尺寸
        const imgWidth = 210; // A4宽度(mm)
        const pageHeight = 297; // A4高度(mm)
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;

        const doc = new jsPDF('p', 'mm', 'a4');
        let position = 0;

        // 添加第一页
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // 如果内容超过一页，添加更多页面
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // 下载PDF
        doc.save(fileName);
        showNotification('PDF报告导出成功', 'success');

    } catch (error) {
        console.error('生成PDF失败:', error);
        showNotification('生成PDF失败，请重试', 'error');
    }
}

// 生成报告HTML内容
function generateReportHTML() {
    const formattedContent = formatImprovementsContent(window.currentImprovements.content);

    return `
        <div style="font-family: Microsoft YaHei, SimSun, sans-serif;">
            <!-- 报告头部 -->
            <div style="text-align: center; border-bottom: 3px solid #2980b9; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="font-size: 28px; font-weight: bold; color: #2c3e50; margin: 0 0 15px 0;">
                    智能教学改进建议报告
                </h1>
                <div style="font-size: 14px; color: #7f8c8d; margin: 5px 0;">
                    <div>分析范围：${window.currentImprovements.scopeText}${window.currentImprovements.courseText ? ' - ' + window.currentImprovements.courseText : ''}</div>
                    <div>生成时间：${window.currentImprovements.generatedAt}</div>
                </div>
            </div>

            <!-- 报告内容 -->
            <div style="font-size: 14px; line-height: 1.8; color: #333;">
                ${formattedContent}
            </div>

            <!-- 报告尾部 -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #7f8c8d;">
                <div>本报告由智囊WisdomEdu智能教学系统基于DeepSeek AI模型生成</div>
                <div style="margin-top: 5px;">报告生成时间：${window.currentImprovements.generatedAt}</div>
            </div>
        </div>
    `;
}

// ============= 知识块查看功能 =============

// 查看知识块功能
async function viewKnowledgeChunks(courseId, courseName) {
    try {
        // 显示模态框
        const modal = document.getElementById('knowledge-chunks-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.add('show');

        // 设置课程信息
        document.getElementById('chunks-modal-title').textContent = `${courseName} - 知识块详情`;
        document.getElementById('chunks-course-name').textContent = courseName;

        // 找到课程代码
        const course = knowledgeCurrentCourses.find(c => c.id == courseId);
        if (course) {
            document.getElementById('chunks-course-code').textContent = course.courseCode || '';
        }

        // 显示加载状态
        document.getElementById('chunks-loading').style.display = 'block';
        document.getElementById('chunks-list').style.display = 'none';
        document.getElementById('chunks-empty').style.display = 'none';

        // 获取知识块数据
        const response = await fetch(`/api/teacher/knowledge/${courseId}/chunks`, {
            method: 'GET',
            credentials: 'include'
        });

        document.getElementById('chunks-loading').style.display = 'none';

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data && result.data.length > 0) {
                displayKnowledgeChunks(result.data);
            } else {
                document.getElementById('chunks-empty').style.display = 'block';
            }
        } else {
            showNotification('获取知识块数据失败，请重试', 'error');
            document.getElementById('chunks-empty').style.display = 'block';
        }

    } catch (error) {
        console.error('查看知识块失败:', error);
        showNotification('查看知识块失败，请重试', 'error');
        document.getElementById('chunks-loading').style.display = 'none';
        document.getElementById('chunks-empty').style.display = 'block';
    }
}

// 显示知识块列表
function displayKnowledgeChunks(chunks) {
    const container = document.getElementById('chunks-list');
    const totalCountElement = document.getElementById('chunks-total-count');
    const fileFilterSelect = document.getElementById('chunks-file-filter');

    // 更新总数
    totalCountElement.textContent = chunks.length;

    // 更新文件过滤器
    const fileNames = [...new Set(chunks.map(chunk => chunk.fileName))];
    fileFilterSelect.innerHTML = '<option value="">所有文件</option>';
    fileNames.forEach(fileName => {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = fileName;
        fileFilterSelect.appendChild(option);
    });

    // 渲染知识块列表
    renderKnowledgeChunks(chunks);

    // 设置搜索和过滤事件
    setupChunksFilters(chunks);

    container.style.display = 'block';
}

// 渲染知识块列表
function renderKnowledgeChunks(chunks) {
    const container = document.getElementById('chunks-list');

    let html = '';
    chunks.forEach((chunk, index) => {
        const statusBadge = chunk.processed ?
            '<span class="badge badge-success">已处理</span>' :
            '<span class="badge badge-warning">处理中</span>';

        const createdTime = chunk.createdAt ?
            new Date(chunk.createdAt).toLocaleString() : '未知';

        html += `
            <div class="chunk-item" style="border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 12px; padding: 16px; background: white;">
                <div class="chunk-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                        <strong style="color: #2c3e50;">知识块 #${chunk.chunkIndex !== null && chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : index + 1}</strong>
                        <span style="color: #7f8c8d; margin-left: 8px; font-size: 14px;">${chunk.fileName}</span>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${statusBadge}
                        <button class="btn btn-sm btn-warning" onclick="editKnowledgeChunk('${chunk.chunkId}', '${chunk.fileName}', ${chunk.chunkIndex !== null && chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : index + 1})">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteKnowledgeChunk('${chunk.chunkId}', '${chunk.fileName}', ${chunk.chunkIndex !== null && chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : index + 1})">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                        <button class="btn btn-sm btn-info" onclick="showChunkDetail('${chunk.chunkId}', '${chunk.fileName}', ${chunk.chunkIndex !== null && chunk.chunkIndex !== undefined ? chunk.chunkIndex + 1 : index + 1})">
                            <i class="fas fa-eye"></i> 查看详情
                        </button>
                    </div>
                </div>
                <div class="chunk-preview" style="color: #7f8c8d; font-size: 14px; line-height: 1.5; padding: 12px; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">
                    ${chunk.preview || '无内容预览'}
                </div>
                <div class="chunk-meta" style="font-size: 12px; color: #95a5a6;">
                    创建时间: ${createdTime} | 块ID: ${chunk.chunkId}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 设置知识块搜索和过滤功能
function setupChunksFilters(allChunks) {
    const searchInput = document.getElementById('chunks-search');
    const fileFilter = document.getElementById('chunks-file-filter');

    function filterChunks() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedFile = fileFilter.value;

        let filteredChunks = allChunks.filter(chunk => {
            const matchesSearch = !searchTerm ||
                (chunk.content && chunk.content.toLowerCase().includes(searchTerm)) ||
                (chunk.fileName && chunk.fileName.toLowerCase().includes(searchTerm));

            const matchesFile = !selectedFile || chunk.fileName === selectedFile;

            return matchesSearch && matchesFile;
        });

        renderKnowledgeChunks(filteredChunks);
        document.getElementById('chunks-total-count').textContent = filteredChunks.length;
    }

    // 移除现有的事件监听器
    searchInput.removeEventListener('input', searchInput._filterHandler);
    fileFilter.removeEventListener('change', fileFilter._filterHandler);

    // 添加新的事件监听器
    searchInput._filterHandler = filterChunks;
    fileFilter._filterHandler = filterChunks;

    searchInput.addEventListener('input', searchInput._filterHandler);
    fileFilter.addEventListener('change', fileFilter._filterHandler);
}

// 显示知识块详细内容
async function showChunkDetail(chunkId, fileName, chunkIndex) {
    try {
        // 显示详情模态框
        const modal = document.getElementById('chunk-detail-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.add('show');

        // 设置基本信息
        document.getElementById('chunk-detail-title').textContent = `知识块 #${chunkIndex} - 详情`;
        document.getElementById('chunk-detail-name').textContent = `知识块 #${chunkIndex}`;
        document.getElementById('chunk-detail-file').textContent = fileName;
        document.getElementById('chunk-detail-id').textContent = chunkId;

        // 显示加载状态
        const contentDisplay = document.getElementById('chunk-content-display');
        contentDisplay.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin"></i> 加载知识块详情中...</div>';

        // 获取知识块详细信息
        const response = await fetch(`/api/teacher/knowledge/chunk/${encodeURIComponent(chunkId)}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                displayChunkDetail(result.data);
            } else {
                contentDisplay.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;">获取知识块详情失败</div>';
                showNotification(result.message || '获取知识块详情失败', 'error');
            }
        } else {
            contentDisplay.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;">获取知识块详情失败</div>';
            showNotification('获取知识块详情失败，请重试', 'error');
        }

    } catch (error) {
        console.error('查看知识块详情失败:', error);
        showNotification('查看知识块详情失败，请重试', 'error');

        const contentDisplay = document.getElementById('chunk-content-display');
        if (contentDisplay) {
            contentDisplay.innerHTML = '<div style="text-align: center; padding: 40px; color: #e74c3c;">获取知识块详情失败</div>';
        }
    }
}

// 显示知识块详细信息
function displayChunkDetail(chunkData) {
    // 更新状态标签
    const statusElement = document.getElementById('chunk-detail-status');
    if (chunkData.processed) {
        statusElement.className = 'badge badge-success';
        statusElement.textContent = '已处理';
    } else {
        statusElement.className = 'badge badge-warning';
        statusElement.textContent = '处理中';
    }

    // 更新创建时间
    const createdTime = chunkData.createdAt ?
        new Date(chunkData.createdAt).toLocaleString() : '未知';
    document.getElementById('chunk-detail-time').textContent = createdTime;

    // 显示完整内容
    const contentDisplay = document.getElementById('chunk-content-display');
    if (chunkData.content && chunkData.content.trim()) {
        contentDisplay.textContent = chunkData.content;
    } else {
        contentDisplay.innerHTML = '<div style="text-align: center; padding: 40px; color: #7f8c8d;">该知识块暂无内容</div>';
    }
}

// 隐藏知识块详情模态框
function hideChunkDetailModal() {
    const modal = document.getElementById('chunk-detail-modal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 隐藏知识块查看模态框
function hideKnowledgeChunksModal() {
    const modal = document.getElementById('knowledge-chunks-modal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// ============= 知识块编辑删除功能 =============

// 编辑知识块
async function editKnowledgeChunk(chunkId, fileName, chunkIndex) {
    try {
        // 显示编辑模态框
        const modal = document.getElementById('edit-chunk-modal');
        if (!modal) return;

        modal.style.display = 'flex';
        modal.classList.add('show');

        // 设置基本信息
        document.getElementById('edit-chunk-title').textContent = `编辑知识块 #${chunkIndex}`;
        document.getElementById('edit-chunk-name').textContent = `知识块 #${chunkIndex}`;
        document.getElementById('edit-chunk-file').textContent = fileName;
        document.getElementById('edit-chunk-id').textContent = chunkId;

        // 显示加载状态
        const textarea = document.getElementById('edit-chunk-textarea');
        textarea.value = '加载中...';
        textarea.disabled = true;

        // 获取知识块详细信息
        const response = await fetch(`/api/teacher/knowledge/chunk/${encodeURIComponent(chunkId)}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                // 更新状态标签
                const statusElement = document.getElementById('edit-chunk-status');
                if (result.data.processed) {
                    statusElement.className = 'badge badge-success';
                    statusElement.textContent = '已处理';
                } else {
                    statusElement.className = 'badge badge-warning';
                    statusElement.textContent = '处理中';
                }

                // 更新创建时间
                const createdTime = result.data.createdAt ?
                    new Date(result.data.createdAt).toLocaleString() : '未知';
                document.getElementById('edit-chunk-time').textContent = createdTime;

                // 设置内容到文本框
                textarea.value = result.data.content || '';
                textarea.disabled = false;
                textarea.focus();

                // 存储chunkId供保存时使用
                textarea.dataset.chunkId = chunkId;

            } else {
                textarea.value = '获取知识块内容失败';
                showNotification(result.message || '获取知识块内容失败', 'error');
            }
        } else {
            textarea.value = '获取知识块内容失败';
            showNotification('获取知识块内容失败，请重试', 'error');
        }

    } catch (error) {
        console.error('编辑知识块失败:', error);
        showNotification('编辑知识块失败，请重试', 'error');
    }
}

// 保存知识块编辑
async function saveChunkEdit() {
    try {
        const textarea = document.getElementById('edit-chunk-textarea');
        const chunkId = textarea.dataset.chunkId;
        const content = textarea.value.trim();

        if (!content) {
            showNotification('内容不能为空', 'warning');
            return;
        }

        showLoading('保存中...');

        const response = await fetch(`/api/teacher/knowledge/chunk/${encodeURIComponent(chunkId)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ content: content })
        });

        hideLoading();

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showNotification('知识块保存成功', 'success');
                hideEditChunkModal();
                // 刷新知识块列表
                refreshCurrentChunksList();
            } else {
                showNotification(result.message || '保存失败', 'error');
            }
        } else {
            showNotification('保存失败，请重试', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('保存知识块失败:', error);
        showNotification('保存知识块失败，请重试', 'error');
    }
}

// 删除知识块
async function deleteKnowledgeChunk(chunkId, fileName, chunkIndex) {
    const confirmed = await showConfirmDialog(
        '确认删除知识块',
        `确定要删除知识块 #${chunkIndex} 吗？\n\n文件：${fileName}\n\n此操作无法撤销！`,
        '确认删除'
    );

    if (!confirmed) return;

    try {
        showLoading('删除中...');

        const response = await fetch(`/api/teacher/knowledge/chunk/${encodeURIComponent(chunkId)}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        hideLoading();

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                showNotification('知识块删除成功', 'success');
                // 刷新知识块列表
                refreshCurrentChunksList();
            } else {
                showNotification(result.message || '删除失败', 'error');
            }
        } else {
            showNotification('删除失败，请重试', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('删除知识块失败:', error);
        showNotification('删除知识块失败，请重试', 'error');
    }
}

// 隐藏编辑模态框
function hideEditChunkModal() {
    const modal = document.getElementById('edit-chunk-modal');
    if (!modal) return;

    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 刷新当前知识块列表
function refreshCurrentChunksList() {
    // 获取当前显示的课程ID
    const modal = document.getElementById('knowledge-chunks-modal');
    if (modal && modal.style.display === 'flex') {
        // 如果知识块列表模态框正在显示，重新加载数据
        const courseName = document.getElementById('chunks-course-name').textContent;
        const courseCode = document.getElementById('chunks-course-code').textContent;

        // 从当前课程列表中找到对应的课程ID
        const course = knowledgeCurrentCourses.find(c => c.name === courseName);
        if (course) {
            viewKnowledgeChunks(course.id, course.name);
        }
    }
}

// ======== 试卷预览和编辑功能 ========

// 显示试卷预览模态框
async function showExamPreviewModal(examId) {
    try {
        showLoading('加载试卷内容...');

        // 获取试卷详情
        const response = await TeacherAPI.getExamDetail(examId);
        if (!response.success) {
            throw new Error(response.message || '获取试卷详情失败');
        }

        const exam = response.data;

        // 调试信息
        console.log('试卷数据:', exam);
        console.log('试卷题目数据:', exam.questions);

        // 设置基本信息
        document.getElementById('preview-exam-title').textContent = exam.title || 'AI生成试卷';
        document.getElementById('preview-exam-duration').textContent = (exam.timeLimit || 90) + '分钟';
        document.getElementById('preview-exam-total-score').textContent = (exam.totalScore || 100) + '分';
        document.getElementById('preview-exam-question-count').textContent =
            (exam.questions ? exam.questions.length : 0) + '题';

        // 渲染题目内容
        renderExamQuestions(exam.questions || []);

        // 保存当前试卷ID用于其他操作
        document.getElementById('exam-preview-modal').setAttribute('data-exam-id', examId);

        // 显示模态框
        document.getElementById('exam-preview-modal').style.display = 'flex';

        // 设置事件监听器
        setupExamPreviewModalEvents();

        hideLoading();
    } catch (error) {
        console.error('显示试卷预览失败:', error);
        hideLoading();
        showNotification('加载试卷预览失败: ' + error.message, 'error');
    }
}

// 渲染试卷题目
function renderExamQuestions(questions) {
    const container = document.getElementById('preview-questions-container');

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #7f8c8d; padding: 50px; font-style: italic;">
                <i class="fas fa-question-circle" style="font-size: 48px; margin-bottom: 20px; display: block;"></i>
                该试卷暂无题目
            </div>
        `;
        return;
    }

    let questionsHtml = '';

    questions.forEach((question, index) => {
        // 添加防御性检查
        if (!question || typeof question !== 'object') {
            console.warn('跳过无效题目:', question);
            return;
        }

        const questionNumber = index + 1;
        const score = question.score || 10;

        console.log(`渲染第${questionNumber}题:`, question);
        console.log(`题目答案字段:`, {
            correctAnswer: question.correctAnswer,
            answer: question.answer,
            correct: question.correct,
            solution: question.solution
        });
        console.log(`题目解析字段:`, {
            explanation: question.explanation,
            analysis: question.analysis,
            solution_detail: question.solution_detail,
            rationale: question.rationale
        });

        questionsHtml += `
            <div class="question-item" style="margin-bottom: 30px; padding: 25px; border: 1px solid #e9ecef; border-radius: 10px; background: #fafbfc;">
                <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: #3498db; margin: 0; font-size: 16px; font-weight: 600;">
                        第${questionNumber}题 (${score}分)
                        ${question.knowledgePoint ? `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">知识点：${question.knowledgePoint}</span>` : ''}
                    </h4>
                </div>

                <div class="question-content" style="margin-bottom: 20px;">
                    <div style="font-size: 15px; line-height: 1.6; color: #2c3e50;">
                        ${formatTeacherMarkdown(question.content || question.questionText || question.text || '题目内容')}
                    </div>
                </div>

                ${renderQuestionOptions(question)}

                ${renderQuestionAnswer(question)}

                ${renderQuestionExplanation(question)}

                ${renderQuestionCapabilityGoals(question)}
            </div>
        `;
    });

    container.innerHTML = questionsHtml;
}

// 渲染题目选项
function renderQuestionOptions(question) {
    if (!question.options) {
        return '';
    }

    // 确保options是数组
    let options = [];
    if (Array.isArray(question.options)) {
        options = question.options;
    } else if (typeof question.options === 'string') {
        // 如果是字符串，尝试解析
        try {
            options = JSON.parse(question.options);
        } catch (e) {
            // 如果解析失败，按行分割
            options = question.options.split('\n').filter(opt => opt.trim());
        }
    } else if (typeof question.options === 'object') {
        // 如果是对象，转换为数组
        options = Object.values(question.options);
    }

    if (!options || options.length === 0) {
        return '';
    }

    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    let optionsHtml = '<div class="question-options" style="margin-bottom: 20px;">';

    options.forEach((option, index) => {
        const label = optionLabels[index] || (index + 1);
        // 检查选项是否已经包含标签，如果有则去掉
        const cleanOption = option.replace(/^[A-Z]\.\s*/, '');
        optionsHtml += `
            <div class="option-item" style="margin-bottom: 8px; padding: 8px 0;">
                <span style="font-weight: 500; color: #3498db; margin-right: 8px;">${label}.</span>
                <span style="color: #2c3e50;">${formatTeacherMarkdown(cleanOption)}</span>
            </div>
        `;
    });

    optionsHtml += '</div>';
    return optionsHtml;
}

// 渲染正确答案
function renderQuestionAnswer(question) {
    // 支持多种答案字段名
    const answer = question.correctAnswer || question.answer || question.correct || question.solution;

    if (!answer) {
        console.log('题目无答案信息:', question);
        return '';
    }

    // 使用Markdown解析答案内容
    const formattedAnswer = formatTeacherMarkdown(answer);

    return `
        <div class="question-answer" style="margin-bottom: 15px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
            <span style="font-weight: 600; color: #155724;">参考答案：</span>
            <div style="color: #155724; margin-top: 8px;">${formattedAnswer}</div>
        </div>
    `;
}

// 渲染题目解析
function renderQuestionExplanation(question) {
    // 支持多种解析字段名
    const explanation = question.explanation || question.analysis || question.solution_detail || question.rationale;

    if (!explanation) {
        console.log('题目无解析信息:', question);
        return '';
    }

    // 使用Markdown解析解析内容
    const formattedExplanation = formatTeacherMarkdown(explanation);

    return `
        <div class="question-explanation" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px;">
            <span style="font-weight: 600; color: #0c5460;">解析：</span>
            <div style="color: #0c5460; line-height: 1.6; margin-top: 8px;">${formattedExplanation}</div>
        </div>
    `;
}

// 渲染题目能力培养目标
function renderQuestionCapabilityGoals(question) {
    return `
        <div class="question-capability-goals" style="padding: 12px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; margin-top: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-weight: 600; color: #1976d2;">🎯 能力培养目标：</span>
                <button onclick="generateCapabilityGoals(${question.id}, this)"
                        class="btn-sm"
                        style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-magic" style="margin-right: 4px;"></i>AI生成
                </button>
            </div>
            <div id="capability-goals-${question.id}" style="color: #37474f; line-height: 1.6; padding: 8px; background-color: #ffffff; border-left: 3px solid #1976d2; border-radius: 4px; font-size: 14px; min-height: 24px;">
                <span style="color: #999; font-style: italic;">点击"AI生成"按钮自动生成该题目的能力培养目标</span>
            </div>
        </div>
    `;
}

// 雷达图功能 - 绘制能力维度雷达图
function drawRadarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 60;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 能力维度标签
    const labels = data.labels || ['理论掌握', '实践应用', '创新思维', '知识迁移', '学习能力', '系统思维'];
    const values = data.values || [0, 0, 0, 0, 0, 0];
    const maxValue = options.maxValue || 100;

    // 绘制网格
    const levels = 5;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    for (let level = 1; level <= levels; level++) {
        const levelRadius = (radius * level) / levels;
        ctx.beginPath();

        for (let i = 0; i < labels.length; i++) {
            const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
            const x = centerX + levelRadius * Math.cos(angle);
            const y = centerY + levelRadius * Math.sin(angle);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    // 绘制轴线
    ctx.strokeStyle = '#bbb';
    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    // 绘制数据区域
    ctx.fillStyle = 'rgba(255, 99, 132, 0.2)';
    ctx.strokeStyle = 'rgba(255, 99, 132, 1)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < values.length; i++) {
        const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
        const value = Math.max(0, Math.min(maxValue, values[i]));
        const distance = (radius * value) / maxValue;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制数据点
    ctx.fillStyle = 'rgba(255, 99, 132, 1)';
    for (let i = 0; i < values.length; i++) {
        const angle = (Math.PI * 2 * i) / values.length - Math.PI / 2;
        const value = Math.max(0, Math.min(maxValue, values[i]));
        const distance = (radius * value) / maxValue;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制标签
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';

    for (let i = 0; i < labels.length; i++) {
        const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
        const labelRadius = radius + 20;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);

        // 调整文本对齐
        if (x < centerX - 5) {
            ctx.textAlign = 'right';
        } else if (x > centerX + 5) {
            ctx.textAlign = 'left';
        } else {
            ctx.textAlign = 'center';
        }

        ctx.fillText(labels[i], x, y + 4);

        // 绘制数值
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';
        const valueText = values[i].toFixed(0);
        ctx.fillText(valueText, x, y + 16);
    }

    // 恢复字体设置
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333';
}

// 更新学生雷达图
async function updateStudentRadarChart() {
    const examSelect = document.getElementById('analysis-exam-select');
    const studentSelect = document.getElementById('radar-student-select');
    const canvas = document.getElementById('radarCanvas');
    const emptyState = document.getElementById('radar-empty-state');

    if (!examSelect.value) {
        canvas.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.textContent = '请先选择考试';
        return;
    }

    if (!studentSelect.value) {
        canvas.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.textContent = '请选择学生或全班平均';
        return;
    }

    try {
        // 显示加载状态
        emptyState.style.display = 'flex';
        emptyState.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成雷达图...';

        // 获取能力分析数据
        let capabilityData;
        if (studentSelect.value === 'all') {
            // 获取全班平均数据
            capabilityData = await getClassAverageCapabilityData(examSelect.value);
        } else {
            // 获取单个学生数据
            capabilityData = await getStudentCapabilityData(examSelect.value, studentSelect.value);
        }

        if (capabilityData) {
            // 隐藏空状态，显示画布
            emptyState.style.display = 'none';
            canvas.style.display = 'block';

            // 绘制雷达图
            drawRadarChart('radarCanvas', capabilityData, { maxValue: 100 });

            // 添加数据信息显示
            const infoContainer = document.getElementById('capability-radar-chart');
            let existingInfo = infoContainer.querySelector('.radar-info');
            if (existingInfo) {
                existingInfo.remove();
            }

            const infoDiv = document.createElement('div');
            infoDiv.className = 'radar-info';
            infoDiv.style.cssText = `
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background: rgba(255,255,255,0.9);
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                text-align: center;
                color: #666;
                border: 1px solid #e0e0e0;
            `;

            if (studentSelect.value === 'all') {
                const dataTypeInfo = capabilityData.isSimulated ?
                    `<span style="color: #f39c12; font-size: 12px;">[基于分数模拟]</span>` :
                    `<span style="color: #27ae60; font-size: 12px;">[真实能力数据]</span>`;
                infoDiv.innerHTML = `
                    <strong>${capabilityData.examTitle || '当前考试'} - 全班平均表现</strong> ${dataTypeInfo}<br>
                    参与人数: ${capabilityData.participantCount || 0}人
                `;
            } else {
                const avgScore = capabilityData.values ?
                    (capabilityData.values.reduce((a, b) => a + b, 0) / capabilityData.values.length).toFixed(1) : '0.0';
                const dataTypeInfo = capabilityData.isSimulated ?
                    `<span style="color: #f39c12; font-size: 12px;">[基于分数模拟]</span>` :
                    `<span style="color: #27ae60; font-size: 12px;">[真实能力数据]</span>`;
                infoDiv.innerHTML = `
                    <strong>${capabilityData.examTitle || '当前考试'} - ${capabilityData.studentName || '学生'}表现</strong> ${dataTypeInfo}<br>
                    能力平均分: ${avgScore}分
                `;
            }

            infoContainer.appendChild(infoDiv);
        } else {
            throw new Error('无法获取能力分析数据');
        }

    } catch (error) {
        console.error('更新雷达图失败:', error);
        canvas.style.display = 'none';
        emptyState.style.display = 'flex';
        emptyState.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 生成雷达图失败';
    }
}

// 获取全班平均能力数据
async function getClassAverageCapabilityData(examId) {
    try {
        const response = await fetch(`/api/exam/${examId}/capability-radar/class-average`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            return {
                labels: result.data.labels,
                values: result.data.values,
                participantCount: result.data.participantCount,
                examTitle: result.data.examTitle
            };
        } else {
            throw new Error(result.message || '获取全班平均数据失败');
        }
    } catch (error) {
        console.error('获取全班平均能力数据失败:', error);
        return null;
    }
}

// 获取单个学生能力数据
async function getStudentCapabilityData(examId, studentId) {
    try {
        const response = await fetch(`/api/exam/${examId}/capability-radar/${studentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            return {
                labels: result.data.labels,
                values: result.data.values,
                studentName: result.data.studentName,
                examTitle: result.data.examTitle
            };
        } else {
            throw new Error(result.message || '获取学生数据失败');
        }
    } catch (error) {
        console.error('获取学生能力数据失败:', error);
        return null;
    }
}

// 在考试选择改变时更新学生列表和雷达图
function onExamSelectionChangeForRadar() {
    const examSelect = document.getElementById('analysis-exam-select');
    const studentSelect = document.getElementById('radar-student-select');

    if (examSelect.value) {
        // 加载学生列表
        loadStudentsForRadar(examSelect.value);
        // 重置雷达图
        updateStudentRadarChart();
    } else {
        // 清空学生列表
        studentSelect.innerHTML = '<option value="">选择学生</option><option value="all">全班平均</option>';
        updateStudentRadarChart();
    }
}

// 加载考试的学生列表
async function loadStudentsForRadar(examId) {
    try {
        const studentSelect = document.getElementById('radar-student-select');

        // 显示加载状态
        studentSelect.innerHTML = '<option value="">加载中...</option><option value="all">全班平均</option>';

        const response = await fetch(`/api/exam/${examId}/participants`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            const students = result.data;

            // 清空并重新填充学生选项
            studentSelect.innerHTML = '<option value="">选择学生</option><option value="all">全班平均</option>';

            students.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.name} (${student.score || '--'}分)`;
                studentSelect.appendChild(option);
            });

            if (students.length === 0) {
                const noStudentOption = document.createElement('option');
                noStudentOption.value = '';
                noStudentOption.textContent = '暂无学生参与';
                noStudentOption.disabled = true;
                studentSelect.appendChild(noStudentOption);
            }
        } else {
            throw new Error(result.message || '获取学生列表失败');
        }

    } catch (error) {
        console.error('加载学生列表失败:', error);
        const studentSelect = document.getElementById('radar-student-select');
        studentSelect.innerHTML = '<option value="">加载失败</option><option value="all">全班平均</option>';
    }
}

// 生成题目能力培养目标
async function generateCapabilityGoals(questionId, buttonElement) {
    const goalContainer = document.getElementById(`capability-goals-${questionId}`);

    if (!goalContainer) {
        console.error('找不到能力培养目标容器');
        return;
    }

    // 显示加载状态
    const originalContent = goalContainer.innerHTML;
    goalContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; color: #1976d2;">
            <i class="fas fa-spinner fa-spin"></i>
            <span>AI正在生成能力培养目标...</span>
        </div>
    `;

    // 禁用按钮
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.style.opacity = '0.6';
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 4px;"></i>生成中...';
    }

    try {
        const response = await fetch(`/api/exam/question/${questionId}/capability-goals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success && result.data) {
            // 显示生成的能力培养目标
            goalContainer.innerHTML = `
                <div style="color: #37474f; line-height: 1.8;">
                    ${result.data.split('；').map(goal =>
                        `<div style="margin-bottom: 6px; padding: 4px 0;">
                            <i class="fas fa-target" style="color: #1976d2; margin-right: 8px; font-size: 12px;"></i>
                            <span>${goal.trim()}</span>
                        </div>`
                    ).join('')}
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
                    <i class="fas fa-robot" style="margin-right: 4px;"></i>
                    <span>AI生成的能力培养目标</span>
                </div>
            `;
        } else {
            throw new Error(result.message || '生成失败');
        }

    } catch (error) {
        console.error('生成能力培养目标失败:', error);
        goalContainer.innerHTML = `
            <div style="color: #d32f2f; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>生成失败: ${error.message}</span>
                <button onclick="generateCapabilityGoals(${questionId}, this.parentElement.previousElementSibling.querySelector('button'))"
                        style="margin-left: 8px; background: #1976d2; color: white; border: none; padding: 2px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                    重试
                </button>
            </div>
        `;
    } finally {
        // 恢复按钮状态
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.style.opacity = '1';
            buttonElement.innerHTML = '<i class="fas fa-magic" style="margin-right: 4px;"></i>AI生成';
        }
    }
}

// 切换大作业模式
function toggleAssignmentMode(checkbox) {
    if (checkbox.checked) {
        // 当选择大作业模式时，提示用户注意事项
        const confirmed = confirm(
            '🤖 启用AI智能大作业模式？\n\n' +
            '• 基于课程知识库自动生成大作业题目\n' +
            '• 学生上传文档完成作业\n' +
            '• AI辅助评分，教师最终审核\n\n' +
            '确定启用吗？'
        );

        if (!confirmed) {
            checkbox.checked = false;
            return;
        }

        // 禁用其他题型选项（大作业模式下只能有一种题型）
        const otherCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="q-"]:not(#q-assignment)');
        otherCheckboxes.forEach(cb => {
            if (cb.checked) {
                cb.checked = false;
                showNotification('大作业模式下，其他题型已自动取消选择', 'info');
            }
            cb.disabled = true;
        });

        // 设置默认值
        const countInput = document.getElementById('q-assignment-count');
        const scoreInput = document.getElementById('q-assignment-score');
        if (countInput && !countInput.value) countInput.value = '1';
        if (scoreInput && !scoreInput.value) scoreInput.value = '50';

        showNotification('🤖 已启用AI智能大作业模式，其他题型已禁用', 'success');
    } else {
        // 重新启用其他题型选项
        const otherCheckboxes = document.querySelectorAll('input[type="checkbox"][id^="q-"]:not(#q-assignment)');
        otherCheckboxes.forEach(cb => {
            cb.disabled = false;
        });

        showNotification('已关闭大作业模式，其他题型重新启用', 'info');
    }
}

// 显示大作业要求设置模态框
function showAssignmentRequirementModal(questionId, questionTitle, questionScore) {
    const modal = document.getElementById('assignment-requirement-modal');
    const titleElement = document.getElementById('assignment-question-title');
    const scoreElement = document.getElementById('assignment-question-score');
    const contentTextarea = document.getElementById('assignment-requirement-content');

    // 设置作业信息
    titleElement.textContent = questionTitle || '大作业题目';
    scoreElement.textContent = questionScore || '50';

    // 存储questionId用于保存
    modal.setAttribute('data-question-id', questionId);

    // 清空内容
    contentTextarea.value = '';

    // 重置权重
    resetWeightDisplay();

    // 显示模态框
    modal.style.display = 'flex';
}

// 隐藏大作业要求设置模态框
function hideAssignmentRequirementModal() {
    const modal = document.getElementById('assignment-requirement-modal');
    modal.style.display = 'none';
}

// 更新权重显示
function updateWeightDisplay() {
    const contentWeight = parseInt(document.getElementById('content-weight').value);
    const formatWeight = parseInt(document.getElementById('format-weight').value);
    const innovationWeight = parseInt(document.getElementById('innovation-weight').value);
    const completenessWeight = parseInt(document.getElementById('completeness-weight').value);

    // 更新显示文本
    document.getElementById('content-weight-text').textContent = contentWeight + '%';
    document.getElementById('format-weight-text').textContent = formatWeight + '%';
    document.getElementById('innovation-weight-text').textContent = innovationWeight + '%';
    document.getElementById('completeness-weight-text').textContent = completenessWeight + '%';

    // 计算总计
    const total = contentWeight + formatWeight + innovationWeight + completenessWeight;
    document.getElementById('total-weight').textContent = total;

    // 根据总计显示不同颜色
    const totalElement = document.getElementById('weight-total');
    if (total === 100) {
        totalElement.style.background = '#e8f5e8';
        totalElement.querySelector('span').style.color = '#155724';
    } else {
        totalElement.style.background = '#fff3cd';
        totalElement.querySelector('span').style.color = '#856404';
    }
}

// 重置权重显示
function resetWeightDisplay() {
    document.getElementById('content-weight').value = 40;
    document.getElementById('format-weight').value = 20;
    document.getElementById('innovation-weight').value = 25;
    document.getElementById('completeness-weight').value = 15;
    updateWeightDisplay();
}

// 保存大作业要求
async function saveAssignmentRequirement() {
    const modal = document.getElementById('assignment-requirement-modal');
    const questionId = modal.getAttribute('data-question-id');
    const requirement = document.getElementById('assignment-requirement-content').value.trim();

    if (!requirement) {
        showNotification('请输入作业具体要求', 'warning');
        return;
    }

    // 获取权重设置
    const weights = {
        content: parseInt(document.getElementById('content-weight').value),
        format: parseInt(document.getElementById('format-weight').value),
        innovation: parseInt(document.getElementById('innovation-weight').value),
        completeness: parseInt(document.getElementById('completeness-weight').value)
    };

    // 验证权重总计
    const totalWeight = weights.content + weights.format + weights.innovation + weights.completeness;
    if (totalWeight !== 100) {
        showNotification('评分权重总计必须为100%，当前为' + totalWeight + '%', 'warning');
        return;
    }

    try {
        showLoading('正在保存作业要求...');

        const response = await TeacherAPI.saveAssignmentRequirement(questionId, {
            requirement: requirement,
            weights: weights
        });

        hideLoading();

        if (response.success) {
            showNotification('大作业要求保存成功！', 'success');
            hideAssignmentRequirementModal();

            // 刷新试卷预览
            if (window.currentExam) {
                const examDetailResponse = await TeacherAPI.getExamDetail(window.currentExam.id);
                if (examDetailResponse.success) {
                    displayExamPreview(examDetailResponse.data);
                }
            }
        } else {
            showNotification('保存失败：' + (response.message || '未知错误'), 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('保存大作业要求失败:', error);
        showNotification('保存失败，请重试', 'error');
    }
}

// 大作业要求模态框事件监听器
document.addEventListener('DOMContentLoaded', function() {
    // 大作业选择框事件监听
    const assignmentCheckbox = document.getElementById('q-assignment');
    if (assignmentCheckbox) {
        assignmentCheckbox.addEventListener('change', function() {
            toggleAssignmentMode(this);
        });
    }

    // 关闭按钮事件
    const closeBtn = document.getElementById('close-assignment-requirement-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAssignmentRequirementModal);
    }

    // 取消按钮事件
    const cancelBtn = document.getElementById('cancel-assignment-requirement');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAssignmentRequirementModal);
    }

    // 保存按钮事件
    const saveBtn = document.getElementById('save-assignment-requirement');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAssignmentRequirement);
    }

    // ESC键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('assignment-requirement-modal');
            if (modal && modal.style.display === 'flex') {
                hideAssignmentRequirementModal();
            }
        }
    });

    // 点击背景关闭模态框
    const modal = document.getElementById('assignment-requirement-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAssignmentRequirementModal();
            }
        });
    }
});

// 格式化教师端的Markdown内容（用于试卷答案和解析）
function formatTeacherMarkdown(message) {
    // 检查Marked.js是否可用
    if (typeof marked !== 'undefined') {
        try {
            // 配置Marked.js选项
            marked.setOptions({
                breaks: true,        // 支持单行换行
                gfm: true,          // GitHub风格Markdown
                sanitize: false,    // 信任内容
                smartLists: true,   // 智能列表处理
                smartypants: false, // 保持原始引号
                highlight: function(code, lang) {
                    // 简单的代码高亮处理
                    return `<code class="language-${lang || 'text'}">${escapeHtml(code)}</code>`;
                }
            });

            // 预处理：确保代码块格式正确
            let processedMessage = message;

            // 处理可能的代码块格式问题
            // 如果包含```但没有正确的换行，尝试修复
            if (processedMessage.includes('```') && !processedMessage.match(/```[\s\S]*?```/)) {
                // 尝试修复代码块格式
                processedMessage = processedMessage.replace(/```([^`]+)```/g, function(match, code) {
                    return '```\n' + code.trim() + '\n```';
                });
            }

            // 使用Marked.js解析Markdown
            const result = marked.parse(processedMessage);

            // 后处理：确保代码块有正确的样式
            return result.replace(/<pre><code class="language-([^"]*)">/g,
                '<pre><code class="language-$1" style="display: block; white-space: pre-wrap; word-break: break-all;">');

        } catch (error) {
            console.error('Marked.js解析失败:', error);
            console.error('原始内容:', message);
            // 回退到简单处理，但保留代码块格式
            return formatFallbackMarkdown(message);
        }
    } else {
        console.warn('Marked.js未加载，使用简单格式化');
        // 如果Marked.js不可用，使用简单的格式化
        return formatFallbackMarkdown(message);
    }
}

// 备用的简单Markdown格式化函数
function formatFallbackMarkdown(message) {
    let formatted = message;

    // 处理代码块
    formatted = formatted.replace(/```([\s\S]*?)```/g, function(match, code) {
        return `<pre><code style="display: block; white-space: pre-wrap; word-break: break-all; background-color: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px;">${escapeHtml(code.trim())}</code></pre>`;
    });

    // 处理行内代码
    formatted = formatted.replace(/`([^`]+)`/g, function(match, code) {
        return `<code style="background-color: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">${escapeHtml(code)}</code>`;
    });

    // 处理粗体
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 处理换行
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// 设置试卷预览模态框事件监听器
function setupExamPreviewModalEvents() {
    const modal = document.getElementById('exam-preview-modal');
    const closeBtn = document.getElementById('close-preview-modal');

    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.removeEventListener('click', hideExamPreviewModal);
        closeBtn.addEventListener('click', hideExamPreviewModal);
    }

    // ESC键关闭
    const escHandler = (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            hideExamPreviewModal();
        }
    };

    document.removeEventListener('keydown', escHandler);
    document.addEventListener('keydown', escHandler);

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideExamPreviewModal();
        }
    };
}

// 隐藏试卷预览模态框
function hideExamPreviewModal() {
    const modal = document.getElementById('exam-preview-modal');
    modal.style.display = 'none';
    modal.removeAttribute('data-exam-id');
}

// 从预览进入编辑模式
function editExamFromPreview() {
    const modal = document.getElementById('exam-preview-modal');
    const examId = modal.getAttribute('data-exam-id');

    if (examId) {
        hideExamPreviewModal();
        showExamEditModal(examId);
    }
}

// 从预览发布试卷
function publishExamFromPreview() {
    const modal = document.getElementById('exam-preview-modal');
    const examId = modal.getAttribute('data-exam-id');

    if (examId) {
        hideExamPreviewModal();
        showPublishExamWithModal(examId);
    }
}

// 从预览导出试卷
function exportExamFromPreview() {
    const modal = document.getElementById('exam-preview-modal');
    const examId = modal.getAttribute('data-exam-id');

    if (examId) {
        exportExam(examId);
    }
}

// 显示试卷编辑模态框
async function showExamEditModal(examId) {
    try {
        showLoading('加载试卷内容...');

        // 获取试卷详情
        const response = await TeacherAPI.getExamDetail(examId);
        if (!response.success) {
            throw new Error(response.message || '获取试卷详情失败');
        }

        const exam = response.data;

        // 生成Markdown格式内容
        const markdownContent = generateExamMarkdown(exam);

        // 设置编辑器内容
        const editor = document.getElementById('exam-markdown-editor');
        editor.value = markdownContent;

        // 保存当前试卷ID
        document.getElementById('exam-edit-modal').setAttribute('data-exam-id', examId);

        // 显示模态框
        document.getElementById('exam-edit-modal').style.display = 'flex';

        // 设置事件监听器
        setupExamEditModalEvents();

        // 初始化预览
        setTimeout(() => {
            updateExamPreview();
            // 如果编辑器有内容，立即触发预览更新
            if (editor && editor.value.trim()) {
                console.log('编辑器有内容，立即更新预览');
                updateExamPreview();
            }
        }, 200);

        hideLoading();
    } catch (error) {
        console.error('显示试卷编辑失败:', error);
        hideLoading();
        showNotification('加载试卷编辑失败: ' + error.message, 'error');
    }
}

// 设置试卷编辑模态框事件监听器
function setupExamEditModalEvents() {
    const modal = document.getElementById('exam-edit-modal');
    const closeBtn = document.getElementById('close-edit-modal');
    const editor = document.getElementById('exam-markdown-editor');

    // 关闭按钮事件
    if (closeBtn) {
        closeBtn.removeEventListener('click', hideExamEditModal);
        closeBtn.addEventListener('click', hideExamEditModal);
    }

    // 编辑器内容变化事件
    if (editor) {
        editor.removeEventListener('input', updateExamPreview);
        editor.addEventListener('input', updateExamPreview);
    }

    // ESC键关闭
    const escHandler = (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            hideExamEditModal();
        }
    };

    document.removeEventListener('keydown', escHandler);
    document.addEventListener('keydown', escHandler);

    // 点击背景关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            hideExamEditModal();
        }
    };
}

// 成绩批改相关函数

// 显示批改弹窗
function showGradeModal(gradeData) {
    const modal = document.getElementById('grade-modal');
    if (!modal) return;

    // 填充基本信息
    document.getElementById('grade-student-name').textContent = gradeData.student.realName || '未知学生';
    document.getElementById('grade-exam-info').textContent = `${gradeData.exam.title} - ${gradeData.exam.course.name}`;
    document.getElementById('grade-ai-score').textContent = gradeData.examResult.score || '--';
    document.getElementById('grade-manual-score').textContent = gradeData.examResult.finalScore || '--';

    // 填充评分表单
    document.getElementById('grade-final-score').value = gradeData.examResult.finalScore || gradeData.examResult.score || '';
    document.getElementById('grade-teacher-comments').value = gradeData.examResult.teacherComments || '';

    // 为最终得分输入框添加事件监听器
    const finalScoreInput = document.getElementById('grade-final-score');
    if (finalScoreInput) {
        finalScoreInput.addEventListener('input', function() {
            const manualScoreDisplay = document.getElementById('grade-manual-score');
            if (manualScoreDisplay) {
                manualScoreDisplay.textContent = this.value || '--';
            }
        });
    }

    // 显示试卷内容
    displayGradeQuestions(gradeData.questions, gradeData.studentAnswers);

    // 保存当前批改数据
    window.currentGradeData = gradeData;

    // 显示弹窗
    modal.style.display = 'flex';

    // 绑定关闭事件
    document.getElementById('close-grade-modal').onclick = hideGradeModal;
}

// 隐藏批改弹窗
function hideGradeModal() {
    const modal = document.getElementById('grade-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentGradeData = null;
}

// 显示试卷题目和学生答案
function displayGradeQuestions(questions, studentAnswers) {
    const container = document.getElementById('grade-questions-container');
    if (!container || !questions) return;

    // 创建学生答案映射
    const answerMap = {};
    if (studentAnswers) {
        studentAnswers.forEach(answer => {
            answerMap[answer.questionId] = answer;
        });
    }

    let questionsHtml = '';
    questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const studentAnswer = answerMap[question.id];

        // 解析选项
        let options = [];
        if (question.options) {
            try {
                options = typeof question.options === 'string' ?
                    JSON.parse(question.options) : question.options;
            } catch (e) {
                console.error('解析选项失败:', e);
            }
        }

        questionsHtml += `
            <div class="grade-question-item" style="margin-bottom: 30px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: white;">
                <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h5 style="margin: 0; color: #2c3e50;">第${questionNumber}题 (${question.score || 10}分)</h5>
                    <span class="question-type" style="padding: 4px 8px; background: #3498db; color: white; border-radius: 4px; font-size: 12px;">
                        ${getQuestionTypeDisplayName(question.type)}
                    </span>
                </div>

                <div class="question-content" style="margin-bottom: 15px; line-height: 1.6;">
                    ${formatTeacherMarkdown(question.content || question.questionText || '')}
                </div>

                ${options.length > 0 ? `
                    <div class="question-options" style="margin-bottom: 15px;">
                        ${options.map((option, i) => {
                            const optionLabel = String.fromCharCode(65 + i);
                            const isSelected = studentAnswer && studentAnswer.answer === optionLabel;
                            return `
                                <div style="padding: 8px; margin: 4px 0; border-radius: 4px; ${isSelected ? 'background: #e3f2fd; border: 1px solid #2196f3;' : 'background: #f8f9fa;'}">
                                    <span style="font-weight: 500; color: #3498db; margin-right: 8px;">${optionLabel}.</span>
                                    ${formatTeacherMarkdown(option)}
                                    ${isSelected ? '<span style="color: #2196f3; margin-left: 8px;"><i class="fas fa-check"></i> 学生选择</span>' : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}

                <div class="student-answer-section" style="margin-bottom: 15px; padding: 12px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                    <h6 style="margin: 0 0 8px 0; color: #856404;">
                        <i class="fas fa-user"></i> 学生答案
                    </h6>
                    <div style="color: #856404;">
                        ${studentAnswer ? formatTeacherMarkdown(studentAnswer.answer || '未作答') : '未作答'}
                    </div>
                </div>

                <div class="correct-answer-section" style="margin-bottom: 15px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
                    <h6 style="margin: 0 0 8px 0; color: #155724;">
                        <i class="fas fa-check-circle"></i> 参考答案
                    </h6>
                    <div style="color: #155724;">
                        ${formatTeacherMarkdown(question.answer || question.correctAnswer || 'N/A')}
                    </div>
                </div>

                ${question.explanation ? `
                    <div class="explanation-section" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px;">
                        <h6 style="margin: 0 0 8px 0; color: #0c5460;">
                            <i class="fas fa-lightbulb"></i> 解析
                        </h6>
                        <div style="color: #0c5460; line-height: 1.6;">
                            ${formatTeacherMarkdown(question.explanation)}
                        </div>
                    </div>
                ` : ''}

                <div class="question-grading-section" style="padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; margin-top: 15px;">
                    <h6 style="margin: 0 0 12px 0; color: #495057;">
                        <i class="fas fa-clipboard-check"></i> 单题评分
                    </h6>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="margin: 0; font-weight: 500; color: #495057;">得分：</label>
                            <input type="number"
                                   id="question-score-${question.id}"
                                   class="question-score-input"
                                   min="0"
                                   max="${question.score || 10}"
                                   value="${studentAnswer && studentAnswer.score !== null ? studentAnswer.score : ''}"
                                   style="width: 80px; padding: 4px 8px; border: 1px solid #ced4da; border-radius: 4px; text-align: center;"
                                   placeholder="0"
                                   onchange="updateTotalScore()">
                            <span style="color: #6c757d;">/ ${question.score || 10}分</span>
                        </div>

                        ${!['multiple-choice', 'choice', 'true-false', 'true_false'].includes(question.type) ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${question.type === 'assignment' || question.type.includes('大作业') ? `
                                <button type="button"
                                        class="btn-ai-detect-assignment"
                                        onclick="aiDetectAssignment(${question.id}, ${studentAnswer ? studentAnswer.id : 'null'})"
                                        style="padding: 6px 12px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.3s ease;"
                                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(231, 76, 60, 0.3)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    <i class="fas fa-search"></i>
                                    <span>AI检测</span>
                                </button>
                            ` : `
                                <button type="button"
                                        class="btn-ai-grade"
                                        onclick="aiGradeQuestion(${question.id}, ${studentAnswer ? studentAnswer.id : 'null'})"
                                        style="padding: 6px 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.3s ease;"
                                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'"
                                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    <i class="fas fa-brain"></i>
                                    <span>AI批改</span>
                                </button>
                            `}
                            <span id="ai-score-display-${question.id}" style="font-size: 12px; color: #666; font-weight: 500; display: none;"></span>
                        </div>
                        ` : ''}

                        <div style="flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px;">
                            <label style="margin: 0; font-weight: 500; color: #495057; white-space: nowrap;">评语：</label>
                            <input type="text"
                                   id="question-feedback-${question.id}"
                                   class="question-feedback-input"
                                   value="${studentAnswer && studentAnswer.teacherFeedback ? studentAnswer.teacherFeedback : ''}"
                                   placeholder="可选：对此题的评语或建议"
                                   style="flex: 1; padding: 6px 12px; border: 1px solid #ced4da; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = questionsHtml;
}

// 更新总分
function updateTotalScore() {
    if (!window.currentGradeData) return;

    const scoreInputs = document.querySelectorAll('.question-score-input');
    let totalScore = 0;

    scoreInputs.forEach(input => {
        const score = parseInt(input.value) || 0;
        totalScore += score;
    });

    // 更新最终得分输入框
    const finalScoreInput = document.getElementById('grade-final-score');
    if (finalScoreInput) {
        finalScoreInput.value = totalScore;
    }

    // 更新右上角的人工评分显示
    const manualScoreDisplay = document.getElementById('grade-manual-score');
    if (manualScoreDisplay) {
        manualScoreDisplay.textContent = totalScore;
    }
}

// 保存评分
async function saveGrade() {
    if (!window.currentGradeData) {
        showNotification('数据异常，请重新打开批改页面', 'error');
        return;
    }

    const finalScore = document.getElementById('grade-final-score').value;
    const teacherComments = document.getElementById('grade-teacher-comments').value;

    // 移除强制最终得分校验，因为可以通过单题评分自动计算

    try {
        showLoading('正在保存评分...');

        // 收集单题评分数据
        const questionScores = [];
        const scoreInputs = document.querySelectorAll('.question-score-input');
        const feedbackInputs = document.querySelectorAll('.question-feedback-input');

        scoreInputs.forEach((scoreInput, index) => {
            const questionId = scoreInput.id.replace('question-score-', '');
            const score = scoreInput.value ? parseInt(scoreInput.value) : null;
            const feedback = feedbackInputs[index] ? feedbackInputs[index].value : '';

            questionScores.push({
                questionId: questionId,
                score: score,
                feedback: feedback
            });
        });

        const gradeData = {
            finalScore: finalScore ? parseFloat(finalScore) : null,
            teacherComments: teacherComments,
            questionScores: questionScores
        };

        const response = await TeacherAPI.manualGrade(window.currentGradeData.examResult.id, gradeData);
        hideLoading();

        if (response.success) {
            showNotification('评分保存成功', 'success');
            hideGradeModal();
            loadGradeList(); // 刷新列表
        } else {
            showNotification('保存失败：' + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('保存评分失败:', error);
        showNotification('保存失败，请重试', 'error');
    }
}

// 显示成绩详情弹窗
// 获取题目类型显示名称
function getQuestionTypeDisplayName(type) {
    const typeMap = {
        'choice': '选择题',
        'single_choice': '单选题',
        'multiple_choice': '多选题',
        'true_false': '判断题',
        'true-false': '判断题',
        'fill_blank': '填空题',
        'fill-blank': '填空题',
        'short_answer': '简答题',
        'short-answer': '简答题',
        'essay': '论述题',
        'calculation': '计算题',
        'case_analysis': '案例分析题',
        'case-analysis': '案例分析题',
        'programming': '编程题'
    };
    return typeMap[type] || type || '未知题型';
}

function showGradeDetailModal(gradeData) {
    const modal = document.getElementById('grade-detail-modal');
    if (!modal) return;

    // 填充基本信息
    document.getElementById('detail-student-name').textContent = gradeData.student.realName || '未知学生';
    document.getElementById('detail-exam-info').textContent = `${gradeData.exam.title} - ${gradeData.exam.course.name}`;
    document.getElementById('detail-final-score').textContent = gradeData.examResult.finalScore || '--';
    document.getElementById('detail-ai-score').textContent = gradeData.examResult.score || '--';
    document.getElementById('detail-submit-time').textContent = formatDateTime(gradeData.examResult.submitTime);
    document.getElementById('detail-grade-status').textContent = getGradeStatusText(gradeData.examResult.gradeStatus);

    // 显示教师评语
    const commentsDiv = document.getElementById('detail-teacher-comments');
    const commentsText = document.getElementById('detail-comments-text');
    if (gradeData.examResult.teacherComments) {
        commentsText.textContent = gradeData.examResult.teacherComments;
        commentsDiv.style.display = 'block';
    } else {
        commentsDiv.style.display = 'none';
    }

    // 显示试卷详情
    displayGradeDetailQuestions(gradeData.questions, gradeData.studentAnswers);

    // 保存当前数据
    window.currentGradeDetailData = gradeData;

    // 显示弹窗
    modal.style.display = 'flex';

    // 绑定关闭事件
    document.getElementById('close-grade-detail-modal').onclick = hideGradeDetailModal;
}

// 隐藏成绩详情弹窗
function hideGradeDetailModal() {
    const modal = document.getElementById('grade-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentGradeDetailData = null;
}

// 渲染题目答案部分
function renderQuestionAnswerSection(question, studentAnswer, options) {
    const questionType = question.type ? question.type.toLowerCase() : '';

    // 大作业题型特殊处理
    if (questionType === 'assignment' || questionType.includes('大作业') || questionType.includes('作业')) {
        return renderAssignmentQuestionSection(question, studentAnswer);
    }

    // 选择题
    if (options.length > 0) {
        return `
            <div class="question-options" style="margin-bottom: 15px;">
                ${options.map((option, i) => {
                    const optionLabel = String.fromCharCode(65 + i);
                    const isSelected = studentAnswer && studentAnswer.answer === optionLabel;
                    const isCorrectOption = question.answer === optionLabel || question.correctAnswer === optionLabel;

                    let optionStyle = 'padding: 8px; margin: 4px 0; border-radius: 4px; background: #f8f9fa;';
                    if (isSelected && isCorrectOption) {
                        optionStyle = 'padding: 8px; margin: 4px 0; border-radius: 4px; background: #d4edda; border: 1px solid #c3e6cb;';
                    } else if (isSelected) {
                        optionStyle = 'padding: 8px; margin: 4px 0; border-radius: 4px; background: #f8d7da; border: 1px solid #f5c6cb;';
                    } else if (isCorrectOption) {
                        optionStyle = 'padding: 8px; margin: 4px 0; border-radius: 4px; background: #d1ecf1; border: 1px solid #bee5eb;';
                    }

                    return `
                        <div style="${optionStyle}">
                            <span style="font-weight: 500; color: #3498db; margin-right: 8px;">${optionLabel}.</span>
                            ${formatTeacherMarkdown(option)}
                            ${isSelected ? '<span style="color: #e74c3c; margin-left: 8px;"><i class="fas fa-user"></i> 学生选择</span>' : ''}
                            ${isCorrectOption ? '<span style="color: #27ae60; margin-left: 8px;"><i class="fas fa-check"></i> 正确答案</span>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // 普通主观题
    return `
        <div style="margin-bottom: 15px;">
            <div style="padding: 8px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 8px;">
                <strong>学生答案：</strong> ${studentAnswer ? formatTeacherMarkdown(studentAnswer.answer) : '未作答'}
            </div>
            <div style="padding: 8px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px;">
                <strong>参考答案：</strong> ${formatTeacherMarkdown(question.answer || question.correctAnswer || 'N/A')}
            </div>
        </div>
    `;
}

// 渲染大作业题目部分
function renderAssignmentQuestionSection(question, studentAnswer) {
    const hasUploadedFile = studentAnswer && studentAnswer.answer && studentAnswer.answer.startsWith('FILE:');
    const fileName = hasUploadedFile ? studentAnswer.answer.replace('FILE:', '') : '';

    let assignmentHtml = `
        <div class="assignment-section" style="margin-bottom: 15px; border: 2px solid #f39c12; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <i class="fas fa-file-upload" style="color: #f39c12; font-size: 18px;"></i>
                <h4 style="margin: 0; color: #d68910; font-weight: 600;">大作业提交</h4>
                <span style="font-size: 12px; background: #f39c12; color: white; padding: 2px 6px; border-radius: 10px;">文档上传</span>
            </div>
    `;

    if (hasUploadedFile) {
        // 显示已上传的文件信息
        assignmentHtml += `
            <div style="background: white; border: 1px solid #ddb84a; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-file-alt" style="color: #27ae60; font-size: 20px;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2c3e50;">${fileName}</div>
                        ${studentAnswer.fileSize ? `<div style="font-size: 12px; color: #7f8c8d;">文件大小: ${formatFileSize(studentAnswer.fileSize)}</div>` : ''}
                        ${studentAnswer.uploadTime ? `<div style="font-size: 12px; color: #7f8c8d;">上传时间: ${formatDateTime(studentAnswer.uploadTime)}</div>` : ''}
                    </div>
                </div>

                <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button type="button" onclick="performAssignmentAIDetection(${studentAnswer.id})"
                            class="btn btn-warning" style="font-size: 12px; padding: 6px 12px;">
                        <i class="fas fa-robot"></i> AI检测评分
                    </button>
                    <button type="button" onclick="downloadAssignmentFile(${studentAnswer.id})"
                            class="btn btn-info" style="font-size: 12px; padding: 6px 12px;">
                        <i class="fas fa-download"></i> 下载文档
                    </button>
                </div>

                <!-- AI检测结果区域 -->
                <div id="ai-detection-result-${studentAnswer.id}" style="margin-top: 15px; display: none;">
                    <!-- AI检测结果将在这里显示 -->
                </div>
            </div>
        `;
    } else {
        // 显示未提交状态
        assignmentHtml += `
            <div style="background: white; border: 1px solid #dc3545; border-radius: 8px; padding: 15px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="color: #dc3545; font-size: 24px; margin-bottom: 10px;"></i>
                <div style="color: #dc3545; font-weight: 600;">学生未提交作业文档</div>
                <div style="color: #6c757d; font-size: 12px; margin-top: 5px;">请联系学生上传作业文档后再进行批改</div>
            </div>
        `;
    }

    assignmentHtml += `</div>`;
    return assignmentHtml;
}

// 执行大作业AI检测
async function performAssignmentAIDetection(studentAnswerId) {
    try {
        showLoading('正在进行AI检测分析...');

        const response = await fetch('/api/teacher/assignment/ai-detect-and-grade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                studentAnswerId: studentAnswerId
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            displayAIDetectionResult(studentAnswerId, result.data);
            showNotification('AI检测完成', 'success');
        } else {
            showNotification(result.message || 'AI检测失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('AI检测失败:', error);
        showNotification('AI检测失败，请重试', 'error');
    }
}

// 显示AI检测结果
function displayAIDetectionResult(studentAnswerId, detectionData) {
    const resultContainer = document.getElementById(`ai-detection-result-${studentAnswerId}`);
    if (!resultContainer) return;

    const riskLevel = detectionData.riskLevel || 'normal';
    const aiProbability = Math.round((detectionData.aiProbability || 0) * 100);
    const suggestedScore = detectionData.suggestedScore || 0;
    const maxScore = detectionData.maxScore || 100;

    let riskColor = '#27ae60';
    let riskText = '正常';

    switch (riskLevel.toLowerCase()) {
        case 'high':
            riskColor = '#e74c3c';
            riskText = '高风险';
            break;
        case 'medium':
            riskColor = '#f39c12';
            riskText = '中等风险';
            break;
        case 'low':
            riskColor = '#f1c40f';
            riskText = '低风险';
            break;
    }

    resultContainer.innerHTML = `
        <div style="border: 1px solid #dee2e6; border-radius: 8px; background: white; overflow: hidden;">
            <div style="background: #f8f9fa; padding: 12px; border-bottom: 1px solid #dee2e6;">
                <h6 style="margin: 0; color: #495057; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-robot"></i> AI检测结果
                </h6>
            </div>

            <div style="padding: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div style="text-align: center; padding: 10px; border: 1px solid ${riskColor}; border-radius: 6px; background: ${riskColor}15;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">风险等级</div>
                        <div style="font-weight: 600; color: ${riskColor};">${riskText}</div>
                    </div>
                    <div style="text-align: center; padding: 10px; border: 1px solid #17a2b8; border-radius: 6px; background: #17a2b815;">
                        <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">AI概率</div>
                        <div style="font-weight: 600; color: #17a2b8;">${aiProbability}%</div>
                    </div>
                </div>

                <div style="background: #e8f5e8; border: 1px solid #c3e6cb; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-weight: 600; color: #155724;">AI建议评分</span>
                        <span style="font-size: 18px; font-weight: 700; color: #155724;">${suggestedScore}/${maxScore}分</span>
                    </div>
                    <div style="font-size: 12px; color: #155724;">
                        基于AI检测结果的建议分数，教师可参考此分数进行最终评分
                    </div>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button type="button" onclick="applyAISuggestedScore(${studentAnswerId}, ${suggestedScore})"
                            class="btn btn-success" style="font-size: 12px; padding: 6px 12px;">
                        <i class="fas fa-check"></i> 采用AI建议
                    </button>
                    <button type="button" onclick="showDetailedAIReport(${studentAnswerId})"
                            class="btn btn-info" style="font-size: 12px; padding: 6px 12px;">
                        <i class="fas fa-eye"></i> 详细报告
                    </button>
                </div>
            </div>
        </div>
    `;

    // 保存检测数据用于后续操作
    window.aiDetectionResults = window.aiDetectionResults || {};
    window.aiDetectionResults[studentAnswerId] = detectionData;

    resultContainer.style.display = 'block';
}

// 采用AI建议分数
async function applyAISuggestedScore(studentAnswerId, suggestedScore) {
    // 这里可以直接更新批改界面的分数输入框
    showNotification(`已采用AI建议分数：${suggestedScore}分`, 'success');

    // 如果当前正在批改界面，更新分数
    const scoreInput = document.querySelector(`input[data-student-answer-id="${studentAnswerId}"]`);
    if (scoreInput) {
        scoreInput.value = suggestedScore;
    }
}

// AI检测大作业
async function aiDetectAssignment(questionId, studentAnswerId) {
    if (!studentAnswerId || studentAnswerId === 'null') {
        showNotification('学生未提交答案', 'warning');
        return;
    }

    try {
        showLoading('正在进行AI检测分析，请稍候...');

        const response = await fetch('/api/teacher/assignment/ai-detect-and-grade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                studentAnswerId: studentAnswerId
            })
        });

        const result = await response.json();
        hideLoading();

        if (result.success) {
            displayAssignmentDetectionResult(questionId, studentAnswerId, result.data);
            showNotification('AI检测分析完成', 'success');
        } else {
            showNotification(result.message || 'AI检测失败', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('AI检测大作业失败:', error);
        showNotification('AI检测失败，请重试', 'error');
    }
}

function displayAssignmentDetectionResult(questionId, studentAnswerId, detectionData) {
    // 查找现有的结果容器或创建新的
    let resultContainer = document.getElementById(`assignment-detection-result-${questionId}`);

    if (!resultContainer) {
        // 在题目区域后面插入结果容器
        const questionSection = document.querySelector(`[data-question-id="${questionId}"]`) ||
                               document.querySelector('.grade-question-item');

        resultContainer = document.createElement('div');
        resultContainer.id = `assignment-detection-result-${questionId}`;
        resultContainer.style.marginTop = '15px';

        if (questionSection) {
            questionSection.appendChild(resultContainer);
        } else {
            document.body.appendChild(resultContainer);
        }
    }

    const riskLevel = detectionData.riskLevel || 'low';
    const aiProbability = (detectionData.aiProbability * 100).toFixed(1);
    const suggestedScore = detectionData.suggestedScore || 0;
    const maxScore = detectionData.maxScore || 10;

    // 根据风险等级设置颜色
    let riskColor, riskText, riskIcon;
    switch(riskLevel.toLowerCase()) {
        case 'high':
            riskColor = '#e74c3c';
            riskText = '高风险';
            riskIcon = 'fas fa-exclamation-triangle';
            break;
        case 'medium':
            riskColor = '#f39c12';
            riskText = '中等风险';
            riskIcon = 'fas fa-exclamation-circle';
            break;
        default:
            riskColor = '#27ae60';
            riskText = '低风险';
            riskIcon = 'fas fa-check-circle';
    }

    resultContainer.innerHTML = `
        <div style="border: 2px solid ${riskColor}; border-radius: 12px; padding: 20px; background: linear-gradient(135deg, ${riskColor}11 0%, ${riskColor}22 100%);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                <i class="${riskIcon}" style="color: ${riskColor}; font-size: 18px;"></i>
                <h4 style="margin: 0; color: ${riskColor}; font-weight: 600;">AI检测结果</h4>
                <span style="font-size: 12px; background: ${riskColor}; color: white; padding: 2px 6px; border-radius: 10px;">${riskText}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: ${riskColor};">${aiProbability}%</div>
                    <div style="font-size: 12px; color: #666;">AI生成概率</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #3498db;">${suggestedScore}/${maxScore}</div>
                    <div style="font-size: 12px; color: #666;">建议分数</div>
                </div>
            </div>

            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h6 style="margin: 0 0 8px 0; color: #2c3e50;">
                    <i class="fas fa-file-alt"></i> 文档信息
                </h6>
                <div style="font-size: 13px; color: #666;">
                    <div><strong>文件名:</strong> ${detectionData.fileName || '未知'}</div>
                    <div><strong>文件大小:</strong> ${formatFileSize(detectionData.fileSize || 0)}</div>
                    <div><strong>上传时间:</strong> ${detectionData.uploadTime ? formatDateTime(detectionData.uploadTime) : '未知'}</div>
                </div>
            </div>

            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="applyAISuggestedScore(${studentAnswerId}, ${suggestedScore})"
                        class="btn btn-success" style="font-size: 12px; padding: 6px 12px;">
                    <i class="fas fa-check"></i> 采用建议分数
                </button>
                <button type="button" onclick="showDetailedDetectionReport(${studentAnswerId})"
                        class="btn btn-info" style="font-size: 12px; padding: 6px 12px;">
                    <i class="fas fa-eye"></i> 详细检测报告
                </button>
                <button type="button" onclick="hideDetectionResult('${questionId}')"
                        class="btn btn-secondary" style="font-size: 12px; padding: 6px 12px;">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        </div>
    `;

    // 保存检测数据用于后续操作
    window.assignmentDetectionResults = window.assignmentDetectionResults || {};
    window.assignmentDetectionResults[studentAnswerId] = detectionData;

    resultContainer.style.display = 'block';
}

function hideDetectionResult(questionId) {
    const resultContainer = document.getElementById(`assignment-detection-result-${questionId}`);
    if (resultContainer) {
        resultContainer.style.display = 'none';
    }
}

function showDetailedDetectionReport(studentAnswerId) {
    const detectionData = window.assignmentDetectionResults?.[studentAnswerId];
    if (!detectionData) {
        showNotification('检测数据不存在', 'error');
        return;
    }

    // 创建详细报告模态框
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
            <div class="modal-header">
                <h3><i class="fas fa-search"></i> AI检测详细报告</h3>
                <button class="modal-close" onclick="closeDetailedReport()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body" style="max-height: 600px; overflow-y: auto;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">检测概要</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: ${detectionData.riskLevel === 'high' ? '#e74c3c' : detectionData.riskLevel === 'medium' ? '#f39c12' : '#27ae60'};">
                                ${(detectionData.aiProbability * 100).toFixed(1)}%
                            </div>
                            <div style="font-size: 12px; color: #666;">AI生成概率</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #3498db;">
                                ${detectionData.suggestedScore}/${detectionData.maxScore}
                            </div>
                            <div style="font-size: 12px; color: #666;">建议分数</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold; color: #9b59b6;">
                                ${detectionData.riskLevel === 'high' ? '高风险' : detectionData.riskLevel === 'medium' ? '中等风险' : '低风险'}
                            </div>
                            <div style="font-size: 12px; color: #666;">风险等级</div>
                        </div>
                    </div>
                </div>

                <div style="background: white; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px;">
                    <h4 style="margin: 0 0 10px 0; color: #2c3e50;">AI分析报告</h4>
                    <div style="color: #666; line-height: 1.6; font-size: 14px;">
                        ${detectionData.detectionReport || '暂无详细报告'}
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeDetailedReport()">
                    <i class="fas fa-times"></i> 关闭
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    window.currentDetailedReportModal = modal;
}

function closeDetailedReport() {
    if (window.currentDetailedReportModal) {
        window.currentDetailedReportModal.remove();
        window.currentDetailedReportModal = null;
    }
}

// 显示详细AI报告
function showDetailedAIReport(studentAnswerId) {
    const detectionData = window.aiDetectionResults && window.aiDetectionResults[studentAnswerId];
    if (!detectionData) {
        showNotification('AI检测数据不存在', 'error');
        return;
    }

    // 显示详细报告弹窗（可以实现一个模态框）
    alert('详细AI报告功能待实现'); // 临时处理
}

// 下载大作业文档
async function downloadAssignmentFile(studentAnswerId) {
    try {
        showLoading('正在准备下载...');

        const response = await fetch(`/api/teacher/assignment/${studentAnswerId}/download`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assignment_${studentAnswerId}.pdf`; // 默认文件名
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('文档下载成功', 'success');
        } else {
            showNotification('文档下载失败', 'error');
        }

    } catch (error) {
        console.error('下载失败:', error);
        showNotification('下载失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

// 显示成绩详情的试卷内容
function displayGradeDetailQuestions(questions, studentAnswers) {
    const container = document.getElementById('detail-questions-container');
    if (!container || !questions) return;

    // 创建学生答案映射
    const answerMap = {};
    if (studentAnswers) {
        studentAnswers.forEach(answer => {
            answerMap[answer.questionId] = answer;
        });
    }

    let questionsHtml = '';
    questions.forEach((question, index) => {
        const questionNumber = index + 1;
        const studentAnswer = answerMap[question.id];

        // 解析选项
        let options = [];
        if (question.options) {
            try {
                options = typeof question.options === 'string' ?
                    JSON.parse(question.options) : question.options;
            } catch (e) {
                console.error('解析选项失败:', e);
            }
        }

        // 判断答案是否正确
        const isCorrect = studentAnswer &&
            (studentAnswer.answer === question.answer ||
             studentAnswer.answer === question.correctAnswer);

        questionsHtml += `
            <div class="detail-question-item" style="margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: white;">
                <div class="question-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h5 style="margin: 0; color: #2c3e50;">第${questionNumber}题 (${question.score || 10}分)</h5>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="question-type" style="padding: 4px 8px; background: #3498db; color: white; border-radius: 4px; font-size: 12px;">
                        ${getQuestionTypeDisplayName(question.type)}
                        </span>
                        <span class="answer-status" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; ${isCorrect ? 'background: #27ae60; color: white;' : 'background: #e74c3c; color: white;'}">
                            ${isCorrect ? '正确' : '错误'}
                        </span>
                    </div>
                </div>

                <div class="question-content" style="margin-bottom: 15px; line-height: 1.6;">
                    ${formatTeacherMarkdown(question.content || question.questionText || '')}
                </div>

                ${renderQuestionAnswerSection(question, studentAnswer, options)}

                ${question.explanation ? `
                    <div class="explanation-section" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px;">
                        <h6 style="margin: 0 0 8px 0; color: #0c5460;">
                            <i class="fas fa-lightbulb"></i> 解析
                        </h6>
                        <div style="color: #0c5460; line-height: 1.6;">
                            ${formatTeacherMarkdown(question.explanation)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = questionsHtml;
}

// 从详情页面重新批改
function editGradeFromDetail() {
    if (window.currentGradeDetailData) {
        hideGradeDetailModal();
        showGradeModal(window.currentGradeDetailData);
    }
}

// 格式化日期时间
function formatDateTime(dateTime) {
    if (!dateTime) return '--';

    try {
        const date = new Date(dateTime);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateTime;
    }
}

// 发布选中考试的成绩
async function publishSelectedExamGrades() {
    try {
        // 获取选中的试卷
        const checkedBoxes = document.querySelectorAll('.grade-checkbox:checked');
        const visibleCheckedBoxes = Array.from(checkedBoxes).filter(checkbox =>
            checkbox.closest('tr').style.display !== 'none'
        );

        if (visibleCheckedBoxes.length > 0) {
            // 批量发布选中的试卷成绩
            const confirmed = await showConfirmDialog(
                '批量发布成绩',
                `确定要发布选中的 ${visibleCheckedBoxes.length} 份试卷的成绩吗？\n\n发布后学生将能够查看这些考试的成绩。`,
                '发布成绩'
            );
            if (!confirmed) return;

            showLoading(`正在批量发布 ${visibleCheckedBoxes.length} 份试卷成绩...`);

            // 获取所有选中试卷的考试ID
            const examIds = new Set();
            visibleCheckedBoxes.forEach(checkbox => {
                const row = checkbox.closest('tr');
                const examId = row.getAttribute('data-exam-id');
                if (examId) {
                    examIds.add(examId);
                }
            });

            let successCount = 0;
            let errorCount = 0;

            // 批量发布每个考试的成绩
            for (const examId of examIds) {
                try {
                    const response = await TeacherAPI.publishGrades(examId, true);
                    if (response.success) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`发布考试${examId}成绩失败:`, error);
                }
            }

            hideLoading();

            if (successCount > 0) {
                showNotification(`批量发布成绩完成，成功发布 ${successCount} 个考试的成绩${errorCount > 0 ? `，失败 ${errorCount} 个` : ''}`, 'success');
                loadGradeList(); // 刷新列表
            } else {
                showNotification('批量发布成绩失败，请重试', 'error');
            }

        } else {
            // 原有逻辑：如果没有选中试卷，发布整个考试的成绩
        const examFilter = document.getElementById('grade-exam-filter');
        const selectedExamId = examFilter?.value;

        if (!selectedExamId) {
                showNotification('请先选择要发布成绩的考试或勾选要发布的试卷', 'warning');
            return;
        }

            const confirmed = await showConfirmDialog(
                '发布考试成绩',
                '确定要发布所选考试的成绩吗？发布后学生将能够查看成绩。',
                '发布成绩'
            );
        if (!confirmed) return;

        showLoading('正在发布成绩...');
        const response = await TeacherAPI.publishGrades(selectedExamId, true);
        hideLoading();

        if (response.success) {
            showNotification(response.message, 'success');
            loadGradeList(); // 刷新列表
        } else {
            showNotification('发布失败：' + response.message, 'error');
            }
        }
    } catch (error) {
        hideLoading();
        console.error('发布成绩失败:', error);
        showNotification('发布失败，请重试', 'error');
    }
}

// 发布或取消发布单个考试的成绩
async function publishSingleGrade(examId, resultId, isCurrentlyPublished) {
    try {
        const action = isCurrentlyPublished ? '取消发布' : '发布';
        const actionDescription = isCurrentlyPublished ?
            '取消发布后，该考试的所有学生将无法查看成绩。' :
            '发布后，该考试的所有学生将能够查看成绩。';

        const confirmed = await showConfirmDialog(
            `${action}考试成绩`,
            `确定要${action}此考试的成绩吗？\n\n${actionDescription}`,
            action
        );
        if (!confirmed) return;

        showLoading(`正在${action}成绩...`);
        const response = await TeacherAPI.publishGrades(examId, !isCurrentlyPublished);
        hideLoading();

        if (response.success) {
            showNotification(`成绩${action}成功`, 'success');
            loadGradeList(); // 刷新列表
        } else {
            showNotification(`${action}失败：` + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error(`${isCurrentlyPublished ? '取消发布' : '发布'}成绩失败:`, error);
        showNotification(`${isCurrentlyPublished ? '取消发布' : '发布'}失败，请重试`, 'error');
    }
}

// 取消发布成绩
async function unpublishExamGrades(examId) {
    try {
        const confirmed = confirm('确定要取消发布此考试的成绩吗？');
        if (!confirmed) return;

        showLoading('正在取消发布...');
        const response = await TeacherAPI.publishGrades(examId, false);
        hideLoading();

        if (response.success) {
            showNotification(response.message, 'success');
            loadGradeList(); // 刷新列表
        } else {
            showNotification('操作失败：' + response.message, 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('取消发布失败:', error);
        showNotification('操作失败，请重试', 'error');
    }
}

// 更新编辑预览
function updateExamPreview() {
    const editor = document.getElementById('exam-markdown-editor');
    const preview = document.getElementById('exam-preview-panel');

    if (!editor || !preview) return;

    const markdown = editor.value.trim();

    if (!markdown) {
        preview.innerHTML = `
            <div style="color: #95a5a6; text-align: center; padding: 50px; font-style: italic;">
                开始编辑以查看预览...
            </div>
        `;
        return;
    }

    try {
        console.log('正在解析Markdown:', markdown);
        // 解析Markdown并渲染预览
        const examData = parseExamMarkdownToData(markdown);
        console.log('解析出的试卷数据:', examData);
        renderExamPreviewFromData(examData);
    } catch (error) {
        console.error('Markdown解析失败:', error);
        preview.innerHTML = `
            <div style="color: #e74c3c; text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                预览解析失败<br>
                <small style="font-size: 12px; margin-top: 5px; display: block;">${error.message}</small>
            </div>
        `;
    }
}

// 根据数据渲染编辑预览
function renderExamPreviewFromData(examData, container = null) {
    const preview = container || document.getElementById('exam-preview-panel');

    console.log('renderExamPreviewFromData 被调用，examData:', examData);
    console.log('examData.questions:', examData.questions);
    console.log('questions 长度:', examData.questions ? examData.questions.length : 'undefined');

    if (!examData.questions || examData.questions.length === 0) {
        console.log('没有题目数据，显示暂无题目内容');
        preview.innerHTML = `
            <div style="color: #7f8c8d; text-align: center; padding: 30px; font-style: italic;">
                暂无题目内容
            </div>
        `;
        return;
    }

    let previewHtml = '';

    examData.questions.forEach((question, index) => {
        const questionNumber = index + 1;

        previewHtml += `
            <div class="preview-question" style="margin-bottom: 25px; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; background: #fafbfc;">
                <div class="preview-question-header" style="margin-bottom: 10px;">
                    <span style="color: #3498db; font-weight: 600; font-size: 14px;">第${questionNumber}题 (${question.score || 10}分)</span>
                    ${question.knowledgePoint ? `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">知识点：${question.knowledgePoint}</span>` : ''}
                </div>

                <div class="preview-question-content" style="margin-bottom: 15px; line-height: 1.6;">
                    ${formatTeacherMarkdown(question.content || question.questionText || '')}
                </div>

                ${renderPreviewOptions(question)}

                ${(question.correctAnswer || question.answer || question.correct || question.solution) ? `
                    <div style="margin-top: 10px; padding: 8px; background: #d4edda; border-radius: 4px; font-size: 13px;">
                        <strong style="color: #155724;">参考答案：</strong>
                        <div style="color: #155724; margin-top: 4px;">${formatTeacherMarkdown(question.correctAnswer || question.answer || question.correct || question.solution)}</div>
                    </div>
                ` : ''}

                ${(question.explanation || question.analysis || question.solution_detail || question.rationale) ? `
                    <div style="margin-top: 8px; padding: 8px; background: #d1ecf1; border-radius: 4px; font-size: 13px;">
                        <strong style="color: #0c5460;">解析：</strong>
                        <div style="color: #0c5460; margin-top: 4px;">${formatTeacherMarkdown(question.explanation || question.analysis || question.solution_detail || question.rationale)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    });

    preview.innerHTML = previewHtml;
}

// 渲染预览选项
function renderPreviewOptions(question) {
    if (!question.options) {
        return '';
    }

    // 确保options是数组
    let options = [];
    if (Array.isArray(question.options)) {
        options = question.options;
    } else if (typeof question.options === 'string') {
        // 如果是字符串，尝试解析
        try {
            options = JSON.parse(question.options);
        } catch (e) {
            // 如果解析失败，按行分割
            options = question.options.split('\n').filter(opt => opt.trim());
        }
    } else if (typeof question.options === 'object') {
        // 如果是对象，转换为数组
        options = Object.values(question.options);
    }

    if (!options || options.length === 0) {
        return '';
    }

    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
    let optionsHtml = '<div class="preview-options" style="margin: 10px 0;">';

    options.forEach((option, index) => {
        const label = optionLabels[index] || (index + 1);
        // 检查选项是否已经包含标签，如果有则去掉
        const cleanOption = option.replace(/^[A-Z]\.\s*/, '');
        optionsHtml += `
            <div style="margin: 5px 0; font-size: 13px;">
                <span style="font-weight: 500; color: #3498db; margin-right: 5px;">${label}.</span>
                <span>${formatTeacherMarkdown(cleanOption)}</span>
            </div>
        `;
    });

    optionsHtml += '</div>';
    return optionsHtml;
}

// 隐藏试卷编辑模态框
function hideExamEditModal() {
    const modal = document.getElementById('exam-edit-modal');
    modal.style.display = 'none';
    modal.removeAttribute('data-exam-id');

    // 清空编辑器
    const editor = document.getElementById('exam-markdown-editor');
    if (editor) editor.value = '';

    // 清空预览
    const preview = document.getElementById('exam-preview-panel');
    if (preview) {
        preview.innerHTML = `
            <div style="color: #95a5a6; text-align: center; padding: 50px; font-style: italic;">
                开始编辑以查看预览...
            </div>
        `;
    }
}

// 保存试卷编辑
async function saveExamEdit() {
    try {
        const modal = document.getElementById('exam-edit-modal');
        const examId = modal.getAttribute('data-exam-id');
        const editor = document.getElementById('exam-markdown-editor');

        if (!examId || !editor) {
            throw new Error('无法获取试卷信息');
        }

        const markdown = editor.value.trim();
        if (!markdown) {
            showNotification('试卷内容不能为空', 'warning');
            return;
        }

        showLoading('保存试卷修改...');

        // 解析Markdown内容
        const examData = parseExamMarkdown(markdown);

        // 调用API保存
        const response = await TeacherAPI.updateExam(examId, markdown);

        if (!response.success) {
            throw new Error(response.message || '保存试卷失败');
        }

        hideLoading();
        hideExamEditModal();
        showNotification('试卷保存成功', 'success');

        // 刷新试卷列表
        if (typeof loadExamList === 'function') {
            await loadExamList();
        }

    } catch (error) {
        console.error('保存试卷编辑失败:', error);
        hideLoading();
        showNotification('保存试卷失败: ' + error.message, 'error');
    }
}

// AI单题批改功能
async function aiGradeQuestion(questionId, studentAnswerId) {
    if (!questionId || !studentAnswerId) {
        showNotification('题目信息不完整，无法进行AI批改', 'error');
        return;
    }

    try {
        // 更新按钮状态
        const button = document.querySelector(`button[onclick="aiGradeQuestion(${questionId}, ${studentAnswerId})"]`);
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI批改中...';
            button.style.background = '#95a5a6';
        }

        console.log('开始AI批改 - 题目ID:', questionId, '学生答案ID:', studentAnswerId);

        // 调用AI批改API
        const response = await fetch('/api/teacher/grades/ai-grade-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questionId: questionId,
                studentAnswerId: studentAnswerId
            })
        });

        const result = await response.json();

        if (result.success) {
            const aiScore = result.data.aiScore;
            const maxScore = result.data.maxScore;

            // 显示AI评分结果
            const scoreDisplay = document.getElementById(`ai-score-display-${questionId}`);
            if (scoreDisplay) {
                scoreDisplay.textContent = `AI评分: ${aiScore}/${maxScore}分`;
                scoreDisplay.style.display = 'inline';
                scoreDisplay.style.color = '#27ae60';
                scoreDisplay.style.fontWeight = 'bold';
            }

            // 显示应用按钮
            if (button) {
                button.innerHTML = `
                    <i class="fas fa-check"></i>
                    <span>应用此分数</span>
                `;
                button.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';
                button.disabled = false;
                button.onclick = () => applyAiScore(questionId, studentAnswerId, aiScore);
            }

            showNotification(`AI批改完成：${aiScore}/${maxScore}分`, 'success');

        } else {
            throw new Error(result.message || 'AI批改失败');
        }

    } catch (error) {
        console.error('AI批改失败:', error);
        showNotification('AI批改失败：' + error.message, 'error');

        // 恢复按钮状态
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-brain"></i> <span>AI批改</span>';
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }
}

// 应用AI评分
async function applyAiScore(questionId, studentAnswerId, aiScore) {
    try {
        showLoading('正在应用AI评分...');

        // 调用应用AI评分API
        const response = await fetch('/api/teacher/grades/apply-ai-score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentAnswerId: studentAnswerId,
                aiScore: aiScore
            })
        });

        const result = await response.json();

        if (result.success) {
            // 更新分数输入框
            const scoreInput = document.getElementById(`question-score-${questionId}`);
            if (scoreInput) {
                scoreInput.value = aiScore;
                // 触发change事件以更新总分
                scoreInput.dispatchEvent(new Event('change'));
            }

            // 更新反馈输入框
            const feedbackInput = document.getElementById(`question-feedback-${questionId}`);
            if (feedbackInput) {
                feedbackInput.value = 'AI智能评分';
            }

            // 隐藏AI评分显示和按钮
            const scoreDisplay = document.getElementById(`ai-score-display-${questionId}`);
            if (scoreDisplay) {
                scoreDisplay.style.display = 'none';
            }

            const button = document.querySelector(`button[onclick*="applyAiScore(${questionId}"]`);
            if (button) {
                button.innerHTML = '<i class="fas fa-check-circle"></i> <span>已应用</span>';
                button.style.background = '#95a5a6';
                button.disabled = true;
            }

            hideLoading();
            showNotification('AI评分已应用', 'success');

        } else {
            throw new Error(result.message || '应用AI评分失败');
        }

    } catch (error) {
        hideLoading();
        console.error('应用AI评分失败:', error);
        showNotification('应用AI评分失败：' + error.message, 'error');
    }
}

// AI批改整个试卷
async function aiGradeExam(resultId) {
    try {
        // 显示确认对话框
        const confirmResult = await showConfirmDialog(
            'AI批改确认',
            '确定要对这份试卷进行AI批改吗？\n\n系统将自动评分所有主观题，并计算总分。\n\n注意：此操作将覆盖已有的AI评分。',
            '确定批改'
        );

        if (!confirmResult) {
            return;
        }

        showLoading('正在获取试卷详情...');

        // 先获取试卷详情
        const response = await TeacherAPI.getGradeDetail(resultId);

        if (!response.success) {
            throw new Error(response.message || '获取试卷详情失败');
        }

        const gradeData = response.data;
        const questions = gradeData.questions;
        const studentAnswers = gradeData.studentAnswers;

        // 筛选出需要AI评分的题目（主观题）
        const subjectiveQuestions = questions.filter(question => {
            const questionType = question.type;
            return !['multiple-choice', 'choice', 'true-false', 'true_false'].includes(questionType);
        });

        if (subjectiveQuestions.length === 0) {
            hideLoading();
            showNotification('此试卷没有需要AI批改的主观题', 'warning');
            return;
        }

        hideLoading();
        showLoading(`正在AI批改 ${subjectiveQuestions.length} 道主观题，请稍候...`);

        let totalAiScore = 0;
        let processedCount = 0;
        let aiGradedResults = [];

        // 调用整卷AI批改API
        const aiResponse = await fetch('/api/teacher/grades/ai-grade-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resultId: resultId
            })
        });

        const aiResult = await aiResponse.json();

        if (aiResult.success) {
            processedCount = aiResult.data.processedCount;
            totalAiScore = aiResult.data.totalAiScore;
            aiGradedResults = aiResult.data.gradingResults;
        } else {
            throw new Error(aiResult.message || 'AI批改失败');
        }

        hideLoading();

        if (processedCount > 0) {
            // 显示批改结果
            const resultMessage = `
                AI批改完成！

                成功处理：${processedCount} 道题
                主观题总分：${totalAiScore} 分

                详细结果：
                ${aiGradedResults.map((result, index) =>
                    `${index + 1}. ${result.questionContent}\n   学生答案：${result.studentAnswer}\n   AI评分：${result.aiScore}/${result.maxScore}分`
                ).join('\n\n')}
            `;

            showNotification('AI批改完成，总分已更新到AI评分列', 'success');

            // 显示详细结果对话框
            await showConfirmDialog(
                'AI批改结果',
                resultMessage,
                '确定'
            );

            // 刷新成绩列表
            await loadGradeList();

        } else {
            showNotification('AI批改失败，未能成功处理任何题目', 'error');
        }

    } catch (error) {
        hideLoading();
        console.error('AI批改试卷失败:', error);
        showNotification('AI批改失败：' + error.message, 'error');
    }
}

// ===============================
// 我的报告功能
// ===============================

// 自动保存报告到数据库
async function autoSaveReportToDatabase() {
    if (!window.currentImprovements) return;

    try {
        // 生成文件名
        const now = new Date();
        const dateStr = now.getFullYear() +
                       String(now.getMonth() + 1).padStart(2, '0') +
                       String(now.getDate()).padStart(2, '0') + '_' +
                       String(now.getHours()).padStart(2, '0') +
                       String(now.getMinutes()).padStart(2, '0');

        let fileName = `教学改进建议_${window.currentImprovements.scopeText}`;
        if (window.currentImprovements.courseText) {
            fileName += `_${window.currentImprovements.courseText}`;
        }
        fileName += `_${dateStr}.pdf`;

        const reportData = {
            title: `教学改进建议 - ${window.currentImprovements.courseText || '未知课程'}`,
            content: window.currentImprovements.content,
            fileName: fileName,
            analysisScope: window.currentImprovements.scope || 'COURSE',
            scopeText: window.currentImprovements.scopeText,
            courseId: window.currentImprovements.courseId,
            courseText: window.currentImprovements.courseText
        };

        const response = await fetch('/api/teaching-reports/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(reportData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('报告已自动保存到数据库:', result.data);
            showNotification('报告已自动保存', 'success');
        } else {
            console.error('保存报告到数据库失败:', result.message);
            showNotification('保存报告失败：' + result.message, 'warning');
        }

    } catch (error) {
        console.error('保存报告到数据库时出错:', error);
        showNotification('保存报告时出错，请重试', 'warning');
    }
}

// 显示"我的报告"按钮
function showMyReportsButton() {
    const myReportsBtn = document.getElementById('my-reports-btn');
    if (myReportsBtn) {
        myReportsBtn.style.display = 'inline-block';
        console.log('显示"我的报告"按钮');
    }
}

// 显示"我的报告"弹窗
async function showMyReportsModal() {
    const modal = document.getElementById('myReportsModal');
    if (!modal) return;

    // 显示弹窗
    modal.style.display = 'flex';

    // 加载报告列表
    await loadReportsList();

    // 绑定关闭事件
    const closeBtn = document.getElementById('close-my-reports-modal');
    if (closeBtn) {
        closeBtn.onclick = closeMyReportsModal;
    }

    // 点击遮罩关闭
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeMyReportsModal();
        }
    };
}

// 关闭"我的报告"弹窗
function closeMyReportsModal() {
    const modal = document.getElementById('myReportsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 加载报告列表
async function loadReportsList() {
    try {
        const response = await fetch('/api/teaching-reports/list', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            displayReportsList(result.data || []);
        } else {
            showNotification('获取报告列表失败：' + result.message, 'error');
            displayReportsList([]);
        }

    } catch (error) {
        console.error('获取报告列表失败:', error);
        showNotification('获取报告列表失败，请重试', 'error');
        displayReportsList([]);
    }
}

// 显示报告列表
function displayReportsList(reports) {
    const reportsContainer = document.getElementById('reports-list');
    const emptyState = document.getElementById('empty-reports');
    const reportsCount = document.getElementById('reports-count');
    const clearAllBtn = document.getElementById('clear-all-btn');

    // 更新报告数量
    if (reportsCount) {
        reportsCount.textContent = reports.length;
    }

    // 显示/隐藏清空按钮
    if (clearAllBtn) {
        clearAllBtn.style.display = reports.length > 0 ? 'inline-block' : 'none';
    }

    if (reports.length === 0) {
        // 显示空状态
        if (reportsContainer) reportsContainer.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    // 隐藏空状态
    if (emptyState) emptyState.style.display = 'none';

    // 生成报告列表HTML
    const reportsHTML = reports.map(report => {
        const createdDate = new Date(report.createdAt).toLocaleString('zh-CN');
        const previewText = report.content ? report.content.substring(0, 100).replace(/[#*`]/g, '') + '...' : '无内容预览';

        return `
            <div class="report-item" data-report-id="${report.id}">
                <div class="report-header">
                    <div>
                        <h5 class="report-title">${report.title}</h5>
                        <div class="report-meta">
                            <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                            <span><i class="fas fa-file"></i> ${report.fileName}</span>
                            ${report.courseText ? `<span><i class="fas fa-book"></i> ${report.courseText}</span>` : ''}
                        </div>
                    </div>
                    <div class="report-actions">
                        <button class="btn btn-sm btn-primary" onclick="viewReport(${report.id})" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="downloadReport(${report.id})" title="重新下载">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReport(${report.id})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="report-content-preview">
                    ${previewText}
                </div>
                <div class="report-tags">
                    <span class="report-tag scope-${report.analysisScope || 'course'}">${report.scopeText || '单个课程'}</span>
                    <span class="report-tag"><i class="fas fa-robot"></i> AI生成</span>
                </div>
            </div>
        `;
    }).join('');

    if (reportsContainer) {
        reportsContainer.innerHTML = reportsHTML;
    }
}

// 查看报告详情
async function viewReport(reportId) {
    try {
        const response = await fetch(`/api/teaching-reports/${reportId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
            showNotification('获取报告详情失败：' + result.message, 'error');
            return;
        }

        const report = result.data;

        // 创建详情查看弹窗
        const detailModal = document.createElement('div');
        detailModal.className = 'report-detail-modal';
        detailModal.innerHTML = `
            <div class="report-detail-content">
                <div class="report-detail-header">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <h4 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">
                            ${report.title}
                        </h4>
                    </div>
                    <button onclick="closeReportDetail()" style="background: rgba(255, 255, 255, 0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s ease;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="report-detail-body">
                    <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px;">
                            <div><strong>生成时间：</strong>${report.generatedAt || report.createdAt}</div>
                            <div><strong>分析范围：</strong>${report.scopeText}</div>
                            <div><strong>课程：</strong>${report.courseText || '未知课程'}</div>
                            <div><strong>文件名：</strong>${report.fileName}</div>
                        </div>
                    </div>
                    <div class="improvements-content" style="background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                        ${formatImprovementsContent(report.content)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(detailModal);

        // 添加关闭功能
        window.closeReportDetail = function() {
            document.body.removeChild(detailModal);
            delete window.closeReportDetail;
        };

        // 点击遮罩关闭
        detailModal.onclick = function(e) {
            if (e.target === detailModal) {
                window.closeReportDetail();
            }
        };

    } catch (error) {
        console.error('查看报告详情失败:', error);
        showNotification('查看报告详情失败，请重试', 'error');
    }
}

// 下载报告
async function downloadReport(reportId) {
    try {
        // 先获取报告详情
        const response = await fetch(`/api/teaching-reports/${reportId}`, {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
            showNotification('获取报告信息失败：' + result.message, 'error');
            return;
        }

        const report = result.data;

        // 临时设置当前改进建议数据
        const originalImprovements = window.currentImprovements;
        window.currentImprovements = {
            content: report.content,
            scope: report.analysisScope,
            courseId: report.courseId,
            scopeText: report.scopeText,
            courseText: report.courseText,
            generatedAt: report.generatedAt || report.createdAt
        };

        // 生成PDF
        showNotification('正在重新生成PDF，请稍候...', 'info');
        await generateChinesePDF(report.fileName);

        // 更新下载次数
        await fetch(`/api/teaching-reports/${reportId}/download`, {
            method: 'POST',
            credentials: 'include'
        });

        // 恢复原始数据
        setTimeout(() => {
            window.currentImprovements = originalImprovements;
        }, 1000);

    } catch (error) {
        console.error('下载报告失败:', error);
        showNotification('下载失败，请重试', 'error');
    }
}

// 删除报告
async function deleteReport(reportId) {
    try {
        const confirmed = await showConfirmDialog(
            '删除报告',
            '确定要删除这个报告吗？删除后无法恢复。',
            '删除'
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(`/api/teaching-reports/${reportId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('报告已删除', 'success');
            // 重新加载列表
            await loadReportsList();
        } else {
            showNotification('删除失败：' + result.message, 'error');
        }

    } catch (error) {
        console.error('删除报告失败:', error);
        showNotification('删除失败，请重试', 'error');
    }
}

// 清空所有报告
async function clearAllReports() {
    try {
        const confirmed = await showConfirmDialog(
            '清空所有报告',
            '确定要清空所有报告吗？此操作无法恢复。',
            '清空'
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch('/api/teaching-reports/clear-all', {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`成功清空 ${result.data.deletedCount} 个报告`, 'success');
            // 重新加载列表
            await loadReportsList();
        } else {
            showNotification('清空失败：' + result.message, 'error');
        }

    } catch (error) {
        console.error('清空报告失败:', error);
        showNotification('清空失败，请重试', 'error');
    }
}

// ==================== 系统通知功能 ====================

// 全局变量存储系统通知
let systemNotices = [];

// 获取系统通知
async function loadSystemNotices() {
    try {
        const response = await fetch('/api/notices/system', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            systemNotices = result.data || [];
            console.log('📢 获取系统通知:', systemNotices.length, '条');

            // 更新首页通知显示
            updateSystemNoticesDisplay();
        } else {
            console.error('获取系统通知失败:', result.message);
        }

    } catch (error) {
        console.error('获取系统通知失败:', error);
        // 静默失败，不显示错误通知
    }
}

// 更新首页系统通知显示
function updateSystemNoticesDisplay() {
    const container = document.getElementById('recent-notices-container');
    const viewAllBtn = document.getElementById('view-all-notices-btn');

    if (!container) return;

    // 筛选适用于教师的通知
    const teacherNotices = systemNotices.filter(notice =>
        notice.targetType === 'ALL' || notice.targetType === 'TEACHER'
    );

    if (teacherNotices.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-bell-slash" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
                <p>暂无系统通知</p>
                <p>管理员发布通知后会在这里显示</p>
            </div>
        `;
        if (viewAllBtn) viewAllBtn.style.display = 'none';
        return;
    }

    // 取最新的2条通知
    const recentNotices = [...teacherNotices]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 2);

    const noticesHtml = recentNotices.map(notice => {
        const targetText = getTargetTypeText(notice.targetType);
        const statusText = notice.pushTime === 'scheduled' ? '定时推送' : '立即推送';
        const truncatedContent = notice.content.length > 60 ?
            notice.content.substring(0, 60) + '...' : notice.content;

        const displayTime = notice.pushTime === 'scheduled' && notice.scheduledTime
            ? notice.scheduledTime
            : notice.createdAt;

        return `
            <div class="recent-notice-card" onclick="viewSystemNoticeDetail(${notice.id})">
                <div class="recent-notice-header">
                    <div class="recent-notice-title">${notice.title}</div>
                    <div class="recent-notice-time">${formatShortDate(displayTime)}</div>
                </div>
                <div class="recent-notice-content">${truncatedContent}</div>
                <div class="recent-notice-footer">
                    <div class="recent-notice-course">
                        <i class="fas fa-bullhorn" style="color: #f39c12; margin-right: 4px;"></i>
                        系统通知
                    </div>
                    <div class="recent-notice-course">对象：${targetText}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="recent-notices-list">
            ${noticesHtml}
        </div>
    `;

    // 显示或隐藏"查看全部"按钮
    if (viewAllBtn) {
        if (teacherNotices.length > 2) {
            viewAllBtn.style.display = 'inline-flex';
            viewAllBtn.innerHTML = `<i class="fas fa-list"></i> 查看全部 (${teacherNotices.length})`;
        } else {
            viewAllBtn.style.display = 'none';
        }
    }
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

// 查看系统通知详情
function viewSystemNoticeDetail(noticeId) {
    const notice = systemNotices.find(n => n.id === noticeId);
    if (!notice) return;

    const targetText = getTargetTypeText(notice.targetType);
    const pushTimeText = notice.pushTime === 'scheduled' ? '定时推送' : '立即推送';

    const displayTime = notice.pushTime === 'scheduled' && notice.scheduledTime
        ? notice.scheduledTime
        : notice.createdAt;

    const modalHtml = `
        <div id="system-notice-detail-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 600px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: #f39c12;">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <h3>系统通知</h3>
                    </div>
                    <button id="close-system-notice-detail" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="notice-detail">
                        <div class="detail-row">
                            <label>标题：</label>
                            <span>${notice.title}</span>
                        </div>
                        <div class="detail-row">
                            <label>内容：</label>
                            <div class="notice-content" style="max-height: 200px; overflow-y: auto; padding: 10px; background: #f8f9fa; border-radius: 4px; white-space: pre-wrap;">${notice.content}</div>
                        </div>
                        <div class="detail-row">
                            <label>通知对象：</label>
                            <span>${targetText}</span>
                        </div>
                        <div class="detail-row">
                            <label>推送方式：</label>
                            <span>${pushTimeText}${notice.pushTime === 'scheduled' && notice.scheduledTime ?
                                ` (${formatDateTime(notice.scheduledTime)})` : ''}</span>
                        </div>
                        <div class="detail-row">
                            <label>发布时间：</label>
                            <span>${formatDateTime(displayTime)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定关闭事件
    document.getElementById('close-system-notice-detail').addEventListener('click', function() {
        document.getElementById('system-notice-detail-modal').remove();
    });

    // 点击背景关闭
    document.getElementById('system-notice-detail-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// 显示所有系统通知
function showAllSystemNotices() {
    const teacherNotices = systemNotices.filter(notice =>
        notice.targetType === 'ALL' || notice.targetType === 'TEACHER'
    );

    if (teacherNotices.length === 0) {
        showNotification('暂无系统通知', 'info');
        return;
    }

    const noticesHtml = teacherNotices.map(notice => {
        const targetText = getTargetTypeText(notice.targetType);
        const displayTime = notice.pushTime === 'scheduled' && notice.scheduledTime
            ? notice.scheduledTime
            : notice.createdAt;

        return `
            <tr style="cursor: pointer;" onclick="viewSystemNoticeDetail(${notice.id})">
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notice.title}</td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${notice.content}</td>
                <td>${targetText}</td>
                <td>${formatDateTime(displayTime)}</td>
            </tr>
        `;
    }).join('');

    const modalHtml = `
        <div id="all-system-notices-modal" class="course-modal-overlay" style="display: flex;">
            <div class="course-modal-container" style="max-width: 900px;">
                <div class="course-modal-header">
                    <div class="modal-title-section">
                        <div class="modal-icon" style="background: #f39c12;">
                            <i class="fas fa-bullhorn"></i>
                        </div>
                        <h3>系统通知 (${teacherNotices.length}条)</h3>
                    </div>
                    <button id="close-all-system-notices" class="modal-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="course-modal-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>标题</th>
                                    <th>内容</th>
                                    <th>对象</th>
                                    <th>发布时间</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${noticesHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定关闭事件
    document.getElementById('close-all-system-notices').addEventListener('click', function() {
        document.getElementById('all-system-notices-modal').remove();
    });

    // 点击背景关闭
    document.getElementById('all-system-notices-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

// 重写查看全部通知函数，显示系统通知
function showAllTeacherNotices() {
    showAllSystemNotices();
}

// 在页面卸载时清理定时器
window.addEventListener('beforeunload', () => {
    stopKnowledgeMasteryAutoRefresh();
});

// 在页面切换时管理自动刷新
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时停止自动刷新
        stopKnowledgeMasteryAutoRefresh();
    } else {
        // 页面显示时恢复自动刷新
        if (currentSelectedCourseId) {
            startKnowledgeMasteryAutoRefresh(currentSelectedCourseId);
        }
    }
});

// 题型分数设置相关函数
function getDefaultScoreForType(type) {
    const defaultScores = {
        'multiple-choice': 5,
        'fill-blank': 8,
        'true-false': 3,
        'answer': 15,
        'custom': 20
    };
    return defaultScores[type] || 10;
}

function calculateTotalScore() {
    let totalScore = 0;
    const types = ['multiple-choice', 'fill-blank', 'true-false', 'answer'];

    types.forEach(type => {
        const checkbox = document.getElementById(`q-${type}`);
        const countInput = document.getElementById(`q-${type}-count`);
        const scoreInput = document.getElementById(`q-${type}-score`);

        if (checkbox?.checked && countInput?.value && scoreInput?.value) {
            const count = parseInt(countInput.value) || 0;
            const score = parseInt(scoreInput.value) || 0;
            totalScore += count * score;
        }
    });

    // 处理自定义题型
    const customCheckbox = document.getElementById('q-custom');
    const customCount = document.getElementById('q-custom-count');
    const customScore = document.getElementById('q-custom-score');

    if (customCheckbox?.checked && customCount?.value && customScore?.value) {
        const count = parseInt(customCount.value) || 0;
        const score = parseInt(customScore.value) || 0;
        totalScore += count * score;
    }

    return totalScore;
}

function autoCalculateTotalScore() {
    const calculatedScore = calculateTotalScore();
    const totalScoreInput = document.getElementById('exam-total-score');

    if (calculatedScore > 0 && totalScoreInput) {
        totalScoreInput.value = calculatedScore;

        // 显示自动计算提示
        showTemporaryMessage(`已自动计算总分：${calculatedScore}分`, 'info');
    }
}

function showTemporaryMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.temp-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'temp-message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'info' ? '#17a2b8' : '#28a745'};
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 为题型输入框添加事件监听
function setupQuestionTypeScoreListeners() {
    const types = ['multiple-choice', 'fill-blank', 'true-false', 'answer'];

    types.forEach(type => {
        const countInput = document.getElementById(`q-${type}-count`);
        const scoreInput = document.getElementById(`q-${type}-score`);

        if (countInput) {
            countInput.addEventListener('input', () => {
                if (!scoreInput.value) {
                    scoreInput.value = getDefaultScoreForType(type);
                }
            });
        }
    });

    // 自定义题型
    const customCountInput = document.getElementById('q-custom-count');
    const customScoreInput = document.getElementById('q-custom-score');

    if (customCountInput && customScoreInput) {
        customCountInput.addEventListener('input', () => {
            if (!customScoreInput.value) {
                customScoreInput.value = getDefaultScoreForType('custom');
            }
        });
    }

    // 大作业题型
    const assignmentCheckbox = document.getElementById('q-assignment');
    if (assignmentCheckbox) {
        assignmentCheckbox.removeEventListener('change', handleAssignmentToggle);
        assignmentCheckbox.addEventListener('change', handleAssignmentToggle);
    }
}

// 处理大作业模式切换
function handleAssignmentToggle(event) {
    toggleAssignmentMode(event.target);
}

// 能力维度设置相关函数
function toggleCapabilitySettings() {
    const checkbox = document.getElementById('enable-capability-analysis');
    const settingsDiv = document.getElementById('capability-settings');

    if (checkbox.checked) {
        settingsDiv.style.display = 'block';
        // 设置推荐值
        setRecommendedCapabilityValues();
    } else {
        settingsDiv.style.display = 'none';
        // 清空所有能力维度设置
        clearCapabilitySettings();
    }
}

function setRecommendedCapabilityValues() {
    // 根据权重建议设置默认值
    const recommendations = {
        'knowledge': 2,    // 理论掌握 - 20%
        'application': 3,  // 实践应用 - 25%
        'innovation': 1,   // 创新思维 - 15%
        'transfer': 1,     // 知识迁移 - 15%
        'learning': 1,     // 学习能力 - 10%
        'systematic': 1    // 系统思维 - 10%
    };

    for (const [capability, count] of Object.entries(recommendations)) {
        const checkbox = document.getElementById(`cap-${capability}`);
        const countInput = document.getElementById(`cap-${capability}-count`);

        if (checkbox && countInput) {
            checkbox.checked = true;
            countInput.value = count;
        }
    }
}

function clearCapabilitySettings() {
    const capabilities = ['knowledge', 'application', 'innovation', 'transfer', 'learning', 'systematic', 'ideology', 'communication'];

    capabilities.forEach(capability => {
        const checkbox = document.getElementById(`cap-${capability}`);
        const countInput = document.getElementById(`cap-${capability}-count`);

        if (checkbox) checkbox.checked = false;
        if (countInput) countInput.value = '';
    });
}

function collectCapabilityRequirements() {
    const enableCapability = document.getElementById('enable-capability-analysis')?.checked;
    if (!enableCapability) {
        return null;
    }

    const capabilities = ['knowledge', 'application', 'innovation', 'transfer', 'learning', 'systematic', 'ideology', 'communication'];
    const requirements = {};

    capabilities.forEach(capability => {
        const checkbox = document.getElementById(`cap-${capability}`);
        const countInput = document.getElementById(`cap-${capability}-count`);

        if (checkbox?.checked && countInput?.value) {
            const count = parseInt(countInput.value);
            if (count > 0) {
                requirements[capability] = count;
            }
        }
    });

    return Object.keys(requirements).length > 0 ? requirements : null;
}

// 培养目标相关函数
function addTrainingObjective() {
    const container = document.getElementById('training-objectives-list');
    const objectiveCount = container.children.length;

    const objectiveItem = document.createElement('div');
    objectiveItem.className = 'objective-item';
    objectiveItem.innerHTML = `
        <span class="objective-number">${objectiveCount + 1}</span>
        <input type="text" class="objective-input" placeholder="请输入培养目标描述" />
        <button type="button" class="remove-objective-btn" onclick="removeTrainingObjective(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;

    container.appendChild(objectiveItem);

    // 更新序号
    updateObjectiveNumbers();
}

function removeTrainingObjective(button) {
    const objectiveItem = button.closest('.objective-item');
    objectiveItem.remove();

    // 更新序号
    updateObjectiveNumbers();
}

function updateObjectiveNumbers() {
    const container = document.getElementById('training-objectives-list');
    const items = container.querySelectorAll('.objective-item');

    items.forEach((item, index) => {
        const numberSpan = item.querySelector('.objective-number');
        if (numberSpan) {
            numberSpan.textContent = index + 1;
        }
    });
}

function collectTrainingObjectives() {
    const container = document.getElementById('training-objectives-list');
    const inputs = container.querySelectorAll('.objective-input');
    const objectives = [];

    inputs.forEach(input => {
        const value = input.value.trim();
        if (value) {
            objectives.push(value);
        }
    });

    return objectives;
}

function displayTrainingObjectives(objectives) {
    const container = document.getElementById('training-objectives-list');
    container.innerHTML = '';

    if (objectives && objectives.length > 0) {
        objectives.forEach((objective, index) => {
            const objectiveItem = document.createElement('div');
            objectiveItem.className = 'objective-item';
            objectiveItem.innerHTML = `
                <span class="objective-number">${index + 1}</span>
                <input type="text" class="objective-input" value="${objective}" />
                <button type="button" class="remove-objective-btn" onclick="removeTrainingObjective(this)">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(objectiveItem);
        });
    }
}



// ========== 站内通信相关函数 ==========

// 这些全局变量已在messaging-functions.js中定义，此处删除重复定义



// 显示会话列表
function displaySessionsList(sessions) {
    const container = document.getElementById('sessions-list');

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无会话</div>';
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="session-item" style="margin-bottom: 16px; padding: 16px; border: 1px solid #e9ecef; border-radius: 8px; background: white;">
            <div class="session-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">${session.sessionName}</h3>
                <div class="session-meta">
                    <span class="session-code" style="background: #3498db; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace; margin-right: 8px;">
                        ${session.sessionCode}
                    </span>
                    <span class="session-status" style="background: ${session.isActive ? '#27ae60' : '#95a5a6'}; color: white; padding: 4px 8px; border-radius: 4px;">
                        ${session.isActive ? '进行中' : '已结束'}
                    </span>
                </div>
            </div>
            <div class="session-info" style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
                <span>类型: ${getSessionTypeText(session.sessionType)}</span>
                <span style="margin-left: 16px;">参与者: ${session.currentParticipants}/${session.maxParticipants}</span>
                <span style="margin-left: 16px;">开始时间: ${formatDateTime(session.startTime)}</span>
            </div>
            <div class="session-description" style="font-size: 14px; color: #34495e; margin-bottom: 12px;">
                ${session.description || '无描述'}
            </div>
            <div class="session-actions">
                ${session.isActive ? `
                    <button class="btn btn-sm btn-primary" onclick="enterSession(${session.id})">
                        <i class="fas fa-sign-in-alt"></i> 进入会话
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="viewSessionStats(${session.id})" style="margin-left: 8px;">
                        <i class="fas fa-chart-bar"></i> 统计
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="endSession(${session.id})" style="margin-left: 8px;">
                        <i class="fas fa-stop"></i> 结束会话
                    </button>
                ` : `
                    <button class="btn btn-sm btn-secondary" onclick="viewSessionHistory(${session.id})">
                        <i class="fas fa-history"></i> 查看记录
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

// 获取会话类型文本
function getSessionTypeText(type) {
    const types = {
        'discussion': '讨论课',
        'presentation': '演示课',
        'collaboration': '协作课',
        'quiz': '测验课'
    };
    return types[type] || '普通课堂';
}

// 显示创建会话模态框
function showCreateSessionModal() {
    const user = getCurrentUser();
    if (!user || !user.teacherId) {
        showAlert('请先登录', 'error');
        return;
    }

    showModal(`
        <div class="modal-header">
            <h3>创建新会话</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <form id="create-session-form">
                <div class="form-group">
                    <label>会话名称:</label>
                    <input type="text" id="session-name" class="form-control" placeholder="输入会话名称" required>
                </div>
                <div class="form-group">
                    <label>选择课程:</label>
                    <select id="session-course" class="form-select" required>
                        <option value="">请选择课程</option>
                        ${currentCourses.map(course => `<option value="${course.id}">${course.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>会话类型:</label>
                    <select id="session-type" class="form-select">
                        <option value="discussion">讨论课</option>
                        <option value="presentation">演示课</option>
                        <option value="collaboration">协作课</option>
                        <option value="quiz">测验课</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>会话描述:</label>
                    <textarea id="session-description" class="form-control" rows="3" placeholder="输入会话描述（可选）"></textarea>
                </div>
                <div style="text-align: right; margin-top: 20px;">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="submit" class="btn btn-primary" style="margin-left: 8px;">创建会话</button>
                </div>
            </form>
        </div>
    `);

    // 绑定表单提交事件
    document.getElementById('create-session-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createSession();
    });
}

// 创建会话
async function createSession() {
    try {
        const user = getCurrentUser();
        const sessionName = document.getElementById('session-name').value.trim();
        const courseId = document.getElementById('session-course').value;
        const sessionType = document.getElementById('session-type').value;
        const description = document.getElementById('session-description').value.trim();

        if (!sessionName || !courseId) {
            showAlert('请填写完整信息', 'error');
            return;
        }

        const response = await fetch('/api/classroom/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherId: user.teacherId,
                courseId: parseInt(courseId),
                sessionName: sessionName,
                sessionType: sessionType,
                description: description
            })
        });

        const result = await response.json();
        if (result.success) {
            showAlert('会话创建成功！会话代码: ' + result.data.sessionCode, 'success');
            closeModal();
            await refreshSessions();
        } else {
            showAlert('创建失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('创建会话失败:', error);
        showAlert('创建失败，请检查网络连接', 'error');
    }
}

// 根据代码加入会话
async function joinSessionByCode() {
    try {
        const sessionCode = document.getElementById('session-code-input').value.trim().toUpperCase();
        if (!sessionCode || sessionCode.length !== 8) {
            showAlert('请输入正确的8位会话代码', 'error');
            return;
        }

        // 查找会话
        const response = await fetch(`/api/classroom/sessions/code/${sessionCode}`);
        const result = await response.json();

        if (result.success) {
            const session = result.data;
            if (!session.isActive) {
                showAlert('会话已结束', 'error');
                return;
            }

            // 加入会话
            const user = getCurrentUser();
            const joinResponse = await fetch(`/api/classroom/sessions/${session.id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.teacherId,
                    userName: user.realName || user.username,
                    userType: 'teacher'
                })
            });

            const joinResult = await joinResponse.json();
            if (joinResult.success) {
                currentSession = session;
                currentUserId = user.teacherId;
                currentUserName = user.realName || user.username;
                showAlert('成功加入会话', 'success');
                document.getElementById('session-code-input').value = '';
                showSessionRoom(session);
            } else {
                showAlert('加入失败: ' + joinResult.message, 'error');
            }
        } else {
            showAlert('会话不存在或代码错误', 'error');
        }
    } catch (error) {
        console.error('加入会话失败:', error);
        showAlert('加入失败，请检查网络连接', 'error');
    }
}

// 显示会话室界面
function showSessionRoom(session) {
    const sessionRoom = document.getElementById('session-room');
    const currentSessionCard = document.getElementById('current-session');

    sessionRoom.innerHTML = `
        <div style="display: flex; height: 600px;">
            <!-- 左侧：参与者列表 -->
            <div style="width: 250px; border-right: 1px solid #e9ecef; background: #f8f9fa;">
                <div style="padding: 16px; border-bottom: 1px solid #e9ecef; background: white;">
                    <h4 style="margin: 0; font-size: 14px;">参与者 (<span id="participant-count">0</span>)</h4>
                </div>
                <div id="participants-list" style="padding: 8px; max-height: 520px; overflow-y: auto;">
                    <!-- 参与者列表 -->
                </div>
            </div>

            <!-- 右侧：聊天区域 -->
            <div style="flex: 1; display: flex; flex-direction: column;">
                <div style="padding: 16px; border-bottom: 1px solid #e9ecef; background: white;">
                    <h4 style="margin: 0; font-size: 14px;">${session.sessionName} - ${session.sessionCode}</h4>
                </div>

                <!-- 消息区域 -->
                <div id="messages-area" style="flex: 1; padding: 16px; overflow-y: auto; background: #f8f9fa;">
                    <!-- 消息列表 -->
                </div>

                <!-- 消息输入区域 -->
                <div style="padding: 16px; border-top: 1px solid #e9ecef; background: white;">
                    <div style="display: flex; gap: 8px;">
                        <input type="text" id="message-input" class="form-control" placeholder="输入消息..." onkeypress="handleMessageKeyPress(event)">
                        <button class="btn btn-primary" onclick="sendMessage()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="toggleHandRaise()" id="hand-raise-btn">
                            <i class="fas fa-hand-paper"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    currentSessionCard.style.display = 'block';

    // 开始定时更新
    startSessionUpdates(session.id);
}

// 开始会话更新
function startSessionUpdates(sessionId) {
    // 立即加载一次
    loadSessionData(sessionId);

    // 每3秒更新一次
    messageInterval = setInterval(() => {
        loadSessionData(sessionId);
    }, 3000);
}

// 加载会话数据
async function loadSessionData(sessionId) {
    try {
        // 加载参与者
        const participantsResponse = await fetch(`/api/classroom/sessions/${sessionId}/participants`);
        const participantsResult = await participantsResponse.json();
        if (participantsResult.success) {
            displayParticipants(participantsResult.data);
        }

        // 加载消息
        const messagesResponse = await fetch(`/api/classroom/sessions/${sessionId}/messages`);
        const messagesResult = await messagesResponse.json();
        if (messagesResult.success) {
            displayMessages(messagesResult.data);
        }
    } catch (error) {
        console.error('加载会话数据失败:', error);
    }
}

// 显示参与者列表
function displayParticipants(participants) {
    const container = document.getElementById('participants-list');
    const countElement = document.getElementById('participant-count');

    countElement.textContent = participants.length;

    container.innerHTML = participants.map(participant => `
        <div class="participant-item" style="padding: 8px; margin-bottom: 4px; border-radius: 4px; ${participant.isHandRaised ? 'background: #fff3cd; border: 1px solid #ffeaa7;' : 'background: white;'}">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <div style="font-weight: 500; font-size: 13px;">${participant.userName}</div>
                    <div style="font-size: 11px; color: #7f8c8d;">
                        ${participant.userType === 'teacher' ? '教师' : '学生'}
                        ${participant.permissionLevel === 'host' ? ' (主持人)' : ''}
                    </div>
                </div>
                <div>
                    ${participant.isHandRaised ? '<i class="fas fa-hand-paper" style="color: #f39c12;"></i>' : ''}
                    ${participant.isMuted ? '<i class="fas fa-microphone-slash" style="color: #e74c3c;"></i>' : ''}
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${participant.isOnline ? '#27ae60' : '#95a5a6'}; display: inline-block; margin-left: 4px;"></span>
                </div>
            </div>
        </div>
    `).join('');
}

// 显示消息列表
function displayMessages(messages) {
    const container = document.getElementById('messages-area');

    container.innerHTML = messages.map(message => `
        <div class="message-item" style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">
                <span style="font-weight: 500;">${message.senderName}</span>
                <span style="margin-left: 8px;">${formatDateTime(message.createdAt)}</span>
                ${message.isSystemMessage ? '<span style="margin-left: 8px; background: #3498db; color: white; padding: 1px 4px; border-radius: 2px; font-size: 10px;">系统</span>' : ''}
            </div>
            <div style="background: ${message.isSystemMessage ? '#ecf0f1' : 'white'}; padding: 8px 12px; border-radius: 8px; border-left: 4px solid ${message.senderType === 'teacher' ? '#3498db' : '#27ae60'};">
                ${message.content}
                ${message.fileUrl ? `<br><a href="${message.fileUrl}" target="_blank" style="color: #3498db;"><i class="fas fa-paperclip"></i> ${message.fileName}</a>` : ''}
            </div>
        </div>
    `).join('');

    // 滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 发送消息
async function sendMessage() {
    try {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (!content || !currentSession) {
            return;
        }

        const response = await fetch(`/api/classroom/sessions/${currentSession.id}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                senderId: currentUserId,
                senderName: currentUserName,
                senderType: 'teacher',
                messageType: 'text',
                content: content
            })
        });

        const result = await response.json();
        if (result.success) {
            messageInput.value = '';
            // 立即刷新消息列表
            loadSessionData(currentSession.id);
        } else {
            showAlert('发送失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        showAlert('发送失败', 'error');
    }
}

// 处理消息输入键盘事件
function handleMessageKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// 举手/取消举手
async function toggleHandRaise() {
    try {
        if (!currentSession) return;

        const response = await fetch(`/api/classroom/sessions/${currentSession.id}/hand-raise`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId
            })
        });

        const result = await response.json();
        if (result.success) {
            // 立即刷新参与者列表
            loadSessionData(currentSession.id);
        } else {
            showAlert('操作失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('举手操作失败:', error);
        showAlert('操作失败', 'error');
    }
}

// 离开当前会话
async function leaveCurrentSession() {
    try {
        if (!currentSession) return;

        const response = await fetch(`/api/classroom/sessions/${currentSession.id}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId
            })
        });

        const result = await response.json();
        if (result.success) {
            showAlert('已离开会话', 'success');

            // 清理状态
            currentSession = null;
            currentUserId = null;
            currentUserName = null;

            if (messageInterval) {
                clearInterval(messageInterval);
                messageInterval = null;
            }

            document.getElementById('current-session').style.display = 'none';
        } else {
            showAlert('离开失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('离开会话失败:', error);
        showAlert('离开失败', 'error');
    }
}

// 进入会话（从会话管理页面）
async function enterSession(sessionId) {
    try {
        // 先加入会话
        const user = getCurrentUser();
        const response = await fetch(`/api/classroom/sessions/${sessionId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.teacherId,
                userName: user.realName || user.username,
                userType: 'teacher'
            })
        });

        const result = await response.json();
        if (result.success) {
            // 获取会话详情
            const sessionResponse = await fetch(`/api/classroom/sessions/${sessionId}`);
            const sessionResult = await sessionResponse.json();

            if (sessionResult.success) {
                currentSession = sessionResult.data;
                currentUserId = user.teacherId;
                currentUserName = user.realName || user.username;

                // 切换到加入课堂页面并显示会话室
                showSection('classroom-join');
                showSessionRoom(currentSession);
            }
        } else {
            showAlert('进入失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('进入会话失败:', error);
        showAlert('进入失败', 'error');
    }
}

// 结束会话
async function endSession(sessionId) {
    try {
        if (!confirm('确定要结束这个会话吗？')) {
            return;
        }

        const user = getCurrentUser();
        const response = await fetch(`/api/classroom/sessions/${sessionId}/end`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                teacherId: user.teacherId
            })
        });

        const result = await response.json();
        if (result.success) {
            showAlert('会话已结束', 'success');
            await refreshSessions();
        } else {
            showAlert('结束失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('结束会话失败:', error);
        showAlert('结束失败', 'error');
    }
}

// 查看会话统计
async function viewSessionStats(sessionId) {
    try {
        const response = await fetch(`/api/classroom/sessions/${sessionId}/stats`);
        const result = await response.json();

        if (result.success) {
            const stats = result.data;
            showAlert(`会话统计：
                参与者数量：${stats.participantCount}
                消息数量：${stats.messageCount}
                举手人数：${stats.handRaisedCount}`, 'info');
        } else {
            showAlert('获取统计失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('获取统计失败:', error);
        showAlert('获取统计失败', 'error');
    }
}

// 刷新历史记录
async function refreshHistory() {
    try {
        const user = getCurrentUser();
        if (!user || !user.teacherId) {
            showAlert('请先登录', 'error');
            return;
        }

        const response = await fetch(`/api/classroom/sessions/teacher/${user.teacherId}?isActive=false`);
        const result = await response.json();

        if (result.success) {
            displayHistoryList(result.data);
        } else {
            showAlert('获取历史记录失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('刷新历史记录失败:', error);
        showAlert('刷新失败，请检查网络连接', 'error');
    }
}

// 显示历史记录列表
function displayHistoryList(sessions) {
    const container = document.getElementById('history-list');

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div class="empty-state">暂无历史记录</div>';
        return;
    }

    container.innerHTML = sessions.map(session => `
        <div class="history-item" style="margin-bottom: 16px; padding: 16px; border: 1px solid #e9ecef; border-radius: 8px; background: white;">
            <div class="history-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h3 style="margin: 0; font-size: 16px; color: #2c3e50;">${session.sessionName}</h3>
                <span class="session-code" style="background: #95a5a6; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">
                    ${session.sessionCode}
                </span>
            </div>
            <div class="history-info" style="font-size: 14px; color: #7f8c8d; margin-bottom: 8px;">
                <span>类型: ${getSessionTypeText(session.sessionType)}</span>
                <span style="margin-left: 16px;">持续时间: ${calculateDuration(session.startTime, session.endTime)}</span>
            </div>
            <div class="history-time" style="font-size: 14px; color: #7f8c8d; margin-bottom: 12px;">
                开始: ${formatDateTime(session.startTime)} | 结束: ${formatDateTime(session.endTime)}
            </div>
            <div class="history-actions">
                <button class="btn btn-sm btn-secondary" onclick="viewSessionHistory(${session.id})">
                    <i class="fas fa-eye"></i> 查看详情
                </button>
            </div>
        </div>
    `).join('');
}

// 计算持续时间
function calculateDuration(startTime, endTime) {
    if (!endTime) return '进行中';

    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / (1000 * 60)); // 分钟

    if (duration < 60) {
        return duration + ' 分钟';
    } else {
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return hours + ' 小时 ' + minutes + ' 分钟';
    }
}

// 查看会话历史详情
async function viewSessionHistory(sessionId) {
    try {
        const [sessionResponse, messagesResponse] = await Promise.all([
            fetch(`/api/classroom/sessions/${sessionId}`),
            fetch(`/api/classroom/sessions/${sessionId}/messages`)
        ]);

        const sessionResult = await sessionResponse.json();
        const messagesResult = await messagesResponse.json();

        if (sessionResult.success && messagesResult.success) {
            const session = sessionResult.data;
            const messages = messagesResult.data;

            showModal(`
                <div class="modal-header">
                    <h3>会话详情 - ${session.sessionName}</h3>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-info" style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-radius: 6px;">
                        <div><strong>会话代码:</strong> ${session.sessionCode}</div>
                        <div><strong>类型:</strong> ${getSessionTypeText(session.sessionType)}</div>
                        <div><strong>开始时间:</strong> ${formatDateTime(session.startTime)}</div>
                        <div><strong>结束时间:</strong> ${formatDateTime(session.endTime)}</div>
                        <div><strong>描述:</strong> ${session.description || '无'}</div>
                    </div>
                    <div class="messages-history" style="max-height: 400px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 6px; padding: 16px;">
                        <h4 style="margin: 0 0 16px 0;">聊天记录 (${messages.length} 条消息)</h4>
                        ${messages.length > 0 ? messages.map(message => `
                            <div class="message-item" style="margin-bottom: 12px; padding: 8px; border-radius: 4px; background: ${message.isSystemMessage ? '#ecf0f1' : '#ffffff'}; border-left: 3px solid ${message.senderType === 'teacher' ? '#3498db' : '#27ae60'};">
                                <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">
                                    <strong>${message.senderName}</strong> - ${formatDateTime(message.createdAt)}
                                    ${message.isSystemMessage ? ' (系统消息)' : ''}
                                </div>
                                <div>${message.content}</div>
                            </div>
                        `).join('') : '<div style="text-align: center; color: #7f8c8d;">暂无消息记录</div>'}
                    </div>
                </div>
            `);
        } else {
            showAlert('获取会话详情失败', 'error');
        }
    } catch (error) {
        console.error('获取会话详情失败:', error);
        showAlert('获取详情失败', 'error');
    }
}

// 导出历史记录
async function exportHistory() {
    try {
        const user = getCurrentUser();
        const response = await fetch(`/api/classroom/sessions/teacher/${user.teacherId}?isActive=false`);
        const result = await response.json();

        if (result.success) {
            const sessions = result.data;
            let content = `课堂协同历史记录\n生成时间: ${new Date().toLocaleString()}\n\n`;

            sessions.forEach((session, index) => {
                content += `${index + 1}. ${session.sessionName}\n`;
                content += `   会话代码: ${session.sessionCode}\n`;
                content += `   类型: ${getSessionTypeText(session.sessionType)}\n`;
                content += `   开始时间: ${formatDateTime(session.startTime)}\n`;
                content += `   结束时间: ${formatDateTime(session.endTime)}\n`;
                content += `   持续时间: ${calculateDuration(session.startTime, session.endTime)}\n`;
                content += `   描述: ${session.description || '无'}\n\n`;
            });

            downloadTextFile(content, 'classroom_collaboration_history.txt');
        } else {
            showAlert('导出失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('导出失败:', error);
        showAlert('导出失败', 'error');
    }
}

// ==================== 热点推送功能 ====================

// 热点推送相关变量
let currentHotTopics = [];
let hotTopicFilter = 'today';

// 初始化热点推送
async function initializeHotTopics() {
    console.log('初始化热点推送...');
    try {
        // 初始化示例数据
        await initializeHotTopicData();
        // 加载热点数据
        await loadTeacherHotTopics();
    } catch (error) {
        console.error('初始化热点推送失败:', error);
    }
}

// 初始化热点示例数据
async function initializeHotTopicData() {
    try {
        const response = await fetch('/api/hot-topics/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('热点示例数据初始化成功:', result.message);
        }
    } catch (error) {
        console.error('初始化热点示例数据失败:', error);
    }
}

// 加载教师热点数据
async function loadTeacherHotTopics() {
    try {
        console.log('加载教师热点数据...');
        const response = await fetch('/api/hot-topics/latest?limit=10');

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                currentHotTopics = result.data;
                displayTeacherHotTopics(currentHotTopics);
                console.log('热点数据加载成功:', currentHotTopics.length, '条');
            } else {
                console.error('获取热点数据失败:', result.message);
                showHotTopicError('获取热点数据失败');
            }
        } else {
            console.error('热点API请求失败:', response.status);
            showHotTopicError('网络请求失败');
        }
    } catch (error) {
        console.error('加载热点数据失败:', error);
        showHotTopicError('加载热点数据时发生错误');
    }
}

// 显示教师热点列表
function displayTeacherHotTopics(topics) {
    const container = document.getElementById('teacher-hotspot-list');
    if (!container) {
        console.error('找不到热点容器元素');
        return;
    }

    if (!topics || topics.length === 0) {
        container.innerHTML = `
            <div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-fire" style="font-size: 48px; margin-bottom: 16px; color: #e74c3c;"></i>
                <p>暂无热点内容</p>
                <p>请稍后刷新或联系管理员</p>
            </div>
        `;
        return;
    }

    let html = '';
    topics.forEach(topic => {
        const timeAgo = getTimeAgo(topic.publishTime);
        const badgeClass = getBadgeClass(topic.publishTime);
        const badgeText = getBadgeText(topic.publishTime);

        html += `
            <div class="hotspot-item" onclick="openHotTopicDetail(${topic.id})">
                <div class="hotspot-header">
                    <h4 class="hotspot-title">${escapeHtml(topic.title)}</h4>
                    <span class="hotspot-badge ${badgeClass}">${badgeText}</span>
                </div>
                <p class="hotspot-summary">${escapeHtml(topic.summary || '暂无摘要')}</p>
                <div class="hotspot-meta">
                    <div class="hotspot-source">
                        <i class="fas fa-globe" style="font-size: 10px;"></i>
                        <span>${escapeHtml(topic.sourceWebsite || '未知来源')}</span>
                    </div>
                    <div class="hotspot-time">${timeAgo}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 刷新教师热点
async function refreshTeacherHotspots() {
    console.log('刷新教师热点...');
    const container = document.getElementById('teacher-hotspot-list');
    if (container) {
        container.innerHTML = `
            <div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-sync-alt fa-spin" style="font-size: 48px; margin-bottom: 16px; color: #e74c3c;"></i>
                <p>正在刷新热点数据...</p>
            </div>
        `;
    }

    try {
        // 手动触发爬取
        await fetch('/api/hot-topics/refresh', { method: 'POST' });
        // 重新加载数据
        await loadTeacherHotTopics();
        showAlert('热点数据刷新成功', 'success');
    } catch (error) {
        console.error('刷新热点失败:', error);
        showHotTopicError('刷新失败，请稍后重试');
        showAlert('刷新热点数据失败', 'error');
    }
}

// 筛选教师热点
async function filterTeacherHotspots() {
    const filterSelect = document.getElementById('teacher-hotspot-filter');
    if (!filterSelect) return;

    hotTopicFilter = filterSelect.value;
    console.log('筛选热点:', hotTopicFilter);

    const container = document.getElementById('teacher-hotspot-list');
    if (container) {
        container.innerHTML = `
            <div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-filter" style="font-size: 48px; margin-bottom: 16px; color: #e74c3c;"></i>
                <p>正在筛选热点...</p>
            </div>
        `;
    }

    try {
        let url = '/api/hot-topics/latest?limit=20';

        // 根据筛选条件调整API请求
        if (hotTopicFilter === 'popular') {
            url = '/api/hot-topics/popular?limit=10';
        }

        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                let filteredTopics = result.data;

                // 客户端时间筛选
                if (hotTopicFilter === 'today') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    filteredTopics = filteredTopics.filter(topic => {
                        const publishDate = new Date(topic.publishTime);
                        return publishDate >= today;
                    });
                } else if (hotTopicFilter === 'week') {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    filteredTopics = filteredTopics.filter(topic => {
                        const publishDate = new Date(topic.publishTime);
                        return publishDate >= weekAgo;
                    });
                } else if (hotTopicFilter === 'month') {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    filteredTopics = filteredTopics.filter(topic => {
                        const publishDate = new Date(topic.publishTime);
                        return publishDate >= monthAgo;
                    });
                }

                currentHotTopics = filteredTopics;
                displayTeacherHotTopics(filteredTopics);
            } else {
                showHotTopicError('筛选失败: ' + result.message);
            }
        } else {
            showHotTopicError('筛选请求失败');
        }
    } catch (error) {
        console.error('筛选热点失败:', error);
        showHotTopicError('筛选时发生错误');
    }
}

// 打开热点详情
function openHotTopicDetail(topicId) {
    console.log('打开热点详情:', topicId);

    // 跳转到热点详情页面
    window.open(`hotspot-detail.html?id=${topicId}`, '_blank');
}

// 显示热点错误信息
function showHotTopicError(message) {
    const container = document.getElementById('teacher-hotspot-list');
    if (container) {
        container.innerHTML = `
            <div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #e74c3c;"></i>
                <p>${escapeHtml(message)}</p>
                <button class="btn btn-sm btn-primary" onclick="refreshTeacherHotspots()" style="margin-top: 12px;">
                    <i class="fas fa-sync-alt"></i> 重试
                </button>
            </div>
        `;
    }
}

// 获取并显示产业信息
async function loadJobPostings() {
    const container = document.getElementById('job-postings-list');
    if (!container) return;

    try {
        const response = await fetch('/api/jobs/latest');
        const result = await response.json();

        if (result.success && result.data) {
            displayJobPostings(result.data);
        } else {
            showJobPostingError(result.message || '无法加载产业信息');
        }
    } catch (error) {
        console.error('获取产业信息失败:', error);
        showJobPostingError('网络错误，请稍后重试');
    }
}

// 显示产业信息列表
function displayJobPostings(postings) {
    const container = document.getElementById('job-postings-list');
    if (!container) return;

    if (!postings || postings.length === 0) {
        container.innerHTML = `<div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-briefcase" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
            <p>暂无产业信息</p>
        </div>`;
        return;
    }

    let html = '';
    postings.forEach(post => {
        html += `
            <li class="activity-item" onclick="openJobPosting('${post.url}')">
                <div class="activity-icon" style="background: #eaf1ff; color: #4a90e2;"><i class="fas fa-briefcase"></i></div>
                <div class="activity-content">
                    <div class="activity-title">${escapeHtml(post.title)} - ${escapeHtml(post.company)}</div>
                    <div class="activity-desc">${escapeHtml(post.salary)} | ${escapeHtml(post.location)}</div>
                    <div class="activity-time">${getTimeAgo(post.postedDate)}</div>
                </div>
            </li>
        `;
    });
    container.innerHTML = html;
}

// 刷新产业信息
function refreshJobPostings() {
    const container = document.getElementById('job-postings-list');
    if (container) {
        container.innerHTML = `<div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-sync-alt fa-spin" style="font-size: 48px; margin-bottom: 16px; color: #bdc3c7;"></i>
            <p>正在刷新产业信息...</p>
        </div>`;
    }
    loadJobPostings();
}

// 显示产业信息加载错误
function showJobPostingError(message) {
    const container = document.getElementById('job-postings-list');
    if (container) {
        container.innerHTML = `<div class="hotspot-loading" style="text-align: center; padding: 48px 0; color: #7f8c8d;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px; color: #e74c3c;"></i>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-sm btn-primary" onclick="refreshJobPostings()" style="margin-top: 12px;">
                <i class="fas fa-sync-alt"></i> 重试
            </button>
        </div>`;
    }
}

// 打开招聘信息链接
function openJobPosting(url) {
    if (url && url !== '#') {
        showTeacherSecurityWarning(url);
    }
}


// 获取时间差显示文本
function getTimeAgo(publishTime) {
    if (!publishTime) return '未知时间';

    const now = new Date();
    const publishDate = new Date(publishTime);
    const diffMs = now - publishDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return '刚刚';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
        return `${diffHours}小时前`;
    } else if (diffDays < 7) {
        return `${diffDays}天前`;
    } else {
        return publishDate.toLocaleDateString('zh-CN');
    }
}

// 获取徽章样式类
function getBadgeClass(publishTime) {
    if (!publishTime) return '';

    const now = new Date();
    const publishDate = new Date(publishTime);
    const diffHours = (now - publishDate) / (1000 * 60 * 60);

    if (diffHours <= 24) {
        return 'today';
    } else if (diffHours <= 168) { // 7天
        return 'week';
    } else {
        return 'month';
    }
}

// 获取徽章文本
function getBadgeText(publishTime) {
    if (!publishTime) return '热点';

    const now = new Date();
    const publishDate = new Date(publishTime);
    const diffHours = (now - publishDate) / (1000 * 60 * 60);

    if (diffHours <= 24) {
        return '今日';
    } else if (diffHours <= 168) { // 7天
        return '本周';
    } else {
        return '热点';
    }
}

// HTML转义函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 格式化大纲内容，简洁清晰的显示
 */
function formatOutlineContent(content) {
    if (!content) return '';

    // 预处理表格内容
    content = preprocessTableContent(content);

    // 首先清理HTML标签，但保留表格结构
    let cleaned = content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        // 清理HTML表格标签（但保留内容）
        .replace(/<\/?table[^>]*>/gi, '')
        .replace(/<\/?thead[^>]*>/gi, '')
        .replace(/<\/?tbody[^>]*>/gi, '')
        .replace(/<tr[^>]*>/gi, '')
        .replace(/<\/tr>/gi, '')
        .replace(/<t[hd][^>]*>/gi, '|')
        .replace(/<\/t[hd]>/gi, '|')
        // 清理其他HTML标签
        .replace(/<\/?[^>]+>/g, '')
        // 清理多余的符号，但保留表格分隔符
        .replace(/\*{2,}/g, '')  // 只清理连续的星号
        .replace(/={3,}/g, '')   // 只清理连续的等号
        .replace(/-{4,}/g, '')   // 只清理长横线
        .trim();

    // 按行处理
    let lines = cleaned.split('\n');
    let formatted = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) {
            // 如果在表格中遇到空行，结束表格
            if (inTable) {
                formatted.push(formatTable(tableRows));
                tableRows = [];
                inTable = false;
            }
            if (formatted.length > 0) {
                formatted.push('<div style="height: 12px;"></div>');
            }
            continue;
        }

        // 检查是否是表格行（包含|分隔的内容）
        if (line.includes('|')) {
            let cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
            // 如果有至少2个有效单元格，认为是表格行
            if (cells.length >= 2) {
                if (!inTable) {
                    inTable = true;
                }
                tableRows.push(cells);
                continue;
            }
        }

        // 如果当前不是表格行但之前在处理表格，结束表格
        if (inTable) {
            formatted.push(formatTable(tableRows));
            tableRows = [];
            inTable = false;
        }

        // 清理行内容，去掉markdown符号
        let cleanLine = line
            .replace(/^#{1,6}\s*/, '')  // 去掉标题符号
            .replace(/^[-*+]\s*/, '')   // 去掉列表符号
            .replace(/^\d+\.\s*/, '')   // 去掉数字列表符号
            .replace(/^[一二三四五六七八九十]+[、．.]\s*/, '')  // 去掉中文序号
            .replace(/^[(（]\d+[)）]\s*/, '')  // 去掉小序号
            .replace(/\*\*(.+?)\*\*/g, '$1')  // 去掉粗体符号
            .replace(/__(.+?)__/g, '$1')      // 去掉粗体符号
            .replace(/\*(.+?)\*/g, '$1')      // 去掉斜体符号
            .replace(/_(.+?)_/g, '$1')        // 去掉斜体符号
            .replace(/`([^`]+)`/g, '$1')      // 去掉代码符号
            .replace(/\*+/g, '')              // 去掉多余的星号
            .replace(/\|+/g, '')              // 去掉多余的竖线
            .trim();

        if (!cleanLine) continue;

        // 判断内容类型并应用样式
        if (line.match(/^#{1,2}\s/)) {
            // 主标题
            formatted.push(`<div style="font-size: 20px; font-weight: bold; color: #2c3e50; margin: 25px 0 15px 0; line-height: 1.4; padding-bottom: 8px; border-bottom: 2px solid #3498db;">${escapeHtml(cleanLine)}</div>`);
        } else if (line.match(/^#{3,}\s/) || line.match(/^[一二三四五六七八九十]+[、．.]\s/)) {
            // 副标题
            formatted.push(`<div style="font-size: 17px; font-weight: 600; color: #34495e; margin: 20px 0 12px 0; line-height: 1.4; padding-left: 12px; border-left: 4px solid #3498db;">${escapeHtml(cleanLine)}</div>`);
        } else if (line.match(/^(\d+\.\s|[-*+]\s|[(（]\d+[)）]\s)/)) {
            // 列表项
            formatted.push(`<div style="margin: 8px 0 8px 25px; color: #2c3e50; line-height: 1.6; font-size: 15px; position: relative;"><span style="position: absolute; left: -20px; color: #3498db;">•</span>${escapeHtml(cleanLine)}</div>`);
        } else {
            // 普通段落 - 处理链接
            let processedLine = escapeHtml(cleanLine);
            processedLine = makeLinksClickable(processedLine);
            formatted.push(`<div style="margin: 12px 0; color: #2c3e50; line-height: 1.7; font-size: 15px; text-align: justify;">${processedLine}</div>`);
        }
    }

    // 处理最后的表格
    if (inTable && tableRows.length > 0) {
        formatted.push(formatTable(tableRows));
    }

    return formatted.join('');
}

/**
 * 格式化表格
 */
function formatTable(rows) {
    if (!rows || rows.length === 0) return '';

    console.log('格式化表格，行数:', rows.length, '数据:', rows); // 调试信息

    let tableHtml = `
        <div style="margin: 20px 0; overflow-x: auto;">
            <table style="
                width: 100%;
                border-collapse: collapse;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-radius: 10px;
                overflow: hidden;
                background: white;
                border: 2px solid #3498db;
            ">`;

    rows.forEach((row, index) => {
        const isHeader = index === 0;
        const bgColor = isHeader ? '#3498db' : (index % 2 === 1 ? '#f8f9fa' : 'white');
        const textColor = isHeader ? 'white' : '#2c3e50';
        const fontWeight = isHeader ? 'bold' : 'normal';
        const fontSize = isHeader ? '16px' : '15px';

        tableHtml += `<tr style="background-color: ${bgColor}; transition: background-color 0.2s;">`;
        row.forEach(cell => {
            const tag = isHeader ? 'th' : 'td';
            tableHtml += `<${tag} style="
                padding: 15px 20px;
                border: 1px solid ${isHeader ? '#2980b9' : '#e9ecef'};
                color: ${textColor};
                font-weight: ${fontWeight};
                font-size: ${fontSize};
                text-align: left;
                vertical-align: top;
                line-height: 1.5;
            ">${escapeHtml(cell.toString())}</${tag}>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</table></div>';
    return tableHtml;
}

/**
 * 预处理内容，将markdown表格转换为更容易识别的格式
 */
function preprocessTableContent(content) {
    let lines = content.split('\n');
    let processedLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // 检查是否是markdown表格分隔行（如 |---|---|---|）
        if (line.match(/^\|?[\s]*:?-+:?[\s]*\|/)) {
            // 跳过分隔行，不添加到结果中
            continue;
        }

        // 如果是表格行，确保格式正确
        if (line.includes('|') && !line.startsWith('#')) {
            // 确保行首尾有|
            if (!line.startsWith('|')) {
                line = '|' + line;
            }
            if (!line.endsWith('|')) {
                line = line + '|';
            }
        }

        processedLines.push(line);
    }

    return processedLines.join('\n');
}

/**
 * 将文本中的URL转换为可点击的链接（带安全提示）
 */
function makeLinksClickable(text) {
    // URL正则表达式
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;

    return text.replace(urlRegex, function(url) {
        // 清理URL末尾可能的标点符号
        let cleanUrl = url.replace(/[.,;:!?)]$/, '');
        let punctuation = url.slice(cleanUrl.length);

        // 使用安全提示功能，而不是直接跳转
        return `<a href="javascript:void(0)" onclick="showTeacherSecurityWarning('${cleanUrl.replace(/'/g, '\\\'')}')" style="color: #3498db; text-decoration: none; border-bottom: 1px dotted #3498db; cursor: pointer;" onmouseover="this.style.textDecoration='underline';" onmouseout="this.style.textDecoration='none';" title="点击安全访问: ${cleanUrl}">${cleanUrl}</a>${punctuation}`;
    });
}

/**
 * 格式化试卷内容，简洁清晰的显示
 */
function formatExamContent(content) {
    if (!content) return '';

    // 首先清理HTML标签和特殊符号
    let cleaned = content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        // 清理HTML表格标签
        .replace(/<\/?table[^>]*>/gi, '')
        .replace(/<\/?tr[^>]*>/gi, '')
        .replace(/<\/?td[^>]*>/gi, '')
        .replace(/<\/?th[^>]*>/gi, '')
        .replace(/<\/?thead[^>]*>/gi, '')
        .replace(/<\/?tbody[^>]*>/gi, '')
        // 清理其他HTML标签
        .replace(/<\/?[^>]+>/g, '')
        // 清理多余的符号
        .replace(/\*+/g, '')
        .replace(/\|+/g, '')
        .replace(/=+/g, '')
        .replace(/-{3,}/g, '')
        .trim();

    // 按行处理
    let lines = cleaned.split('\n');
    let formatted = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) {
            if (formatted.length > 0) {
                formatted.push('<div style="height: 12px;"></div>');
            }
            continue;
        }

        // 清理行内容，保留分数标记
        let cleanLine = line
            .replace(/^#{1,6}\s*/, '')  // 去掉标题符号
            .replace(/^[-*+]\s*/, '')   // 去掉列表符号
            .replace(/^\d+\.\s*/, '')   // 去掉数字列表符号（题目编号除外）
            .replace(/^[A-Z]\.\s*/, '') // 去掉选项符号
            .replace(/^[(（]\d+[)）]\s*/, '')  // 去掉小序号
            .replace(/\*\*(.+?)\*\*/g, '$1')  // 去掉粗体符号
            .replace(/__(.+?)__/g, '$1')      // 去掉粗体符号
            .replace(/\*(.+?)\*/g, '$1')      // 去掉斜体符号
            .replace(/_(.+?)_/g, '$1')        // 去掉斜体符号
            .replace(/`([^`]+)`/g, '$1')      // 去掉代码符号
            .replace(/\*+/g, '')              // 去掉多余的星号
            .replace(/\|+/g, '')              // 去掉多余的竖线
            .trim();

        if (!cleanLine) continue;

        // 判断内容类型
        if (line.match(/^#{1,2}\s/)) {
            // 试卷标题
            formatted.push(`<div style="font-size: 22px; font-weight: bold; color: #2c3e50; margin: 25px 0 20px 0; text-align: center; line-height: 1.4; padding-bottom: 10px; border-bottom: 2px solid #3498db;">${escapeHtml(cleanLine)}</div>`);
        } else if (line.match(/^#{3}\s/) && (line.includes('一、') || line.includes('二、') || line.includes('三、') || line.includes('四、') || line.includes('五、'))) {
            // 题型标题
            formatted.push(`<div style="font-size: 18px; font-weight: bold; color: #2c3e50; margin: 25px 0 15px 0; padding: 12px 0; border-bottom: 2px solid #3498db; line-height: 1.4;">${escapeHtml(cleanLine)}</div>`);
        } else if (line.match(/^(\d+)\.\s/)) {
            // 题目编号
            let match = line.match(/^(\d+)\.\s*(.+)/);
            let number = match[1];
            let text = match[2];
            formatted.push(`<div style="margin: 18px 0 12px 0; font-size: 16px; line-height: 1.7; color: #2c3e50; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;"><span style="font-weight: bold; color: #3498db; margin-right: 8px;">${number}.</span>${escapeHtml(text)}</div>`);
        } else if (line.match(/^[A-Z]\.\s/)) {
            // 选项
            let match = line.match(/^([A-Z])\.\s*(.+)/);
            let option = match[1];
            let text = match[2];
            formatted.push(`<div style="margin: 8px 0 8px 30px; font-size: 15px; line-height: 1.6; color: #2c3e50; padding: 8px 12px; background: white; border: 1px solid #e9ecef; border-radius: 6px;"><span style="font-weight: 600; color: #3498db; margin-right: 8px;">${option}.</span>${escapeHtml(text)}</div>`);
        } else if (line.match(/^(答案|解析)[：:]/)) {
            // 答案和解析
            let match = line.match(/^(答案|解析)[：:]\s*(.+)/);
            let type = match[1];
            let content = match[2];
            let bgColor = type === '答案' ? '#d5f4e6' : '#e8f4fd';
            let borderColor = type === '答案' ? '#27ae60' : '#3498db';
            let textColor = type === '答案' ? '#27ae60' : '#3498db';
            formatted.push(`<div style="margin: 12px 0; font-size: 15px; line-height: 1.6; background: ${bgColor}; padding: 12px; border-radius: 6px; border-left: 4px solid ${borderColor};"><span style="font-weight: bold; color: ${textColor}; margin-right: 8px;">${type}：</span><span style="color: #2c3e50;">${escapeHtml(content)}</span></div>`);
        } else if (line.match(/^(注意|说明)[：:]/)) {
            // 考试说明
            let match = line.match(/^(注意|说明)[：:]\s*(.+)/);
            let type = match[1];
            let content = match[2];
            formatted.push(`<div style="margin: 15px 0; font-size: 15px; line-height: 1.7; color: #856404; background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;"><span style="font-weight: bold; margin-right: 8px;">${type}：</span>${escapeHtml(content)}</div>`);
        } else if (line.match(/\[(\d+)分\]/)) {
            // 包含分数标记的行
            let processedText = escapeHtml(cleanLine)
                .replace(/\[(\d+)分\]/g, '<span style="color: #e74c3c; font-weight: bold; background: #ffeaa7; padding: 3px 8px; border-radius: 4px; font-size: 13px;">[$1分]</span>');
            formatted.push(`<div style="margin: 10px 0; color: #2c3e50; line-height: 1.7; font-size: 15px;">${processedText}</div>`);
        } else {
            // 普通段落 - 处理链接
            let processedLine = escapeHtml(cleanLine);
            processedLine = makeLinksClickable(processedLine);
            formatted.push(`<div style="margin: 12px 0; color: #2c3e50; line-height: 1.7; font-size: 15px; text-align: justify;">${processedLine}</div>`);
        }
    }

    return formatted.join('');
}

/**
 * 编辑联网搜索生成的试卷
 */
function editWebSearchExam() {
    if (!window.currentExam || !window.currentExam.isWebSearchGenerated) {
        showNotification('没有可编辑的联网搜索试卷', 'error');
        return;
    }

    const previewDiv = document.getElementById('exam-preview');

    // 重新构建预览界面，包含编辑模式
    previewDiv.innerHTML = `
        <div class="card-header">
            <i class="fas fa-edit"></i> 编辑试卷
            <div class="card-actions">
                <button class="btn btn-sm btn-success" onclick="saveWebSearchExamEdit()">
                    <i class="fas fa-save"></i> 保存
                </button>
                <button class="btn btn-sm btn-secondary" onclick="cancelWebSearchExamEdit()">
                    <i class="fas fa-times"></i> 取消
                </button>
            </div>
        </div>
        <div id="exam-content" style="padding: 24px;">
            <!-- 动态生成的编辑内容 -->
        </div>
    `;

    const editContainer = document.createElement('div');
    editContainer.className = 'exam-edit-container';

    // 创建Markdown编辑器
    const textarea = document.createElement('textarea');
    textarea.className = 'exam-edit-textarea';
    textarea.style.cssText = `
        width: 100%;
        min-height: 500px;
        padding: 20px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.6;
        resize: vertical;
        background: #f8f9fa;
        color: #2c3e50;
    `;
    textarea.placeholder = '请输入试卷内容（支持Markdown格式）...';
    textarea.value = window.currentExam.originalContent || '';

    // 添加编辑提示
    const editHint = document.createElement('div');
    editHint.style.cssText = `
        margin-bottom: 15px;
        padding: 12px;
        background: #e8f4fd;
        border: 1px solid #bee5eb;
        border-radius: 6px;
        color: #0c5460;
        font-size: 14px;
    `;
    editHint.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <strong>编辑提示：</strong>您可以直接编辑试卷内容，支持Markdown格式。编辑完成后点击"保存"按钮。
    `;

    editContainer.appendChild(editHint);
    editContainer.appendChild(textarea);

    // 将编辑容器添加到内容区域
    const contentDiv = document.getElementById('exam-content');
    contentDiv.appendChild(editContainer);

    // 聚焦到编辑器
    textarea.focus();
}

/**
 * 保存联网搜索试卷的编辑
 */
function saveWebSearchExamEdit() {
    const textarea = document.querySelector('.exam-edit-textarea');
    if (!textarea) {
        showNotification('找不到编辑器', 'error');
        return;
    }

    const editedContent = textarea.value.trim();
    if (!editedContent) {
        showNotification('试卷内容不能为空', 'warning');
        return;
    }

    // 更新当前试卷数据
    window.currentExam.originalContent = editedContent;

    // 重新显示试卷（退出编辑模式）
    const updatedData = {
        examTitle: window.currentExam.title,
        duration: window.currentExam.duration,
        examType: window.currentExam.examType,
        examContent: editedContent,
        referenceLinks: window.currentExam.referenceLinks
    };

    displayWebSearchExamResult(updatedData);
    showNotification('试卷编辑已保存', 'success');
}

/**
 * 取消联网搜索试卷的编辑
 */
function cancelWebSearchExamEdit() {
    if (!window.currentExam) {
        showNotification('没有可取消的编辑', 'error');
        return;
    }

    // 重新显示原始试卷
    const originalData = {
        examTitle: window.currentExam.title,
        duration: window.currentExam.duration,
        examType: window.currentExam.examType,
        examContent: window.currentExam.originalContent,
        referenceLinks: window.currentExam.referenceLinks
    };

    displayWebSearchExamResult(originalData);
}

/**
 * 保存联网搜索生成的试卷
 */
function saveWebSearchExam() {
    if (!window.currentExam || !window.currentExam.isWebSearchGenerated) {
        showNotification('没有可保存的联网搜索试卷', 'error');
        return;
    }

    // 这里可以调用后端API保存试卷
    console.log('保存联网搜索试卷:', window.currentExam);
    showNotification('试卷保存功能开发中...', 'info');
}

/**
 * 导出联网搜索生成的试卷
 */
function exportWebSearchExam() {
    if (!window.currentExam || !window.currentExam.isWebSearchGenerated) {
        showNotification('没有可导出的联网搜索试卷', 'error');
        return;
    }

    // 创建Markdown内容
    let markdownContent = `# ${window.currentExam.title}\n\n`;
    markdownContent += `**考试时长：** ${window.currentExam.duration}分钟\n`;
    markdownContent += `**总分：** ${window.currentExam.totalScore}分\n`;
    markdownContent += `**类型：** ${window.currentExam.examType}\n\n`;
    markdownContent += `**生成时间：** ${new Date().toLocaleString()}\n\n`;
    markdownContent += '---\n\n';
    markdownContent += window.currentExam.originalContent || '';

    // 添加参考链接
    if (window.currentExam.referenceLinks && window.currentExam.referenceLinks.length > 0) {
        markdownContent += '\n\n## 参考资料\n\n';
        window.currentExam.referenceLinks.forEach(link => {
            markdownContent += `- [${link.title}](${link.url})\n`;
        });
    }

    // 创建下载链接
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${window.currentExam.title}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification('试卷已导出为Markdown文件', 'success');
}

/**
 * 联网搜索生成教学改进建议
 */
async function generateImprovementsWithWebSearch(courseId, courseName, searchQuery) {
    try {
        showLoading('正在联网搜索相关信息并生成改进建议，请稍候...');

        // 调用联网搜索API
        const response = await fetch('/api/web-search/improvements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                courseId: courseId,
                courseName: courseName,
                searchQuery: searchQuery
            })
        });

        if (!response.ok) {
            // 如果API不可用，使用模拟数据
            if (response.status === 404) {
                console.warn('联网搜索API不可用，使用模拟数据');
                const mockData = generateMockImprovementData(courseName, searchQuery);
                displayWebSearchImprovementResult(mockData);
                showNotification('教学改进建议生成成功！（模拟数据）', 'success');
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // 显示联网搜索生成的改进建议
            displayWebSearchImprovementResult(data.data);
            showNotification('教学改进建议生成成功！', 'success');
        } else {
            throw new Error(data.message || '生成改进建议失败');
        }

    } catch (error) {
        console.error('联网搜索生成改进建议失败:', error);

        // 如果是网络错误，尝试使用模拟数据
        if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
            console.warn('API不可用，使用模拟数据');
            const mockData = generateMockImprovementData(courseName, searchQuery);
            displayWebSearchImprovementResult(mockData);
            showNotification('教学改进建议生成成功！（模拟数据）', 'warning');
        } else {
            showNotification('生成改进建议失败: ' + error.message, 'error');
        }
    } finally {
        hideLoading();
    }
}

/**
 * 显示联网搜索生成的改进建议结果
 */
function displayWebSearchImprovementResult(data) {
    const contentDiv = document.getElementById('improvements-content');

    // 生成参考链接HTML
    let referenceLinksHtml = '';
    if (data.referenceLinks && data.referenceLinks.length > 0) {
        referenceLinksHtml = `
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px; font-weight: 600;">
                    参考资料链接
                </h4>
                <div style="margin-bottom: 15px;">
                    ${data.referenceLinks.map(link => `
                        <div style="margin: 8px 0;">
                            <a href="javascript:void(0)" onclick="showTeacherSecurityWarning('${escapeHtml(link.url).replace(/'/g, '\\\'')}')"
                               style="color: #3498db; text-decoration: none; font-size: 15px; line-height: 1.6; cursor: pointer;"
                               onmouseover="this.style.textDecoration='underline';"
                               onmouseout="this.style.textDecoration='none';"
                               title="点击安全访问: ${escapeHtml(link.url)}">
                                • ${escapeHtml(link.title)}
                            </a>
                        </div>
                    `).join('')}
                </div>
                <div style="font-size: 13px; color: #7f8c8d; margin-top: 10px;">
                    点击链接查看相关资料（安全访问）
                </div>
            </div>
        `;
    }

    contentDiv.innerHTML = `
        <div class="improvement-result">
            <div class="improvement-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                <div>
                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                        <i class="fas fa-globe" style="color: #17a2b8; margin-right: 8px;"></i>
                        ${escapeHtml(data.courseName)} - 联网搜索生成改进建议
                    </h3>
                    <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                        基于网络搜索结果生成 • 生成时间：${new Date().toLocaleString()}
                    </div>
                </div>
                <div class="improvement-actions" style="display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-primary" onclick="saveCurrentImprovement()">
                        <i class="fas fa-save"></i> 保存建议
                    </button>
                    <button class="btn btn-sm btn-accent" onclick="exportCurrentImprovement()">
                        <i class="fas fa-download"></i> 导出报告
                    </button>
                </div>
            </div>
            <div class="improvement-content" style="background: white; padding: 30px; border-radius: 12px; line-height: 1.8; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                ${formatOutlineContent(data.improvementContent)}
            </div>
            ${referenceLinksHtml}
        </div>
    `;

    // 显示"我的报告"按钮
    const myReportsBtn = document.getElementById('my-reports-btn');
    if (myReportsBtn) {
        myReportsBtn.style.display = 'inline-flex';
    }
}

// ==================== 联网搜索功能 ====================

let currentSearchType = null; // 'outline' 或 'exam'

// 初始化联网搜索勾选框事件
document.addEventListener('DOMContentLoaded', function() {
    // 联网搜索勾选框不需要额外的事件处理，只需要在生成时检查状态即可
});



/**
 * 应用大纲生成结果
 */
function applyOutlineResult(data) {
    if (data.outlineContent) {
        // 显示大纲结果区域
        const resultDiv = document.getElementById('outline-result');
        const contentDiv = document.getElementById('outline-content');

        contentDiv.innerHTML = `
            <div class="outline-display">
                <div class="outline-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                    <div>
                        <h3 class="outline-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                            <i class="fas fa-globe" style="color: #17a2b8; margin-right: 8px;"></i>
                            ${escapeHtml(data.courseName)} - 联网搜索生成大纲
                        </h3>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                            基于网络搜索结果生成 • 学时：${data.hours}学时
                        </div>
                    </div>
                    <div class="outline-actions" style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-primary" onclick="saveCurrentOutline()">
                            <i class="fas fa-save"></i> 保存大纲
                        </button>
                        <button class="btn btn-sm btn-accent" onclick="downloadCurrentOutline()">
                            <i class="fas fa-download"></i> 下载PDF
                        </button>
                    </div>
                </div>
                <div class="outline-content" style="background: white; padding: 30px; border-radius: 12px; line-height: 1.8; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                    ${formatOutlineContent(data.outlineContent)}
                </div>
            </div>
        `;

        resultDiv.style.display = 'block';

        // 滚动到结果区域
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 应用试卷生成结果
 */
function applyExamResult(data) {
    if (data.examContent) {
        // 显示试卷预览区域
        const previewDiv = document.getElementById('exam-preview');
        const contentDiv = document.getElementById('exam-content');

        contentDiv.innerHTML = `
            <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">
                        <i class="fas fa-globe" style="color: #17a2b8; margin-right: 8px;"></i>
                        ${escapeHtml(data.examTitle)}
                    </h2>
                    <div style="display: flex; gap: 15px; font-size: 14px; color: #7f8c8d;">
                        <span><strong>考试时长：</strong>${data.duration}分钟</span>
                        <span><strong>类型：</strong>${escapeHtml(data.examType)}</span>
                    </div>
                </div>
                <div style="font-size: 12px; color: #17a2b8; margin-bottom: 20px; padding: 8px 12px; background: #e8f4fd; border-radius: 4px;">
                    <i class="fas fa-info-circle"></i> 本试卷基于网络搜索结果生成，包含最新的相关信息和实际应用场景
                </div>
                <div style="line-height: 1.7; font-size: 15px; color: #2c3e50;">
                    ${formatExamContent(data.examContent)}
                </div>
            </div>
        `;

        previewDiv.style.display = 'block';

        // 滚动到结果区域
        previewDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 智能生成搜索查询
 */
function generateSmartSearchQuery(courseName, requirements, type) {
    let searchQuery = '';

    // 基于课程名称生成核心搜索词
    const courseKeywords = extractCourseKeywords(courseName);

    if (type === 'outline') {
        // 教学大纲搜索查询
        searchQuery = `${courseKeywords} 2024年最新教学大纲 课程设计 教学方法`;

        if (requirements && requirements.trim()) {
            // 从教学要求中提取关键词
            const reqKeywords = extractRequirementKeywords(requirements);
            searchQuery += ` ${reqKeywords}`;
        }

        searchQuery += ' 教育部 高等教育 人才培养';

    } else if (type === 'exam') {
        // 试卷搜索查询
        searchQuery = `${courseKeywords} 2024年考试题目 实际应用案例 行业实践`;

        if (requirements && requirements.trim()) {
            // 从特殊要求中提取关键词
            const reqKeywords = extractRequirementKeywords(requirements);
            searchQuery += ` ${reqKeywords}`;
        }

        searchQuery += ' 最新技术 面试题 实战项目';

    } else if (type === 'improvement') {
        // 教学改进建议搜索查询
        searchQuery = `${courseKeywords} 2024年教学改进 教学方法创新 教育技术`;

        if (requirements && requirements.trim()) {
            const reqKeywords = extractRequirementKeywords(requirements);
            searchQuery += ` ${reqKeywords}`;
        }

        searchQuery += ' 教学效果提升 学生参与度 教学质量';
    }

    return searchQuery.trim();
}

/**
 * 从课程名称中提取关键词
 */
function extractCourseKeywords(courseName) {
    // 移除常见的课程修饰词，保留核心技术词汇
    let keywords = courseName
        .replace(/课程|设计|基础|高级|实践|应用|原理|技术|程序|开发|系统/g, '')
        .trim();

    // 如果是常见的技术课程，添加相关关键词
    if (courseName.includes('Java')) {
        keywords += ' Spring Boot 微服务 企业级开发';
    } else if (courseName.includes('Python')) {
        keywords += ' 数据分析 人工智能 机器学习';
    } else if (courseName.includes('前端') || courseName.includes('Web')) {
        keywords += ' React Vue.js 现代前端框架';
    } else if (courseName.includes('数据库')) {
        keywords += ' MySQL Redis 大数据 NoSQL';
    } else if (courseName.includes('算法') || courseName.includes('数据结构')) {
        keywords += ' LeetCode 编程竞赛 面试算法';
    } else if (courseName.includes('网络')) {
        keywords += ' 网络安全 云计算 分布式系统';
    }

    return keywords;
}

/**
 * 从教学要求中提取关键词
 */
function extractRequirementKeywords(requirements) {
    // 提取关键的技术词汇和概念
    const techWords = requirements.match(/[A-Za-z]+|[\u4e00-\u9fa5]{2,}/g) || [];

    // 过滤掉常见的非关键词
    const stopWords = ['学生', '掌握', '了解', '理解', '能够', '通过', '学习', '课程', '内容', '知识', '技能', '方法', '基本', '主要', '重要', '相关'];

    const keywords = techWords
        .filter(word => word.length > 1 && !stopWords.includes(word))
        .slice(0, 5) // 只取前5个关键词
        .join(' ');

    return keywords;
}

/**
 * 显示联网搜索确认对话框
 */
function showWebSearchConfirmDialog(type, searchQuery) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'course-modal-overlay';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;';

        modal.innerHTML = `
            <div class="course-modal-container" style="max-width: 500px; background: white; border-radius: 12px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <div class="course-modal-header" style="padding: 20px 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(23, 162, 184, 0.1); display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-search" style="color: #17a2b8; font-size: 18px;"></i>
                        </div>
                        <h3 style="margin: 0; color: #2c3e50; font-size: 18px;">确认联网搜索</h3>
                    </div>
                </div>

                <div class="course-modal-body" style="padding: 24px;">
                    <div style="margin-bottom: 20px;">
                        <p style="margin: 0 0 16px 0; color: #495057; line-height: 1.6;">
                            您选择了启用联网搜索功能来生成<strong>${type}</strong>。系统将：
                        </p>
                        <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #495057; line-height: 1.6;">
                            <li>根据您的搜索查询从互联网获取最新信息</li>
                            <li>结合搜索结果和AI能力生成更贴合实际的内容</li>
                            <li>整个过程可能需要30-60秒</li>
                        </ul>
                    </div>

                    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                        <div style="font-weight: 500; color: #17a2b8; margin-bottom: 8px;">
                            <i class="fas fa-search"></i> 搜索查询
                        </div>
                        <div style="color: #495057; font-size: 14px; line-height: 1.5;">
                            ${escapeHtml(searchQuery)}
                        </div>
                    </div>
                </div>

                <div class="course-modal-footer" style="padding: 20px 24px; border-top: 1px solid #eee; display: flex; gap: 12px; justify-content: flex-end;">
                    <button id="cancel-web-search" class="btn btn-secondary" style="padding: 10px 20px;">
                        <i class="fas fa-times"></i> 取消
                    </button>
                    <button id="confirm-web-search" class="btn btn-primary" style="padding: 10px 20px;">
                        <i class="fas fa-search"></i> 确认搜索
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定事件
        document.getElementById('cancel-web-search').onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        document.getElementById('confirm-web-search').onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };

        // 点击背景关闭
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(false);
            }
        };
    });
}

/**
 * 联网搜索生成试卷
 */
async function generateExamWithWebSearch(examTitle, courseId, duration, totalScore, questionTypes, difficulty, specialRequirements, searchQuery) {
    showLoading('🌐 正在联网搜索相关信息...<br>🤖 AI将结合网络搜索结果生成试卷...');

    // 获取课程名称
    const courseSelect = document.getElementById('exam-course-select');
    const courseName = courseSelect.options[courseSelect.selectedIndex].text;

    const response = await fetch('/api/web-search/exam', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            examTitle: examTitle,
            courseName: courseName,
            examType: '期末考试', // 默认类型，可以根据需要调整
            duration: parseInt(duration),


            searchQuery: searchQuery
        })
    });

    const result = await response.json();
    hideLoading();

    if (result.success) {
        console.log('联网搜索生成试卷成功:', result);
        showNotification('🎉 基于联网搜索的试卷生成成功！', 'success');
        displayWebSearchExamResult(result.data);
    } else {
        console.error('联网搜索生成试卷失败:', result);
        showNotification(result.message || '联网搜索生成失败', 'error');
    }
}

/**
 * 显示联网搜索大纲结果
 */
function displayWebSearchOutlineResult(data) {
    if (data.outlineContent) {
        // 设置当前生成的大纲数据
        currentGeneratedOutline = {
            courseName: data.courseName,
            hours: data.hours,
            requirements: data.requirements,
            content: data.outlineContent,
            referenceLinks: data.referenceLinks,
            type: 'web_search'
        };
        // 显示大纲结果区域
        const resultDiv = document.getElementById('outline-result');
        const contentDiv = document.getElementById('outline-content');

        // 生成参考链接HTML
        let referenceLinksHtml = '';
        if (data.referenceLinks && data.referenceLinks.length > 0) {
            referenceLinksHtml = `
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px; font-weight: 600;">
                        参考资料链接
                    </h4>
                    <div style="margin-bottom: 15px;">
                        ${data.referenceLinks.map(link => `
                            <div style="margin: 8px 0;">
                                <a href="javascript:void(0)" onclick="showTeacherSecurityWarning('${escapeHtml(link.url).replace(/'/g, '\\\'')}')"
                                   style="color: #3498db; text-decoration: none; font-size: 15px; line-height: 1.6; cursor: pointer;"
                                   onmouseover="this.style.textDecoration='underline';"
                                   onmouseout="this.style.textDecoration='none';"
                                   title="点击安全访问: ${escapeHtml(link.url)}">
                                    • ${escapeHtml(link.title)}
                                </a>
                            </div>
                        `).join('')}
                    </div>
                    <div style="font-size: 13px; color: #7f8c8d; margin-top: 10px;">
                        点击链接查看相关资料（安全访问）
                    </div>
                </div>
            `;
        }

        contentDiv.innerHTML = `
            <div class="outline-display">
                <div class="outline-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef;">
                    <div>
                        <h3 class="outline-title" style="margin: 0; font-size: 18px; font-weight: 600; color: #2c3e50;">
                            <i class="fas fa-globe" style="color: #17a2b8; margin-right: 8px;"></i>
                            ${escapeHtml(data.courseName)} - 联网搜索生成大纲
                        </h3>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
                            基于网络搜索结果生成 • 学时：${data.hours}学时
                        </div>
                    </div>
                    <div class="outline-actions" style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-primary" onclick="saveCurrentOutline()">
                            <i class="fas fa-save"></i> 保存大纲
                        </button>
                        <button class="btn btn-sm btn-accent" onclick="downloadCurrentOutline()">
                            <i class="fas fa-download"></i> 下载PDF
                        </button>
                    </div>
                </div>
                <div class="outline-content" style="background: white; padding: 30px; border-radius: 12px; line-height: 1.8; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
                    ${formatOutlineContent(data.outlineContent)}
                </div>
                ${referenceLinksHtml}
            </div>
        `;

        resultDiv.style.display = 'block';

        // 滚动到结果区域
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 显示联网搜索试卷结果
 */
function displayWebSearchExamResult(data) {
    if (data.examContent) {
        // 显示试卷预览区域
        const previewDiv = document.getElementById('exam-preview');
        const contentDiv = document.getElementById('exam-content');

        // 创建一个临时的试卷数据对象，模拟普通试卷的结构
        const examData = {
            id: 'web_search_' + Date.now(), // 临时ID
            title: data.examTitle || '联网搜索生成试卷',
            duration: data.duration || 120,
            totalScore: 100,
            examType: data.examType || '综合测试',
            originalContent: data.examContent,
            isWebSearchGenerated: true,
            referenceLinks: data.referenceLinks
        };

        // 保存到全局变量
        window.currentExam = examData;

        // 使用与普通试卷相同的头部结构，但添加编辑功能
        previewDiv.innerHTML = `
            <div class="card-header">
                <i class="fas fa-globe"></i> 联网搜索生成试卷
                <div class="card-actions">
                    <button class="btn btn-sm btn-accent" onclick="editWebSearchExam()">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="saveWebSearchExam()">
                        <i class="fas fa-save"></i> 保存
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="exportWebSearchExam()">
                        <i class="fas fa-download"></i> 导出
                    </button>
                </div>
            </div>
            <div id="exam-content" style="padding: 24px;">
                <!-- 动态生成的试卷内容 -->
            </div>
        `;

        // 重新获取contentDiv引用
        const newContentDiv = document.getElementById('exam-content');

        // 生成参考链接HTML
        let referenceLinksHtml = '';
        if (data.referenceLinks && data.referenceLinks.length > 0) {
            referenceLinksHtml = `
                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e9ecef;">
                    <h4 style="color: #2c3e50; margin-bottom: 15px; font-size: 16px; font-weight: 600;">
                        参考资料链接
                    </h4>
                    <div style="margin-bottom: 15px;">
                        ${data.referenceLinks.map(link => `
                            <div style="margin: 8px 0;">
                                <a href="javascript:void(0)" onclick="showTeacherSecurityWarning('${escapeHtml(link.url).replace(/'/g, '\\\'')}')"
                                   style="color: #3498db; text-decoration: none; font-size: 15px; line-height: 1.6; cursor: pointer;"
                                   onmouseover="this.style.textDecoration='underline';"
                                   onmouseout="this.style.textDecoration='none';"
                                   title="点击安全访问: ${escapeHtml(link.url)}">
                                    • ${escapeHtml(link.title)}
                                </a>
                            </div>
                        `).join('')}
                    </div>
                    <div style="font-size: 13px; color: #7f8c8d; margin-top: 10px;">
                        点击链接查看相关资料（安全访问）
                    </div>
                </div>
            `;
        }

        // 使用与普通试卷相同的内容结构
        newContentDiv.innerHTML = `
            <div class="exam-header">
                <h3>${examData.title}</h3>
                <div class="exam-info">
                    <span>考试时长：${examData.duration}分钟</span>
                    <span>总分：${examData.totalScore}分</span>
                    <span>类型：${examData.examType}</span>
                </div>
                <div style="font-size: 12px; color: #17a2b8; margin-top: 10px; padding: 8px 12px; background: #e8f4fd; border-radius: 4px;">
                    <i class="fas fa-info-circle"></i> 本试卷基于网络搜索结果生成，包含最新的相关信息和实际应用场景
                </div>
            </div>
            <div class="exam-content-body">
                ${formatExamContent(data.examContent)}
                ${referenceLinksHtml}
            </div>
        `;

        previewDiv.style.display = 'block';

        // 滚动到结果区域
        previewDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 生成模拟的教学改进建议数据
 */
function generateMockImprovementData(courseName, searchQuery) {
    const mockContent = `# ${courseName} 教学改进建议报告

## 基于联网搜索的最新教育趋势分析

**搜索查询：** ${searchQuery}

## 一、教学内容优化建议

### 1.1 课程内容更新
- 结合2024年最新行业发展趋势，更新课程案例和实践项目
- 增加前沿技术和应用场景的介绍，如AI技术在教育中的应用
- 优化知识点的逻辑结构，采用螺旋式递进教学方法
- 参考链接：https://www.edu.cn/latest-trends

### 1.2 实践环节加强
- 增加动手实践的比重，提高学生的实际操作能力
- 设计更多贴近实际工作场景的项目案例
- 建立校企合作，引入真实项目进行教学
- 推荐资源：https://github.com/education-projects

## 二、教学方法创新

### 2.1 混合式教学模式
- 采用线上线下相结合的教学模式，利用现代教育技术
- 利用翻转课堂提高课堂互动效果
- 运用多媒体技术和虚拟现实技术丰富教学手段
- 参考平台：https://www.coursera.org/teaching-methods

### 2.2 互动式教学策略
- 增加小组讨论和协作学习环节
- 采用问题导向的教学方法（PBL）
- 鼓励学生主动参与和表达，培养批判性思维
- 教学工具：https://www.mentimeter.com/

## 三、学生参与度提升

### 3.1 激发学习兴趣
- 通过生动的案例和实际应用激发学生兴趣
- 设置有挑战性的学习任务和游戏化元素
- 建立积极的课堂氛围，营造学习共同体
- 案例库：https://www.case-studies.edu

### 3.2 个性化指导
- 根据学生的不同基础提供差异化指导
- 建立学习小组，促进同伴互助学习
- 定期进行学习反馈和个性化指导
- 评估工具：https://www.adaptive-learning.com

## 四、教学技术应用

### 4.1 数字化教学工具
- 利用在线学习平台提供丰富的学习资源
- 使用虚拟仿真技术增强实践教学效果
- 采用智能化评估工具提高评价效率和准确性
- 推荐平台：https://www.edtech-tools.com

### 4.2 人工智能技术融合
- 探索AI技术在个性化学习中的应用
- 利用大数据分析学生学习行为和效果
- 建设智慧教室，提升教学体验和效果
- AI教育：https://www.ai-education.org

## 五、评估方式改进

### 5.1 多元化评价体系
- 采用过程性评价与终结性评价相结合的方式
- 增加实践能力和创新能力的评价权重
- 建立学生自评和互评机制，培养反思能力
- 评价标准：https://www.assessment-standards.edu

### 5.2 实时反馈机制
- 建立及时的学习反馈机制，使用数字化工具
- 提供个性化的学习建议和改进方案
- 定期调整教学策略，基于数据驱动的决策
- 反馈系统：https://www.feedback-systems.com

## 六、课程资源建设

### 6.1 数字化资源开发
- 建设高质量的在线课程资源和微课程
- 开发多媒体教学材料，包括视频、动画等
- 建立完善的案例库和题库，支持自适应学习
- 资源平台：https://www.open-educational-resources.org

### 6.2 资源共享与协作
- 建立教师间的资源共享平台和社区
- 与其他院校开展资源合作和交流
- 持续更新和维护教学资源，保持内容的时效性
- 合作网络：https://www.education-collaboration.net

---

**生成时间：** ${new Date().toLocaleString()}
**基于搜索：** ${searchQuery}

*本报告基于最新的教育研究和网络搜索结果生成，建议结合实际情况进行调整和实施。*`;

    return {
        courseName: courseName,
        improvementContent: mockContent,
        referenceLinks: [
            { title: "教育部最新教学指导意见", url: "http://www.moe.gov.cn/jyb_xxgk/moe_1777/moe_1778/" },
            { title: "现代教育技术应用指南", url: "https://www.icourse163.org/" },
            { title: "高等教育教学改革案例", url: "https://www.xuetangx.com/" },
            { title: "AI技术在教育中的应用", url: "https://www.ai-education.org/" },
            { title: "数字化教学资源平台", url: "https://www.smartedu.cn/" }
        ]
    };
}

/**
 * 格式化新闻内容
 */
function formatNewsContent(content) {
    if (!content) return '';

    // 清理和格式化内容
    let formatted = content
        .replace(/\n\n+/g, '</p><p>')  // 段落分隔
        .replace(/\n/g, '<br>')        // 换行
        .trim();

    // 添加段落标签
    if (formatted && !formatted.startsWith('<p>')) {
        formatted = '<p>' + formatted + '</p>';
    }

    // 处理链接
    formatted = makeLinksClickable(formatted);

    return formatted;
}









// ==================== 教师端安全提示功能 ====================

// 显示教师端安全警告
function showTeacherSecurityWarning(url) {
    if (!url) {
        console.warn('URL为空，无法显示安全警告');
        return;
    }

    // 创建安全提示弹窗
    const modal = createTeacherSecurityModal(url);
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

// 创建教师端安全提示弹窗
function createTeacherSecurityModal(url) {
    const modal = document.createElement('div');
    modal.id = 'teacher-security-modal';
    modal.className = 'teacher-security-modal';

    modal.innerHTML = `
        <div class="teacher-security-modal-content">
            <div class="teacher-security-modal-header">
                <div class="warning-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>安全提示</h3>
            </div>
            <div class="teacher-security-modal-body">
                <p><strong class="highlight">您即将离开智囊，跳转到第三方网站。</strong></p>
                <p>智囊出于为您提供便利的目的向您提供第三方链接，我们不对第三方网站的内容负责，请您审慎访问，保护好您的信息及财产安全。</p>
            </div>
            <div class="teacher-security-modal-footer">
                <button type="button" class="teacher-security-btn teacher-security-btn-cancel" onclick="closeTeacherSecurityModal()">
                    <i class="fas fa-times"></i> 取消
                </button>
                <button type="button" class="teacher-security-btn teacher-security-btn-continue" onclick="continueToTeacherUrl('${url}')">
                    <i class="fas fa-external-link-alt"></i> 继续访问
                </button>
            </div>
        </div>
    `;

    // 添加样式
    if (!document.getElementById('teacher-security-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'teacher-security-modal-styles';
        style.textContent = `
            .teacher-security-modal {
                position: fixed;
                z-index: 10001;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
            }

            .teacher-security-modal-content {
                background-color: #fff;
                margin: 10% auto;
                padding: 0;
                border-radius: 15px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                animation: teacherModalSlideIn 0.3s ease-out;
            }

            @keyframes teacherModalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .teacher-security-modal-header {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 20px;
                border-radius: 15px 15px 0 0;
                text-align: center;
            }

            .teacher-security-modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
            }

            .teacher-security-modal-header .warning-icon {
                font-size: 48px;
                margin-bottom: 10px;
                color: #fff;
            }

            .teacher-security-modal-body {
                padding: 30px;
                text-align: center;
            }

            .teacher-security-modal-body p {
                color: #555;
                line-height: 1.6;
                margin-bottom: 20px;
                font-size: 16px;
            }

            .teacher-security-modal-body .highlight {
                color: #e74c3c;
                font-weight: 600;
            }

            .teacher-security-modal-footer {
                padding: 0 30px 30px;
                display: flex;
                gap: 15px;
                justify-content: center;
            }

            .teacher-security-btn {
                padding: 12px 30px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 120px;
            }

            .teacher-security-btn-cancel {
                background: #f8f9fa;
                color: #6c757d;
                border: 2px solid #dee2e6;
            }

            .teacher-security-btn-cancel:hover {
                background: #e9ecef;
                color: #495057;
                border-color: #adb5bd;
            }

            .teacher-security-btn-continue {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: 2px solid transparent;
            }

            .teacher-security-btn-continue:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            }

            @media (max-width: 768px) {
                .teacher-security-modal-content {
                    margin: 20% auto;
                    width: 95%;
                }

                .teacher-security-modal-footer {
                    flex-direction: column;
                }

                .teacher-security-btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    return modal;
}

// 关闭教师端安全提示弹窗
function closeTeacherSecurityModal() {
    const modal = document.getElementById('teacher-security-modal');
    if (modal) {
        modal.remove();
    }
}

// 继续访问教师端URL
function continueToTeacherUrl(url) {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
    closeTeacherSecurityModal();
}

// 打开热点原文链接（带安全提示）
function openHotspotOriginalLink() {
    const originalLinkBtn = document.getElementById('hotspot-original-link-btn');
    const url = originalLinkBtn.getAttribute('data-url');

    if (url) {
        showTeacherSecurityWarning(url);
    } else {
        showNotification('原文链接不可用', 'warning');
    }
}

// 导出教师端安全提示函数
window.showTeacherSecurityWarning = showTeacherSecurityWarning;
window.closeTeacherSecurityModal = closeTeacherSecurityModal;
window.continueToTeacherUrl = continueToTeacherUrl;
window.openHotspotOriginalLink = openHotspotOriginalLink;

