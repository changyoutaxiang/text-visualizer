import { CodeEditor } from './CodeEditor.js';

export class PreviewPanel {
    constructor() {
        this.container = document.getElementById('previewContainer');
        this.currentResult = null;
        this.currentFormat = 'svg';
        this.isFullscreen = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 存储绑定的事件处理函数，便于清理
        this.boundFormatChanged = (e) => {
            this.currentFormat = e.detail.format;
            if (this.currentResult) {
                this.displayResult(this.currentResult, this.currentFormat);
            }
        };

        this.boundKeydown = (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                this.exitFullscreen();
            }
        };

        this.boundFullscreenChange = this.handleFullscreenChange.bind(this);

        document.addEventListener('formatChanged', this.boundFormatChanged);
        document.addEventListener('keydown', this.boundKeydown);
    }

    cleanup() {
        // 清理所有事件监听器，防止内存泄漏
        document.removeEventListener('formatChanged', this.boundFormatChanged);
        document.removeEventListener('keydown', this.boundKeydown);
        
        // 清理全屏事件监听器
        document.removeEventListener('fullscreenchange', this.boundFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.boundFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.boundFullscreenChange);
    }

    displayResult(result, format) {
        this.currentResult = result;
        this.currentFormat = format;
        
        this.container.innerHTML = '';
        this.container.classList.remove('placeholder');

        if (format === 'svg') {
            this.displaySVG(result);
        } else if (format === 'html') {
            this.displayHTML(result);
        }

        console.log(`🎯 显示${format.toUpperCase()}格式结果`);
    }

    displaySVG(svgCode) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgCode, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            
            if (!svg) {
                throw new Error('无效的SVG代码');
            }

            svg.style.width = '100%';
            svg.style.height = 'auto';
            svg.style.maxHeight = '600px';
            
            this.container.appendChild(svg);
            this.addSVGInteractions(svg);
            
        } catch (error) {
            this.showError('SVG渲染失败: ' + error.message);
        }
    }

    displayHTML(htmlCode) {
        try {
            // 1. 清理HTML内容，移除潜在恶意代码
            const cleanHTML = this.sanitizeHTML(htmlCode);
            
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = 'none';
            iframe.style.borderRadius = '8px';
            iframe.sandbox = 'allow-scripts allow-same-origin';

            this.container.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline' 'self'; img-src 'self' data: https:; font-src 'self' data:;">
                    <style>
                        body { 
                            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; 
                            margin: 20px;
                            line-height: 1.6;
                            color: #374151;
                        }
                        * { box-sizing: border-box; }
                        img { max-width: 100%; height: auto; }
                        table { border-collapse: collapse; width: 100%; }
                        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                        th { background-color: #f3f4f6; }
                    </style>
                </head>
                <body>
                    ${cleanHTML}
                </body>
                </html>
            `);
            iframeDoc.close();

            iframe.onload = () => {
                this.adjustIframeHeight(iframe);
            };

        } catch (error) {
            this.showError('HTML渲染失败: ' + error.message);
        }
    }

    addSVGInteractions(svg) {
        const elements = svg.querySelectorAll('*');
        elements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.cursor = 'pointer';
                this.highlightElement(element);
            });

            element.addEventListener('mouseleave', () => {
                this.unhighlightElement(element);
            });
        });
    }

    highlightElement(element) {
        const originalOpacity = element.style.opacity || '1';
        element.style.opacity = '0.7';
        element.dataset.originalOpacity = originalOpacity;
    }

    unhighlightElement(element) {
        const originalOpacity = element.dataset.originalOpacity || '1';
        element.style.opacity = originalOpacity;
    }

    adjustIframeHeight(iframe) {
        try {
            const height = iframe.contentDocument.body.scrollHeight;
            iframe.style.height = Math.max(height + 20, 400) + 'px';
        } catch (error) {
            console.warn('无法调整iframe高度:', error);
        }
    }

    toggleFullscreen() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }

    enterFullscreen() {
        const container = this.container.closest('.preview-section') || this.container;
        
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }

        this.isFullscreen = true;
        container.classList.add('fullscreen');
        
        // 添加全屏事件监听
        document.addEventListener('fullscreenchange', this.boundFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.boundFullscreenChange);
        document.addEventListener('MSFullscreenChange', this.boundFullscreenChange);
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        this.isFullscreen = false;
    }

    handleFullscreenChange() {
        const container = this.container.closest('.preview-section') || this.container;
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            container.classList.remove('fullscreen');
            this.isFullscreen = false;
        }
    }

    sanitizeHTML(html) {
        // 创建临时div来清理HTML
        const div = document.createElement('div');
        div.innerHTML = html;
        
        // 移除所有script标签
        const scripts = div.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // 移除危险属性
        const dangerousAttributes = [
            'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
            'onmousedown', 'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress',
            'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange'
        ];
        
        const allElements = div.querySelectorAll('*');
        allElements.forEach(element => {
            dangerousAttributes.forEach(attr => {
                if (element.hasAttribute(attr)) {
                    element.removeAttribute(attr);
                }
            });
            
            // 清理javascript:协议的href
            if (element.hasAttribute('href')) {
                const href = element.getAttribute('href');
                if (href && href.toLowerCase().startsWith('javascript:')) {
                    element.removeAttribute('href');
                }
            }
            
            // 清理iframe的srcdoc属性
            if (element.tagName === 'IFRAME') {
                element.removeAttribute('srcdoc');
            }
        });
        
        return div.innerHTML;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }

    getCurrentCode() {
        return this.currentResult;
    }

    clear() {
        this.currentResult = null;
        this.container.innerHTML = `
            <div class="placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <p>生成结果将在这里显示</p>
            </div>
        `;
    }
}