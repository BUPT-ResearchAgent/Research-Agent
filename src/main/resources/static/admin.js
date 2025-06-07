// 美观的通知提示函数
function showNotification(message, type = 'info') {
    // 创建通知容器（如果不存在�?
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
    
    // 根据类型设置颜色和图�?
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
    
    // 添加到容�?
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

document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状�?
    const currentUser = JSON.parse(localStorage.getItem('smartedu_current_user') || 'null');
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // 设置用户�?
    document.querySelector('.user-name').textContent = currentUser.username;

    // 菜单点击切换功能
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动状�?
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            
            // 添加当前活动状�?
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
            showNotification('用户菜单功能', 'info');
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

    // 退出相�?
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
        // 跳转到首�?
        window.location.href = 'SmartEdu.html';
    });

    // 初始化用户管理功�?
    initUserManagement();
});

// 用户管理功能
function initUserManagement() {
    let currentPage = 1;
    const pageSize = 10;
    let filteredUsers = [];
    let selectedUsers = [];

    // 获取DOM元素
    const userSearch = document.getElementById('user-search');
    const roleFilter = document.getElementById('role-filter');
    const statusFilter = document.getElementById('status-filter');
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

    // 获取所有用户数�?
    function getAllUsers() {
        const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        return users.map(user => ({
            ...user,
            registeredAt: user.registeredAt || new Date().toISOString(),
            lastLogin: user.lastLogin || '从未登录',
            status: user.status || 'active'
        }));
    }

    // 更新统计数据
    function updateStats() {
        const users = getAllUsers();
        const teacherCount = users.filter(u => u.role === 'teacher').length;
        const studentCount = users.filter(u => u.role === 'student').length;
        const activeCount = users.filter(u => u.status === 'active').length;
        
        // 更新统计卡片
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = users.length;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = activeCount;
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = teacherCount;
        document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = studentCount;
    }

    // 搜索和筛选用�?
    function filterUsers() {
        const searchTerm = userSearch.value.toLowerCase();
        const roleFilter = document.getElementById('role-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        const allUsers = getAllUsers();
        
        filteredUsers = allUsers.filter(user => {
            const matchSearch = user.username.toLowerCase().includes(searchTerm);
            const matchRole = !roleFilter || user.role === roleFilter;
            const matchStatus = !statusFilter || user.status === statusFilter;
            
            return matchSearch && matchRole && matchStatus;
        });
        
        currentPage = 1;
        renderUserTable();
        updatePagination();
    }

    // 渲染用户表格
    function renderUserTable() {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageUsers = filteredUsers.slice(startIndex, endIndex);
        
        userTableBody.innerHTML = '';
        
        pageUsers.forEach(user => {
            const row = document.createElement('tr');
            const isSelected = selectedUsers.includes(user.username);
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="user-checkbox" value="${user.username}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>${user.username}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${user.role === 'teacher' ? '教师' : user.role === 'student' ? '学生' : '管理�?}
                    </span>
                </td>
                <td>${formatDate(user.registeredAt)}</td>
                <td>${user.lastLogin}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status === 'active' ? '活跃' : '非活�?}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editUser('${user.username}')" ${user.username === 'admin' ? 'disabled' : ''}>
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="action-btn delete" onclick="deleteUser('${user.username}')" ${user.username === 'admin' ? 'disabled' : ''}>
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
        selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
        
        // 更新全选状�?
        const allCheckboxes = document.querySelectorAll('.user-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.user-checkbox:checked');
        selectAll.indeterminate = checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length;
        selectAll.checked = checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0;
        
        // 更新批量操作按钮状�?
        const selectedCount = selectedUsers.length;
        batchDelete.disabled = selectedCount === 0;
        batchRole.disabled = selectedCount === 0;
        
        // 不允许选择admin账户进行批量操作
        const hasAdmin = selectedUsers.includes('admin');
        if (hasAdmin) {
            batchDelete.disabled = true;
        }
        
        // 更新选中数量显示
        document.getElementById('selected-count').textContent = selectedCount;
    }

    // 更新分页
    function updatePagination() {
        const totalPages = Math.ceil(filteredUsers.length / pageSize);
        const startIndex = (currentPage - 1) * pageSize + 1;
        const endIndex = Math.min(currentPage * pageSize, filteredUsers.length);
        
        document.getElementById('page-start').textContent = filteredUsers.length > 0 ? startIndex : 0;
        document.getElementById('page-end').textContent = endIndex;
        document.getElementById('total-users').textContent = filteredUsers.length;
        
        prevPage.disabled = currentPage === 1;
        nextPage.disabled = currentPage === totalPages;
        
        // 生成页码
        const pageNumbers = document.getElementById('page-numbers');
        pageNumbers.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    currentPage = i;
                    renderUserTable();
                    updatePagination();
                });
                pageNumbers.appendChild(pageBtn);
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.padding = '6px 10px';
                pageNumbers.appendChild(ellipsis);
            }
        }
    }

    // 格式化日�?
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    // 事件绑定
    userSearch.addEventListener('input', filterUsers);
    document.getElementById('role-filter').addEventListener('change', filterUsers);
    document.getElementById('status-filter').addEventListener('change', filterUsers);
    
    selectAll.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = this.checked;
            if (cb.value === 'admin') {
                cb.checked = false; // 不允许选择admin
            }
        });
        handleUserSelection();
    });

    prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderUserTable();
            updatePagination();
        }
    });

    nextPage.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredUsers.length / pageSize);
        if (currentPage < totalPages) {
            currentPage++;
            renderUserTable();
            updatePagination();
        }
    });

    // 导出用户数据
    exportUsers.addEventListener('click', function() {
        const users = getAllUsers();
        const csvContent = "data:text/csv;charset=utf-8," 
            + "用户�?角色,注册时间,最后登�?状态\n"
            + users.map(u => `${u.username},${u.role},${formatDate(u.registeredAt)},${u.lastLogin},${u.status}`).join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', '用户数据.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // 初始�?
    filteredUsers = getAllUsers();
    updateStats();
    renderUserTable();
    updatePagination();

    // 使函数全局可访�?
    window.editUser = editUser;
    window.deleteUser = deleteUser;
    window.filterUsers = filterUsers;
}

// 编辑用户功能
function editUser(username) {
    const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
    const user = users.find(u => u.username === username);
    
    if (!user) {
        showNotification('用户不存在！', 'error');
        return;
    }
    
    if (user.username === 'admin') {
        showNotification('不允许编辑管理员账户�?, 'warning');
        return;
    }
    
    const modal = document.getElementById('user-edit-modal');
    const form = document.getElementById('user-edit-form');
    
    // 填充表单数据
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-role').value = user.role;
    document.getElementById('edit-status').value = user.status || 'active';
    document.getElementById('edit-password').value = '';
    
    // 显示弹窗
    modal.style.display = 'flex';
    
    // 绑定事件
    bindEditModalEvents(user);
}

// 绑定编辑弹窗事件
function bindEditModalEvents(originalUser) {
    const modal = document.getElementById('user-edit-modal');
    const saveBtn = document.getElementById('save-user');
    const cancelBtn = document.getElementById('cancel-edit');
    const closeBtn = document.getElementById('close-edit-modal');
    
    // 移除之前的事件监听器
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    // 保存用户
    newSaveBtn.addEventListener('click', function() {
        const newRole = document.getElementById('edit-role').value;
        const newStatus = document.getElementById('edit-status').value;
        const newPassword = document.getElementById('edit-password').value.trim();
        
        // 验证数据
        if (!newRole || !newStatus) {
            showNotification('请填写所有必填字段！', 'warning');
            return;
        }
        
        // 更新用户数据
        const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        const userIndex = users.findIndex(u => u.username === originalUser.username);
        
        if (userIndex !== -1) {
            users[userIndex].role = newRole;
            users[userIndex].status = newStatus;
            
            // 如果提供了新密码，则更新密码
            if (newPassword) {
                if (newPassword.length < 6) {
                    showNotification('密码长度至少6位！', 'warning');
                    return;
                }
                users[userIndex].password = newPassword;
            }
            
            // 保存到localStorage
            localStorage.setItem('smartedu_users', JSON.stringify(users));
            
            // 关闭弹窗
            modal.style.display = 'none';
            
            // 刷新页面数据
            window.location.reload();
            
            alert('用户信息更新成功�?);
        }
    });
    
    // 取消/关闭
    [cancelBtn, closeBtn].forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 删除用户功能
function deleteUser(username) {
    if (username === 'admin') {
        showNotification('不允许删除管理员账户！', 'warning');
        return;
    }
    
    if (!confirm(`确定要删除用�?"${username}" 吗？此操作不可撤销！`)) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
    const filteredUsers = users.filter(u => u.username !== username);
    
    localStorage.setItem('smartedu_users', JSON.stringify(filteredUsers));
    
    // 刷新页面数据
    window.location.reload();
    
    showNotification('用户删除成功！', 'success');
}

// 批量删除用户
function initBatchOperations() {
    const batchDeleteBtn = document.getElementById('batch-delete');
    const batchRoleBtn = document.getElementById('batch-role');
    const batchRoleModal = document.getElementById('batch-role-modal');
    
    // 批量删除
    batchDeleteBtn.addEventListener('click', function() {
        const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
        
        if (selectedUsers.length === 0) {
            showNotification('请选择要删除的用户！', 'warning');
            return;
        }
        
        if (selectedUsers.includes('admin')) {
            alert('不允许删除管理员账户�?);
            return;
        }
        
        if (!confirm(`确定要删除选中�?${selectedUsers.length} 个用户吗？此操作不可撤销！`)) {
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        const filteredUsers = users.filter(u => !selectedUsers.includes(u.username));
        
        localStorage.setItem('smartedu_users', JSON.stringify(filteredUsers));
        
        // 刷新页面数据
        window.location.reload();
        
        alert(`成功删除 ${selectedUsers.length} 个用户！`);
    });
    
    // 批量修改角色
    batchRoleBtn.addEventListener('click', function() {
        const selectedUsers = Array.from(document.querySelectorAll('.user-checkbox:checked')).map(cb => cb.value);
        
        if (selectedUsers.length === 0) {
            alert('请选择要修改的用户�?);
            return;
        }
        
        if (selectedUsers.includes('admin')) {
            alert('不允许修改管理员账户�?);
            return;
        }
        
        document.getElementById('selected-count').textContent = selectedUsers.length;
        batchRoleModal.style.display = 'flex';
        
        // 绑定批量角色修改事件
        bindBatchRoleEvents(selectedUsers);
    });
}

// 绑定批量角色修改事件
function bindBatchRoleEvents(selectedUsers) {
    const modal = document.getElementById('batch-role-modal');
    const confirmBtn = document.getElementById('confirm-batch-role');
    const cancelBtn = document.getElementById('cancel-batch-role');
    const closeBtn = document.getElementById('close-batch-role-modal');
    
    // 移除之前的事件监听器
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    // 确认修改
    newConfirmBtn.addEventListener('click', function() {
        const newRole = document.getElementById('batch-new-role').value;
        
        if (!newRole) {
            showNotification('请选择新角色！', 'warning');
            return;
        }
        
        const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        
        selectedUsers.forEach(username => {
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex !== -1 && username !== 'admin') {
                users[userIndex].role = newRole;
            }
        });
        
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        
        modal.style.display = 'none';
        
        // 刷新页面数据
        window.location.reload();
        
        alert(`成功修改 ${selectedUsers.length} 个用户的角色！`);
    });
    
    // 取消/关闭
    [cancelBtn, closeBtn].forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 添加用户功能
function initAddUser() {
    const addUserBtn = document.getElementById('add-user');
    const refreshBtn = document.getElementById('refresh-data');
    const addUserModal = document.getElementById('add-user-modal');
    
    // 添加用户按钮
    addUserBtn.addEventListener('click', function() {
        // 清空表单
        document.getElementById('add-user-form').reset();
        addUserModal.style.display = 'flex';
        bindAddUserEvents();
    });
    
    // 刷新数据按钮
    refreshBtn.addEventListener('click', function() {
        window.location.reload();
    });
}

// 绑定添加用户事件
function bindAddUserEvents() {
    const modal = document.getElementById('add-user-modal');
    const saveBtn = document.getElementById('save-new-user');
    const cancelBtn = document.getElementById('cancel-add');
    const closeBtn = document.getElementById('close-add-modal');
    
    // 移除之前的事件监听器
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    // 保存新用�?
    newSaveBtn.addEventListener('click', function() {
        const username = document.getElementById('add-username').value.trim();
        const password = document.getElementById('add-password').value;
        const confirmPassword = document.getElementById('add-confirm-password').value;
        const role = document.getElementById('add-role').value;
        const status = document.getElementById('add-status').value;
        
        // 验证数据
        if (!username || !password || !confirmPassword || !role) {
            showNotification('请填写所有必填字段！', 'warning');
            return;
        }
        
        if (username.length < 3) {
            showNotification('用户名长度至�?位！', 'warning');
            return;
        }
        
        if (password.length < 6) {
            showNotification('密码长度至少6位！', 'warning');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('两次输入的密码不一致！', 'warning');
            return;
        }
        
        if (username === 'admin') {
            showNotification('不允许创建admin用户名！', 'warning');
            return;
        }
        
        // 检查用户名是否已存�?
        const users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        if (users.find(u => u.username === username)) {
            alert('用户名已存在�?);
            return;
        }
        
        // 创建新用�?
        const newUser = {
            username: username,
            password: password,
            role: role,
            status: status,
            registeredAt: new Date().toISOString(),
            lastLogin: '从未登录'
        };
        
        users.push(newUser);
        localStorage.setItem('smartedu_users', JSON.stringify(users));
        
        // 关闭弹窗
        modal.style.display = 'none';
        
        // 刷新页面数据
        window.location.reload();
        
        alert('用户添加成功�?);
    });
    
    // 取消/关闭
    [cancelBtn, closeBtn].forEach(btn => {
        btn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    });
    
    // 点击背景关闭
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 初始化批量操作和其他功能（在页面加载后调用）
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initBatchOperations();
        initAddUser();
    }, 100);
}); 
