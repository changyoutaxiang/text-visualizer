export class FormatSelector {
    constructor() {
        this.elements = document.querySelectorAll('input[name="format"]');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.elements.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.onFormatChange(e.target.value);
            });
        });
    }

    getValue() {
        const selected = document.querySelector('input[name="format"]:checked');
        return selected ? selected.value : 'svg';
    }

    setValue(format) {
        const radio = document.querySelector(`input[name="format"][value="${format}"]`);
        if (radio) {
            radio.checked = true;
            this.onFormatChange(format);
        }
    }

    onFormatChange(format) {
        console.log(`格式已切换: ${format}`);
        
        localStorage.setItem('selected_format', format);
        
        this.updateFormatHint(format);
        
        document.dispatchEvent(new CustomEvent('formatChanged', { detail: { format } }));
    }

    updateFormatHint(format) {
        let hint = document.querySelector('.format-hint');
        
        if (!hint) {
            const container = document.querySelector('.radio-group').parentNode;
            hint = document.createElement('div');
            hint.className = 'format-hint';
            container.appendChild(hint);
        }

        const hints = {
            'svg': 'SVG格式：矢量图形，可无损缩放，适合图标和图表',
            'html': 'HTML格式：包含完整样式，可交互，适合复杂可视化'
        };

        hint.textContent = hints[format] || '';
    }

    loadSavedFormat() {
        const saved = localStorage.getItem('selected_format');
        if (saved) {
            this.setValue(saved);
        }
    }
}