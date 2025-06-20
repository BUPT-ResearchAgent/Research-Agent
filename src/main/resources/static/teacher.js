// SmartEdu教师端交互逻辑
let currentCourses = [];
let currentExams = [];
let currentMaterials = [];
let currentNotices = [];
let allNotices = []; // 存储所有通知
let filteredNotices = []; // 存储筛选后的通知
let currentPage = 1;
let pageSize = 10;
let totalPages = 1;

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
        // 加载基础数据
        await loadCurrentUser();
        
        // 提前加载课程列表，这样知识库模块就可以使用了
        console.log('初始化时加载课程列表...');
        await loadCourseList();
        
        // 设置默认显示的页面，这会自动加载控制面板数据
        showSection('dashboard');
        
        // 设置默认活动菜单项
        const defaultMenuItem = document.querySelector('.menu-item[data-section="dashboard"]');
        if (defaultMenuItem) {
            updateActiveMenu(defaultMenuItem);
        }
        
        console.log('教师端页面初始化完成，课程数据:', currentCourses);
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
    
    // 知识库上传模态框事件（只设置一次）
    setupKnowledgeUploadModal();
    
    // 知识块查看模态框事件
    setupKnowledgeChunksModal();
    
    // 知识块详情模态框事件
    setupChunkDetailModal();
    
    // 知识块编辑模态框事件
    setupEditChunkModal();
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
        
        const courseData = {
            name: nameElement.value.trim(),
            description: descElement.value.trim(),
            credit: parseInt(creditElement.value),
            hours: parseInt(hoursElement.value),
            semester: semesterElement.value
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
            case 'answer-manage':
                await loadAnswersData();
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
            case 'knowledge':
                await loadKnowledgeData();
                break;
        }
    } catch (error) {
        console.error('加载页面数据失败:', error);
        showNotification('数据加载失败', 'error');
    }
}

// 加载控制面板数据
async function loadDashboardData() {
    try {
        // 加载课程列表
        const coursesResponse = await TeacherAPI.getCourses();
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
        
        // 加载统计数据
        const statsResponse = await TeacherAPI.getDashboardStats();
        const stats = statsResponse.data || {};
        
        // 更新统计卡片
        updateStatsCards(stats);
        
        // 更新课程表格
        updateRecentCoursesTable();
        
        // 更新知识点掌握情况的课程选择器
        updateKnowledgeCourseSelect();
        
        // 加载通知数据以更新首页最新通知显示
        await loadNoticesData();
        
        console.log('控制面板数据加载完成');
    } catch (error) {
        console.error('加载控制面板数据失败:', error);
        showNotification('数据加载失败', 'error');
    }
}

