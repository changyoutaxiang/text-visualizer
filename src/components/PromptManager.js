import { PREDEFINED_PROMPTS } from '../utils/constants.js';

export class PromptManager {
    constructor() {
        this.customPrompts = this.loadCustomPrompts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        const promptSelect = document.getElementById('promptSelect');
        const addPromptBtn = document.getElementById('addPromptBtn');

        if (promptSelect) {
            promptSelect.addEventListener('change', (e) => {
                this.onPromptChange(e.target.value);
            });
        }

        if (addPromptBtn) {
            addPromptBtn.addEventListener('click', () => {
                this.showAddPromptDialog();
            });
        }
    }

    loadCustomPrompts() {
        const saved = localStorage.getItem('custom_prompts');
        return saved ? JSON.parse(saved) : {};
    }

    saveCustomPrompts() {
        localStorage.setItem('custom_prompts', JSON.stringify(this.customPrompts));
    }

    getPrompt(promptKey, text = '') {
        let prompt;
        
        if (this.customPrompts[promptKey]) {
            prompt = this.customPrompts[promptKey];
        } else if (PREDEFINED_PROMPTS[promptKey]) {
            prompt = PREDEFINED_PROMPTS[promptKey];
        } else {
            prompt = PREDEFINED_PROMPTS['data-analysis'];
        }

        return this.processTemplate(prompt.template, { text });
    }

    processTemplate(template, variables) {
        let processed = template;
        
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            processed = processed.replace(regex, variables[key]);
        });

        return processed;
    }

    addCustomPrompt(key, name, description, template, category = 'custom') {
        const prompt = {
            name,
            description,
            template,
            category,
            createdAt: Date.now()
        };

        this.customPrompts[key] = prompt;
        this.saveCustomPrompts();

        console.log(`添加自定义提示词: ${name}`);
        return key;
    }

    updateCustomPrompt(key, name, description, template) {
        if (this.customPrompts[key]) {
            const prompt = this.customPrompts[key];
            prompt.name = name;
            prompt.description = description;
            prompt.template = template;
            prompt.updatedAt = Date.now();
            
            this.saveCustomPrompts();
            console.log(`更新自定义提示词: ${name}`);
            return true;
        }
        return false;
    }

    removeCustomPrompt(key) {
        const removed = delete this.customPrompts[key];
        if (removed) {
            this.saveCustomPrompts();
            console.log(`删除自定义提示词: ${key}`);
        }
        return removed;
    }

    getAllPrompts() {
        return {
            predefined: PREDEFINED_PROMPTS,
            custom: Object.fromEntries(this.customPrompts)
        };
    }

    getPromptsByCategory(category) {
        if (category === 'predefined') {
            return PREDEFINED_PROMPTS;
        } else if (category === 'custom') {
            return Object.fromEntries(this.customPrompts);
        }
        
        const filtered = {};
        
        if (category === 'all') {
            return { ...PREDEFINED_PROMPTS, ...Object.fromEntries(this.customPrompts) };
        }

        Object.entries(PREDEFINED_PROMPTS).forEach(([key, prompt]) => {
            if (prompt.category === category) {
                filtered[key] = prompt;
            }
        });

        Object.entries(this.customPrompts).forEach(([key, prompt]) => {
            if (prompt.category === category) {
                filtered[key] = prompt;
            }
        });

        return filtered;
    }

    renderPrompts() {
        const select = document.getElementById('promptSelect');
        if (!select) return;
        
        select.innerHTML = '';

        Object.entries(PREDEFINED_PROMPTS).forEach(([key, prompt]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = prompt.name;
            select.appendChild(option);
        });

        Object.entries(this.customPrompts).forEach(([key, prompt]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `自定义: ${prompt.name}`;
            option.className = 'custom-prompt';
            select.appendChild(option);
        });
    }

    onPromptChange(promptKey) {
        const prompt = this.customPrompts[promptKey] || PREDEFINED_PROMPTS[promptKey];
        if (prompt) {
            this.showPromptDescription(prompt);
        }
    }

    showPromptDescription(prompt) {
        let desc = document.querySelector('.prompt-description');
        
        if (!desc) {
            desc = document.createElement('div');
            desc.className = 'prompt-description';
            const promptSelect = document.getElementById('promptSelect');
            if (promptSelect && promptSelect.parentNode) {
                promptSelect.parentNode.appendChild(desc);
            }
        }

        if (desc) {
            desc.textContent = prompt.description;
        }
    }

    showAddPromptDialog() {
        const dialog = this.createPromptDialog();
        if (dialog) {
            document.body.appendChild(dialog);
        }
    }

    createPromptDialog() {
        if (typeof document === 'undefined') return null;
        
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3>添加自定义提示词</h3>
                <div class="form-group">
                    <label>名称：</label>
                    <input type="text" id="promptName" placeholder="提示词名称">
                </div>
                <div class="form-group">
                    <label>描述：</label>
                    <input type="text" id="promptDesc" placeholder="简短描述">
                </div>
                <div class="form-group">
                    <label>模板：</label>
                    <textarea id="promptTemplate" rows="8" placeholder="使用 {text} 作为文本占位符"></textarea>
                </div>
                <div class="modal-actions">
                    <button id="savePromptBtn" class="primary-btn">保存</button>
                    <button id="cancelPromptBtn" class="secondary-btn">取消</button>
                </div>
            </div>
        `;

        const saveBtn = dialog.querySelector('#savePromptBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCustomPromptFromDialog(dialog);
            });
        }

        const cancelBtn = dialog.querySelector('#cancelPromptBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (dialog.parentNode) {
                    document.body.removeChild(dialog);
                }
            });
        }

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog && dialog.parentNode) {
                document.body.removeChild(dialog);
            }
        });

        return dialog;
    }

    saveCustomPromptFromDialog(dialog) {
        const nameInput = dialog.querySelector('#promptName');
        const descInput = dialog.querySelector('#promptDesc');
        const templateInput = dialog.querySelector('#promptTemplate');

        if (!nameInput || !descInput || !templateInput) return;

        const name = nameInput.value.trim();
        const description = descInput.value.trim();
        const template = templateInput.value.trim();

        if (!name || !template) {
            alert('请填写名称和模板');
            return;
        }

        const key = `custom_${Date.now()}`;
        this.addCustomPrompt(key, name, description, template);

        if (dialog.parentNode) {
            document.body.removeChild(dialog);
        }
    }

    validatePrompt(template) {
        const required = ['{text}'];
        const missing = [];

        required.forEach(variable => {
            if (!template.includes(variable)) {
                missing.push(variable);
            }
        });

        return {
            valid: missing.length === 0,
            missing,
            message: missing.length > 0 ? `缺少必需变量: ${missing.join(', ')}` : '模板有效'
        };
    }
}