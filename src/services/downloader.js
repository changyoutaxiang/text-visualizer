export class DownloaderService {
    constructor() {
        this.allowedFormats = ['svg', 'html', 'png', 'jpeg'];
    }

    downloadSVG(svgContent, filename = null) {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        this.downloadBlob(blob, filename || `visualization_${Date.now()}.svg`);
    }

    downloadHTML(htmlContent, filename = null) {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        this.downloadBlob(blob, filename || `visualization_${Date.now()}.html`);
    }

    async downloadPNG(svgElement, filename = null) {
        try {
            const canvas = await this.svgToCanvas(svgElement);
            canvas.toBlob(blob => {
                this.downloadBlob(blob, filename || `visualization_${Date.now()}.png`);
            });
        } catch (error) {
            console.error('PNG下载失败:', error);
            throw new Error('无法转换为PNG格式');
        }
    }

    async downloadJPEG(svgElement, filename = null) {
        try {
            const canvas = await this.svgToCanvas(svgElement);
            canvas.toBlob(blob => {
                this.downloadBlob(blob, filename || `visualization_${Date.now()}.jpeg`);
            }, 'image/jpeg', 0.9);
        } catch (error) {
            console.error('JPEG下载失败:', error);
            throw new Error('无法转换为JPEG格式');
        }
    }

    async svgToCanvas(svgElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        
        return new Promise((resolve, reject) => {
            img.onload = () => {
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                ctx.drawImage(img, 0, 0);
                resolve(canvas);
            };
            
            img.onerror = reject;
            
            const blob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            img.src = url;
            
            URL.revokeObjectURL(url);
        });
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    generateFilename(format, prefix = 'visualization') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        return `${prefix}_${timestamp}.${format}`;
    }

    validateFormat(format) {
        return this.allowedFormats.includes(format.toLowerCase());
    }

    async downloadFromContent(content, format, filename = null) {
        format = format.toLowerCase();
        
        if (!this.validateFormat(format)) {
            throw new Error(`不支持的格式: ${format}`);
        }

        if (!filename) {
            filename = this.generateFilename(format);
        }

        switch (format) {
            case 'svg':
                this.downloadSVG(content, filename);
                break;
            case 'html':
                this.downloadHTML(content, filename);
                break;
            case 'png':
            case 'jpeg':
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'image/svg+xml');
                const svgElement = doc.querySelector('svg');
                
                if (svgElement) {
                    if (format === 'png') {
                        await this.downloadPNG(svgElement, filename);
                    } else {
                        await this.downloadJPEG(svgElement, filename);
                    }
                } else {
                    throw new Error('无法找到SVG元素');
                }
                break;
            default:
                throw new Error(`不支持的格式: ${format}`);
        }
    }
}