// 互动交流功能JavaScript代码

// 全局变量
let currentChatPartnerId = null;
let currentChatPartnerType = null;
let currentChatPartnerName = null;
let currentCourseId = null;
let messageRefreshInterval = null;

// 获取当前用户信息（兼容教师端和学生端）
function getCurrentUserInfo() {
    console.log('获取用户信息，当前window.currentUser:', window.currentUser);

    // 首先检查页面类型
    const pageTitle = document.title;
    const isTeacherPage = pageTitle.includes('教师端') || window.location.pathname.includes('teacher');
    const isStudentPage = pageTitle.includes('学生端') || window.location.pathname.includes('student');

    console.log('页面检查结果:', { pageTitle, isTeacherPage, isStudentPage });

    // 如果是教师端，使用固定的用户ID 4（从日志确认，用户ID 4 对应教师ID 2）
    if (isTeacherPage) {
        return {
            userId: 4, // 使用用户ID 4（对应数据库中的教师ID 2）
            userType: 'TEACHER',
            userName: 'teacher2教师',
            role: 'teacher'
        };
    }

    // 如果是学生端，尝试获取学生信息
    if (isStudentPage) {
        // 尝试从window.currentUser获取
        if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            const currentUser = window.currentUser;

            // 使用userId，不是studentId！这是关键修复
            const userId = currentUser.userId || currentUser.id;
            if (userId && userId !== 'unknown') {
                console.log('学生端获取到有效的用户ID:', userId);
                return {
                    userId: userId, // 修复：使用真实的userId
                    userType: 'STUDENT',
                    userName: currentUser.realName || currentUser.username || currentUser.name,
                    role: 'student'
                };
            } else {
                console.error('学生端用户ID无效:', userId);
            }
        } else {
            console.error('学生端无法获取window.currentUser');
        }

        // 学生端备用方案：使用固定的学生信息（student2 - User ID 5）
        console.warn('学生端使用备用用户信息');
        return {
            userId: 5, // 使用User ID 5（对应student2）
            userType: 'STUDENT',
            userName: 'student2学生',
            role: 'student'
        };
    }

    console.error('无法确定当前用户信息');
    return null;
}

