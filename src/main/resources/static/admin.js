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
    document.getElementById('current-username').textContent = currentUser.username;

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

    // 用户下拉菜单
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    
    if(userProfile && userDropdown) {
        userProfile.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
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
    function formatDate(dateString) {
        try {
        const date = new Date(dateString);
            return date.toLocaleDateString('zh-CN');
        } catch (error) {
            return '无效日期';
        }
    }

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
