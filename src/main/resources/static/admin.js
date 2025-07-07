// 美观的通知提示函数
function showNotification(message, type = 'info') {
    // 创建通知容器（如果不存在）
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        margin-bottom: 10px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(400px);
        transition: all 0.3s ease;
        pointer-events: auto;
        cursor: pointer;
        max-width: 350px;
        word-wrap: break-word;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // 根据类型设置颜色和图标
    let bgColor, icon;
    switch (type) {
        case 'success':
            bgColor = '#27ae60';
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            bgColor = '#e74c3c';
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            bgColor = '#f39c12';
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            bgColor = '#3498db';
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.style.backgroundColor = bgColor;
    notification.innerHTML = `${icon}<span>${message}</span>`;
    
    // 添加到容器
    container.appendChild(notification);
    
    // 延迟显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // 点击关闭
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // 自动关闭
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, type === 'error' ? 5000 : 3000);
}

// 全局变量存储用户数据
let filteredUsers = [];

// 全局工具函数
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    } catch (error) {
        return '无效日期';
    }
}

// 用户下拉菜单相关功能
function initUserDropdownFunctions() {
    // 修改密码功能
    window.showChangePasswordModal = function() {
        document.getElementById('change-password-modal').style.display = 'flex';
    };

    // 注销账户功能
    window.showDeleteAccountModal = function() {
        document.getElementById('delete-account-modal').style.display = 'flex';
    };

    // 退出登录功能
    window.handleLogout = function() {
        document.getElementById('logout-modal').style.display = 'flex';
    };

    // 修改密码模态框事件
    const changePasswordModal = document.getElementById('change-password-modal');
    const changePasswordForm = document.getElementById('change-password-form');
    const closePasswordModal = document.getElementById('close-password-modal');
    const cancelPasswordChange = document.getElementById('cancel-password-change');

    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', () => {
            changePasswordModal.style.display = 'none';
            changePasswordForm.reset();
        });
    }

    if (cancelPasswordChange) {
        cancelPasswordChange.addEventListener('click', () => {
            changePasswordModal.style.display = 'none';
            changePasswordForm.reset();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showNotification('新密码与确认密码不匹配', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        currentPassword: currentPassword,
                        newPassword: newPassword
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('密码修改成功', 'success');
                    changePasswordModal.style.display = 'none';
                    changePasswordForm.reset();
                } else {
                    showNotification(result.message || '密码修改失败', 'error');
                }
            } catch (error) {
                console.error('修改密码失败:', error);
                showNotification('修改密码失败，请重试', 'error');
            }
        });
    }

    // 注销账户模态框事件
    const deleteAccountModal = document.getElementById('delete-account-modal');
    const deleteAccountForm = document.getElementById('delete-account-form');
    const closeDeleteAccountModal = document.getElementById('close-delete-account-modal');
    const cancelDeleteAccount = document.getElementById('cancel-delete-account');

    if (closeDeleteAccountModal) {
        closeDeleteAccountModal.addEventListener('click', () => {
            deleteAccountModal.style.display = 'none';
            deleteAccountForm.reset();
        });
    }

    if (cancelDeleteAccount) {
        cancelDeleteAccount.addEventListener('click', () => {
            deleteAccountModal.style.display = 'none';
            deleteAccountForm.reset();
        });
    }

    if (deleteAccountForm) {
        deleteAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('delete-account-password').value;
            const confirm = document.getElementById('delete-account-confirm').checked;
            
            if (!confirm) {
                showNotification('请确认您已知晓风险', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/delete-account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('账户已成功注销', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showNotification(result.message || '账户注销失败', 'error');
                }
            } catch (error) {
                console.error('注销账户失败:', error);
                showNotification('注销账户失败，请重试', 'error');
            }
        });
    }

    // 点击模态框外部关闭
    changePasswordModal.addEventListener('click', (e) => {
        if (e.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
            changePasswordForm.reset();
        }
    });

    deleteAccountModal.addEventListener('click', (e) => {
        if (e.target === deleteAccountModal) {
            deleteAccountModal.style.display = 'none';
            deleteAccountForm.reset();
        }
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    // 完全不使用localStorage，直接从服务器验证登录状态
    let currentUser = null;
    
    try {
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include'
        });
        const result = await response.json();
        
        if (result.success && result.data) {
            currentUser = result.data;
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html';
        return;
    }
    
    // 如果没有用户信息或角色不是管理员，则跳转到登录页面
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // 设置用户名
    document.getElementById('current-username').textContent = currentUser.realName || currentUser.username;
    
    // 设置用户头像
    const avatarElement = document.getElementById('user-avatar');
    if (avatarElement) {
        if (currentUser.avatarUrl && currentUser.avatarUrl.trim() !== '') {
            avatarElement.innerHTML = `<img src="${currentUser.avatarUrl}" alt="用户头像" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarElement.innerHTML = '<i class="fas fa-user-shield"></i>';
        }
    }

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
            // 移除其他菜单项的active类
            document.querySelectorAll('.menu-item').forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            
            // 添加当前菜单项的active类
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            if(section) {
                showSection(section);
                
                // 根据不同的section初始化相应的功能
                if(section === 'resource-manage') {
                    initResourceManagement();
                } else if(section === 'screen-overview') {
                    initScreenOverview();
                }
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

    // 用户下拉菜单 - 优化交互体验
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    
    if(userProfile && userDropdown) {
        let closeTimer = null;
        let isHovering = false;
        
        // 显示下拉菜单的函数
        function showDropdown() {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
            userDropdown.classList.add('show');
        }
        
        // 隐藏下拉菜单的函数
        function hideDropdown() {
            userDropdown.classList.remove('show');
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
            if (userDropdown.classList.contains('show')) {
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
            if (userDropdown.classList.contains('show')) {
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
                if (userDropdown.classList.contains('show')) {
                    // 立即关闭，但如果鼠标在菜单区域内则延时关闭
                    if (!isHovering) {
                        hideDropdown();
                    } else {
                        scheduleHide();
                    }
                }
            }
        });
        
        // 阻止下拉菜单内部点击事件冒泡，并在点击菜单项后关闭菜单
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            // 点击菜单项后，给一个短暂延时然后关闭菜单
            if (e.target.closest('.dropdown-item, .user-dropdown-item')) {
                setTimeout(() => {
                    hideDropdown();
                }, 100);
            }
        });
        
        // 键盘支持：按ESC键关闭下拉菜单
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && userDropdown.classList.contains('show')) {
                hideDropdown();
            }
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

    // 退出登录相关
    const logoutModal = document.getElementById('logout-modal');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');

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

    // 初始化用户下拉菜单功能
    initUserDropdownFunctions();

    // 初始化用户管理功能
    initUserManagement();
});

// 全局变量
let selectedUsers = [];

// 用户管理功能
function initUserManagement() {
    let currentPage = 1;
    const pageSize = 10;
    let paginationInfo = {};

    // 获取DOM元素
    const userSearch = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    const userTableBody = document.getElementById('user-table-body');
    const selectAll = document.getElementById('select-all');
    const batchDelete = document.getElementById('batch-delete');
    const batchRole = document.getElementById('batch-role');
    const exportUsers = document.getElementById('export-users');
    const prevPage = document.getElementById('prev-page');
    const nextPage = document.getElementById('next-page');

    // 模态框元素
    const userEditModal = document.getElementById('user-edit-modal');
    const batchRoleModal = document.getElementById('batch-role-modal');

    // 获取统计数据
    async function loadStats() {
        try {
            const response = await fetch('/api/auth/admin/stats', {
                method: 'GET',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                const stats = result.data;
                document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = stats.totalUsers;
                document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = stats.activeUsers;
                document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = stats.teacherCount;
                document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = stats.studentCount;
                
                // 不显示活跃率变化趋势，保持简洁样式
                // const activeRateElement = document.querySelector('.stat-card:nth-child(2) .stat-change');
                // if (activeRateElement) {
                //     activeRateElement.innerHTML = `<i class="fas fa-arrow-up"></i> ${stats.activeRate}% 活跃率`;
                // }
            } else {
                showNotification(result.message || '获取统计数据失败', 'error');
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
            showNotification('获取统计数据失败', 'error');
        }
    }

    // 获取用户列表数据
    async function loadUsers() {
        try {
            const searchTerm = userSearch.value.trim();
            const roleFilterValue = roleFilter.value;
            
            const params = new URLSearchParams({
                page: currentPage,
                size: pageSize
            });
            
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilterValue) params.append('role', roleFilterValue);
            
            const response = await fetch(`/api/auth/admin/users?${params}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success) {
                filteredUsers = result.data.users;
                paginationInfo = result.data.pagination;
        renderUserTable();
        updatePagination();
            } else {
                showNotification(result.message || '获取用户列表失败', 'error');
            }
        } catch (error) {
            console.error('获取用户列表失败:', error);
            showNotification('获取用户列表失败', 'error');
        }
    }

    // 搜索和筛选用户
    function filterUsers() {
        currentPage = 1;
        loadUsers();
    }

    // 渲染用户表格
    function renderUserTable() {
        userTableBody.innerHTML = '';
        
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            const isSelected = selectedUsers.includes(user.id.toString());
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>${user.username}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${user.role === 'teacher' ? '教师' : user.role === 'student' ? '学生' : '管理员'}
                    </span>
                </td>
                <td>${formatDate(user.createdAt)}</td>
                <td>${user.lastLogin ? formatDate(user.lastLogin) : '从未登录'}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status === 'online' ? '在线' : '离线'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editUser(${user.id})" ${user.username === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="action-btn delete" onclick="deleteUser(${user.id})" ${user.username === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </td>
            `;
            
            userTableBody.appendChild(row);
        });
        
        // 绑定复选框事件
        document.querySelectorAll('.user-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleUserSelection);
        });
    }

    // 处理用户选择
    function handleUserSelection() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        selectedUsers = Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // 更新全选状态
        const allChecked = checkboxes.length > 0 && selectedUsers.length === checkboxes.length;
        selectAll.checked = allChecked;
        selectAll.indeterminate = selectedUsers.length > 0 && selectedUsers.length < checkboxes.length;
        
        // 更新批量操作按钮状态
        const hasSelection = selectedUsers.length > 0;
        batchDelete.disabled = !hasSelection;
        batchRole.disabled = !hasSelection;
        
        // 更新选中数量显示
        const selectedCount = document.getElementById('selected-count');
        if (selectedCount) {
            selectedCount.textContent = selectedUsers.length;
        }
    }

    // 分页更新
    function updatePagination() {
        if (!paginationInfo) return;
        
        document.getElementById('page-start').textContent = paginationInfo.startIndex || 0;
        document.getElementById('page-end').textContent = paginationInfo.endIndex || 0;
        document.getElementById('total-users').textContent = paginationInfo.totalUsers || 0;
        
        prevPage.disabled = currentPage === 1;
        nextPage.disabled = currentPage === paginationInfo.totalPages || paginationInfo.totalPages === 0;
        
        // 生成页码
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = '';
        
        const totalPages = paginationInfo.totalPages || 0;
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.textContent = i;
            pageBtn.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`;
                pageBtn.addEventListener('click', () => {
                    currentPage = i;
                loadUsers();
                });
                pageNumbers.appendChild(pageBtn);
        }
    }

    // 格式化日期
    // formatDate函数已移动到全局作用域

    // 绑定事件
    if (userSearch) {
    userSearch.addEventListener('input', filterUsers);
    }
    if (roleFilter) {
        roleFilter.addEventListener('change', filterUsers);
    }
    if (selectAll) {
    selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        handleUserSelection();
    });
    }
    if (prevPage) {
        prevPage.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
                loadUsers();
            }
        });
    }
    if (nextPage) {
        nextPage.addEventListener('click', function() {
            if (currentPage < paginationInfo.totalPages) {
            currentPage++;
                loadUsers();
            }
        });
    }

    // 初始化
    loadStats();
    loadUsers();
    
    // 添加刷新数据按钮事件
    const refreshDataBtn = document.getElementById('refresh-data');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', function() {
            loadStats();
            loadUsers();
            showNotification('数据已刷新', 'success');
        });
    }
    
    // 批量删除事件
    if (batchDelete) {
        batchDelete.addEventListener('click', handleBatchDelete);
    }
    
    // 批量修改角色事件
    if (batchRole) {
        batchRole.addEventListener('click', handleBatchRole);
    }
    
    // 导出用户数据事件
    if (exportUsers) {
        exportUsers.addEventListener('click', handleExportUsers);
    }
    
    // 批量角色修改弹窗事件
    const closeBatchRoleModal = document.getElementById('close-batch-role-modal');
    const cancelBatchRole = document.getElementById('cancel-batch-role');
    const confirmBatchRole = document.getElementById('confirm-batch-role');
    
    if (closeBatchRoleModal) {
        closeBatchRoleModal.addEventListener('click', hideBatchRoleModal);
    }
    if (cancelBatchRole) {
        cancelBatchRole.addEventListener('click', hideBatchRoleModal);
    }
    if (confirmBatchRole) {
        confirmBatchRole.addEventListener('click', confirmBatchRoleChange);
    }
    
    // 点击弹窗外部关闭
    if (batchRoleModal) {
        batchRoleModal.addEventListener('click', (e) => {
            if (e.target === batchRoleModal) {
                hideBatchRoleModal();
            }
        });
    }
}

