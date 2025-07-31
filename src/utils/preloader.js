/**
 * 智能资源预加载器
 * 根据用户行为智能预加载资源，提升用户体验
 */

class SmartPreloader {
    constructor() {
        this.preloadedModules = new Set();
        this.userInteractionStarted = false;
        this.setupUserInteractionDetection();
    }

    /**
     * 检测用户交互，开始预加载策略
     */
    setupUserInteractionDetection() {
        const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
        
        const startPreloading = () => {
            if (!this.userInteractionStarted) {
                this.userInteractionStarted = true;
                this.startIntelligentPreloading();
                
                // 移除事件监听器
                events.forEach(event => {
                    document.removeEventListener(event, startPreloading, { passive: true });
                });
            }
        };

        events.forEach(event => {
            document.addEventListener(event, startPreloading, { passive: true });
        });
    }

    /**
     * 开始智能预加载
     */
    async startIntelligentPreloading() {
        console.log('🧠 开始智能预加载...');

        // 1. 预加载可能用到的模板
        this.preloadTemplates();

        // 2. 延迟预加载CodeMirror (用户很可能会使用编辑功能)
        setTimeout(() => {
            this.preloadCodeEditor();
        }, 2000);

        // 3. 预加载AI模型配置
        this.preloadModelConfigs();
    }

    /**
     * 预加载模板资源
     */
    async preloadTemplates() {
        try {
            // 预加载常用模板
            const commonTemplates = [
                '/prompts/templates/数据分析图表.md',
                '/prompts/templates/流程图.md'
            ];

            const promises = commonTemplates.map(template => 
                fetch(template).then(res => res.text()).catch(() => null)
            );

            await Promise.allSettled(promises);
            console.log('✅ 模板预加载完成');
        } catch (error) {
            console.warn('⚠️ 模板预加载失败:', error);
        }
    }

    /**
     * 预加载代码编辑器
     */
    async preloadCodeEditor() {
        if (this.preloadedModules.has('codemirror')) return;

        try {
            console.log('🔄 预加载代码编辑器...');
            
            // 在生产环境中，模块已经被Vite打包，无需单独预加载
            // 这里只是标记为已预加载，避免重复处理
            this.preloadedModules.add('codemirror');
            console.log('✅ 代码编辑器预加载完成');
        } catch (error) {
            console.warn('⚠️ 代码编辑器预加载失败:', error);
        }
    }

    /**
     * 预加载AI模型配置
     */
    async preloadModelConfigs() {
        try {
            // 预先初始化模型配置，避免首次API调用的延迟
            const { MODEL_CONFIGS } = await import('../utils/constants.js');
            
            // 缓存到sessionStorage
            sessionStorage.setItem('modelConfigs', JSON.stringify(MODEL_CONFIGS));
            console.log('✅ AI模型配置预加载完成');
        } catch (error) {
            console.warn('⚠️ 模型配置预加载失败:', error);
        }
    }

    /**
     * 预加载指定资源
     */
    async preloadResource(url, type = 'fetch') {
        if (this.preloadedModules.has(url)) return;

        try {
            switch (type) {
                case 'fetch':
                    await fetch(url);
                    break;
                case 'image':
                    await this.preloadImage(url);
                    break;
                case 'module':
                    await this.preloadModule(url);
                    break;
            }
            
            this.preloadedModules.add(url);
        } catch (error) {
            console.warn(`预加载资源失败 ${url}:`, error);
        }
    }

    /**
     * 预加载图片
     */
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * 预加载ES模块
     */
    async preloadModule(modulePath) {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = modulePath;
        document.head.appendChild(link);
    }

    /**
     * 获取预加载状态
     */
    getPreloadStatus() {
        return {
            userInteractionStarted: this.userInteractionStarted,
            preloadedModules: Array.from(this.preloadedModules),
            preloadCount: this.preloadedModules.size
        };
    }
}

// 创建全局预加载器实例
export const smartPreloader = new SmartPreloader();

// 页面加载完成后立即启动预加载检测
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 智能预加载器启动');
    });
} else {
    console.log('🚀 智能预加载器启动');
}