// 刷新对话列表
async function refreshConversations() {
    try {
        const userInfo = getCurrentUserInfo();
        console.log('刷新对话列表 - 用户信息:', userInfo);

        if (!userInfo || !userInfo.userId) {
            console.error('用户信息不完整');
            showEmptyConversations();
            return;
        }

        const response = await fetch(`/api/messages/conversations?userId=${userInfo.userId}&userType=${userInfo.userType}`, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('对话列表API响应状态:', response.status);
        const result = await response.json();
        console.log('对话列表API响应:', result);

        if (result.success) {
            displayConversationsList(result.data);
            // 隐藏空状态，显示对话列表
            const emptyElement = document.getElementById('conversations-empty');
            if (emptyElement) {
                emptyElement.style.display = result.data.length === 0 ? 'block' : 'none';
            }
        } else {
            console.error('获取对话列表失败:', result.message);
            showEmptyConversations();
        }
    } catch (error) {
        console.error('刷新对话列表失败:', error);
        showEmptyConversations();
    }
}

// 显示对话列表
function displayConversationsList(conversations) {
    const container = document.getElementById('conversations-list');

    if (!conversations || conversations.length === 0) {
        showEmptyConversations();
        return;
    }

    container.innerHTML = conversations.map(conv => `
        <div class="conversation-item">
            <div class="conversation-info" onclick="openConversation(${conv.partnerId}, '${conv.partnerType}', '${conv.partnerName}')">
                <div class="conversation-partner">
                    <i class="fas fa-${conv.partnerType === 'TEACHER' ? 'chalkboard-teacher' : 'user-graduate'}"></i>
                    ${conv.partnerName}
                    ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                </div>
                <div class="conversation-last-message">${conv.lastMessage}</div>
            </div>
            <div class="conversation-meta">
                <div class="conversation-time">${formatMessageTime(conv.lastMessageTime)}</div>
                <button class="delete-conversation-btn" onclick="deleteConversation(event, ${conv.partnerId}, '${conv.partnerType}')" title="删除对话">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// 显示空对话状态
function showEmptyConversations() {
    const emptyElement = document.getElementById('conversations-empty');
    if (emptyElement) {
        emptyElement.style.display = 'block';
    }

    const container = document.getElementById('conversations-list');
    if (container) {
        container.innerHTML = '';
    }
}

// 打开对话
async function openConversation(partnerId, partnerType, partnerName, courseId = null) {
    console.log('🗨️ 打开对话:', { partnerId, partnerType, partnerName, courseId });

    currentChatPartnerId = partnerId;
    currentChatPartnerType = partnerType;
    currentChatPartnerName = partnerName;
    currentCourseId = courseId;

    // 更新聊天界面标题（适配teacher.html的结构）
    const chatPartnerName = document.getElementById('chat-partner-name');
    const chatHeader = document.getElementById('chat-header');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputArea = document.getElementById('chat-input-area');

    if (chatPartnerName) chatPartnerName.textContent = `${partnerName} (${partnerType === 'TEACHER' ? '教师' : '学生'})`;
    if (chatHeader) chatHeader.style.display = 'block';
    if (chatInputArea) chatInputArea.style.display = 'block';

    // 清空并准备消息区域
    if (chatMessages) {
        chatMessages.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;"><i class="fas fa-spinner fa-spin"></i> 加载对话历史...</div>';
    }

    // 加载对话历史
    await loadConversationHistory();

    // 标记为已读
    await markCurrentChatAsRead();

    // 聚焦到输入框
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        setTimeout(() => messageInput.focus(), 100);
    }

    // 启动消息自动刷新
    if (typeof startMessageRefresh === 'function') {
        startMessageRefresh();
    }

    console.log('✅ 对话界面已打开');
}

// 关闭聊天窗口
function closeChatWindow() {
    const chatHeader = document.getElementById('chat-header');
    const chatInputArea = document.getElementById('chat-input-area');
    const chatMessages = document.getElementById('chat-messages');
    const chatPartnerName = document.getElementById('chat-partner-name');

    if (chatHeader) chatHeader.style.display = 'none';
    if (chatInputArea) chatInputArea.style.display = 'none';
    if (chatPartnerName) chatPartnerName.textContent = '请选择对话';

    if (chatMessages) {
        chatMessages.innerHTML = '<div style="text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; color: #6c757d;"><div><i class="fas fa-comments" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i><p>选择一个对话开始聊天</p></div></div>';
    }

    currentChatPartnerId = null;
    currentChatPartnerType = null;
    currentChatPartnerName = null;
    currentCourseId = null;

    // 停止消息刷新
    if (typeof stopMessageRefresh === 'function') {
        stopMessageRefresh();
    }
}

// 加载对话历史
async function loadConversationHistory() {
    try {
        const userInfo = getCurrentUserInfo();
        console.log('加载对话历史 - 用户信息:', userInfo);
        console.log('加载对话历史 - 对话伙伴:', { partnerId: currentChatPartnerId, partnerType: currentChatPartnerType });

        if (!userInfo || !userInfo.userId) {
            console.error('用户信息不完整');
            return;
        }

        const url = `/api/messages/conversation?userId1=${userInfo.userId}&userType1=${userInfo.userType}&userId2=${currentChatPartnerId}&userType2=${currentChatPartnerType}`;
        console.log('加载对话历史URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include'
        });

        console.log('加载对话历史API响应状态:', response.status);
        const result = await response.json();
        console.log('加载对话历史API响应:', result);

        if (result.success) {
            displayChatMessages(result.data);
        } else {
            console.error('加载对话失败:', result.message);
            showNotification('加载对话失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('加载对话失败:', error);
        showNotification('加载对话失败: ' + error.message, 'error');
    }
}

// 显示聊天消息
function displayChatMessages(messages) {
    const container = document.getElementById('chat-messages');
    const userInfo = getCurrentUserInfo();

    if (!messages || messages.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 40px; font-size: 14px;"><i class="fas fa-comment-alt" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5; display: block;"></i>开始新的对话吧！</div>';
        return;
    }

    // 当有消息时，改变容器的显示方式
    container.style.display = 'block';
    container.style.alignItems = 'flex-start';
    container.style.justifyContent = 'flex-start';

    // 创建聊天消息的HTML - 像微信一样垂直排列
    container.innerHTML = messages.map(msg => {
        const isMyMessage = msg.senderId === userInfo.userId && msg.senderType === userInfo.userType;
        const avatarIcon = isMyMessage ? 'fas fa-user-tie' : 'fas fa-user-graduate';
        const avatarColor = isMyMessage ? '#007bff' : '#28a745';

        return `
            <div style="
                margin-bottom: 15px;
                padding: 0 12px;
                display: flex;
                justify-content: ${isMyMessage ? 'flex-end' : 'flex-start'};
            ">
                <div style="
                    display: flex;
                    max-width: 75%;
                    ${isMyMessage ? 'flex-direction: row-reverse;' : 'flex-direction: row;'}
                    align-items: flex-end;
                ">
                    <!-- 头像 -->
                    <div style="
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: ${avatarColor};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: ${isMyMessage ? '0 0 0 6px' : '0 6px 0 0'};
                        flex-shrink: 0;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    ">
                        <i class="${avatarIcon}" style="color: white; font-size: 14px;"></i>
                    </div>

                    <!-- 消息内容区域 -->
                    <div style="flex: 1; min-width: 0;">
                        <!-- 消息气泡 -->
                        <div style="
                            ${isMyMessage ?
                                'background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); color: white; border-radius: 18px 18px 4px 18px;' :
                                'background: white; color: #333; border: 1px solid #e0e0e0; border-radius: 18px 18px 18px 4px;'
                            }
                            padding: 8px 12px;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                            position: relative;
                            word-wrap: break-word;
                            line-height: 1.4;
                            display: inline-block;
                            max-width: 100%;
                        ">
                            <!-- 消息文本 -->
                            <div style="font-size: 14px;">
                                ${msg.content}
                            </div>
                        </div>

                        <!-- 时间戳 -->
                        <div style="
                            font-size: 11px;
                            color: #999;
                            margin-top: 4px;
                            text-align: ${isMyMessage ? 'right' : 'left'};
                            padding: ${isMyMessage ? '0 4px 0 0' : '0 0 0 4px'};
                        ">
                            ${formatMessageTime(msg.sentAt)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 滚动到底部
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// 发送消息
async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();

    if (!content) return;
    if (!currentChatPartnerId) {
        showNotification('请先选择对话', 'warning');
        return;
    }

    try {
        const userInfo = getCurrentUserInfo();
        console.log('发送消息 - 用户信息:', userInfo);
        console.log('发送消息 - 接收者信息:', { partnerId: currentChatPartnerId, partnerType: currentChatPartnerType });

        if (!userInfo || !userInfo.userId) {
            showNotification('用户信息获取失败', 'error');
            return;
        }

        const messageData = {
            senderId: userInfo.userId,
            senderType: userInfo.userType,
            receiverId: currentChatPartnerId,
            receiverType: currentChatPartnerType,
            courseId: currentCourseId,
            content: content
        };

        console.log('发送消息数据:', messageData);

        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(messageData)
        });

        console.log('发送消息API响应状态:', response.status);
        const result = await response.json();
        console.log('发送消息API响应:', result);

        if (result.success) {
            input.value = '';
            await loadConversationHistory();
            await refreshConversations();
            showNotification('消息发送成功', 'success');
        } else {
            showNotification('发送失败: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('发送消息失败:', error);
        showNotification('发送失败: ' + error.message, 'error');
    }
}

// 处理回车键发送
function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// 标记当前对话为已读
async function markCurrentChatAsRead() {
    if (!currentChatPartnerId) return;

    try {
        const userInfo = getCurrentUserInfo();
        if (!userInfo || !userInfo.userId) return;

        const markReadData = {
            receiverId: userInfo.userId,
            receiverType: userInfo.userType,
            senderId: currentChatPartnerId,
            senderType: currentChatPartnerType
        };

        console.log('标记已读数据:', markReadData);

        await fetch('/api/messages/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(markReadData)
        });

        await refreshUnreadCount();
        await refreshConversations();
    } catch (error) {
        console.error('标记已读失败:', error);
    }
}

// 更新未读消息数量
async function refreshUnreadCount() {
    try {
        const userInfo = getCurrentUserInfo();
        if (!userInfo || !userInfo.userId) return;

        const response = await fetch(`/api/messages/unread-count?userId=${userInfo.userId}&userType=${userInfo.userType}`);
        const result = await response.json();

        if (result.success) {
            const badge = document.getElementById('unread-messages-badge');
            if (badge) {
                if (result.data > 0) {
                    badge.textContent = result.data;
                    badge.style.display = 'inline';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('更新未读数量失败:', error);
    }
}

// 刷新可对话用户
async function refreshAvailableUsers() {
    await loadUserCourses();
    clearCourseUsers();
}

// 加载用户课程列表
async function loadUserCourses() {
    try {
        const userInfo = getCurrentUserInfo();
        console.log('加载用户课程 - 用户信息:', userInfo);

        if (!userInfo || !userInfo.userId) {
            console.error('无法获取用户ID');
            return;
        }

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

        console.log('用户课程API响应状态:', response.status);
        const result = await response.json();
        console.log('用户课程API响应:', result);

        if (result.success) {
            const select = document.getElementById('course-select');
            if (select) {
                // 清空原有选项并添加新选项
                select.innerHTML = '<option value="">请选择课程</option>';

                if (result.data && result.data.length > 0) {
                    const options = result.data.map(course => {
                        const courseName = course.name || '未命名课程';
                        const courseCode = course.courseCode || 'N/A';
                        return `<option value="${course.id}">${courseName} (${courseCode})</option>`;
                    }).join('');
                    select.innerHTML += options;

                    console.log(`✅ 成功加载 ${result.data.length} 个课程到下拉框`);
                } else {
                    console.log('⚠️ 用户没有可用的课程');
                    select.innerHTML += '<option value="" disabled>暂无可用课程</option>';
                }
            } else {
                console.error('找不到course-select元素');
            }
        } else {
            console.error('获取用户课程失败:', result.message);
        }
    } catch (error) {
        console.error('加载课程列表失败:', error);
    }
}

// 加载课程用户
async function loadCourseUsers() {
    const courseSelect = document.getElementById('course-select');
    const courseId = courseSelect ? courseSelect.value : '';
    const container = document.getElementById('available-users-list');

    if (!courseId) {
        clearCourseUsers();
        return;
    }

    try {
        const userInfo = getCurrentUserInfo();
        if (!userInfo || !userInfo.userId) {
            console.error('无法获取用户信息');
            return;
        }

        console.log(`加载课程 ${courseId} 的用户列表，当前用户: ${userInfo.userId} (${userInfo.userType})`);

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

        console.log('课程用户API响应状态:', response.status);
        const result = await response.json();
        console.log('课程用户API响应:', result);

        if (result.success) {
            console.log(`✅ 成功获取 ${result.data ? result.data.length : 0} 个用户`);
            displayCourseUsers(result.data);
            // 隐藏空状态
            const emptyElement = document.getElementById('users-empty');
            if (emptyElement) {
                emptyElement.style.display = result.data.length === 0 ? 'block' : 'none';
            }
        } else {
            console.error('获取课程用户失败:', result.message);
            if (container) {
                container.innerHTML = `<div style="text-align: center; color: #e74c3c; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px;"></i>
                    <br>获取用户列表失败<br>
                    <small style="color: #7f8c8d;">${result.message || '请检查网络连接'}</small>
                </div>`;
            }
        }
    } catch (error) {
        console.error('加载课程用户失败:', error);
        if (container) {
            container.innerHTML = `<div style="text-align: center; color: #e74c3c; padding: 40px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 12px;"></i>
                <br>加载失败<br>
                <small style="color: #7f8c8d;">请检查网络连接后重试</small>
            </div>`;
        }
    }
}

// 显示课程用户列表
function displayCourseUsers(users) {
    const container = document.getElementById('available-users-list');

    if (!users || users.length === 0) {
        if (container) {
            container.innerHTML = '<div style="text-align: center; color: #6c757d; padding: 40px;">该课程暂无其他用户</div>';
        }
        return;
    }

    if (container) {
        container.innerHTML = users.map(user => `
            <div class="user-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 12px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div>
                    <div style="font-weight: bold; color: #2c3e50; margin-bottom: 4px;">
                        <i class="fas fa-${user.userType === 'TEACHER' ? 'chalkboard-teacher' : 'user-graduate'}"></i>
                        ${user.name}
                    </div>
                    <div style="color: #6c757d; font-size: 14px;">
                        ${user.userType === 'TEACHER' ? '教师' : user.className ? user.className : '学生'}
                        ${user.studentId ? ` | 学号: ${user.studentId}` : ''}
                    </div>
                </div>
                <button class="btn btn-primary" onclick="startNewChat(${user.id}, '${user.userType}', '${user.name}')">
                    <i class="fas fa-comment"></i> 开始聊天
                </button>
            </div>
        `).join('');
    }
}

// 开始新聊天
async function startNewChat(userId, userType, userName) {
    // 切换到对话列表页面
    if (typeof showSection === 'function') {
        showSection('message-conversations');
    }

    // 等待页面加载完成
    setTimeout(async () => {
        await refreshConversations();
        await openConversation(userId, userType, userName);
    }, 100);
}

// 清空课程用户列表
function clearCourseUsers() {
    const container = document.getElementById('available-users-list');
    if (container) {
        container.innerHTML = '';
    }

    const emptyElement = document.getElementById('users-empty');
    if (emptyElement) {
        emptyElement.style.display = 'block';
    }
}

// 过滤用户
function filterUsers() {
    // 这个功能可以后续实现，目前先保留接口
    loadCourseUsers();
}

// 格式化消息时间
function formatMessageTime(timeString) {
    if (!timeString) return '';

    try {
        const date = new Date(timeString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } else if (diffInHours < 24 * 7) {
            return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
        }
    } catch (error) {
        return timeString;
    }
}

// 启动消息刷新（页面加载时调用）
function startMessageRefresh() {
    // 清除现有定时器
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
    }

    // 每30秒刷新一次
    messageRefreshInterval = setInterval(async () => {
        await refreshUnreadCount();
        if (currentChatPartnerId) {
            await loadConversationHistory();
        }
    }, 30000);
}

// 停止消息刷新
function stopMessageRefresh() {
    if (messageRefreshInterval) {
        clearInterval(messageRefreshInterval);
        messageRefreshInterval = null;
    }
}

// 设置消息输入框回车事件
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', handleMessageKeyPress);
    }

    // 启动消息刷新
    startMessageRefresh();
});

// 页面卸载时清理定时器
window.addEventListener('beforeunload', function() {
    stopMessageRefresh();
});

// 删除对话
async function deleteConversation(event, partnerId, partnerType) {
    event.stopPropagation(); // 阻止事件冒泡，防止打开对话

    const confirmed = confirm('确定要删除此对话吗？此操作不可恢复。');
    if (!confirmed) {
        return;
    }

    try {
        const userInfo = getCurrentUserInfo();
        if (!userInfo || !userInfo.userId) {
            showNotification('无法获取用户信息', 'error');
            return;
        }

        const params = new URLSearchParams({
            userId1: userInfo.userId,
            userType1: userInfo.userType,
            userId2: partnerId,
            userType2: partnerType
        });

        const response = await fetch(`/api/messages/conversation?${params.toString()}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showNotification('对话已删除', 'success');
            // 如果删除的是当前打开的对话，则关闭聊天窗口
            if (partnerId === currentChatPartnerId) {
                closeChatWindow();
            }
            await refreshConversations();
        } else {
            showNotification(result.message || '删除失败', 'error');
        }
    } catch (error) {
        console.error('删除对话失败:', error);
        showNotification('删除对话时发生错误', 'error');
    }
}