// 编辑用户
function editUser(userId) {
    // 从当前用户列表中找到要编辑的用户
    const user = filteredUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('用户不存在', 'error');
        return;
    }
    
    if (user.username === 'admin') {
        showNotification('不允许编辑管理员账户', 'warning');
        return;
    }
    
    const modal = document.getElementById('user-edit-modal');
    const form = document.getElementById('user-edit-form');
    
    // 填充表单数据
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-password').value = '';
    
    // 显示弹窗
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // 绑定保存事件
    const saveBtn = document.getElementById('save-user');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    newSaveBtn.addEventListener('click', async function() {
        const newRole = document.getElementById('edit-role').value;
        const newPassword = document.getElementById('edit-password').value.trim();
        
        try {
            const updateData = {
                role: newRole
            };
            
            if (newPassword) {
                if (newPassword.length < 6) {
                    showNotification('密码长度至少6位', 'warning');
                    return;
                }
                updateData.password = newPassword;
            }
            
            const response = await fetch(`/api/auth/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updateData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('用户信息更新成功', 'success');
            modal.style.display = 'none';
                modal.classList.remove('show');
                form.reset();
                loadUsers(); // 重新加载用户列表
                loadStats(); // 重新加载统计数据
            } else {
                showNotification(result.message || '更新失败', 'error');
            }
        } catch (error) {
            console.error('更新用户失败:', error);
            showNotification('更新用户失败', 'error');
        }
    });
}

// 删除用户
async function deleteUser(userId) {
    // 从当前用户列表中找到要删除的用户
    const user = filteredUsers.find(u => u.id === userId);
    if (!user) {
        showNotification('用户不存在', 'error');
        return;
    }
    
    if (user.username === 'admin') {
        showNotification('不允许删除管理员账户', 'warning');
        return;
    }
    
    // 使用自定义确认弹窗
    showConfirmModal({
        type: 'danger',
        title: '删除用户',
        message: `确定要删除用户 "${user.username}" 吗？\n\n此操作不可撤销！`,
        confirmClass: 'course-btn-danger',
        confirmIcon: 'fas fa-trash',
        confirmText: '删除',
        onConfirm: async () => {
            await performSingleDelete(userId);
        }
    });
}

// 执行单个用户删除操作
async function performSingleDelete(userId) {
    try {
        const response = await fetch(`/api/auth/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('用户删除成功', 'success');
            loadUsers(); // 重新加载用户列表
            loadStats(); // 重新加载统计数据
        } else {
            showNotification(result.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        showNotification('删除用户失败', 'error');
    }
}

// 初始化添加用户功能
function initAddUser() {
    const addUserBtn = document.getElementById('add-user');
    const addUserModal = document.getElementById('add-user-modal');
    
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'flex';
            addUserModal.classList.add('show');
        });
    }
    
    bindAddUserEvents();
}

// 绑定添加用户相关事件
function bindAddUserEvents() {
    const addUserModal = document.getElementById('add-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    const closeAddModal = document.getElementById('close-add-modal');
    const cancelAdd = document.getElementById('cancel-add');
    const saveNewUser = document.getElementById('save-new-user');
    
    if (closeAddModal) {
        closeAddModal.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserModal.classList.remove('show');
            addUserForm.reset();
        });
    }
    
    if (cancelAdd) {
        cancelAdd.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserModal.classList.remove('show');
            addUserForm.reset();
        });
    }
    
    // 绑定编辑用户模态框关闭事件
    const userEditModal = document.getElementById('user-edit-modal');
    const userEditForm = document.getElementById('user-edit-form');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    
    if (closeEditModal) {
        closeEditModal.addEventListener('click', function() {
            userEditModal.style.display = 'none';
            userEditModal.classList.remove('show');
            userEditForm.reset();
        });
    }
    
    if (cancelEdit) {
        cancelEdit.addEventListener('click', function() {
            userEditModal.style.display = 'none';
            userEditModal.classList.remove('show');
            userEditForm.reset();
        });
    }
    
    // 点击模态框外部关闭
    if (addUserModal) {
        addUserModal.addEventListener('click', function(e) {
            if (e.target === addUserModal) {
                addUserModal.style.display = 'none';
                addUserModal.classList.remove('show');
                addUserForm.reset();
            }
        });
    }
    
    if (userEditModal) {
        userEditModal.addEventListener('click', function(e) {
            if (e.target === userEditModal) {
                userEditModal.style.display = 'none';
                userEditModal.classList.remove('show');
                userEditForm.reset();
            }
        });
    }
    
    if (saveNewUser) {
        saveNewUser.addEventListener('click', async function() {
            // 获取表单数据
            const username = document.getElementById('add-username').value.trim();
            const password = document.getElementById('add-password').value;
            const confirmPassword = document.getElementById('add-confirm-password').value;
            const role = document.getElementById('add-role').value;
            
            // 验证表单
            if (!username || !password || !role) {
                showNotification('请填写所有必填字段', 'error');
            return;
        }
        
            if (password !== confirmPassword) {
                showNotification('密码与确认密码不匹配', 'error');
            return;
        }
        
            if (password.length < 6) {
                showNotification('密码至少需要6位', 'error');
            return;
        }
        
            try {
                const response = await fetch('/api/auth/admin/users', {
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
                    showNotification('用户创建成功', 'success');
                    addUserModal.style.display = 'none';
                    addUserModal.classList.remove('show');
                    addUserForm.reset();
                    loadUsers(); // 重新加载用户列表
                    loadStats(); // 重新加载统计数据
                } else {
                    showNotification(result.message || '创建用户失败', 'error');
                }
            } catch (error) {
                console.error('创建用户失败:', error);
                showNotification('创建用户失败', 'error');
            }
        });
    }
}

// 页面加载完成后初始化添加用户功能
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initAddUser, 100);
    initConfirmModal();
}); 

// 确认弹窗处理
function initConfirmModal() {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalCancel = document.getElementById('confirm-modal-cancel');
    const confirmModalConfirm = document.getElementById('confirm-modal-confirm');
    
    // 取消按钮事件
    if (confirmModalCancel) {
        confirmModalCancel.addEventListener('click', hideConfirmModal);
    }
    
    // 点击弹窗外部关闭
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                hideConfirmModal();
            }
        });
    }
}

// 显示确认弹窗
function showConfirmModal(options) {
    const confirmModal = document.getElementById('confirm-modal');
    const confirmModalIcon = document.getElementById('confirm-modal-icon');
    const confirmModalTitle = document.getElementById('confirm-modal-title');
    const confirmModalMessage = document.getElementById('confirm-modal-message');
    const confirmModalConfirm = document.getElementById('confirm-modal-confirm');
    
    // 设置图标和样式
    const iconConfig = {
        danger: { icon: 'fas fa-exclamation-triangle', color: '#dc3545', bgColor: 'rgba(220, 53, 69, 0.1)' },
        warning: { icon: 'fas fa-exclamation-circle', color: '#ffc107', bgColor: 'rgba(255, 193, 7, 0.1)' },
        info: { icon: 'fas fa-info-circle', color: '#17a2b8', bgColor: 'rgba(23, 162, 184, 0.1)' }
    };
    
    const config = iconConfig[options.type] || iconConfig.info;
    
    // 设置内容
    confirmModalIcon.innerHTML = `<i class="${config.icon}"></i>`;
    confirmModalIcon.style.backgroundColor = config.bgColor;
    confirmModalIcon.querySelector('i').style.color = config.color;
    confirmModalTitle.textContent = options.title || '确认操作';
    // 处理换行符
    const message = options.message || '确定要执行此操作吗？';
    confirmModalMessage.innerHTML = message.replace(/\n/g, '<br>');
    
    // 设置确认按钮
    const confirmBtn = confirmModalConfirm;
    confirmBtn.className = `course-btn ${options.confirmClass || 'course-btn-primary'}`;
    confirmBtn.innerHTML = `<i class="${options.confirmIcon || 'fas fa-check'}"></i><span>${options.confirmText || '确定'}</span>`;
    
    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 添加新的事件监听器
    newConfirmBtn.addEventListener('click', () => {
        hideConfirmModal();
        if (options.onConfirm) {
            options.onConfirm();
        }
    });
    
    // 显示弹窗
    confirmModal.style.display = 'flex';
    confirmModal.classList.add('show');
}

// 隐藏确认弹窗
function hideConfirmModal() {
    const confirmModal = document.getElementById('confirm-modal');
    confirmModal.style.display = 'none';
    confirmModal.classList.remove('show');
}

