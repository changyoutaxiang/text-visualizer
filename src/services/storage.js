export class StorageService {
    constructor() {
        this.storageKey = 'text_visualizer_data';
        this.historyKey = 'visualization_history';
    }

    saveLastResult(result, format) {
        const data = {
            result,
            format,
            timestamp: Date.now()
        };
        localStorage.setItem('last_result', JSON.stringify(data));
    }

    loadLastResult() {
        const saved = localStorage.getItem('last_result');
        return saved ? JSON.parse(saved) : null;
    }

    saveHistoryItem(text, prompt, model, format, result) {
        const history = this.loadHistory();
        const item = {
            id: Date.now(),
            text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            prompt,
            model,
            format,
            result,
            timestamp: Date.now(),
            title: this.generateTitle(text)
        };

        history.unshift(item);
        
        if (history.length > 100) {
            history.splice(100);
        }

        localStorage.setItem(this.historyKey, JSON.stringify(history));
        return item.id;
    }

    loadHistory() {
        const saved = localStorage.getItem(this.historyKey);
        return saved ? JSON.parse(saved) : [];
    }

    getHistoryItem(id) {
        const history = this.loadHistory();
        return history.find(item => item.id === parseInt(id));
    }

    deleteHistoryItem(id) {
        const history = this.loadHistory();
        const filtered = history.filter(item => item.id !== parseInt(id));
        localStorage.setItem(this.historyKey, JSON.stringify(filtered));
    }

    clearHistory() {
        localStorage.removeItem(this.historyKey);
    }

    generateTitle(text) {
        const title = text.trim().split('\n')[0];
        return title.length > 30 ? title.substring(0, 30) + '...' : title;
    }

    downloadFile(content, format, filename = null) {
        const blob = new Blob([content], {
            type: format === 'svg' ? 'image/svg+xml' : 'text/html'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `visualization_${Date.now()}.${format}`;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    saveSettings(settings) {
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    loadSettings() {
        const saved = localStorage.getItem('settings');
        const defaultSettings = {
            apiKey: '',
            defaultModel: 'anthropic/claude-3.5-sonnet',
            defaultFormat: 'svg',
            autoSave: true,
            theme: 'dark'
        };

        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveUserPrompts(prompts) {
        localStorage.setItem('user_prompts', JSON.stringify(prompts));
    }

    loadUserPrompts() {
        const saved = localStorage.getItem('user_prompts');
        return saved ? JSON.parse(saved) : {};
    }

    exportData() {
        const data = {
            history: this.loadHistory(),
            settings: this.loadSettings(),
            userPrompts: this.loadUserPrompts(),
            lastResult: this.loadLastResult(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });

        this.downloadFile(blob, 'json', `text_visualizer_backup_${Date.now()}.json`);
    }

    importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.history) {
                        localStorage.setItem(this.historyKey, JSON.stringify(data.history));
                    }
                    if (data.settings) {
                        this.saveSettings(data.settings);
                    }
                    if (data.userPrompts) {
                        this.saveUserPrompts(data.userPrompts);
                    }
                    if (data.lastResult) {
                        this.saveLastResult(data.lastResult.result, data.lastResult.format);
                    }
                    
                    resolve(data);
                } catch (error) {
                    reject(new Error('无效的数据格式'));
                }
            };
            reader.onerror = () => reject(new Error('文件读取失败'));
            reader.readAsText(file);
        });
    }

    getStorageUsage() {
        const historySize = new Blob([localStorage.getItem(this.historyKey) || '']).size;
        const settingsSize = new Blob([localStorage.getItem('settings') || '']).size;
        const promptsSize = new Blob([localStorage.getItem('user_prompts') || '']).size;
        
        return {
            history: historySize,
            settings: settingsSize,
            prompts: promptsSize,
            total: historySize + settingsSize + promptsSize
        };
    }

    clearAllData() {
        localStorage.removeItem('last_result');
        localStorage.removeItem(this.historyKey);
        localStorage.removeItem('settings');
        localStorage.removeItem('user_prompts');
        localStorage.removeItem('custom_prompts');
    }
}