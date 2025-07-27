import './styles/main.css';
// 启动智能预加载器
import { smartPreloader } from './utils/preloader.js';

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
        
        this.init();
    }

    async init() {
        console.log('文本视觉化工具已启动');
        
        this.setupEventListeners();
        await this.loadInitialData();
        
        console.log('应用初始化完成');
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