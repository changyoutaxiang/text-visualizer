/**
 * 身份验证守卫组件
 * 提供密码保护功能，防止未授权访问
 */

export class AuthGuard {
    constructor(onAuthSuccess = null) {
        this.password = import.meta.env.VITE_APP_PASSWORD;
        this.sessionKey = 'tv_auth_session';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24小时
        this.isAuthenticated = false;
        this.onAuthSuccess = onAuthSuccess || (() => {});
        
        this.init();
    }

    init() {
        // 如果没有设置密码，跳过验证
        if (!this.password) {
            console.log('🔓 未设置访问密码，跳过身份验证');
            this.isAuthenticated = true;
            return;
        }

        // 检查现有会话
        if (this.checkExistingSession()) {
            this.isAuthenticated = true;
            console.log('✅ 会话有效，用户已认证');
        } else {
            this.showLoginDialog();
        }
    }

    /**
     * 检查现有会话是否有效
     */
    checkExistingSession() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            if (!session) return false;

            const sessionData = JSON.parse(session);
            const now = Date.now();

            // 检查会话是否过期
            if (now > sessionData.expiresAt) {
                localStorage.removeItem(this.sessionKey);
                return false;
            }

            // 更新最后活动时间
            sessionData.lastActivity = now;
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            
            return true;
        } catch (error) {
            console.error('会话检查失败:', error);
            localStorage.removeItem(this.sessionKey);
            return false;
        }
    }

    /**
     * 显示登录对话框
     */
    showLoginDialog() {
        // 隐藏主应用
        const appContainer = document.querySelector('.container');
        if (appContainer) {
            appContainer.style.display = 'none';
        }

        // 创建登录界面
        const loginHtml = `
            <div id="authOverlay" class="auth-overlay">
                <div class="auth-dialog">
                    <div class="auth-header">
                        <h2>🔒 访问验证</h2>
                        <p>请输入访问密码以继续使用</p>
                    </div>
                    <form id="authForm" class="auth-form">
                        <div class="auth-input-group">
                            <input 
                                type="password" 
                                id="passwordInput" 
                                placeholder="请输入访问密码"
                                required
                                autocomplete="current-password"
                            >
                            <button type="submit" id="loginBtn">
                                验证访问
                            </button>
                        </div>
                        <div id="authError" class="auth-error" style="display: none;"></div>
                        <div class="auth-options">
                            <label class="remember-checkbox">
                                <input type="checkbox" id="rememberMe" checked>
                                <span>记住我 (24小时)</span>
                            </label>
                        </div>
                    </form>
                    <div class="auth-footer">
                        <p class="auth-note">
                            💡 这是为了保护应用不被未授权访问
                        </p>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const authStyles = `
            <style>
                .auth-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif);
                }

                .auth-dialog {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: authSlideIn 0.3s ease-out;
                }

                @keyframes authSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .auth-header h2 {
                    color: #1e293b;
                    margin: 0 0 8px 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                .auth-header p {
                    color: #64748b;
                    margin: 0;
                    font-size: 14px;
                }

                .auth-form {
                    margin-bottom: 20px;
                }

                .auth-input-group {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                }

                .auth-input-group input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s ease;
                }

                .auth-input-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .auth-input-group button {
                    padding: 12px 20px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    white-space: nowrap;
                }

                .auth-input-group button:hover {
                    background: #2563eb;
                }

                .auth-input-group button:active {
                    transform: translateY(1px);
                }

                .auth-error {
                    background: #fef2f2;
                    color: #dc2626;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    border: 1px solid #fecaca;
                    margin-bottom: 16px;
                }

                .auth-options {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .remember-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: #64748b;
                    cursor: pointer;
                }

                .remember-checkbox input {
                    margin: 0;
                }

                .auth-footer {
                    border-top: 1px solid #e2e8f0;
                    padding-top: 20px;
                    text-align: center;
                }

                .auth-note {
                    color: #64748b;
                    font-size: 13px;
                    margin: 0;
                }
            </style>
        `;

        // 插入到页面
        document.body.insertAdjacentHTML('beforeend', authStyles + loginHtml);

        // 设置事件监听器
        this.setupLoginListeners();
        
        // 自动聚焦密码输入框
        setTimeout(() => {
            document.getElementById('passwordInput')?.focus();
        }, 100);
    }

    /**
     * 设置登录表单事件监听器
     */
    setupLoginListeners() {
        const form = document.getElementById('authForm');
        const passwordInput = document.getElementById('passwordInput');
        const errorDiv = document.getElementById('authError');

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 输入时清除错误信息
        passwordInput?.addEventListener('input', () => {
            errorDiv.style.display = 'none';
        });

        // 回车键提交
        passwordInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
    }

    /**
     * 处理登录
     */
    handleLogin() {
        const passwordInput = document.getElementById('passwordInput');
        const rememberMe = document.getElementById('rememberMe');
        const errorDiv = document.getElementById('authError');
        const loginBtn = document.getElementById('loginBtn');

        if (!passwordInput || !errorDiv || !loginBtn) return;

        const inputPassword = passwordInput.value.trim();
        
        // 显示加载状态
        loginBtn.textContent = '验证中...';
        loginBtn.disabled = true;

        // 模拟验证延迟（防暴力破解）
        setTimeout(() => {
            if (inputPassword === this.password) {
                // 验证成功
                this.createSession(rememberMe?.checked);
                this.hideLoginDialog();
                this.isAuthenticated = true;
                console.log('✅ 用户认证成功');
                
                // 触发应用初始化
                this.onAuthSuccess();
            } else {
                // 验证失败
                errorDiv.textContent = '❌ 密码错误，请重试';
                errorDiv.style.display = 'block';
                passwordInput.value = '';
                passwordInput.focus();
                
                // 记录失败尝试
                this.recordFailedAttempt();
            }

            // 恢复按钮状态
            loginBtn.textContent = '验证访问';
            loginBtn.disabled = false;
        }, 500);
    }

    /**
     * 创建会话
     */
    createSession(remember = true) {
        const now = Date.now();
        const expiresAt = remember ? 
            now + this.sessionDuration : 
            now + (2 * 60 * 60 * 1000); // 不记住时2小时过期

        const sessionData = {
            createdAt: now,
            lastActivity: now,
            expiresAt: expiresAt,
            remember: remember
        };

        localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    /**
     * 隐藏登录对话框
     */
    hideLoginDialog() {
        const overlay = document.getElementById('authOverlay');
        if (overlay) {
            overlay.style.animation = 'authSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                overlay.remove();
                
                // 显示主应用
                const appContainer = document.querySelector('.container');
                if (appContainer) {
                    appContainer.style.display = 'block';
                }
            }, 300);
        }
    }

    /**
     * 记录失败尝试
     */
    recordFailedAttempt() {
        const attempts = parseInt(localStorage.getItem('auth_failed_attempts') || '0') + 1;
        localStorage.setItem('auth_failed_attempts', attempts.toString());
        
        // 如果尝试次数过多，可以添加限制逻辑
        if (attempts >= 5) {
            console.warn('⚠️ 多次密码错误尝试');
        }
    }

    /**
     * 手动登出
     */
    logout() {
        localStorage.removeItem(this.sessionKey);
        localStorage.removeItem('auth_failed_attempts');
        this.isAuthenticated = false;
        
        // 重新显示登录界面
        this.showLoginDialog();
        
        console.log('🔓 用户已退出登录');
    }

    /**
     * 检查用户是否已认证
     */
    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    /**
     * 获取会话信息
     */
    getSessionInfo() {
        try {
            const session = localStorage.getItem(this.sessionKey);
            return session ? JSON.parse(session) : null;
        } catch {
            return null;
        }
    }
}

// 添加退出动画样式
const exitAnimationStyle = document.createElement('style');
exitAnimationStyle.textContent = `
    @keyframes authSlideOut {
        from {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
        }
    }
`;
document.head.appendChild(exitAnimationStyle);