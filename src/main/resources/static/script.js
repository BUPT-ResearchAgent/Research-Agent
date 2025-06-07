// 本项目已美化字体和背景，风格统一，详见 style.css
// 菜单展开/折叠功能
document.addEventListener('DOMContentLoaded', function() {
    // 菜单展开/折叠
    document.querySelectorAll('.menu-item').forEach(item => {
        if(item.querySelector('.arrow')) {
            item.addEventListener('click', function() {
                const submenu = this.nextElementSibling;
                const chevron = this.querySelector('.arrow');
                
                // 关闭其他展开的菜单
                document.querySelectorAll('.submenu.expanded').forEach(expanded => {
                    if(expanded !== submenu) {
                        expanded.classList.remove('expanded');
                        const otherChevron = expanded.previousElementSibling.querySelector('.arrow');
                        otherChevron.classList.remove('fa-chevron-up');
                        otherChevron.classList.add('fa-chevron-down');
                    }
                });
                
                if(submenu.classList.contains('expanded')) {
                    submenu.classList.remove('expanded');
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                } else {
                    submenu.classList.add('expanded');
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            });
        } else {
            item.addEventListener('click', function() {
                // 移除所有活动状态
                document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
                
                // 添加当前活动状态
                this.classList.add('active');
            });
        }
    });
    
    // 子菜单项点击
    document.querySelectorAll('.submenu-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有活动状态
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
            
            // 添加当前活动状态
            this.classList.add('active');
            
            // 确保父菜单项也是激活状态
            const parentMenuItem = this.closest('.submenu').previousElementSibling;
            if(parentMenuItem) {
                parentMenuItem.classList.add('active');
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
    
    // 菜单内容切换功能
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
    // 子菜单项点击切换内容
    document.querySelectorAll('.submenu-item[data-section]').forEach(item => {
        item.addEventListener('click', function(e) {
            const section = this.getAttribute('data-section');
            if(section) showSection(section);
            e.stopPropagation(); // 防止冒泡影响主菜单
        });
    });

    // 登录界面逻辑
    const loginSection = document.getElementById('login-section');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    loginSection.style.display = '';
    sidebar.style.display = 'none';
    mainContent.style.display = 'none';

    // 注册相关
    const showRegisterBtn = document.getElementById('show-register');
    const registerModal = document.getElementById('register-modal');
    const registerForm = document.getElementById('register-form');
    const cancelRegisterBtn = document.getElementById('cancel-register');

    showRegisterBtn.addEventListener('click', function() {
        registerModal.style.display = 'flex';
    });
    cancelRegisterBtn.addEventListener('click', function() {
        registerModal.style.display = 'none';
        registerForm.reset();
    });
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const role = document.getElementById('register-role').value;
        if (!username || !password) {
                            console.log('账号和密码不能为空');
            return;
        }
        let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
        if (users.find(u => u.username === username)) {
                            console.log('该账号已存在');
            return;
        }
        users.push({ username, password, role });
        localStorage.setItem('smartedu_users', JSON.stringify(users));
                        console.log('注册成功，请登录');
        registerModal.style.display = 'none';
        registerForm.reset();
    });

    // 登录相关
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            const role = document.getElementById('login-role').value;
            let users = JSON.parse(localStorage.getItem('smartedu_users') || '[]');
            const user = users.find(u => u.username === username && u.role === role);
            if (!user) {
                console.log('用户不存在或角色不匹配');
                return;
            }
            if (user.password !== password) {
                console.log('密码错误');
                return;
            }
            // 登录成功，保存当前用户
            localStorage.setItem('smartedu_current_user', JSON.stringify(user));
            loginSection.style.display = 'none';
            sidebar.style.display = '';
            mainContent.style.display = '';
            renderSidebar(role);
            showMainSectionByRole(role);
            // 显示退出按钮
            document.getElementById('logout-btn').style.display = '';
            // 显示用户名
            document.querySelector('.user-name').textContent = user.username;
            // 重新绑定侧边栏事件
            setTimeout(() => {
                // 重新绑定菜单展开/折叠和内容切换
                document.querySelectorAll('.menu-item').forEach(item => {
                    if(item.querySelector('.arrow')) {
                        item.addEventListener('click', function() {
                            const submenu = this.nextElementSibling;
                            const chevron = this.querySelector('.arrow');
                            document.querySelectorAll('.submenu.expanded').forEach(expanded => {
                                if(expanded !== submenu) {
                                    expanded.classList.remove('expanded');
                                    const otherChevron = expanded.previousElementSibling.querySelector('.arrow');
                                    otherChevron.classList.remove('fa-chevron-up');
                                    otherChevron.classList.add('fa-chevron-down');
                                }
                            });
                            if(submenu.classList.contains('expanded')) {
                                submenu.classList.remove('expanded');
                                chevron.classList.remove('fa-chevron-up');
                                chevron.classList.add('fa-chevron-down');
                            } else {
                                submenu.classList.add('expanded');
                                chevron.classList.remove('fa-chevron-down');
                                chevron.classList.add('fa-chevron-up');
                            }
                        });
                    } else {
                        item.addEventListener('click', function() {
                            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                            document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
                            this.classList.add('active');
                        });
                    }
                });
                document.querySelectorAll('.submenu-item').forEach(item => {
                    item.addEventListener('click', function() {
                        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
                        document.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
                        this.classList.add('active');
                        const parentMenuItem = this.closest('.submenu').previousElementSibling;
                        if(parentMenuItem) {
                            parentMenuItem.classList.add('active');
                        }
                    });
                });
                // 内容切换
                function showSection(sectionId) {
                    document.querySelectorAll('.main-section').forEach(sec => {
                        if(sec.id === sectionId) {
                            sec.classList.remove('hidden-section');
                        } else {
                            sec.classList.add('hidden-section');
                        }
                    });
                }
                document.querySelectorAll('.menu-item[data-section]').forEach(item => {
                    item.addEventListener('click', function() {
                        const section = this.getAttribute('data-section');
                        if(section) showSection(section);
                    });
                });
                document.querySelectorAll('.submenu-item[data-section]').forEach(item => {
                    item.addEventListener('click', function(e) {
                        const section = this.getAttribute('data-section');
                        if(section) showSection(section);
                        e.stopPropagation();
                    });
                });
            }, 100);
        });
    }

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
        loginSection.style.display = 'flex';
        loginSection.style.removeProperty('display');
        sidebar.style.display = 'none';
        mainContent.style.display = 'none';
        logoutBtn.style.display = 'none';
        // 清空登录表单
        loginForm.reset();
        // 关闭注册弹窗并重置
        if (registerModal) {
            registerModal.style.display = 'none';
            registerForm.reset();
        }
        // 确保登录表单所有输入可用
        document.getElementById('login-username').disabled = false;
        document.getElementById('login-password').disabled = false;
        document.getElementById('login-role').disabled = false;
    });
});

