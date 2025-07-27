export class ModelSelector {
    constructor() {
        this.element = document.getElementById('modelSelect');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.element.addEventListener('change', (e) => {
            this.onModelChange(e.target.value);
        });
    }

    getValue() {
        return this.element.value;
    }

    setValue(modelId) {
        this.element.value = modelId;
        this.onModelChange(modelId);
    }

    onModelChange(modelId) {
        console.log(`模型已切换: ${modelId}`);
        
        localStorage.setItem('selected_model', modelId);
        
        this.updateModelDescription(modelId);
    }

    updateModelDescription(modelId) {
        let description = document.querySelector('.model-description');
        
        if (!description) {
            description = document.createElement('div');
            description.className = 'model-description';
            this.element.parentNode.appendChild(description);
        }

        const modelMap = {
            'moonshotai/kimi-k2': '月之暗面最新模型，中文优化',
            'x-ai/grok-4': 'xAI最新模型，X平台集成',
            'anthropic/claude-sonnet-4': 'Anthropic最新Sonnet模型',
            'google/gemini-2.5-pro': 'Google最新Gemini Pro模型',
            'deepseek/deepseek-r1-0528': '深度求索推理模型',
            'deepseek/deepseek-chat-v3-0324': '深度求索对话模型'
        };

        description.textContent = modelMap[modelId] || '';
    }

    loadSavedModel() {
        const saved = localStorage.getItem('selected_model');
        if (saved) {
            this.setValue(saved);
        }
    }
}