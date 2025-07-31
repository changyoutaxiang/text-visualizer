import './styles/main.css';
// 启动智能预加载器
import { smartPreloader } from './utils/preloader.js';
// 身份验证守卫
import { AuthGuard } from './components/AuthGuard.js';

// 核心组件 - 立即加载
import { TextInput } from './components/TextInput.js';
import { ModelSelector } from './components/ModelSelector.js';
import { FormatSelector } from './components/FormatSelector.js';
import { PreviewPanel } from './components/PreviewPanel.js';
import { OpenRouterAPI } from './api/openrouter.js';
import { StorageService } from './services/storage.js';

// 可选组件 - 懒加载
let TemplateSelector, CodeEditor;

class TextVisualizerApp {
    constructor() {
        this.api = new OpenRouterAPI();
        this.storage = new StorageService();
        
        // 立即初始化核心组件
        this.textInput = new TextInput();
        this.modelSelector = new ModelSelector();
        this.formatSelector = new FormatSelector();
        this.previewPanel = new PreviewPanel();
        
        // 懒初始化的组件
        this.templateSelector = null;
        this.codeEditor = null;
        
        // 初始化身份验证，传递回调函数
        this.authGuard = new AuthGuard(() => {
            this.continueInit();
        });
        
        this.init();
    }

    async init() {
        console.log('文本视觉化工具已启动');
        
        // 如果已经认证，立即继续初始化
        if (this.authGuard.isUserAuthenticated()) {
            await this.continueInit();
        } else {
            console.log('⏳ 等待用户身份验证...');
        }
    }

    async continueInit() {
        console.log('🚀 继续应用初始化...');
        
        this.setupEventListeners();
        await this.loadInitialData();
        this.showLogoutButton();
        
        console.log('✅ 应用初始化完成');
    }

    showLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && import.meta.env.VITE_APP_PASSWORD) {
            logoutBtn.style.display = 'block';
        }
    }

    setupEventListeners() {
        const generateBtn = document.getElementById('generateBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const editBtn = document.getElementById('editBtn');

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.generateVisualization();
            });
        }
        
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.previewPanel.toggleFullscreen();
            });
        }
        
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadResult();
            });
        }
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.toggleCodeEditor();
            });
        }

        const closeEditorBtn = document.getElementById('closeEditorBtn');
        if (closeEditorBtn) {
            closeEditorBtn.addEventListener('click', () => {
                this.toggleCodeEditor();
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    async loadInitialData() {
        try {
            // 懒加载模板选择器
            await this.ensureTemplateSelector();
            await this.templateSelector.init();
            console.log('模板数据加载完成');
        } catch (error) {
            console.error('加载模板失败:', error);
        }
    }

    /**
     * 确保模板选择器已加载
     */
    async ensureTemplateSelector() {
        if (this.templateSelector) return;
        
        if (!TemplateSelector) {
            console.log('🔄 正在加载模板选择器...');
            const module = await import('./components/TemplateSelector.js');
            TemplateSelector = module.TemplateSelector;
        }
        
        this.templateSelector = new TemplateSelector();
        console.log('✅ 模板选择器加载完成');
    }

    /**
     * 确保代码编辑器已加载
     */
    async ensureCodeEditor() {
        if (this.codeEditor) return;
        
        if (!CodeEditor) {
            console.log('🔄 正在加载代码编辑器组件...');
            const module = await import('./components/CodeEditor.js');
            CodeEditor = module.CodeEditor;
        }
        
        this.codeEditor = new CodeEditor();
        console.log('✅ 代码编辑器组件加载完成');
    }

    async generateVisualization() {
        const text = this.textInput.getValue();
        if (!text.trim()) {
            alert('请输入要可视化的文本内容');
            return;
        }

        // 检查输入长度限制
        const charCount = text.length;
        const MAX_CHARS = 8000; // 大约6000-7000 tokens
        
        if (charCount > MAX_CHARS) {
            const truncateChoice = confirm(
                `输入文本过长 (${charCount.toLocaleString()} 字符)\n` +
                `建议控制在 ${MAX_CHARS.toLocaleString()} 字符以内以获得最佳效果。\n\n` +
                `点击"确定"自动截取前 ${MAX_CHARS.toLocaleString()} 字符，点击"取消"返回编辑。`
            );
            
            if (!truncateChoice) {
                return; // 用户选择取消
            }
            
            // 截取文本并更新输入框
            const truncatedText = text.substring(0, MAX_CHARS);
            this.textInput.setValue(truncatedText);
            
            // 显示截取提示
            alert(`文本已自动截取至 ${MAX_CHARS.toLocaleString()} 字符`);
        }

        const model = this.modelSelector.getValue();
        const format = this.formatSelector.getValue();
        
        // 确保模板选择器已加载
        await this.ensureTemplateSelector();
        const currentTemplate = this.templateSelector.getCurrentTemplate();

        if (!currentTemplate) {
            alert('请选择一个模板');
            return;
        }

        this.showLoading(true, 0, '正在准备提示词...');

        try {
            const prompt = this.templateSelector.getPromptText(text);
            
            // 模拟进度条动画
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress < 90) {
                    this.showLoading(true, progress, '正在调用AI模型...');
                } else {
                    clearInterval(progressInterval);
                }
            }, 200);

            const result = await this.api.generateVisualization(prompt, model, format);
            
            clearInterval(progressInterval);
            this.showLoading(true, 100, '正在渲染结果...');
            
            setTimeout(() => {
                this.previewPanel.displayResult(result, format);
                this.storage.saveLastResult(result, format);
                console.log('可视化生成成功');
                this.showLoading(false);
            }, 300);
            
        } catch (error) {
            console.error('生成失败:', error);
            this.showLoading(false);
            
            // 更友好的错误提示
            let errorMessage = error.message;
            if (error.message.includes('网络')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message.includes('API')) {
                errorMessage = 'AI服务暂时不可用，请稍后重试';
            }
            
            alert('生成失败: ' + errorMessage);
        }
    }

    async toggleCodeEditor() {
        const codeEditor = document.getElementById('codeEditor');
        if (!codeEditor) return;
        
        const isVisible = codeEditor.style.display !== 'none';
        
        if (isVisible) {
            codeEditor.style.display = 'none';
        } else {
            // 懒加载代码编辑器
            await this.ensureCodeEditor();
            
            const currentCode = this.previewPanel.getCurrentCode();
            if (currentCode) {
                await this.codeEditor.open(currentCode);
                codeEditor.style.display = 'block';
            }
        }
    }

    downloadResult() {
        const currentResult = this.previewPanel.getCurrentCode();
        const format = this.formatSelector.getValue();
        
        if (!currentResult) {
            alert('没有可下载的内容');
            return;
        }

        this.storage.downloadFile(currentResult, format);
    }

    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            // 隐藏退出按钮
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.style.display = 'none';
            }
            
            // 调用认证守卫的退出方法
            this.authGuard.logout();
        }
    }

    showLoading(show, progress = 0, text = null) {
        const loading = document.getElementById('loading');
        const loadingText = document.getElementById('loadingText');
        const progressFill = document.getElementById('progressFill');
        
        if (!loading) return;
        
        if (show) {
            loading.style.display = 'flex';
            if (loadingText && text) {
                loadingText.textContent = text;
            }
            if (progressFill) {
                progressFill.style.width = `${Math.min(progress, 100)}%`;
            }
        } else {
            loading.style.display = 'none';
            if (progressFill) {
                progressFill.style.width = '0%';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TextVisualizerApp();
});