// 批量删除处理函数
async function handleBatchDelete() {
    if (selectedUsers.length === 0) {
        showNotification('请选择要删除的用户', 'warning');
            return;
        }
        
    // 检查是否包含admin用户
    const adminUsers = filteredUsers.filter(user => 
        selectedUsers.includes(user.id.toString()) && user.username === 'admin'
    );
    
    if (adminUsers.length > 0) {
        showNotification('不能删除管理员账户', 'warning');
        return;
    }
    
    const selectedUsernames = filteredUsers
        .filter(user => selectedUsers.includes(user.id.toString()))
        .map(user => user.username);
    
    // 使用自定义确认弹窗
    showConfirmModal({
        type: 'danger',
        title: '批量删除用户',
        message: `确定要删除以下 ${selectedUsers.length} 个用户吗？\n${selectedUsernames.join(', ')}\n\n此操作不可撤销！`,
        confirmClass: 'course-btn-danger',
        confirmIcon: 'fas fa-trash',
        confirmText: '删除',
        onConfirm: async () => {
            await performBatchDelete();
        }
    });
}

// 执行批量删除操作
async function performBatchDelete() {
    try {
        const response = await fetch('/api/auth/admin/users/batch', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                userIds: selectedUsers.map(id => parseInt(id))
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message || '批量删除成功', 'success');
            selectedUsers = [];
            loadUsers();
            loadStats();
        } else {
            showNotification(result.message || '批量删除失败', 'error');
        }
    } catch (error) {
        console.error('批量删除失败:', error);
        showNotification('批量删除失败', 'error');
    }
}

// 批量修改角色处理函数
function handleBatchRole() {
    if (selectedUsers.length === 0) {
        showNotification('请选择要修改角色的用户', 'warning');
        return;
    }
    
    // 检查是否包含admin用户
    const adminUsers = filteredUsers.filter(user => 
        selectedUsers.includes(user.id.toString()) && user.username === 'admin'
    );
    
    if (adminUsers.length > 0) {
        showNotification('不能修改管理员账户的角色', 'warning');
        return;
    }
    
    // 更新选中数量显示
    document.getElementById('selected-count').textContent = selectedUsers.length;
    
    // 重置角色选择
    document.getElementById('batch-new-role').value = '';
    
    // 显示弹窗
    const modal = document.getElementById('batch-role-modal');
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// 隐藏批量角色修改弹窗
function hideBatchRoleModal() {
    const modal = document.getElementById('batch-role-modal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}

// 确认批量角色修改
async function confirmBatchRoleChange() {
    const newRole = document.getElementById('batch-new-role').value;
    
    if (!newRole) {
        showNotification('请选择新角色', 'warning');
            return;
        }
        
    try {
        const response = await fetch('/api/auth/admin/users/batch-role', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                userIds: selectedUsers.map(id => parseInt(id)),
                newRole: newRole
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message || '批量修改角色成功', 'success');
            hideBatchRoleModal();
            selectedUsers = [];
            loadUsers();
            loadStats();
        } else {
            showNotification(result.message || '批量修改角色失败', 'error');
        }
    } catch (error) {
        console.error('批量修改角色失败:', error);
        showNotification('批量修改角色失败', 'error');
    }
}

// 导出用户数据处理函数
async function handleExportUsers() {
    try {
        const roleFilterValue = document.getElementById('role-filter').value;
        
        const params = new URLSearchParams();
        if (roleFilterValue) params.append('role', roleFilterValue);
        
        const response = await fetch(`/api/auth/admin/users/export?${params}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 将数据转换为CSV格式
            const csvData = convertToCSV(result.data);
            
            // 创建下载链接
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `用户数据_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('用户数据导出成功', 'success');
        } else {
            showNotification(result.message || '导出失败', 'error');
        }
    } catch (error) {
        console.error('导出用户数据失败:', error);
        showNotification('导出用户数据失败', 'error');
    }
}

// 将数据转换为CSV格式
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return '';
    }
    
    // 获取表头
    const headers = Object.keys(data[0]);
    
    // 构建CSV内容
    const csvContent = [
        // 表头行
        headers.join(','),
        // 数据行
        ...data.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // 如果值包含逗号、换行符或双引号，需要用双引号包围并转义内部双引号
                if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    // 添加BOM以确保Excel正确显示中文
    return '\uFEFF' + csvContent;
}

// ================== 课件资源管理功能 ==================

// 全局变量
let resourcesData = {};
let currentSelectedSubject = null;

// 初始化课件资源管理
function initResourceManagement() {
    console.log('🚀 初始化课件资源管理');
    
    // 检查关键DOM元素
    const requiredElements = [
        'subject-cards',
        'subject-overview', 
        'resource-details',
        'resource-table-body',
        'subject-filter'
    ];
    
    const missingElements = [];
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            missingElements.push(id);
        } else {
            console.log(`✅ 找到DOM元素: ${id}`);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('❌ 缺少关键DOM元素:', missingElements);
        showNotification('页面结构不完整，请刷新重试', 'error');
        return;
    }
    
    // 绑定事件监听器
    bindResourceEvents();
    
    // 加载资源数据
    loadResourceData();
}

// 绑定资源管理事件
function bindResourceEvents() {
    // 刷新按钮
    const refreshBtn = document.getElementById('refresh-resources');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadResourceData);
    }
    
    // 导出按钮
    const exportBtn = document.getElementById('export-resources');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllResources);
    }
    
    // 导出试卷按钮
    const exportExamsBtn = document.getElementById('export-exams');
    if (exportExamsBtn) {
        exportExamsBtn.addEventListener('click', exportExamContent);
    }
    
    // 导出选中学科按钮
    const exportSelectedBtn = document.getElementById('export-selected');
    if (exportSelectedBtn) {
        exportSelectedBtn.addEventListener('click', exportSelectedSubject);
    }
    
    // 查看统计按钮
    const viewStatsBtn = document.getElementById('view-stats');
    if (viewStatsBtn) {
        viewStatsBtn.addEventListener('click', showResourceStats);
    }
    
    // 搜索框
    const searchInput = document.getElementById('resource-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterResources);
    }
    
    // 学科筛选
    const subjectFilter = document.getElementById('subject-filter');
    if (subjectFilter) {
        subjectFilter.addEventListener('change', filterResources);
    }
    
    // 资源类型筛选
    const resourceTypeFilter = document.getElementById('resource-type-filter');
    if (resourceTypeFilter) {
        resourceTypeFilter.addEventListener('change', filterResources);
    }
    
    // 返回概览按钮
    const backBtn = document.getElementById('back-to-overview');
    if (backBtn) {
        backBtn.addEventListener('click', showSubjectOverview);
    }
}

// 加载资源数据
async function loadResourceData() {
    try {
        console.log('开始加载资源数据');
        showLoading('正在加载资源数据...');
        
        const response = await fetch('/api/admin/resources', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log(`API响应状态: ${response.status}`);
        const result = await response.json();
        console.log('API响应结果:', result);
        
        hideLoading();
        
        if (result.success) {
            resourcesData = result.data;
            currentResourceData = result.data; // 同时设置currentResourceData
            
            console.log('资源数据已更新:', resourcesData);
            console.log('📊 学科统计数据:', resourcesData.subjectCounts);
            console.log('📊 资源总数:', resourcesData.totalResources);
            
            updateResourceStats();
            populateSubjectFilter();
            showSubjectOverview();
            
            showNotification('资源数据加载成功', 'success');
        } else {
            console.error('加载资源数据失败:', result.message);
            showNotification(result.message || '加载资源数据失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('加载资源数据失败:', error);
        showNotification('加载资源数据失败', 'error');
    }
}

// 更新资源统计
function updateResourceStats() {
    const totalResources = resourcesData.totalResources || 0;
    const totalSubjects = resourcesData.totalSubjects || 0;
    
    // 计算总存储空间
    let totalStorage = 0;
    const resourcesBySubject = resourcesData.resourcesBySubject || {};
    Object.values(resourcesBySubject).forEach(resources => {
        resources.forEach(resource => {
            totalStorage += resource.fileSize || 0;
        });
    });
    
    // 计算活跃教师数
    const activeTeachers = new Set();
    Object.values(resourcesBySubject).forEach(resources => {
        resources.forEach(resource => {
            if (resource.teacherName) {
                activeTeachers.add(resource.teacherName);
            }
        });
    });
    
    document.getElementById('total-resources').textContent = totalResources;
    document.getElementById('total-subjects').textContent = totalSubjects;
    document.getElementById('total-storage').textContent = formatFileSize(totalStorage);
    document.getElementById('active-teachers').textContent = activeTeachers.size;
}

// 填充学科筛选器
function populateSubjectFilter() {
    const subjectFilter = document.getElementById('subject-filter');
    const subjectCounts = resourcesData.subjectCounts || {};
    
    // 清空现有选项
    subjectFilter.innerHTML = '<option value="">全部学科</option>';
    
    // 添加学科选项
    Object.keys(subjectCounts).forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = `${subject} (${subjectCounts[subject]})`;
        subjectFilter.appendChild(option);
    });
}

// 显示学科概览
function showSubjectOverview() {
    const overviewDiv = document.getElementById('subject-overview');
    const detailsDiv = document.getElementById('resource-details');
    
    overviewDiv.style.display = 'block';
    detailsDiv.style.display = 'none';
    
    // 清除筛选条件
    const subjectFilter = document.getElementById('subject-filter');
    const resourceTypeFilter = document.getElementById('resource-type-filter');
    
    if (subjectFilter) subjectFilter.value = '';
    if (resourceTypeFilter) resourceTypeFilter.value = '';
    
    renderSubjectCards();
}

// 渲染学科卡片
function renderSubjectCards() {
    console.log('开始渲染学科卡片');
    const cardsContainer = document.getElementById('subject-cards');
    
    // 确保使用正确的全局变量
    const subjectCounts = (currentResourceData && currentResourceData.subjectCounts) || 
                          (resourcesData && resourcesData.subjectCounts) || {};
    const resourcesBySubject = (currentResourceData && currentResourceData.resourcesBySubject) || 
                              (resourcesData && resourcesData.resourcesBySubject) || {};
    
    console.log('学科统计数据:', subjectCounts);
    console.log('学科资源数据:', resourcesBySubject);
    
    if (!cardsContainer) {
        console.error('找不到subject-cards元素');
        return;
    }
    
    cardsContainer.innerHTML = '';
    
    if (Object.keys(subjectCounts).length === 0) {
        console.log('没有学科数据，显示空状态');
        cardsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无学科数据</div>';
        return;
    }
    
    Object.keys(subjectCounts).forEach(subject => {
        const resources = resourcesBySubject[subject] || [];
        const resourceCount = subjectCounts[subject] || 0;
        
        // 计算该学科的总存储空间
        const totalSize = resources.reduce((sum, resource) => sum + (resource.fileSize || 0), 0);
        
        // 获取该学科的教师数
        const teachers = new Set(resources.map(r => r.teacherName).filter(name => name));
        
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <h4>${subject}</h4>
            <div class="resource-count">${resourceCount} 个资源</div>
            <div class="resource-stats">
                <div class="stat-item">
                    <div class="stat-value">${formatFileSize(totalSize)}</div>
                    <div class="stat-label">存储空间</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${teachers.size}</div>
                    <div class="stat-label">教师数</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            console.log(`点击了学科卡片: ${subject}`);
            showSubjectDetails(subject);
        });
        cardsContainer.appendChild(card);
    });
    
    console.log(`成功渲染了 ${Object.keys(subjectCounts).length} 个学科卡片`);
}

