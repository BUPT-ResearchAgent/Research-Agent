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
            alert('用户菜单功能');
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
});