// 更新统计卡片
function updateStatsCards(stats) {
    // 更新活跃学生数
    const studentsElement = document.querySelector('.stat-card:nth-child(1) .stat-value');
    if (studentsElement) {
        studentsElement.textContent = stats.totalStudents ? stats.totalStudents.toLocaleString() : '0';
    }
    
    // 更新平均正确率
    const avgScoreElement = document.querySelector('.stat-card:nth-child(2) .stat-value');
    if (avgScoreElement) {
        const avgScore = stats.averageScore || 0;
        avgScoreElement.textContent = avgScore.toFixed(1) + '%';
    }
    
    // 更新待批改试卷
    const pendingElement = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (pendingElement) {
        pendingElement.textContent = stats.pendingGrades || '0';
    }
    
    // 更新课程完成率
    const completionElement = document.querySelector('.stat-card:nth-child(4) .stat-value');
    if (completionElement) {
        const completionRate = stats.completionRate || 0;
        completionElement.textContent = completionRate.toFixed(0) + '%';
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
    
    // 如果有课程，默认选择第一个
    if (currentCourses.length > 0) {
        courseSelect.value = currentCourses[0].id;
    }
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
        
        const response = await TeacherAPI.deleteCourse(courseId);
        
        hideLoading();
        
        if (response.success) {
            showNotification('课程删除成功！', 'success');
            
            // 重新加载数据
            await loadDashboardData();
        } else {
            showNotification(response.message || '删除失败', 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('删除课程失败:', error);
        showNotification('删除失败，请重试', 'error');
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
        
    } catch (error) {
        hideLoading();
        console.error('生成大纲失败:', error);
        showNotification('生成失败，请重试', 'error');
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
    
    // 解析链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3498db; text-decoration: none;" target="_blank">$1</a>');
    
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

// 格式化教学大纲内容 (使用Markdown解析)
function formatOutlineContent(content) {
    if (!content) return '暂无内容';
    
    console.log('开始格式化内容，内容长度:', content.length);
    console.log('内容前100字符:', content.substring(0, 100));
    
    // 检查内容是否包含HTML表格
    if (content.includes('<table') && content.includes('</table>')) {
        console.log('检测到HTML表格内容，直接返回');
        // 如果是HTML表格内容，直接返回，不进行Markdown解析
        return content;
    }
    
    // 检查是否包含HTML标签
    if (content.includes('<') && content.includes('>')) {
        console.log('检测到HTML标签，进行基本清理');
        // 如果包含HTML标签但不是表格，进行基本的HTML清理和格式化
        let html = content;
        
        // 确保段落有适当的样式
        html = html.replace(/<p>/g, '<p style="margin: 12px 0; line-height: 1.7; color: #2c3e50;">');
        
        // 确保标题有适当的样式
        html = html.replace(/<h1>/g, '<h1 style="color: #e74c3c; margin: 32px 0 20px 0; font-size: 24px; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">');
        html = html.replace(/<h2>/g, '<h2 style="color: #2980b9; margin: 24px 0 16px 0; font-size: 20px; border-bottom: 2px solid #3498db; padding-bottom: 8px;">');
        html = html.replace(/<h3>/g, '<h3 style="color: #2c3e50; margin: 20px 0 12px 0; font-size: 18px;">');
        html = html.replace(/<h4>/g, '<h4 style="color: #7f8c8d; margin: 16px 0 8px 0; font-size: 16px;">');
        
        return html;
    }
    
    console.log('使用Markdown解析器');
    // 如果是纯文本或Markdown内容，使用Markdown解析器
    return parseMarkdown(content);
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
        const duration = document.getElementById('exam-duration').value;
        const totalScore = document.getElementById('exam-total-score').value;
        
        // 1. 验证选择课程（必填）
        if (!courseId) {
            showNotification('请选择课程 *', 'warning');
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
            if (checkbox && checkbox.checked && count) {
                questionTypes[type] = parseInt(count.value) || 0;
            }
        });
        
        // 处理自定义题型
        const customCheckbox = document.getElementById('q-custom');
        const customRequirement = document.getElementById('q-custom-requirement');
        const customCount = document.getElementById('q-custom-count');
        
        if (customCheckbox && customCheckbox.checked) {
            if (!customRequirement || !customRequirement.value.trim()) {
                showNotification('选择自定义题型时，请填写题型要求 *', 'warning');
                return;
            }
            if (customCount) {
                questionTypes['custom'] = {
                    count: parseInt(customCount.value) || 0,
                    requirement: customRequirement.value.trim()
                };
            }
        }
        
        // 计算总题目数量，考虑自定义题型的特殊结构
        let totalQuestions = 0;
        Object.values(questionTypes).forEach(value => {
            if (typeof value === 'object' && value.count !== undefined) {
                totalQuestions += value.count;
            } else if (typeof value === 'number') {
                totalQuestions += value;
            }
        });
        
        if (totalQuestions === 0) {
            showNotification('请至少选择一种题型 *', 'warning');
            return;
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
        
        const examData = {
            courseId: parseInt(courseId),
            materialIds: selectedMaterials,
            duration: parseInt(duration),
            totalScore: parseInt(totalScore),
            questionTypes,
            difficulty,
            specialRequirements: specialRequirements || null
        };
        
        console.log('生成试卷数据:', examData);
        
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
            
            questionsHtml += `
                <div class="question-item">
                    <h4>第${index + 1}题 (${question.score || 2}分)</h4>
                    <p class="question-content">${question.content || '题目内容加载失败'}</p>
                    ${options.length > 0 ? `
                        <div class="question-options">
                            ${options.map((option, i) => {
                                // 检查选项是否已经包含标签，如果有则去掉
                                const cleanOption = typeof option === 'string' ? 
                                    option.replace(/^[A-Z]\.\s*/, '') : option;
                                return `<p><span style="font-weight: 500; color: #3498db; margin-right: 8px;">${String.fromCharCode(65 + i)}.</span>${cleanOption}</p>`;
                            }).join('')}
                        </div>
                    ` : ''}
                    <div class="question-answer">
                        <strong>参考答案：</strong>${question.answer || 'N/A'}
                    </div>
                    ${question.explanation ? `
                        <div class="question-explanation">
                            <strong>解析：</strong>${question.explanation}
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
    window.location.href = 'SmartEdu.html';
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
async function loadAnswersData() {
    try {
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        }
        console.log('答案管理页面数据加载完成');
    } catch (error) {
        console.error('加载答案管理页面数据失败:', error);
    }
}

async function loadGradeData() {
    try {
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        }
        console.log('成绩批改页面数据加载完成');
    } catch (error) {
        console.error('加载成绩批改页面数据失败:', error);
    }
}

async function loadAnalysisData() {
    try {
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        }
        console.log('成绩分析页面数据加载完成');
    } catch (error) {
        console.error('加载成绩分析页面数据失败:', error);
    }
}

async function loadImprovementData() {
    try {
        if (!currentCourses || currentCourses.length === 0) {
            await loadCourseList();
        } else {
            updateCourseSelects();
        }
        console.log('教学改进建议页面数据加载完成');
    } catch (error) {
        console.error('加载教学改进建议页面数据失败:', error);
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
        window.location.href = 'SmartEdu.html';
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
                window.location.href = 'SmartEdu.html';
            }
            return;
        }
        
        // 更新页面显示的用户名
        const usernameElement = document.getElementById('current-username');
        if (usernameElement) {
            usernameElement.textContent = userData.username || '教师';
        }
        
        console.log('当前用户:', userData);
    } catch (error) {
        console.error('加载用户信息失败:', error);
        window.location.href = 'SmartEdu.html';
    }
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

// 下载当前预览的大纲（详情模态框中使用）
function downloadCurrentOutline() {
    if (currentHistoryOutline) {
        console.log('下载当前预览的大纲:', currentHistoryOutline.id);
        downloadHistoryOutline(currentHistoryOutline.id);
    } else {
        console.error('没有当前预览的大纲数据');
        showNotification('没有可下载的大纲数据', 'error');
    }
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
        row.innerHTML = `
            <td>
                <div class="exam-title">
                    <strong>${exam.title || '未命名试卷'}</strong>
                    <div class="exam-subtitle">${exam.courseName || '未知课程'}</div>
                </div>
            </td>
            <td>${exam.questionCount || 0}</td>
            <td>${exam.duration || 0}分钟</td>
            <td>
                <span class="status-badge status-${exam.status?.toLowerCase() || 'draft'}">
                    ${getStatusText(exam.status)}
                </span>
            </td>
            <td>${exam.participantCount || 0}</td>
            <td>${exam.publishTime || '未发布'}</td>
            <td>${exam.totalScore || 0}分</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-accent" onclick="showExamPreviewModal(${exam.id})" title="预览">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showExamEditModal(${exam.id})" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="downloadExam(${exam.id})" title="下载">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="showPublishExamWithModal(${exam.id})" 
                            title="发布" ${exam.status === 'PUBLISHED' ? 'disabled' : ''}>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteExam(${exam.id})" 
                            title="删除" ${exam.participantCount > 0 ? 'disabled' : ''}>
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
        const confirmed = await showConfirmDialog(
            '删除试卷',
            '确定要删除这份试卷吗？删除后将无法恢复。',
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
        const response = await fetch('http://localhost:8080/api/auth/current-user', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
            const userData = result.data;
            if (userData.role === 'teacher') {
                // 如果有直接的teacherId就使用，否则使用userId
                return userData.teacherId || userData.userId;
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
    
    // 更新待批改答卷数
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

*本试卷由智教SmartEdu系统生成*
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
        
        return {
            title: title,
            content: content,
            questionText: content,
            options: options,
            correctAnswer: correctAnswer,
            answer: correctAnswer,
            explanation: explanation,
            analysis: explanation,
            score: score
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
                        return `<p><span style="font-weight: 500; color: #3498db; margin-right: 8px;">${option.label}.</span>${option.content}</p>`;
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
        
        // 生成HTML结构（与displayExamPreview一致）
        return `
            <div class="question-item">
                <h4>第${questionIndex}题 (${score}分)</h4>
                <p class="question-content">${content}</p>
                ${optionsHtml}
                <div class="question-answer">
                    <strong>参考答案：</strong>${answer}
                </div>
                ${explanation ? `
                    <div class="question-explanation">
                        <strong>解析：</strong>${explanation}
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
    
    // 重置发布时间为明天
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    document.getElementById('publish-time').value = tomorrow.toISOString().slice(0, 16);
    
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
                updatePublishOptionStates();
            }
        });
    }
    
    if (scheduleChk) {
        scheduleChk.addEventListener('change', function() {
            if (this.checked) {
                document.getElementById('publish-immediately').checked = false;
                updatePublishOptionStates();
            }
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
    const publishTimeInput = document.getElementById('publish-time');
    
    // 更新选项的视觉状态
    const immediatelyOption = document.getElementById('publish-immediately').closest('.publish-option');
    const scheduleOption = document.getElementById('schedule-publish').closest('.publish-option');
    
    if (immediately) {
        immediatelyOption.classList.add('selected');
        scheduleOption.classList.remove('selected');
        // 禁用时间选择
        publishTimeInput.disabled = true;
        scheduleSettings.classList.add('disabled');
    } else if (schedule) {
        immediatelyOption.classList.remove('selected');
        scheduleOption.classList.add('selected');
        // 启用时间选择
        publishTimeInput.disabled = false;
        scheduleSettings.classList.remove('disabled');
    } else {
        immediatelyOption.classList.remove('selected');
        scheduleOption.classList.remove('selected');
        // 禁用时间选择
        publishTimeInput.disabled = true;
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
        } else if (schedule) {
            const publishTime = document.getElementById('publish-time').value;
            
            if (!publishTime) {
                showNotification('请选择发布时间', 'warning');
                return;
            }
            
            publishData.publishType = 'SCHEDULED';
            publishData.publishTime = publishTime;
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

// 缺失的函数实现
function showScheduleModal() {
    showNotification('考试安排功能待实现', 'info');
}

function loadAnswersList() {
    showNotification('答案列表功能待实现', 'info');
}

function autoGradeAll() {
    showNotification('自动批改功能待实现', 'info');
}

function exportAnalysisReport() {
    showNotification('导出分析报告功能待实现', 'info');
}

function generateImprovements() {
    showNotification('生成改进建议功能待实现', 'info');
}

function exportImprovements() {
    showNotification('导出改进建议功能待实现', 'info');
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
                    </h4>
                </div>
                
                <div class="question-content" style="margin-bottom: 20px;">
                    <p style="font-size: 15px; line-height: 1.6; color: #2c3e50; margin: 0;">
                        ${question.content || question.questionText || question.text || '题目内容'}
                    </p>
                </div>
                
                ${renderQuestionOptions(question)}
                
                ${renderQuestionAnswer(question)}
                
                ${renderQuestionExplanation(question)}
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
                <span style="color: #2c3e50;">${cleanOption}</span>
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
    
    return `
        <div class="question-answer" style="margin-bottom: 15px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
            <span style="font-weight: 600; color: #155724;">参考答案：</span>
            <span style="color: #155724;">${answer}</span>
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
    
    return `
        <div class="question-explanation" style="padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px;">
            <span style="font-weight: 600; color: #0c5460;">解析：</span>
            <span style="color: #0c5460; line-height: 1.6;">${explanation}</span>
        </div>
    `;
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
                </div>
                
                <div class="preview-question-content" style="margin-bottom: 15px; line-height: 1.6;">
                    ${question.content || question.questionText || ''}
                </div>
                
                ${renderPreviewOptions(question)}
                
                ${(question.correctAnswer || question.answer || question.correct || question.solution) ? `
                    <div style="margin-top: 10px; padding: 8px; background: #d4edda; border-radius: 4px; font-size: 13px;">
                        <strong style="color: #155724;">参考答案：</strong><span style="color: #155724;">${question.correctAnswer || question.answer || question.correct || question.solution}</span>
                    </div>
                ` : ''}
                
                ${(question.explanation || question.analysis || question.solution_detail || question.rationale) ? `
                    <div style="margin-top: 8px; padding: 8px; background: #d1ecf1; border-radius: 4px; font-size: 13px;">
                        <strong style="color: #0c5460;">解析：</strong><span style="color: #0c5460;">${question.explanation || question.analysis || question.solution_detail || question.rationale}</span>
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
                <span>${cleanOption}</span>
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