// 显示学科详情
function showSubjectDetails(subject) {
    console.log(`显示学科详情: ${subject}`);
    currentSelectedSubject = subject;
    
    const overviewDiv = document.getElementById('subject-overview');
    const detailsDiv = document.getElementById('resource-details');
    
    if (!overviewDiv || !detailsDiv) {
        console.error('找不到必要的DOM元素');
        return;
    }
    
    console.log('切换显示状态');
    overviewDiv.style.display = 'none';
    detailsDiv.style.display = 'block';
    
    const titleElement = document.getElementById('selected-subject-title');
    if (titleElement) {
        titleElement.textContent = `${subject} - 资源详情`;
    }
    
    console.log('开始加载学科资源');
    loadSubjectResources(subject);
}

// 加载学科资源
async function loadSubjectResources(subject) {
    try {
        console.log(`开始加载学科资源: ${subject}`);
        
        showLoading('正在加载学科资源...');
        
        const response = await fetch(`/api/admin/resources?subject=${encodeURIComponent(subject)}&page=0&size=50`, {
            method: 'GET',
            credentials: 'include'
        });
        
        hideLoading();
        
        console.log(`API响应状态: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`API响应结果:`, result);
        
        if (result.success) {
            // 处理学科详情API的数据结构
            let resources = [];
            
            if (result.data && result.data.resources && Array.isArray(result.data.resources)) {
                resources = result.data.resources;
                console.log(`✅ 从学科详情API获取到 ${resources.length} 个资源`);
            } else if (result.data && Array.isArray(result.data)) {
                resources = result.data;
                console.log(`✅ 从备用数据结构获取到 ${resources.length} 个资源`);
            } else {
                console.error('❌ 学科详情API数据格式错误:', result.data);
                resources = [];
            }
            
            console.log('📋 即将渲染的资源数据:', resources);
            
            // 确保表格容器存在
            const tableBody = document.getElementById('resource-table-body');
            if (!tableBody) {
                console.error('❌ 致命错误：找不到resource-table-body元素');
                showNotification('页面结构错误，请刷新页面重试', 'error');
                return;
            }
            
            // 应用筛选条件
            const filteredResources = applyFiltersToResources(resources);
            
            // 强制渲染表格
            renderResourceTable(filteredResources);
            
            if (resources.length > 0) {
                if (filteredResources.length === resources.length) {
                    showNotification(`✅ 成功加载 ${resources.length} 个资源`, 'success');
                } else {
                    showNotification(`✅ 找到 ${filteredResources.length} 个符合条件的资源（共 ${resources.length} 个）`, 'success');
                }
            } else {
                showNotification('此学科暂无资源', 'info');
            }
        } else {
            console.error(`❌ API返回失败: ${result.message}`);
            showNotification(result.message || '加载学科资源失败', 'error');
            renderResourceTable([]); // 渲染空表格
        }
    } catch (error) {
        hideLoading();
        console.error('❌ 请求异常:', error);
        showNotification(`加载失败: ${error.message}`, 'error');
        renderResourceTable([]); // 渲染空表格
    }
}

// 渲染资源表格
function renderResourceTable(resources) {
    console.log(`🎯 开始渲染资源表格，资源数量: ${resources.length}`);
    console.log('📊 资源数据详情:', resources);
    
    const tableBody = document.getElementById('resource-table-body');
    
    if (!tableBody) {
        console.error('❌ 致命错误：找不到resource-table-body元素');
        showNotification('页面结构错误，请刷新页面重试', 'error');
        return;
    }
    
    console.log('✅ 找到表格body元素');
    
    // 强制清空表格
    tableBody.innerHTML = '';
    console.log('✅ 表格已清空');
    
    if (!resources || resources.length === 0) {
        console.log('📝 显示空状态提示');
        const emptyRow = document.createElement('tr');
        
        // 检查是否有筛选条件
        const searchTerm = document.getElementById('resource-search').value.toLowerCase();
        const selectedResourceType = document.getElementById('resource-type-filter').value;
        
        let emptyMessage = '此学科暂无资源数据';
        if (searchTerm || selectedResourceType) {
            emptyMessage = '没有找到符合筛选条件的资源';
        }
        
        emptyRow.innerHTML = `<td colspan="8" style="text-align: center; color: #999; padding: 30px; font-size: 16px;">${emptyMessage}</td>`;
        tableBody.appendChild(emptyRow);
        console.log('✅ 空状态提示已添加');
        return;
    }
    
    console.log(`📋 准备渲染 ${resources.length} 个资源`);
    
    try {
        // 渲染每个资源
        resources.forEach((resource, index) => {
            try {
                console.log(`🔄 渲染资源 ${index + 1}:`, resource);
                
                const row = document.createElement('tr');
                
                // 安全获取资源属性
                const resourceName = resource.name || resource.title || '未知资源';
                const resourceType = resource.type || 'OTHER';
                const courseName = resource.courseName || '未知课程';
                const teacherName = resource.teacherName || '未知教师';
                const description = resource.description || '无描述';
                
                console.log(`📝 资源基本信息: ${resourceName}, 类型: ${resourceType}, 课程: ${courseName}`);
                
                // 获取资源类型图标和文本
                const typeIcon = getResourceTypeIcon(resourceType);
                const resourceTypeText = resource.resourceType || getResourceTypeText(resourceType);
                
                console.log(`🎨 资源显示信息: 图标: ${typeIcon}, 文本: ${resourceTypeText}`);
                
                // 构建额外信息（针对试卷和知识块）
                let extraInfo = '';
                if (resourceType === 'EXAM') {
                    const duration = resource.duration || 0;
                    const totalScore = resource.totalScore || 0;
                    const questionCount = resource.questionCount || 0;
                    
                    extraInfo = `
                        <div class="exam-details" style="margin-top: 5px;">
                            <small style="color: #666;">
                                <i class="fas fa-clock"></i> ${duration}分钟 
                                <i class="fas fa-star"></i> ${totalScore}分 
                                <i class="fas fa-question-circle"></i> ${questionCount}题
                            </small>
                        </div>
                    `;
                    console.log(`📊 试卷额外信息: ${duration}分钟, ${totalScore}分, ${questionCount}题`);
                } else if (resourceType === 'KNOWLEDGE') {
                    const chunkCount = resource.chunkCount || 0;
                    const processedCount = resource.processedCount || 0;
                    const fileName = resource.fileName || '';
                    
                    extraInfo = `
                        <div class="knowledge-details" style="margin-top: 5px;">
                            <small style="color: #666;">
                                <i class="fas fa-puzzle-piece"></i> ${chunkCount}个知识块
                                <i class="fas fa-check-circle"></i> ${processedCount}个已处理
                            </small>
                        </div>
                    `;
                    console.log(`📚 知识块额外信息: ${chunkCount}个块, ${processedCount}个已处理`);
                }
                
                // 格式化文件大小
                const fileSize = resourceType === 'EXAM' ? '-' : formatFileSize(resource.fileSize || 0);
                
                // 格式化上传时间
                const uploadTime = formatDate(resource.uploadedAt || resource.createdAt);
                
                console.log(`⏰ 时间和大小: ${uploadTime}, ${fileSize}`);
                
                // 构建操作按钮
                let actionsHtml = '';
                if (resourceType === 'EXAM') {
                    // 试卷类型显示查看、导出和删除按钮
                    actionsHtml = `
                        <button class="btn btn-sm btn-primary" onclick="viewExamContent('${resource.id}')" title="查看试卷">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="exportSingleExam('${resource.id}')" title="导出试卷">
                            <i class="fas fa-file-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteExam('${resource.id}', '${resourceName}')" title="删除试卷">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                } else if (resourceType === 'KNOWLEDGE') {
                    // 知识块类型显示查看按钮
                    actionsHtml = `
                        <button class="btn btn-sm btn-primary" onclick="viewKnowledgeContent('${resource.courseId}', '${resource.fileName}')" title="查看知识块">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                } else if (resourceType === 'OUTLINE') {
                    // 教学大纲类型显示查看按钮
                    actionsHtml = `
                        <button class="btn btn-sm btn-primary" onclick="viewTeachingOutlineContent('${resource.id}')" title="查看教学大纲">
                            <i class="fas fa-eye"></i>
                        </button>
                    `;
                } else {
                    // 其他资源类型显示下载按钮
                    actionsHtml = `
                        <button class="btn btn-sm btn-primary" onclick="downloadResource('${resource.id}', '${resource.resourceType}')" title="下载">
                            <i class="fas fa-download"></i>
                        </button>
                    `;
                }
                
                console.log(`🔘 操作按钮: ${actionsHtml ? '已生成' : '未生成'}`);
                
                row.innerHTML = `
                    <td>
                        <div class="resource-name">
                            <i class="${typeIcon}" style="margin-right: 8px; color: #3498db;"></i> ${resourceName}
                            ${extraInfo}
                        </div>
                    </td>
                    <td>
                        <span class="badge badge-${getTypeColor(resourceType)}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${resourceTypeText}</span>
                    </td>
                    <td>${fileSize}</td>
                    <td>${courseName}</td>
                    <td>${teacherName}</td>
                    <td>${uploadTime}</td>
                    <td title="${description}">${description.length > 20 ? description.substring(0, 20) + '...' : description}</td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            ${actionsHtml}
                        </div>
                    </td>
                `;
                
                console.log(`🏗️ 行HTML已构建，准备添加到表格`);
                
                if (tableBody) {
                    tableBody.appendChild(row);
                    console.log(`✅ 成功渲染资源 ${index + 1}: ${resourceName}`);
                } else {
                    console.error('❌ tableBody 不存在，无法添加行');
                }
            } catch (error) {
                console.error(`❌ 渲染资源 ${index + 1} 失败:`, error, resource);
                showNotification(`渲染第 ${index + 1} 个资源失败: ${error.message}`, 'error');
                // 即使单个资源渲染失败，也继续渲染其他资源
                // 创建一个错误行显示
                try {
                    const errorRow = document.createElement('tr');
                    errorRow.innerHTML = `
                        <td colspan="8" style="text-align: center; color: #e74c3c; padding: 15px; font-size: 14px;">
                            <i class="fas fa-exclamation-triangle"></i> 资源 ${index + 1} 渲染失败: ${error.message}
                        </td>
                    `;
                    if (tableBody) {
                        tableBody.appendChild(errorRow);
                    } else {
                        console.error('❌ tableBody 不存在，无法添加错误行');
                    }
                } catch (fallbackError) {
                    console.error('连错误行都无法渲染:', fallbackError);
                }
            }
        });
    } catch (error) {
        console.error('❌ 整个资源渲染循环失败:', error);
        showNotification('资源渲染失败: ' + error.message, 'error');
        return;
    }
    
    console.log(`🎉 表格渲染完成！总共渲染了 ${resources.length} 个资源`);
    
    // 确保表格可见
    const detailsDiv = document.getElementById('resource-details');
    if (detailsDiv) {
        detailsDiv.style.display = 'block';
        console.log('✅ 资源详情表格已设置为可见');
    } else {
        console.error('❌ 找不到resource-details元素');
    }
}

// 获取类型对应的颜色
function getTypeColor(type) {
    const colors = {
        'PPT': 'primary',
        'PDF': 'danger',
        'DOC': 'info',
        'DOCX': 'info',
        'TXT': 'secondary',
        'EXAM': 'warning',
        'QUESTION': 'info',
        'MATERIAL': 'primary',
        'KNOWLEDGE': 'success',
        'OUTLINE': 'info',
        'OTHER': 'secondary'
    };
    return colors[type] || 'secondary';
}

// 获取资源类型图标
function getResourceTypeIcon(type) {
    const icons = {
        'PPT': 'fas fa-file-powerpoint',
        'PDF': 'fas fa-file-pdf',
        'DOC': 'fas fa-file-word',
        'DOCX': 'fas fa-file-word',
        'TXT': 'fas fa-file-alt',
        'EXAM': 'fas fa-clipboard-list',
        'QUESTION': 'fas fa-question-circle',
        'MATERIAL': 'fas fa-file',
        'KNOWLEDGE': 'fas fa-brain',
        'OUTLINE': 'fas fa-file-alt',
        'OTHER': 'fas fa-file'
    };
    return icons[type] || 'fas fa-file';
}

// 获取资源类型文本
function getResourceTypeText(type) {
    const texts = {
        'PPT': 'PPT文件',
        'PDF': 'PDF文件',
        'DOC': 'Word文档',
        'DOCX': 'Word文档',
        'TXT': '文本文件',
        'EXAM': '考试试卷',
        'QUESTION': '练习题',
        'MATERIAL': '课程资料',
        'KNOWLEDGE': '知识块',
        'OUTLINE': '教学大纲',
        'OTHER': '其他文件'
    };
    return texts[type] || '未知类型';
}

// 筛选资源
function filterResources() {
    const searchTerm = document.getElementById('resource-search').value.toLowerCase();
    const selectedSubject = document.getElementById('subject-filter').value;
    const selectedResourceType = document.getElementById('resource-type-filter').value;
    
    console.log('🔍 筛选条件:', { searchTerm, selectedSubject, selectedResourceType });
    
    // 如果筛选类型是教学大纲，直接显示教学大纲页面
    if (selectedResourceType === 'OUTLINE') {
        showTeachingOutlines();
        return;
    }
    
    if (selectedSubject) {
        // 在学科详情页面中应用筛选
        showSubjectDetails(selectedSubject);
    } else {
        // 如果在概览模式下，检查是否有筛选条件
        const detailsDiv = document.getElementById('resource-details');
        const overviewDiv = document.getElementById('subject-overview');
        
        if (detailsDiv && detailsDiv.style.display !== 'none' && 
            overviewDiv && overviewDiv.style.display === 'none') {
            // 如果当前在详情页面，重新加载当前学科的资源
            const currentSubject = getCurrentSubjectFromTitle();
            if (currentSubject) {
                loadSubjectResources(currentSubject);
            }
        } else {
            // 如果在概览模式下，显示概览
            showSubjectOverview();
        }
    }
}

// 从标题获取当前学科
function getCurrentSubjectFromTitle() {
    const titleElement = document.getElementById('selected-subject-title');
    if (titleElement) {
        const titleText = titleElement.textContent;
        // 从 "数学 - 资源详情" 中提取 "数学"
        const match = titleText.match(/^(.+?)\s*-\s*资源详情$/);
        return match ? match[1] : null;
    }
    return null;
}

// 显示教学大纲页面
async function showTeachingOutlines() {
    try {
        console.log('🎯 开始显示教学大纲页面');
        
        // 隐藏概览页面和资源详情页面
        const overviewDiv = document.getElementById('subject-overview');
        const detailsDiv = document.getElementById('resource-details');
        
        if (overviewDiv) overviewDiv.style.display = 'none';
        if (detailsDiv) detailsDiv.style.display = 'block';
        
        // 更新标题
        const titleElement = document.getElementById('selected-subject-title');
        if (titleElement) {
            titleElement.textContent = '教学大纲管理';
        }
        
        // 获取搜索关键词
        const searchTerm = document.getElementById('resource-search').value.toLowerCase();
        
        // 加载教学大纲数据
        await loadTeachingOutlines(searchTerm);
        
        console.log('✅ 教学大纲页面显示完成');
        
    } catch (error) {
        console.error('❌ 显示教学大纲页面失败:', error);
        showNotification('显示教学大纲页面失败', 'error');
    }
}

// 加载教学大纲数据
async function loadTeachingOutlines(keyword = '') {
    try {
        console.log('🔄 开始加载教学大纲数据');
        showLoading('正在加载教学大纲...');
        
        // 构建API URL
        let url = '/api/admin/teaching-outlines?page=0&size=100';
        if (keyword && keyword.trim()) {
            url += `&keyword=${encodeURIComponent(keyword)}`;
        }
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        hideLoading();
        
        console.log(`教学大纲API响应状态: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('教学大纲API响应:', result);
        
        if (result.success) {
            console.log('✅ 成功获取教学大纲数据');
            
            // 转换为资源表格格式
            const outlineResources = result.data.map(outline => ({
                id: outline.id,
                name: outline.courseName + ' - 教学大纲',
                type: 'OUTLINE',
                resourceType: '教学大纲',
                description: outline.teachingObjective ? outline.teachingObjective.substring(0, 100) + '...' : '暂无描述',
                fileSize: 0,
                uploadedAt: outline.createdAt,
                createdAt: outline.createdAt,
                courseId: outline.courseId,
                courseName: outline.courseName,
                teacherName: outline.teacherName,
                outlineData: outline // 保存完整的大纲数据
            }));
            
            console.log('📋 转换后的教学大纲资源:', outlineResources);
            
            // 渲染资源表格
            renderResourceTable(outlineResources);
            
            if (outlineResources.length > 0) {
                showNotification(`✅ 成功加载 ${outlineResources.length} 个教学大纲`, 'success');
            } else {
                showNotification('暂无教学大纲数据', 'info');
            }
            
        } else {
            console.error('❌ 获取教学大纲数据失败:', result.message);
            showNotification(result.message || '获取教学大纲数据失败', 'error');
            renderResourceTable([]);
        }
        
    } catch (error) {
        hideLoading();
        console.error('❌ 加载教学大纲数据失败:', error);
        showNotification('加载教学大纲数据失败', 'error');
        renderResourceTable([]);
    }
}

// 应用筛选到资源列表
function applyFiltersToResources(resources) {
    const searchTerm = document.getElementById('resource-search').value.toLowerCase();
    const selectedResourceType = document.getElementById('resource-type-filter').value;
    
    console.log('🎯 应用筛选:', { searchTerm, selectedResourceType, totalResources: resources.length });
    
    let filteredResources = resources;
    
    // 应用搜索筛选
    if (searchTerm) {
        filteredResources = filteredResources.filter(resource => {
            const resourceName = (resource.name || resource.title || '').toLowerCase();
            const courseName = (resource.courseName || '').toLowerCase();
            const teacherName = (resource.teacherName || '').toLowerCase();
            const description = (resource.description || '').toLowerCase();
            
            return resourceName.includes(searchTerm) || 
                   courseName.includes(searchTerm) || 
                   teacherName.includes(searchTerm) || 
                   description.includes(searchTerm);
        });
    }
    
    // 应用资源类型筛选
    if (selectedResourceType) {
        filteredResources = filteredResources.filter(resource => {
            return resource.type === selectedResourceType;
        });
    }
    
    console.log('📋 筛选结果:', { 
        原始数量: resources.length, 
        筛选后数量: filteredResources.length,
        搜索词: searchTerm,
        资源类型: selectedResourceType
    });
    
    return filteredResources;
}

// 导出所有资源
async function exportAllResources() {
    try {
        const response = await fetch('/api/admin/resources/export', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.headers.get('Content-Disposition').split('filename=')[1] || 'resources.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('资源导出成功', 'success');
        } else {
            showNotification('导出失败', 'error');
        }
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败', 'error');
    }
}

// 导出选中学科
async function exportSelectedSubject() {
    const selectedSubject = document.getElementById('subject-filter').value;
    
    if (!selectedSubject) {
        showNotification('请先选择要导出的学科', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/resources/export?subject=${encodeURIComponent(selectedSubject)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedSubject}_resources.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification(`${selectedSubject}学科资源导出成功`, 'success');
        } else {
            showNotification('导出失败', 'error');
        }
    } catch (error) {
        console.error('导出失败:', error);
        showNotification('导出失败', 'error');
    }
}

// 导出试卷内容
async function exportExamContent() {
    try {
        // 检查是否在学科详情页面
        const currentSubject = getCurrentSubject();
        let exportUrl = '/api/admin/exams/export';
        let filename = '试卷合集';
        
        if (currentSubject) {
            exportUrl += `?subject=${encodeURIComponent(currentSubject)}`;
            filename = `${currentSubject}_试卷合集`;
        }
        
        showNotification('正在导出试卷内容...', 'info');
        
        const response = await fetch(exportUrl, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // 从响应头获取文件名，如果获取不到就使用默认名称
            const contentDisposition = response.headers.get('Content-Disposition');
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*?=(.+)/);
                if (filenameMatch) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/"/g, ''));
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('试卷内容导出成功！', 'success');
        } else {
            showNotification('导出失败', 'error');
        }
    } catch (error) {
        console.error('导出试卷内容失败:', error);
        showNotification('导出失败', 'error');
    }
}

