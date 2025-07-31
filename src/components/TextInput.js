import { validateInput, checkContentSafety } from '../utils/security.js';

export class TextInput {
    constructor() {
        this.element = document.getElementById('textInput');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.element.addEventListener('input', () => {
            this.updateCharacterCount();
            this.clearError();
        });

        this.element.addEventListener('paste', (e) => {
            setTimeout(() => {
                this.updateCharacterCount();
                this.validateContent();
            }, 0);
        });

        this.element.addEventListener('blur', () => {
            this.validateContent();
        });
    }

    getValue() {
        return this.element.value;
    }

    getSanitizedValue() {
        const validation = validateInput(this.getValue(), {
            maxLength: 8000,
            minLength: 1,
            allowHTML: false,
            allowScripts: false
        });
        return validation.sanitized;
    }

    setValue(text) {
        const validation = validateInput(text, { maxLength: 8000 });
        if (validation.valid) {
            this.element.value = validation.sanitized;
            this.updateCharacterCount();
        } else {
            console.warn('设置文本失败:', validation.message);
        }
    }

    clear() {
        this.element.value = '';
        this.updateCharacterCount();
        this.clearError();
    }

    updateCharacterCount() {
        const count = this.getValue().length;
        let counter = document.querySelector('.char-count');
        
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-count';
            this.element.parentNode.insertBefore(counter, this.element.nextSibling);
        }
        
        counter.textContent = `${count.toLocaleString()} / 8000 字符`;
        counter.classList.toggle('warning', count > 6000);
        counter.classList.toggle('error', count > 8000);
    }

    validateContent() {
        const text = this.getValue().trim();
        
        if (!text) {
            this.showError('请输入要可视化的文本内容');
            return false;
        }

        const validation = validateInput(text, {
            maxLength: 8000,
            minLength: 1,
            allowHTML: false,
            allowScripts: false
        });

        if (!validation.valid) {
            this.showError(validation.message);
            return false;
        }

        const safetyCheck = checkContentSafety(text);
        if (!safetyCheck.safe) {
            const highRisk = safetyCheck.risks.filter(r => r.severity === 'high');
            if (highRisk.length > 0) {
                console.warn('检测到潜在风险内容:', safetyCheck.risks);
            }
        }

        this.element.classList.remove('error');
        this.clearError();
        return true;
    }

    showError(message) {
        this.element.classList.add('error');
        
        let errorEl = document.querySelector('.input-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'input-error';
            this.element.parentNode.insertBefore(errorEl, this.element.nextSibling);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }

    clearError() {
        this.element.classList.remove('error');
        const errorEl = document.querySelector('.input-error');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }

    validate() {
        return this.validateContent();
    }

    focus() {
        this.element.focus();
    }

    // 获取验证状态
    getValidationStatus() {
        const text = this.getValue().trim();
        return validateInput(text, {
            maxLength: 8000,
            minLength: 1
        });
    }
}