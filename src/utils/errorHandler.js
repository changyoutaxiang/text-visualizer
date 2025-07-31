/**
 * 全局错误处理模块
 * 提供统一的用户友好的错误处理和日志记录
 */

class ErrorHandler {
    constructor() {
        this.errorMap = new Map([
            ['Network Error', '网络连接失败，请检查网络后重试'],
            ['timeout', '请求超时，请稍后重试'],
            ['401', 'API密钥无效或已过期，请检查配置'],
            ['403', '访问被拒绝，请检查权限设置'],
            ['429', '请求过于频繁，请稍后重试'],
            ['500', '服务器内部错误，请稍后重试'],
            ['502', '网关错误，请稍后重试'],
            ['503', '服务暂时不可用，请稍后重试'],
            ['CORS', '跨域请求失败，请检查API配置'],
            ['ABORTED', '请求已取消'],
            ['EMPTY_TEXT', '请输入要可视化的文本内容'],
            ['INVALID_FORMAT', '不支持该输出格式'],
            ['INVALID_MODEL', '请选择有效的AI模型'],
            ['TEMPLATE_ERROR', '模板加载失败，请重试'],
            ['RENDER_ERROR', '内容渲染失败，请检查输入内容']
        ]);
    }

    /**
     * 处理错误并显示用户友好的消息
     * @param {Error|string} error - 错误对象或消息
     * @param {string} context - 错误发生的上下文
     * @param {Object} options - 配置选项
     */
    handle(error, context = 'general', options = {}) {
        const {
            showNotification = true,
            logError = true,
            userMessage = null,
            severity = 'error'
        } = options;

        // 标准化错误消息
        const normalizedError = this.normalizeError(error);
        const message = userMessage || this.getUserFriendlyMessage(normalizedError);
        
        // 记录错误日志
        if (logError) {
            this.logError(normalizedError, context);
        }

        // 显示用户通知
        if (showNotification) {
            this.showNotification(message, severity);
        }

        return message;
    }

    /**
     * 标准化错误对象
     * @param {Error|string} error - 原始错误
     * @returns {Object} 标准化错误对象
     */
    normalizeError(error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code || null
            };
        }

        if (typeof error === 'string') {
            return {
                message: error,
                stack: null,
                name: 'Error',
                code: null
            };
        }

        if (error.response) {
            // axios错误
            return {
                message: error.response.data?.error?.message || error.message,
                stack: error.stack,
                name: error.name,
                code: error.response.status
            };
        }

        return {
            message: String(error),
            stack: null,
            name: 'UnknownError',
            code: null
        };
    }

    /**
     * 获取用户友好的错误消息
     * @param {Object} normalizedError - 标准化错误对象
     * @returns {string} 用户友好的消息
     */
    getUserFriendlyMessage(normalizedError) {
        const { message, code } = normalizedError;

        // 检查HTTP状态码
        if (code) {
            const statusMessage = this.errorMap.get(String(code));
            if (statusMessage) {
                return statusMessage;
            }
        }

        // 检查错误消息关键词
        const lowerMessage = message.toLowerCase();
        for (const [key, value] of this.errorMap) {
            if (lowerMessage.includes(key.toLowerCase())) {
                return value;
            }
        }

        // 默认消息
        return '操作失败，请稍后重试';
    }

    /**
     * 记录错误日志
     * @param {Object} error - 标准化错误对象
     * @param {string} context - 错误上下文
     */
    logError(error, context) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context,
            ...error,
            userAgent: navigator.userAgent.substring(0, 100),
            url: window.location.href,
            referrer: document.referrer
        };

        // 开发环境：控制台输出
        if (import.meta.env.DEV) {
            console.error(`[${context}]`, error);
        }

        // 生产环境：发送到日志服务（可扩展）
        if (import.meta.env.PROD) {
            // 这里可以集成错误监控服务
            console.warn('错误已记录:', logEntry);
        }

        // 本地存储错误日志（可选）
        try {
            const logs = JSON.parse(localStorage.getItem('app_errors') || '[]');
            logs.push(logEntry);
            
            // 限制日志数量
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }
            
            localStorage.setItem('app_errors', JSON.stringify(logs));
        } catch (e) {
            // 忽略存储错误
        }
    }

    /**
     * 显示用户通知
     * @param {string} message - 显示的消息
     * @param {string} severity - 严重程度 (error, warning, info)
     */
    showNotification(message, severity = 'error') {
        // 创建通知元素
        const notification = this.createNotification(message, severity);
        
        // 添加到DOM
        document.body.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    /**
     * 创建通知DOM元素
     * @param {string} message - 消息内容
     * @param {string} severity - 严重程度
     * @returns {HTMLElement} 通知元素
     */
    createNotification(message, severity) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${severity}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;

        // 根据严重程度设置颜色
        const colors = {
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[severity] || colors.error;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    ${severity === 'error' ? `<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>` : ''}
                    ${severity === 'warning' ? `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>` : ''}
                    ${severity === 'info' ? `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>` : ''}
                </svg>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: 8px;
            ">×</button>
        `;

        return notification;
    }

    /**
     * 创建loading状态通知
     * @param {string} message - 加载消息
     * @returns {HTMLElement} 加载通知元素
     */
    showLoading(message = '处理中...') {
        const loading = document.createElement('div');
        loading.className = 'loading-notification';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        loading.innerHTML = `
            <div style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span>${message}</span>
        `;

        document.body.appendChild(loading);
        return loading;
    }

    /**
     * 隐藏loading通知
     * @param {HTMLElement} loadingEl - loading元素
     */
    hideLoading(loadingEl) {
        if (loadingEl && loadingEl.parentNode) {
            loadingEl.remove();
        }
    }

    /**
     * 获取错误统计
     * @returns {Array} 错误日志数组
     */
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('app_errors') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * 清除错误日志
     */
    clearErrorLogs() {
        localStorage.removeItem('app_errors');
    }
}

// 创建单例实例
export const errorHandler = new ErrorHandler();

// 全局错误处理
window.addEventListener('error', (event) => {
    errorHandler.handle(event.error, 'global');
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, 'promise');
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .notification {
        transition: all 0.3s ease-out;
    }

    .notification:hover {
        transform: translateX(-5px);
    }
`;
document.head.appendChild(style);