// 获取当前选中的学科
function getCurrentSubject() {
    const subjectFilter = document.getElementById('subject-filter');
    return subjectFilter ? subjectFilter.value : null;
}

// 查看试卷内容
async function testExamApiConnection() {
    try {
        console.log('🧪 测试管理员API连接...');
        
        // 先测试基础的管理员API
        const testResponse = await fetch('/api/admin/overview', {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('🧪 基础API测试结果:', testResponse.status, testResponse.statusText);
        
        if (testResponse.ok) {
            const result = await testResponse.json();
            console.log('✅ 管理员API可访问，权限正常');
            return true;
        } else {
            console.error('❌ 管理员API访问失败，可能是权限问题');
            showNotification('管理员权限验证失败，请重新登录', 'error');
            return false;
        }
    } catch (error) {
        console.error('❌ API连接测试失败:', error);
        showNotification('服务器连接失败', 'error');
        return false;
    }
}

// 查看知识块内容
async function viewKnowledgeContent(courseId, fileName) {
    try {
        console.log(`🔍 查看知识块内容: 课程ID=${courseId}, 文件名=${fileName}`);
        
        showLoading('正在加载知识块内容...');
        
        const response = await fetch(`/api/admin/knowledge/view?courseId=${courseId}&fileName=${encodeURIComponent(fileName)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        hideLoading();
        
        console.log(`知识块API响应状态: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('知识块API响应:', result);
        
        if (result.success) {
            console.log('✅ 成功获取知识块内容');
            showKnowledgeModal(result.data);
        } else {
            console.error('❌ 获取知识块内容失败:', result.message);
            showNotification(result.message || '获取知识块内容失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ 获取知识块内容异常:', error);
        showNotification(`获取知识块内容失败: ${error.message}`, 'error');
    }
}

async function viewExamContent(examId) {
    try {
        console.log('🎯 开始获取试卷内容，examId:', examId);
        
        // 验证examId参数
        if (!examId || isNaN(examId) || examId <= 0) {
            console.error('❌ 无效的试卷ID:', examId);
            showNotification('试卷ID无效', 'error');
            return;
        }
        
        // 先测试API连接
        const apiAccessible = await testExamApiConnection();
        if (!apiAccessible) {
            return;
        }
        
        showNotification('正在加载试卷内容...', 'info');
        
        const url = `/api/admin/exams/view?examId=${examId}`;
        console.log('📡 请求URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('📤 响应状态:', response.status, response.statusText);
        console.log('📤 响应头:', [...response.headers.entries()]);
        
        if (response.ok) {
            const result = await response.json();
            console.log('📊 后端返回的数据:', result);
            
            if (result.success) {
                console.log('✅ 成功获取试卷数据:', result.data);
                showExamModal(result.data);
            } else {
                console.error('❌ 后端返回错误:', result.message);
                showNotification(result.message || '获取试卷内容失败', 'error');
            }
        } else {
            // 尝试读取错误响应
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.text();
                console.error('❌ 服务器错误响应:', errorData);
                errorMessage += '\n' + errorData;
            } catch (e) {
                console.error('❌ 无法读取错误响应:', e);
            }
            
            showNotification(`获取试卷内容失败: ${errorMessage}`, 'error');
        }
    } catch (error) {
        console.error('❌ 请求过程中发生异常:', error);
        showNotification(`请求失败: ${error.message}`, 'error');
    }
}

// 显示试卷内容模态框
function showExamModal(examData) {
    const modal = document.getElementById('exam-view-modal');
    if (!modal) {
        console.error('找不到试卷查看模态框');
        return;
    }
    
    // 填充试卷基本信息
    document.getElementById('exam-modal-title').textContent = examData.title || '试卷详情';
    document.getElementById('exam-modal-course').textContent = examData.courseName || '未知课程';
    document.getElementById('exam-modal-teacher').textContent = examData.teacherName || '未知教师';
    document.getElementById('exam-modal-duration').textContent = examData.duration || '0';
    document.getElementById('exam-modal-total-score').textContent = examData.totalScore || '0';
    document.getElementById('exam-modal-question-count').textContent = examData.questions ? examData.questions.length : '0';
    document.getElementById('exam-modal-description').textContent = examData.description || '无描述';
    
    // 填充题目内容
    const questionsContainer = document.getElementById('exam-questions-container');
    questionsContainer.innerHTML = '';
    
    if (examData.questions && examData.questions.length > 0) {
        examData.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'exam-question';
            
            let optionsHtml = '';
            if (question.options && question.options.length > 0) {
                optionsHtml = question.options.map((option, optIndex) => {
                    const isCorrect = question.correctAnswer && question.correctAnswer.includes(String.fromCharCode(65 + optIndex));
                    return `
                        <div class="question-option ${isCorrect ? 'correct-option' : ''}">
                            <span class="option-label">${String.fromCharCode(65 + optIndex)}.</span>
                            <span class="option-text">${option}</span>
                            ${isCorrect ? '<i class="fas fa-check-circle correct-icon"></i>' : ''}
                        </div>
                    `;
                }).join('');
            }
            
            questionDiv.innerHTML = `
                <div class="question-header">
                    <span class="question-number">第 ${index + 1} 题</span>
                    <span class="question-score">${question.score || 0} 分</span>
                </div>
                <div class="question-content">${question.content}</div>
                ${optionsHtml}
                ${question.correctAnswer ? `<div class="question-answer"><strong>正确答案：</strong>${question.correctAnswer}</div>` : ''}
                ${question.explanation ? `<div class="question-explanation"><strong>解析：</strong>${question.explanation}</div>` : ''}
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
    } else {
        questionsContainer.innerHTML = '<div class="no-questions">此试卷暂无题目</div>';
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// 显示知识块内容模态框
function showKnowledgeModal(knowledgeData) {
    const modal = document.getElementById('knowledge-view-modal');
    if (!modal) {
        console.error('找不到知识块查看模态框');
        return;
    }
    
    // 填充知识块基本信息
    document.getElementById('knowledge-modal-title').textContent = knowledgeData.fileName || '知识块详情';
    document.getElementById('knowledge-modal-course').textContent = knowledgeData.courseName || '未知课程';
    document.getElementById('knowledge-modal-teacher').textContent = knowledgeData.teacherName || '未知教师';
    document.getElementById('knowledge-modal-total-chunks').textContent = knowledgeData.totalChunks || '0';
    document.getElementById('knowledge-modal-processed-chunks').textContent = knowledgeData.processedChunks || '0';
    
    // 填充知识块内容
    const chunksContainer = document.getElementById('knowledge-chunks-container');
    chunksContainer.innerHTML = '';
    
    if (knowledgeData.chunks && knowledgeData.chunks.length > 0) {
        knowledgeData.chunks.forEach((chunk, index) => {
            const chunkDiv = document.createElement('div');
            chunkDiv.className = 'knowledge-chunk';
            
            const processedIcon = chunk.processed ? 
                '<i class="fas fa-check-circle processed-icon" title="已处理"></i>' : 
                '<i class="fas fa-clock pending-icon" title="待处理"></i>';
            
            chunkDiv.innerHTML = `
                <div class="chunk-header">
                    <span class="chunk-number">第 ${index + 1} 块</span>
                    <span class="chunk-status">${processedIcon}</span>
                </div>
                <div class="chunk-content">${chunk.content || '内容为空'}</div>
                <div class="chunk-info">
                    <small>
                        <span>块ID: ${chunk.chunkId}</span>
                        ${chunk.vectorId ? `<span>向量ID: ${chunk.vectorId}</span>` : ''}
                        <span>创建时间: ${formatDate(chunk.createdAt)}</span>
                    </small>
                </div>
            `;
            
            chunksContainer.appendChild(chunkDiv);
        });
    } else {
        chunksContainer.innerHTML = '<div class="no-chunks">此文件暂无知识块</div>';
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// 查看教学大纲内容
async function viewTeachingOutlineContent(outlineId) {
    try {
        console.log(`🔍 查看教学大纲内容: ID=${outlineId}`);
        
        showLoading('正在加载教学大纲详情...');
        
        const response = await fetch(`/api/admin/teaching-outlines/${outlineId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        hideLoading();
        
        console.log(`教学大纲详情API响应状态: ${response.status}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('教学大纲详情API响应:', result);
        
        if (result.success) {
            console.log('✅ 成功获取教学大纲详情');
            showTeachingOutlineModal(result.data);
        } else {
            console.error('❌ 获取教学大纲详情失败:', result.message);
            showNotification(result.message || '获取教学大纲详情失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ 获取教学大纲详情异常:', error);
        showNotification('获取教学大纲详情失败', 'error');
    }
}

// 显示教学大纲详情模态框
function showTeachingOutlineModal(outlineData) {
    const modal = document.getElementById('teaching-outline-view-modal');
    if (!modal) {
        console.error('找不到教学大纲查看模态框');
        return;
    }
    
    // 填充教学大纲基本信息
    document.getElementById('outline-modal-title').textContent = `${outlineData.courseName} - 教学大纲`;
    document.getElementById('outline-modal-course').textContent = outlineData.courseName || '未知课程';
    document.getElementById('outline-modal-teacher').textContent = outlineData.teacherName || '未知教师';
    document.getElementById('outline-modal-hours').textContent = outlineData.hours || '未设置';
    document.getElementById('outline-modal-created').textContent = formatDate(outlineData.createdAt);
    document.getElementById('outline-modal-updated').textContent = formatDate(outlineData.updatedAt);
    
    // 填充教学大纲内容
    document.getElementById('outline-teaching-objective').innerHTML = formatOutlineContent(outlineData.teachingObjective);
    document.getElementById('outline-teaching-idea').innerHTML = formatOutlineContent(outlineData.teachingIdea);
    document.getElementById('outline-key-points').innerHTML = formatOutlineContent(outlineData.keyPoints);
    document.getElementById('outline-difficulties').innerHTML = formatOutlineContent(outlineData.difficulties);
    document.getElementById('outline-ideological-design').innerHTML = formatOutlineContent(outlineData.ideologicalDesign);
    document.getElementById('outline-teaching-design').innerHTML = formatOutlineContent(outlineData.teachingDesign);
    
    // 显示模态框
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    console.log('✅ 教学大纲详情模态框已显示');
}

// 格式化教学大纲内容
function formatOutlineContent(content) {
    if (!content) return '<p style="color: #999; font-style: italic;">暂无内容</p>';
    
    // 将换行符转换为段落
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}

// 关闭教学大纲查看模态框
function closeTeachingOutlineModal() {
    const modal = document.getElementById('teaching-outline-view-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// 关闭知识块查看模态框
function closeKnowledgeModal() {
    const modal = document.getElementById('knowledge-view-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// 关闭试卷查看模态框
function closeExamModal() {
    const modal = document.getElementById('exam-view-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

// 导出单个试卷
async function exportSingleExam(examId) {
    try {
        showNotification('正在导出试卷...', 'info');
        
        const response = await fetch(`/api/admin/exams/export?examId=${examId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // 从响应头获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = '试卷.md';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*?=(.+)/);
                if (filenameMatch) {
                    filename = decodeURIComponent(filenameMatch[1].replace(/"/g, ''));
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showNotification('试卷导出成功！', 'success');
        } else {
            showNotification('导出失败', 'error');
        }
    } catch (error) {
        console.error('导出试卷失败:', error);
        showNotification('导出失败', 'error');
    }
}

// 删除试卷
async function deleteExam(examId, examName) {
    try {
        // 显示确认对话框
        const confirmResult = await showConfirmModal({
            title: '确认删除试卷',
            message: `确定要删除试卷《${examName}》吗？\n\n注意：此操作不可撤销！`,
            confirmText: '删除',
            cancelText: '取消',
            type: 'danger'
        });
        
        if (!confirmResult) {
            return;
        }
        
        showNotification('正在删除试卷...', 'info');
        
        const response = await fetch(`/api/admin/exams/${examId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('试卷删除成功！', 'success');
            
            // 刷新资源列表
            const currentSubject = getCurrentSubject();
            if (currentSubject) {
                showSubjectDetails(currentSubject);
            } else {
                loadResourceData();
            }
        } else {
            showNotification(result.message || '删除试卷失败', 'error');
        }
        
    } catch (error) {
        console.error('删除试卷失败:', error);
        showNotification('删除试卷失败: ' + error.message, 'error');
    }
}

// 下载资源（占位函数，可根据需要实现）
function downloadResource(resourceId, resourceType) {
    showNotification('资源下载功能开发中...', 'info');
}

// 显示资源统计
function showResourceStats() {
    const stats = `
        总资源数: ${resourcesData.totalResources || 0}
        学科数量: ${resourcesData.totalSubjects || 0}
        存储空间: ${formatFileSize(calculateTotalStorage())}
        活跃教师: ${calculateActiveTeachers()}
    `;
    
    showNotification(stats, 'info');
}

// 计算总存储空间
function calculateTotalStorage() {
    let total = 0;
    const resourcesBySubject = resourcesData.resourcesBySubject || {};
    Object.values(resourcesBySubject).forEach(resources => {
        resources.forEach(resource => {
            total += resource.fileSize || 0;
        });
    });
    return total;
}

// 计算活跃教师数
function calculateActiveTeachers() {
    const teachers = new Set();
    const resourcesBySubject = resourcesData.resourcesBySubject || {};
    Object.values(resourcesBySubject).forEach(resources => {
        resources.forEach(resource => {
            if (resource.teacherName) {
                teachers.add(resource.teacherName);
            }
        });
    });
    return teachers.size;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ================== 大屏概览功能 ==================

// 全局变量
let overviewData = {};
let charts = {};

// 初始化大屏概览
function initScreenOverview() {
    console.log('初始化大屏概览');
    
    // 绑定事件监听器
    bindOverviewEvents();
    
    // 加载概览数据
    loadOverviewData();
}

// 绑定概览事件
function bindOverviewEvents() {
    // 刷新按钮
    const refreshBtn = document.getElementById('refresh-overview');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOverviewData);
    }
    
    // 全屏按钮
    const fullscreenBtn = document.getElementById('fullscreen-overview');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
}

// 加载概览数据
async function loadOverviewData() {
    try {
        showLoading('正在加载概览数据...');
        
        const response = await fetch('/api/admin/overview', {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            overviewData = result.data;
            updateOverviewDisplay();
        } else {
            showNotification(result.message || '加载概览数据失败', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('加载概览数据失败:', error);
        showNotification('加载概览数据失败', 'error');
    }
}

// 更新概览显示
function updateOverviewDisplay() {
    updateBasicStats();
    updateUsageStats();
    updateEfficiencyStats();
    updateLearningStats();
}

// 更新基础统计
function updateBasicStats() {
    const basicStats = overviewData.basicStats || {};
    
    document.getElementById('overview-total-users').textContent = basicStats.totalUsers || 0;
    document.getElementById('overview-total-teachers').textContent = basicStats.totalTeachers || 0;
    document.getElementById('overview-total-students').textContent = basicStats.totalStudents || 0;
    document.getElementById('overview-total-courses').textContent = basicStats.totalCourses || 0;
}

// 更新使用统计
function updateUsageStats() {
    const teacherStats = overviewData.teacherStats || {};
    const studentStats = overviewData.studentStats || {};
    
    // 更新教师统计
    document.getElementById('teacher-active-today').textContent = teacherStats.activeToday || 0;
    document.getElementById('teacher-active-week').textContent = teacherStats.activeThisWeek || 0;
    
    // 更新学生统计
    document.getElementById('student-active-today').textContent = studentStats.activeToday || 0;
    document.getElementById('student-active-week').textContent = studentStats.activeThisWeek || 0;
    
    // 更新活跃模块
    updateActiveModules('teacher-active-modules', teacherStats.activeModules || {});
    updateActiveModules('student-active-modules', studentStats.activeModules || {});
    
    // 更新图表
    updateUsageCharts();
}

// 更新活跃模块
function updateActiveModules(containerId, modules) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    Object.entries(modules).forEach(([moduleName, count]) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'module-item';
        moduleDiv.innerHTML = `
            <span class="module-name">${moduleName}</span>
            <span class="module-count">${count}</span>
        `;
        container.appendChild(moduleDiv);
    });
}

// 更新使用图表
function updateUsageCharts() {
    // 如果Chart.js可用，创建图表
    if (typeof Chart !== 'undefined') {
        createUsageChart('teacher-usage-chart', overviewData.teacherStats?.dailyUsage || {});
        createUsageChart('student-usage-chart', overviewData.studentStats?.dailyUsage || {});
    }
}

// 创建使用图表
function createUsageChart(canvasId, data) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    // 销毁已存在的图表
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }
    
    const chartData = {
        labels: Object.keys(data),
        datasets: [{
            label: '使用次数',
            data: Object.values(data),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            borderWidth: 2,
            fill: true
        }]
    };
    
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 更新教学效率统计
function updateEfficiencyStats() {
    const efficiency = overviewData.teachingEfficiency || {};
    
    // 更新耗时数据
    const preparationTime = efficiency.preparationTime || {};
    const exerciseTime = efficiency.exerciseTime || {};
    
    document.getElementById('prep-time').textContent = preparationTime.平均备课时间 || 0;
    document.getElementById('correction-time').textContent = preparationTime.平均修正时间 || 0;
    document.getElementById('exercise-design-time').textContent = exerciseTime.平均设计时间 || 0;
    document.getElementById('exercise-correction-time').textContent = exerciseTime.平均修正时间 || 0;
    
    // 更新优化建议
    updateOptimizationSuggestions(efficiency.optimizationSuggestions || []);
}

// 更新优化建议
function updateOptimizationSuggestions(suggestions) {
    const container = document.getElementById('optimization-suggestions');
    container.innerHTML = '';
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无优化建议</p>';
        return;
    }
    
    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.innerHTML = `
            <div>
                <div class="suggestion-subject">${suggestion.subject}</div>
                <div class="suggestion-text">${suggestion.suggestion}</div>
            </div>
            <div class="suggestion-actions">
                <div class="suggestion-rate">${suggestion.passRate}% 通过率</div>
                <button class="view-detail-btn" onclick="viewOptimizationDetail('${suggestion.subject}', ${suggestion.courseId || 0})">
                    <i class="fas fa-eye"></i>
                    查看详情
                </button>
            </div>
        `;
        container.appendChild(suggestionDiv);
    });
}

// 查看优化建议详情
async function viewOptimizationDetail(subject, courseId) {
    try {
        // 如果没有courseId，我们需要根据subject找到对应的课程
        if (!courseId) {
            // 显示通用建议
            showOptimizationDetailModal({
                courseName: subject,
                suggestions: [{
                    title: '通用优化建议',
                    content: '建议定期分析学生学习情况，根据数据调整教学方法。',
                    priority: '中'
                }]
            });
            return;
        }
        
        showLoading('正在分析课程数据...');
        
        const response = await fetch(`/api/admin/courses/${courseId}/optimization-suggestions`, {
            method: 'GET',
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            hideLoading();
            showOptimizationDetailModal(result.data);
            
            // 如果AI建议还在生成中，显示加载状态
            if (result.data.aiSuggestions && result.data.aiSuggestions.includes('正在生成AI建议')) {
                updateAISuggestionsInModal(courseId);
            }
        } else {
            showNotification(result.message || '获取优化建议失败', 'error');
        }
    } catch (error) {
        console.error('获取优化建议失败:', error);
        showNotification('获取优化建议失败，请重试', 'error');
    } finally {
        hideLoading();
    }
}

// 在模态框中更新AI建议
async function updateAISuggestionsInModal(courseId) {
    const aiContainer = document.querySelector('.ai-suggestion-text');
    if (!aiContainer) return;
    
    // 显示加载动画
    aiContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>AI正在分析课程数据，生成个性化建议...</span>
        </div>
    `;
    
    let retryCount = 0;
    const maxRetries = 3;
    const retryInterval = 3000; // 3秒
    
    const checkForUpdate = async () => {
        try {
            const response = await fetch(`/api/admin/courses/${courseId}/optimization-suggestions`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (result.success && result.data.aiSuggestions) {
                if (!result.data.aiSuggestions.includes('正在生成AI建议')) {
                    // AI建议已生成完成
                    aiContainer.innerHTML = result.data.aiSuggestions.replace(/\n/g, '<br>');
                    return;
                }
            }
            
            // 如果还在生成中，继续等待
            retryCount++;
            if (retryCount < maxRetries) {
                setTimeout(checkForUpdate, retryInterval);
            } else {
                // 超时后显示默认建议
                aiContainer.innerHTML = `
                    <div style="color: rgba(255,255,255,0.9);">
                        <p>AI建议生成超时，为您提供基于数据的快速建议：</p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>定期分析学生答题数据，识别薄弱知识点</li>
                            <li>根据通过率调整教学难度和节奏</li>
                            <li>增加互动环节，提高学生参与度</li>
                            <li>及时给予学生反馈，帮助改进</li>
                        </ul>
                        <button onclick="retryAIGeneration(${courseId})" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                            重新生成AI建议
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('更新AI建议失败:', error);
            aiContainer.innerHTML = `
                <div style="color: rgba(255,255,255,0.9);">
                    AI建议生成失败，请检查网络连接后重试。
                    <button onclick="retryAIGeneration(${courseId})" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        重试
                    </button>
                </div>
            `;
        }
    };
    
    // 开始检查
    setTimeout(checkForUpdate, retryInterval);
}

// 重新生成AI建议
async function retryAIGeneration(courseId) {
    const aiContainer = document.querySelector('.ai-suggestion-text');
    if (!aiContainer) return;
    
    aiContainer.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>重新生成AI建议中...</span>
        </div>
    `;
    
    // 重新触发AI建议生成
    updateAISuggestionsInModal(courseId);
}

// 显示优化建议详情模态框
function showOptimizationDetailModal(data) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'course-modal-overlay';
    modal.id = 'optimization-detail-modal';
    
    modal.innerHTML = `
        <div class="course-modal-container" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
            <div class="course-modal-header">
                <div class="modal-title-section">
                    <div class="modal-icon" style="background-color: rgba(52, 152, 219, 0.1);">
                        <i class="fas fa-lightbulb" style="color: #3498db;"></i>
                    </div>
                    <h3>课程优化建议 - ${data.courseName}</h3>
                </div>
                <button class="modal-close-btn" onclick="closeOptimizationDetailModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="course-modal-body">
                <div class="optimization-summary">
                    <div class="summary-item">
                        <span class="summary-label">课程名称:</span>
                        <span class="summary-value">${data.courseName}</span>
                    </div>
                    ${data.passRate !== undefined ? `
                        <div class="summary-item">
                            <span class="summary-label">通过率:</span>
                            <span class="summary-value">${data.passRate}%</span>
                        </div>
                    ` : ''}
                    ${data.totalAttempts !== undefined ? `
                        <div class="summary-item">
                            <span class="summary-label">总考试次数:</span>
                            <span class="summary-value">${data.totalAttempts}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="suggestions-detail">
                    <h4 style="margin-bottom: 20px; color: #2c3e50;">AI智能优化建议</h4>
                    
                    ${data.aiSuggestions ? `
                        <div class="ai-suggestions-container">
                            <div class="ai-suggestions-header">
                                <div class="ai-icon">
                                    <i class="fas fa-robot"></i>
                                </div>
                                <span class="ai-label">AI分析结果</span>
                            </div>
                            <div class="ai-suggestions-content">
                                <div class="ai-suggestion-text">${data.aiSuggestions.replace(/\n/g, '<br>')}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${data.suggestions && data.suggestions.length > 0 ? `
                        <div class="traditional-suggestions">
                            <h5 style="margin-top: 30px; margin-bottom: 15px; color: #2c3e50;">其他建议</h5>
                            <div class="suggestions-list">
                                ${data.suggestions.map(suggestion => `
                                    <div class="suggestion-detail-item">
                                        <div class="suggestion-header">
                                            <h5 class="suggestion-title">${suggestion.title}</h5>
                                            <span class="priority-badge priority-${suggestion.priority}">
                                                ${suggestion.priority === '高' ? '高优先级' : 
                                                  suggestion.priority === '中' ? '中优先级' : '低优先级'}
                                            </span>
                                        </div>
                                        <div class="suggestion-content">${suggestion.content}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="course-modal-actions">
                <button class="course-btn course-btn-primary" onclick="closeOptimizationDetailModal()">
                    <i class="fas fa-check"></i>
                    <span>确定</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 关闭优化建议详情模态框
function closeOptimizationDetailModal() {
    const modal = document.getElementById('optimization-detail-modal');
    if (modal) {
        modal.remove();
    }
}

// 更新学习效果统计
function updateLearningStats() {
    const learningEffects = overviewData.learningEffects || {};
    
    // 更新知识点掌握情况
    updateKnowledgePoints(learningEffects.knowledgePoints || {});
    
    // 更新高频错误知识点
    updateFrequentErrors(learningEffects.frequentErrors || []);
    
    // 更新正确率趋势图表
    updateCorrectnessChart(learningEffects.correctnessTrend || []);
}

// 更新知识点掌握情况
function updateKnowledgePoints(knowledgePoints) {
    const container = document.getElementById('knowledge-points');
    container.innerHTML = '';
    
    Object.entries(knowledgePoints).forEach(([point, rate]) => {
        const pointDiv = document.createElement('div');
        pointDiv.className = 'knowledge-point';
        pointDiv.innerHTML = `
            <span class="knowledge-point-name">${point}</span>
            <span class="knowledge-point-rate">${rate}%</span>
        `;
        container.appendChild(pointDiv);
    });
}

// 更新高频错误知识点
function updateFrequentErrors(errors) {
    const container = document.getElementById('frequent-errors');
    container.innerHTML = '';
    
    if (errors.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无错误统计</p>';
        return;
    }
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-item';
        errorDiv.innerHTML = `
            <span class="error-point">${error.knowledgePoint}</span>
            <span class="error-rate">${error.errorRate}%</span>
        `;
        container.appendChild(errorDiv);
    });
}

// 更新正确率趋势图表（按周显示）
function updateCorrectnessChart(trendData) {
    if (typeof Chart !== 'undefined') {
        const ctx = document.getElementById('correctness-trend-chart');
        if (!ctx) return;
        
        // 销毁已存在的图表
        if (charts['correctness-trend-chart']) {
            charts['correctness-trend-chart'].destroy();
        }
        
        // 处理周标签，简化显示
        const processedLabels = trendData.map(item => {
            if (item.week) {
                // 从"2024年第45周"格式中提取简化标签
                const match = item.week.match(/第(\d+)周/);
                return match ? `第${match[1]}周` : item.week;
            }
            return item.month || '未知'; // 兼容旧的月份格式
        });
        
        const chartData = {
            labels: processedLabels,
            datasets: [{
                label: '正确率(%)',
                data: trendData.map(item => item.correctRate),
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#27ae60',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2
            }]
        };
        
        charts['correctness-trend-chart'] = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#2c3e50',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#27ae60',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                const fullWeek = trendData[context[0].dataIndex].week || trendData[context[0].dataIndex].month;
                                return fullWeek;
                            },
                            label: function(context) {
                                return `正确率: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }
}

// 切换全屏模式
function toggleFullscreen() {
    const overviewSection = document.getElementById('screen-overview');
    
    if (!document.fullscreenElement) {
        overviewSection.requestFullscreen().catch(err => {
            console.error('无法进入全屏模式:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// 工具函数 - 显示加载提示
function showLoading(message) {
    // 创建加载提示
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    loadingDiv.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
            <p style="margin: 0; color: #333;">${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
    
    // 添加旋转动画
    if (!document.querySelector('#loading-spin-style')) {
        const style = document.createElement('style');
        style.id = 'loading-spin-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// 工具函数 - 隐藏加载提示
function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// ==================== 发布通知相关函数 ====================

// 打开发布通知模态框
function showPublishNoticeModal() {
    const modal = document.getElementById('publish-notice-modal');
    if (modal) {
        modal.style.display = 'flex';
        // 重置表单
        document.getElementById('publish-notice-form').reset();
        // 隐藏定时发送选项
        document.getElementById('scheduled-time-group').style.display = 'none';
    }
}

// 关闭发布通知模态框
function closePublishNoticeModal() {
    const modal = document.getElementById('publish-notice-modal');
    if (modal) {
        modal.style.display = 'none';
        // 重置表单
        document.getElementById('publish-notice-form').reset();
    }
}

// 处理推送时间选择
function handlePushTimeChange() {
    const pushTimeSelect = document.getElementById('push-time');
    const scheduledTimeGroup = document.getElementById('scheduled-time-group');
    
    if (pushTimeSelect.value === 'scheduled') {
        scheduledTimeGroup.style.display = 'block';
        // 设置最小时间为当前时间
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10); // 最少10分钟后
        const minTime = now.toISOString().slice(0, 16);
        document.getElementById('scheduled-time').min = minTime;
    } else {
        scheduledTimeGroup.style.display = 'none';
    }
}

// 提交通知
async function submitNotice() {
    const form = document.getElementById('publish-notice-form');
    const formData = new FormData(form);
    
    // 验证表单
    const title = formData.get('title');
    const content = formData.get('content');
    const targetAudience = formData.get('targetAudience');
    const pushTime = formData.get('pushTime');
    const scheduledTime = formData.get('scheduledTime');
    
    if (!title || !title.trim()) {
        showNotification('请输入通知标题', 'error');
        return;
    }
    
    if (!content || !content.trim()) {
        showNotification('请输入通知内容', 'error');
        return;
    }
    
    if (!targetAudience) {
        showNotification('请选择通知对象', 'error');
        return;
    }
    
    if (pushTime === 'scheduled' && (!scheduledTime || !scheduledTime.trim())) {
        showNotification('请选择定时发送时间', 'error');
        return;
    }
    
    // 验证定时发送时间
    if (pushTime === 'scheduled') {
        const scheduledDateTime = new Date(scheduledTime);
        const now = new Date();
        
        if (scheduledDateTime <= now) {
            showNotification('定时发送时间必须晚于当前时间', 'error');
            return;
        }
    }
    
    try {
        showLoading('正在发布通知...');
        
        const requestData = {
            title: title.trim(),
            content: content.trim(),
            targetAudience: targetAudience,
            pushTime: pushTime
        };
        
        if (pushTime === 'scheduled') {
            requestData.scheduledTime = scheduledTime;
        }
        
        const response = await fetch('/api/admin/notices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('通知发布成功', 'success');
            closePublishNoticeModal();
            // 可以在这里刷新通知列表或者其他界面
        } else {
            showNotification(result.message || '发布通知失败', 'error');
        }
        
    } catch (error) {
        console.error('发布通知失败:', error);
        showNotification('发布通知失败，请检查网络连接', 'error');
    } finally {
        hideLoading();
    }
}

// 初始化发布通知功能
function initPublishNotice() {
    // 绑定发布通知按钮事件
    const publishNoticeBtn = document.getElementById('publish-notice');
    if (publishNoticeBtn) {
        publishNoticeBtn.addEventListener('click', showPublishNoticeModal);
    }
    
    // 绑定推送时间选择事件
    const pushTimeSelect = document.getElementById('push-time');
    if (pushTimeSelect) {
        pushTimeSelect.addEventListener('change', handlePushTimeChange);
    }
    
    // 绑定模态框关闭事件
    const modal = document.getElementById('publish-notice-modal');
    if (modal) {
        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePublishNoticeModal();
            }
        });
    }
}

// 在页面加载时初始化发布通知功能
document.addEventListener('DOMContentLoaded', () => {
    initPublishNotice();
});

// 初始化大屏概览数据刷新机制
let overviewRefreshInterval = null;

// 启动大屏数据自动刷新
function startOverviewDataRefresh() {
    // 清除之前的定时器
    if (overviewRefreshInterval) {
        clearInterval(overviewRefreshInterval);
    }
    
    // 每3分钟自动刷新一次大屏数据
    overviewRefreshInterval = setInterval(async () => {
        try {
            const overviewSection = document.getElementById('screen-overview');
            if (overviewSection && !overviewSection.hidden) {
                console.log('自动刷新大屏概览数据...');
                await loadOverviewData();
            }
        } catch (error) {
            console.error('自动刷新大屏数据失败:', error);
        }
    }, 180000); // 3分钟 = 180000毫秒
}

// 停止大屏数据自动刷新
function stopOverviewDataRefresh() {
    if (overviewRefreshInterval) {
        clearInterval(overviewRefreshInterval);
        overviewRefreshInterval = null;
    }
}

// 页面可见性变化时的处理
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // 页面隐藏时停止自动刷新
        stopOverviewDataRefresh();
    } else {
        // 页面可见时启动自动刷新，并立即刷新一次
        startOverviewDataRefresh();
        setTimeout(async () => {
            const overviewSection = document.getElementById('screen-overview');
            if (overviewSection && !overviewSection.hidden) {
                await loadOverviewData();
            }
        }, 1000);
    }
});
