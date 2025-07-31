import { PREDEFINED_PROMPTS } from '../utils/constants.js';

export class PromptService {
    constructor() {
        this.customPrompts = new Map();
        this.loadPrompts();
    }

    async loadPrompts() {
        const saved = localStorage.getItem('custom_prompts');
        if (saved) {
            try {
                const prompts = JSON.parse(saved);
                Object.entries(prompts).forEach(([key, prompt]) => {
                    this.customPrompts.set(key, prompt);
                });
            } catch (error) {
                console.error('加载自定义提示词失败:', error);
            }
        }
    }

    savePrompts() {
        const prompts = Object.fromEntries(this.customPrompts);
        localStorage.setItem('custom_prompts', JSON.stringify(prompts));
    }

    getPrompt(promptKey, text = '') {
        let prompt;

        if (this.customPrompts.has(promptKey)) {
            prompt = this.customPrompts.get(promptKey);
        } else {
            prompt = PREDEFINED_PROMPTS[promptKey];
        }

        if (!prompt) {
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

        this.customPrompts.set(key, prompt);
        this.savePrompts();

        console.log(`✅ 添加自定义提示词: ${name}`);
        return key;
    }

    updateCustomPrompt(key, name, description, template) {
        if (this.customPrompts.has(key)) {
            const prompt = this.customPrompts.get(key);
            prompt.name = name;
            prompt.description = description;
            prompt.template = template;
            prompt.updatedAt = Date.now();
            
            this.savePrompts();
            console.log(`✅ 更新自定义提示词: ${name}`);
            return true;
        }
        return false;
    }

    removeCustomPrompt(key) {
        const removed = this.customPrompts.delete(key);
        if (removed) {
            this.savePrompts();
            console.log(`🗑️ 删除自定义提示词: ${key}`);
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

        this.customPrompts.forEach((prompt, key) => {
            if (prompt.category === category) {
                filtered[key] = prompt;
            }
        });

        return filtered;
    }

    searchPrompts(query) {
        const results = {};
        const lowerQuery = query.toLowerCase();

        Object.entries(PREDEFINED_PROMPTS).forEach(([key, prompt]) => {
            if (
                prompt.name.toLowerCase().includes(lowerQuery) ||
                prompt.description.toLowerCase().includes(lowerQuery) ||
                prompt.template.toLowerCase().includes(lowerQuery)
            ) {
                results[key] = prompt;
            }
        });

        this.customPrompts.forEach((prompt, key) => {
            if (
                prompt.name.toLowerCase().includes(lowerQuery) ||
                prompt.description.toLowerCase().includes(lowerQuery) ||
                prompt.template.toLowerCase().includes(lowerQuery)
            ) {
                results[key] = prompt;
            }
        });

        return results;
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

    getPromptUsage(key) {
        const usageKey = `prompt_usage_${key}`;
        const saved = localStorage.getItem(usageKey);
        return saved ? JSON.parse(saved) : { count: 0, lastUsed: null };
    }

    incrementPromptUsage(key) {
        const usage = this.getPromptUsage(key);
        usage.count += 1;
        usage.lastUsed = Date.now();
        
        localStorage.setItem(`prompt_usage_${key}`, JSON.stringify(usage));
    }

    getPopularPrompts(limit = 5) {
        const allPrompts = this.getAllPrompts();
        const popular = [];

        Object.entries(allPrompts.predefined).forEach(([key, prompt]) => {
            const usage = this.getPromptUsage(key);
            popular.push({ key, ...prompt, usage, type: 'predefined' });
        });

        Object.entries(allPrompts.custom).forEach(([key, prompt]) => {
            const usage = this.getPromptUsage(key);
            popular.push({ key, ...prompt, usage, type: 'custom' });
        });

        return popular
            .sort((a, b) => b.usage.count - a.usage.count)
            .slice(0, limit);
    }

    exportPrompts() {
        return {
            predefined: PREDEFINED_PROMPTS,
            custom: Object.fromEntries(this.customPrompts),
            exportDate: new Date().toISOString()
        };
    }

    importPrompts(data) {
        if (data.custom) {
            Object.entries(data.custom).forEach(([key, prompt]) => {
                this.customPrompts.set(key, prompt);
            });
            this.savePrompts();
            console.log('✅ 导入提示词成功');
            return true;
        }
        return false;
    }

    resetToDefaults() {
        this.customPrompts.clear();
        this.savePrompts();
        console.log('🔄 重置为默认提示词');
    }

    getPromptStats() {
        const stats = {
            total: Object.keys(PREDEFINED_PROMPTS).length + this.customPrompts.size,
            predefined: Object.keys(PREDEFINED_PROMPTS).length,
            custom: this.customPrompts.size,
            popular: this.getPopularPrompts(5)
        };

        return stats;
    }
}