// 登录与身份切换逻辑
function renderSidebar(role) {
    const sidebar = document.getElementById('sidebar');
    let html = '';
    if (role === 'teacher') {
        html += `<div class="menu-title">教师端</div>
        <div class="menu-item active" data-section="dashboard"><i class="fas fa-gauge-high"></i><span>教学控制面板</span></div>
        <div class="menu-item" data-section="lesson-design"><i class="fas fa-lightbulb"></i><span>备课与设计</span><i class="fas fa-chevron-down arrow"></i></div>
        <div class="submenu">
            <div class="submenu-item" data-section="upload-material"><i class="fas fa-upload"></i> 上传课程资料</div>
            <div class="submenu-item" data-section="outline"><i class="fas fa-sitemap"></i> 生成教学大纲</div>
            <div class="submenu-item" data-section="publish-notice"><i class="fas fa-bullhorn"></i> 发布通知</div>
        </div>
        <div class="menu-item" data-section="exam-gen"><i class="fas fa-file-signature"></i><span>考核内容生成</span><i class="fas fa-chevron-down arrow"></i></div>
        <div class="submenu">
            <div class="submenu-item" data-section="gen-test"><i class="fas fa-pen-nib"></i> 生成测评</div>
            <div class="submenu-item" data-section="test-manage"><i class="fas fa-tasks"></i> 测评管理</div>
            <div class="submenu-item" data-section="answer-manage"><i class="fas fa-key"></i> 答案管理</div>
        </div>
        <div class="menu-item" data-section="analysis"><i class="fas fa-chart-pie"></i><span>学情数据分析</span><i class="fas fa-chevron-down arrow"></i></div>
        <div class="submenu">
            <div class="submenu-item" data-section="grade-mark"><i class="fas fa-marker"></i> 成绩批改</div>
            <div class="submenu-item" data-section="grade-analysis"><i class="fas fa-chart-bar"></i> 成绩分析</div>
            <div class="submenu-item" data-section="improve-suggest"><i class="fas fa-lightbulb"></i> 教学改进建议</div>
        </div>`;
    } else if (role === 'student') {
        html += `<div class="menu-title">学生端</div>
        <div class="menu-item active" data-section="student-dashboard"><i class="fas fa-tachometer-alt"></i><span>学习控制面板</span></div>
        <div class="menu-item" data-section="student-helper"><i class="fas fa-robot"></i><span>在线学习助手</span></div>
        <div class="menu-item" data-section="practice-eval"><i class="fas fa-stopwatch"></i><span>实时练习评测</span></div>`;
    } else if (role === 'admin') {
        html += `<div class="menu-title">管理端</div>
        <div class="menu-item active" data-section="user-manage"><i class="fas fa-user-cog"></i><span>用户管理</span></div>
        <div class="menu-item" data-section="resource-manage"><i class="fas fa-archive"></i><span>课件资源管理</span></div>
        <div class="menu-item" data-section="screen-overview"><i class="fas fa-desktop"></i><span>大屏概览</span></div>`;
    }
    sidebar.innerHTML = html;
}

function showMainSectionByRole(role) {
    // 教师端默认显示dashboard，学生端student-dashboard，管理端user-manage
    if (role === 'teacher') {
        document.querySelectorAll('.main-section').forEach(sec => sec.classList.add('hidden-section'));
        document.getElementById('dashboard').classList.remove('hidden-section');
    } else if (role === 'student') {
        document.querySelectorAll('.main-section').forEach(sec => sec.classList.add('hidden-section'));
        document.getElementById('student-dashboard').classList.remove('hidden-section');
    } else if (role === 'admin') {
        document.querySelectorAll('.main-section').forEach(sec => sec.classList.add('hidden-section'));
        document.getElementById('user-manage').classList.remove('hidden-section');
    }
}