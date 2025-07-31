import { MarkdownPromptLoader } from '../services/MarkdownPromptLoader.js';

export class MarkdownPromptSelector {
    constructor() {
        this.loader = new MarkdownPromptLoader();
        this.currentTemplate = null;
        this.templates = [];
        this.categories = [];
        this.init();
    }

    async init() {
        await this.loadTemplates();
        this.render();
        this.setupEventListeners();
    }

    async loadTemplates() {
        try {
            this.templates = await this.loader.getAvailableTemplates();
            this.categories = await this.loader.getCategories();
            console.log('✅ 已加载提示词模板:', this.templates.length);
        } catch (error) {
            console.error('加载模板失败:', error);
            this.templates = [];
        }
    }

    render() {
        const container = document.getElementById('promptSelectContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="prompt-selector">
                <label for="markdownPromptSelect">选择提示词模板</label>
                <div class="prompt-selector-wrapper">
                    <select id="markdownPromptSelect" class="prompt-select">
                        ${this.renderTemplateOptions()}
                    </select>
                    <button type="button" class="preview-btn" id="previewPromptBtn" title="预览模板">👁️</button>
                    <button type="button" class="refresh-btn" id="refreshTemplatesBtn" title="刷新模板">🔄</button>
                </div>
                <div class="prompt-info" id="promptInfo"></div>
            </div>
        `;

        this.renderCategoryFilter();
    }

    renderTemplateOptions() {
        if (this.templates.length === 0) {
            return '<option value="">暂无可用模板</option>';
        }

        const grouped = this.groupTemplatesByCategory();
        let options = '<option value="">请选择模板...</option>';

        Object.entries(grouped).forEach(([category, templates]) => {
            options += `<optgroup label="${category}">`;
            templates.forEach(template => {
                options += `<option value="${template.filename}" data-category="${category}">${template.name}</option>`;
            });
            options += '</optgroup>';
        });

        return options;
    }

    renderCategoryFilter() {
        const container = document.getElementById('promptSelectContainer');
        const filter = document.createElement('div');
        filter.className = 'category-filter';
        filter.innerHTML = `
            <label>分类筛选</label>
            <select id="categoryFilter" class="category-select">
                <option value="">全部分类</option>
                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        `;
        
        container.insertBefore(filter, container.firstChild);
    }

    groupTemplatesByCategory() {
        const grouped = {};
        this.templates.forEach(template => {
            const category = template.category || '未分类';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(template);
        });
        return grouped;
    }

    setupEventListeners() {
        const select = document.getElementById('markdownPromptSelect');
        const previewBtn = document.getElementById('previewPromptBtn');
        const refreshBtn = document.getElementById('refreshTemplatesBtn');
        const categoryFilter = document.getElementById('categoryFilter');

        if (select) {
            select.addEventListener('change', (e) => {
                this.handleTemplateChange(e.target.value);
            });
        }

        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showTemplatePreview();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await this.refreshTemplates();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filterTemplatesByCategory(e.target.value);
            });
        }
    }

    async handleTemplateChange(filename) {
        if (!filename) {
            this.currentTemplate = null;
            this.clearPromptInfo();
            return;
        }

        try {
            this.currentTemplate = await this.loader.loadTemplate(filename);
            this.showPromptInfo(this.currentTemplate);
            
            // 触发自定义事件
            const event = new CustomEvent('templateSelected', {
                detail: { template: this.currentTemplate, filename }
            });
            document.dispatchEvent(event);

        } catch (error) {
            console.error('选择模板失败:', error);
            alert('加载模板失败，请重试');
        }
    }

    showPromptInfo(template) {
        const info = document.getElementById('promptInfo');
        if (!info) return;

        info.innerHTML = `
            <div class="prompt-details">
                <h4>${template.name}</h4>
                <p class="description">${template.description}</p>
                ${template.variables.length > 0 ? `
                    <div class="variables">
                        <strong>可用变量：</strong>
                        ${template.variables.map(v => `<code>{${v}}</code>`).join(', ')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    clearPromptInfo() {
        const info = document.getElementById('promptInfo');
        if (info) {
            info.innerHTML = '';
        }
    }

    async showTemplatePreview() {
        if (!this.currentTemplate) {
            alert('请先选择一个模板');
            return;
        }

        const modal = this.createPreviewModal();
        document.body.appendChild(modal);
    }

    createPreviewModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.currentTemplate.name}</h3>
                    <button type="button" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="template-preview">
                        <h4>模板内容：</h4>
                        <pre class="template-content">${this.currentTemplate.template}</pre>
                    </div>
                    <div class="template-meta">
                        <h4>模板信息：</h4>
                        <p><strong>描述：</strong> ${this.currentTemplate.description}</p>
                        <p><strong>变量：</strong> ${this.currentTemplate.variables.join(', ')}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="use-template-btn">使用此模板</button>
                    <button type="button" class="close-modal-btn">关闭</button>
                </div>
            </div>
        `;

        // 关闭按钮事件
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.close-modal-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('.use-template-btn').addEventListener('click', () => {
            modal.remove();
            // 触发使用模板事件
            const event = new CustomEvent('useTemplate', {
                detail: { template: this.currentTemplate }
            });
            document.dispatchEvent(event);
        });

        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    filterTemplatesByCategory(category) {
        const select = document.getElementById('markdownPromptSelect');
        if (!select) return;

        const options = select.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') return; // 跳过默认选项
            
            const optionCategory = option.dataset.category;
            if (!category || optionCategory === category) {
                option.style.display = '';
            } else {
                option.style.display = 'none';
            }
        });

        // 重置选择
        select.value = '';
        this.currentTemplate = null;
        this.clearPromptInfo();
    }

    async refreshTemplates() {
        this.loader.clearCache();
        await this.loadTemplates();
        this.render();
        this.setupEventListeners();
        
        console.log('🔄 模板已刷新');
    }

    getSelectedTemplate() {
        const select = document.getElementById('markdownPromptSelect');
        if (!select || !select.value) return null;

        return {
            filename: select.value,
            template: this.currentTemplate
        };
    }

    getProcessedPrompt(text) {
        if (!this.currentTemplate) return null;

        let prompt = this.currentTemplate.template;
        
        // 替换变量
        const variables = this.currentTemplate.variables || [];
        variables.forEach(variable => {
            if (variable === 'text') {
                prompt = prompt.replace(/\{text\}/g, text);
            } else {
                // 处理其他变量，可以扩展为动态替换
                prompt = prompt.replace(new RegExp(`\\{${variable}\\}`, 'g'), '');
            }
        });

        return prompt;
    }
}