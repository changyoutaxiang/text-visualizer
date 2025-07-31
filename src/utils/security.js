/**
 * 安全工具模块
 * 提供输入验证、HTML清理、内容安全等功能
 */

/**
 * 清理HTML内容，移除潜在恶意代码
 * @param {string} html - 需要清理的HTML字符串
 * @returns {string} 清理后的HTML字符串
 */
export function sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // 创建临时div来清理HTML
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // 移除所有script标签和iframe标签
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
    dangerousTags.forEach(tagName => {
        const elements = div.querySelectorAll(tagName);
        elements.forEach(element => element.remove());
    });
    
    // 移除危险属性
    const dangerousAttributes = [
        'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
        'onmousedown', 'onmouseup', 'onkeydown', 'onkeyup', 'onkeypress',
        'onfocus', 'onblur', 'onsubmit', 'onreset', 'onchange', 'oninput',
        'ondblclick', 'oncontextmenu', 'ondrag', 'ondrop', 'onscroll'
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
        
        // 清理javascript:协议的src
        if (element.hasAttribute('src')) {
            const src = element.getAttribute('src');
            if (src && src.toLowerCase().startsWith('javascript:')) {
                element.removeAttribute('src');
            }
        }
        
        // 清理style中的expression()
        if (element.hasAttribute('style')) {
            const style = element.getAttribute('style');
            if (style && style.toLowerCase().includes('expression(')) {
                element.removeAttribute('style');
            }
        }
    });
    
    return div.innerHTML;
}

/**
 * 验证用户输入文本
 * @param {string} text - 用户输入文本
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果 {valid: boolean, message: string, sanitized: string}
 */
export function validateInput(text, options = {}) {
    const {
        maxLength = 10000,
        minLength = 1,
        allowHTML = false,
        allowScripts = false
    } = options;

    if (!text || typeof text !== 'string') {
        return {
            valid: false,
            message: '输入不能为空',
            sanitized: ''
        };
    }

    const trimmedText = text.trim();

    // 长度验证
    if (trimmedText.length < minLength) {
        return {
            valid: false,
            message: `输入文本过短，至少需要${minLength}个字符`,
            sanitized: trimmedText
        };
    }

    if (trimmedText.length > maxLength) {
        return {
            valid: false,
            message: `输入文本过长，最多支持${maxLength}个字符`,
            sanitized: trimmedText.substring(0, maxLength)
        };
    }

    // 基础清理
    let sanitized = trimmedText;

    // 如果不允许HTML，移除所有HTML标签
    if (!allowHTML) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // 如果不允许脚本，移除脚本相关内容
    if (!allowScripts) {
        // 移除script标签和事件处理器
        const scriptPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /document\.write/gi,
            /document\.cookie/gi
        ];

        scriptPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
    }

    return {
        valid: true,
        message: '输入验证通过',
        sanitized: sanitized
    };
}

/**
 * 转义HTML特殊字符，防止XSS
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的文本
 */
export function escapeHTML(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };

    return text.replace(/[&<>"'\/]/g, char => escapeMap[char]);
}

/**
 * 检查内容是否包含潜在危险代码
 * @param {string} content - 需要检查的内容
 * @returns {Object} 检查结果 {safe: boolean, risks: Array}
 */
export function checkContentSafety(content) {
    if (!content || typeof content !== 'string') {
        return { safe: true, risks: [] };
    }

    const risks = [];
    const dangerPatterns = [
        { pattern: /<script[^>]*>.*?<\/script>/gi, type: 'script_tag', severity: 'high' },
        { pattern: /javascript:/gi, type: 'javascript_protocol', severity: 'high' },
        { pattern: /on\w+\s*=/gi, type: 'event_handler', severity: 'medium' },
        { pattern: /eval\s*\(/gi, type: 'eval_function', severity: 'high' },
        { pattern: /document\.write/gi, type: 'document_write', severity: 'medium' },
        { pattern: /document\.cookie/gi, type: 'cookie_access', severity: 'low' },
        { pattern: /<iframe[^>]*srcdoc/i, type: 'iframe_srcdoc', severity: 'high' },
        { pattern: /<object[^>]*>/gi, type: 'object_tag', severity: 'medium' },
        { pattern: /<embed[^>]*>/gi, type: 'embed_tag', severity: 'medium' }
    ];

    dangerPatterns.forEach(({ pattern, type, severity }) => {
        if (pattern.test(content)) {
            risks.push({ type, severity, pattern: pattern.source });
        }
    });

    return {
        safe: risks.length === 0,
        risks: risks
    };
}

/**
 * 创建安全的iframe内容
 * @param {string} html - HTML内容
 * @returns {string} 安全的iframe文档
 */
export function createSecureIframeContent(html) {
    const cleanHTML = sanitizeHTML(html);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" 
                  content="default-src 'self'; 
                           script-src 'self' 'unsafe-inline'; 
                           style-src 'self' 'unsafe-inline'; 
                           img-src 'self' data: https:;">
            <style>
                body {
                    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
                    margin: 0;
                    padding: 20px;
                    line-height: 1.6;
                    color: #374151;
                    background: #ffffff;
                }
                * { box-sizing: border-box; }
                img { max-width: 100%; height: auto; }
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; }
                .container { max-width: 100%; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="container">
                ${cleanHTML}
            </div>
        </body>
        </html>
    `;
}

/**
 * 生成安全的文件名
 * @param {string} prefix - 文件名前缀
 * @param {string} extension - 文件扩展名
 * @returns {string} 安全的文件名
 */
export function generateSafeFilename(prefix, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safePrefix = prefix.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    return `${safePrefix}-${timestamp}.${extension}`;
}

/**
 * 检查是否为有效的SVG内容
 * @param {string} content - 需要检查的内容
 * @returns {boolean} 是否为有效SVG
 */
export function isValidSVG(content) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    
    const trimmed = content.trim();
    return trimmed.startsWith('<svg') && trimmed.endsWith('</svg>');
}

/**
 * 检查是否为有效的HTML内容
 * @param {string} content - 需要检查的内容
 * @returns {boolean} 是否为有效HTML
 */
export function isValidHTML(content) {
    if (!content || typeof content !== 'string') {
        return false;
    }
    
    const trimmed = content.trim();
    return trimmed.includes('<') && trimmed.includes('>');
}