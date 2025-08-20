/**
 * 安全提示弹窗组件
 * 用于在用户点击外部链接时显示安全警告
 */

class SecurityModal {
    constructor() {
        this.currentUrl = '';
        this.modal = null;
        this.init();
    }

    // 初始化弹窗
    init() {
        // 创建弹窗HTML结构
        this.createModal();
        
        // 绑定事件
        this.bindEvents();
    }

    // 创建弹窗HTML结构
    createModal() {
        const modalHtml = `
            <div id="security-modal" class="security-modal" style="display: none;">
                <div class="security-modal-content">
                    <div class="security-modal-header">
                        <div class="warning-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>安全提示</h3>
                    </div>
                    <div class="security-modal-body">
                        <p><strong class="highlight">您即将离开智囊，跳转到第三方网站。</strong></p>
                        <p>智囊出于为您提供便利的目的向您提供第三方链接，我们不对第三方网站的内容负责，请您审慎访问，保护好您的信息及财产安全。</p>
                    </div>
                    <div class="security-modal-footer">
                        <button type="button" class="security-btn security-btn-cancel" id="security-cancel-btn">
                            <i class="fas fa-times"></i> 取消
                        </button>
                        <button type="button" class="security-btn security-btn-continue" id="security-continue-btn">
                            <i class="fas fa-external-link-alt"></i> 继续访问
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 添加CSS样式
        const styleHtml = `
            <style>
                .security-modal {
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(5px);
                    -webkit-backdrop-filter: blur(5px);
                }
                
                .security-modal-content {
                    background-color: #fff;
                    margin: 10% auto;
                    padding: 0;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    animation: modalSlideIn 0.3s ease-out;
                }
                
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .security-modal-header {
                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                    color: white;
                    padding: 20px;
                    border-radius: 15px 15px 0 0;
                    text-align: center;
                }
                
                .security-modal-header h3 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .security-modal-header .warning-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                    color: #fff;
                }
                
                .security-modal-body {
                    padding: 30px;
                    text-align: center;
                }
                
                .security-modal-body p {
                    color: #555;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    font-size: 16px;
                }
                
                .security-modal-body .highlight {
                    color: #e74c3c;
                    font-weight: 600;
                }
                
                .security-modal-footer {
                    padding: 0 30px 30px;
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                }
                
                .security-btn {
                    padding: 12px 30px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 120px;
                }
                
                .security-btn-cancel {
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 2px solid #dee2e6;
                }
                
                .security-btn-cancel:hover {
                    background: #e9ecef;
                    color: #495057;
                    border-color: #adb5bd;
                }
                
                .security-btn-continue {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: 2px solid transparent;
                }
                
                .security-btn-continue:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                
                @media (max-width: 768px) {
                    .security-modal-content {
                        margin: 20% auto;
                        width: 95%;
                    }
                    
                    .security-modal-footer {
                        flex-direction: column;
                    }
                    
                    .security-btn {
                        width: 100%;
                    }
                }
            </style>
        `;

        // 将HTML和CSS添加到页面
        document.head.insertAdjacentHTML('beforeend', styleHtml);
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        this.modal = document.getElementById('security-modal');
    }

    // 绑定事件
    bindEvents() {
        const cancelBtn = document.getElementById('security-cancel-btn');
        const continueBtn = document.getElementById('security-continue-btn');

        // 取消按钮
        cancelBtn.addEventListener('click', () => {
            this.close();
        });

        // 继续访问按钮
        continueBtn.addEventListener('click', () => {
            this.continueToUrl();
        });

        // 点击背景关闭
        this.modal.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (event) => {
            if (this.modal.style.display === 'block') {
                if (event.key === 'Escape') {
                    this.close();
                } else if (event.key === 'Enter') {
                    this.continueToUrl();
                }
            }
        });
    }

    // 显示安全警告
    show(url) {
        if (!url) {
            console.warn('SecurityModal: URL is required');
            return;
        }

        this.currentUrl = url;
        this.modal.style.display = 'block';
        
        // 聚焦到继续按钮
        setTimeout(() => {
            document.getElementById('security-continue-btn').focus();
        }, 100);
    }

    // 关闭弹窗
    close() {
        this.modal.style.display = 'none';
        this.currentUrl = '';
    }

    // 继续访问URL
    continueToUrl() {
        if (this.currentUrl) {
            window.open(this.currentUrl, '_blank', 'noopener,noreferrer');
        }
        this.close();
    }
}

// 创建全局实例
let securityModal = null;

// 初始化函数
function initSecurityModal() {
    if (!securityModal) {
        securityModal = new SecurityModal();
    }
    return securityModal;
}

// 显示安全警告的便捷函数
function showSecurityWarning(url) {
    const modal = initSecurityModal();
    modal.show(url);
}

// 自动初始化
document.addEventListener('DOMContentLoaded', function() {
    initSecurityModal();
});

// 导出到全局
window.SecurityModal = SecurityModal;
window.showSecurityWarning = showSecurityWarning;
window.initSecurityModal = initSecurityModal;
