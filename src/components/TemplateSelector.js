/**
 * 模板选择器组件
 * 集成MarkdownPromptLoader，提供动态模板选择功能
 */

import { MarkdownPromptLoader } from '../services/MarkdownPromptLoader.js';

export class TemplateSelector {
    constructor() {
        this.loader = new MarkdownPromptLoader();
        this.templates = [];
        this.currentTemplate = null;
        this.selectElement = null;
    }

    /**
     * 初始化模板选择器
     */
    async init() {
        this.selectElement = document.getElementById('promptSelect');
        if (!this.selectElement) {
            console.error('找不到模板选择器元素');
            return;
        }

        await this.loadTemplates();
        this.render();
        this.setupEventListeners();
    }

    /**
     * 加载模板数据
     */
    async loadTemplates() {
        try {
            console.log('🔄 开始加载模板...');
            this.templates = await this.loader.getAvailableTemplates();
            console.log('✅ 已加载模板:', this.templates.length, '个');
            
            if (this.templates.length === 0) {
                console.warn('⚠️ 没有加载到任何模板文件');
            } else {
                console.log('📋 模板列表:', this.templates.map(t => `${t.name} (${t.filename})`));
            }
        } catch (error) {
            console.error('❌ 加载模板失败:', error);
            console.error('错误详情:', error.stack);
            this.templates = [];
        }
    }

    /**
     * 渲染模板选择器
     */
    render() {
        if (!this.selectElement) return;

        // 清空现有选项
        this.selectElement.innerHTML = '';

        if (this.templates.length === 0) {
            // 显示错误状态
            const errorOption = document.createElement('option');
            errorOption.value = '';
            errorOption.textContent = '模板加载失败，请刷新页面';
            errorOption.disabled = true;
            this.selectElement.appendChild(errorOption);
            this.selectElement.disabled = true;
            return;
        }

        // 启用选择器
        this.selectElement.disabled = false;

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `请选择模板... (共${this.templates.length}个)`;
        this.selectElement.appendChild(defaultOption);

        // 按分类分组模板
        const grouped = this.groupTemplatesByCategory();

        Object.entries(grouped).forEach(([category, templates]) => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;

            templates.forEach(template => {
                const option = document.createElement('option');
                option.value = template.filename;
                option.textContent = template.name;
                option.dataset.category = category;
                option.dataset.description = template.description;
                optgroup.appendChild(option);
            });

            this.selectElement.appendChild(optgroup);
        });
    }

    /**
     * 按分类分组模板
     */
    groupTemplatesByCategory() {
        const grouped = {};
        
        this.templates.forEach(template => {
            const category = template.category || '其他';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(template);
        });

        return grouped;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (!this.selectElement) return;

        this.selectElement.addEventListener('change', async (e) => {
            const filename = e.target.value;
            await this.handleTemplateChange(filename);
        });
    }

    /**
     * 处理模板选择变化
     */
    async handleTemplateChange(filename) {
        if (!filename) {
            this.currentTemplate = null;
            this.clearTemplateInfo();
            return;
        }

        try {
            this.currentTemplate = await this.loader.loadTemplate(filename);
            this.showTemplateInfo(this.currentTemplate);
            
            // 触发自定义事件，通知其他组件
            const event = new CustomEvent('templateSelected', {
                detail: { 
                    template: this.currentTemplate, 
                    filename: filename 
                }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('选择模板失败:', error);
            alert('加载模板失败，请重试');
        }
    }

    /**
     * 显示模板信息
     */
    showTemplateInfo(template) {
        // 查找或创建模板信息显示区域
        let infoElement = document.getElementById('templateInfo');
        if (!infoElement) {
            infoElement = document.createElement('div');
            infoElement.id = 'templateInfo';
            infoElement.className = 'template-info';
            
            // 插入到选择器后面
            const container = this.selectElement.parentElement;
            container.appendChild(infoElement);
        }

        infoElement.innerHTML = `
            <div class="template-details">
                <h4>${template.name}</h4>
                <p class="description">${template.description}</p>
                <div class="variables">
                    <strong>变量：</strong>
                    ${template.variables.map(v => `<code>{${v}}</code>`).join(' ')}
                </div>
            </div>
        `;
    }

    /**
     * 清除模板信息显示
     */
    clearTemplateInfo() {
        const infoElement = document.getElementById('templateInfo');
        if (infoElement) {
            infoElement.innerHTML = '';
        }
    }

    /**
     * 获取当前选中的模板
     */
    getCurrentTemplate() {
        return this.currentTemplate;
    }

    /**
     * 获取模板的提示词内容
     * @param {string} text - 用户输入的文本
     * @returns {string} 处理后的提示词
     */
    getPromptText(text) {
        if (!this.currentTemplate) {
            return null;
        }

        // 替换模板中的变量
        let prompt = this.currentTemplate.template;
        prompt = prompt.replace(/\{text\}/g, text);
        
        return prompt;
    }

    /**
     * 刷新模板列表
     */
    async refresh() {
        this.loader.clearCache();
        await this.loadTemplates();
        this.render();
        console.log('🔄 模板列表已刷新');
    }
}