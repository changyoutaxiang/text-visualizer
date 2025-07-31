/**
 * Markdown提示词模板加载器
 * 从本地MD文件动态加载提示词模板
 */

export class MarkdownPromptLoader {
    constructor() {
        // 使用相对路径，适配本地开发环境
        this.basePath = './prompts/templates';
        this.cache = new Map();
        this.metadataCache = new Map();
    }

    /**
     * 获取所有可用的提示词模板
     * @returns {Promise<Array>} 模板列表 [{name, filename, description, metadata}]
     */
    async getAvailableTemplates() {
        try {
            // 定义已知的模板文件列表
            const templateFiles = [
                '数据分析图表.md',
                '文章视觉化.md',
                '文章视觉化-简化版.md',
                '网络关系图.md', 
                '时间轴.md',
                '流程图.md',
                '词云.md'
            ];

            const templates = [];
            
            for (const filename of templateFiles) {
                try {
                    const metadata = await this.getTemplateMetadata(filename);
                    if (metadata) {
                        templates.push({
                            name: metadata.name,
                            filename: filename,
                            description: metadata.description,
                            category: metadata.category || '其他',
                            tags: metadata.tags || []
                        });
                    }
                } catch (error) {
                    console.warn(`跳过模板文件: ${filename}`, error.message);
                }
            }

            return templates;
        } catch (error) {
            console.error('获取模板列表失败:', error);
            return [];
        }
    }

    /**
     * 加载指定的Markdown提示词模板
     * @param {string} filename - 模板文件名
     * @returns {Promise<Object>} 模板内容对象
     */
    async loadTemplate(filename) {
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        try {
            const filePath = `${this.basePath}/${filename}`;
            const content = await this.fetchMarkdown(filePath);
            const parsed = this.parseMarkdown(content);
            
            this.cache.set(filename, parsed);
            return parsed;
        } catch (error) {
            console.error(`加载模板失败: ${filename}`, error);
            throw new Error(`无法加载提示词模板: ${filename}`);
        }
    }

    /**
     * 获取模板的元数据
     * @param {string} filename - 模板文件名
     * @returns {Promise<Object>} 元数据对象
     */
    async getTemplateMetadata(filename) {
        if (this.metadataCache.has(filename)) {
            return this.metadataCache.get(filename);
        }

        try {
            const template = await this.loadTemplate(filename);
            const metadata = {
                name: template.name,
                description: template.description,
                category: template.category,
                tags: template.tags || [],
                variables: this.extractVariables(template.template),
                lastModified: template.lastModified,
                size: template.size
            };

            this.metadataCache.set(filename, metadata);
            return metadata;
        } catch (error) {
            console.error(`获取元数据失败: ${filename}`, error);
            return null;
        }
    }

    /**
     * 解析Markdown内容
     * @param {string} content - Markdown原始内容
     * @returns {Object} 解析后的模板对象
     */
    parseMarkdown(content) {
        const lines = content.split('\n');
        const result = {
            name: '',
            description: '',
            template: '',
            category: '',
            tags: [],
            variables: {},
            sections: {}
        };

        let currentSection = null;
        let templateStart = false;
        let hasTemplateSection = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 解析标题
            if (line.startsWith('# ') && !result.name) {
                result.name = line.substring(2).trim();
                continue;
            }

            // 解析描述
            if (line.startsWith('## 描述')) {
                currentSection = 'description';
                continue;
            }

            // 解析分类
            if (line.startsWith('## 适用场景')) {
                currentSection = 'category';
                continue;
            }

            // 解析变量说明
            if (line.startsWith('## 变量说明')) {
                currentSection = 'variables';
                continue;
            }

            // 解析提示词模板 - 支持多种格式
            if (line.startsWith('## 提示词模板') || line.startsWith('## 📝 专业提示词模板')) {
                currentSection = 'template';
                templateStart = true;
                hasTemplateSection = true;
                continue;
            }

            // 收集内容
            if (currentSection === 'description' && line && !line.startsWith('##')) {
                if (!result.description) {
                    result.description = line;
                } else {
                    result.description += ' ' + line;
                }
            }

            if (currentSection === 'template' && templateStart) {
                if (line === '```markdown' || line === '```') {
                    if (line === '```' && result.template) {
                        templateStart = false;
                        continue;
                    }
                    continue;
                }
                if (templateStart) {
                    result.template += line + '\n';
                }
            }
        }

        // 如果没有找到专门的模板节，将整个内容作为模板
        if (!hasTemplateSection) {
            result.template = content;
            // 从第一行提取名称（如果还没有）
            if (!result.name && lines.length > 0) {
                const firstLine = lines[0].trim();
                if (firstLine.startsWith('# ')) {
                    result.name = firstLine.substring(2).trim();
                } else {
                    result.name = firstLine || '未命名模板';
                }
            }
            // 设置默认描述
            if (!result.description) {
                result.description = '数据可视化模板';
            }
        }

        // 清理模板内容
        result.template = result.template.trim();

        // 提取变量
        result.variables = this.extractVariables(result.template);

        return result;
    }

    /**
     * 提取模板中的变量
     * @param {string} template - 模板内容
     * @returns {Array} 变量列表
     */
    extractVariables(template) {
        const variableRegex = /\{([^}]+)\}/g;
        const variables = [];
        let match;

        while ((match = variableRegex.exec(template)) !== null) {
            variables.push(match[1]);
        }

        return [...new Set(variables)]; // 去重
    }

    /**
     * 获取模板预览（前N行）
     * @param {string} filename - 模板文件名
     * @param {number} maxLength - 最大预览长度
     * @returns {Promise<string>} 预览内容
     */
    async getTemplatePreview(filename, maxLength = 100) {
        try {
            const template = await this.loadTemplate(filename);
            return template.template.substring(0, maxLength) + '...';
        } catch (error) {
            return '无法加载预览';
        }
    }

    /**
     * 搜索模板
     * @param {string} query - 搜索关键词
     * @returns {Promise<Array>} 匹配的模板列表
     */
    async searchTemplates(query) {
        const templates = await this.getAvailableTemplates();
        const lowerQuery = query.toLowerCase();

        return templates.filter(template => 
            template.name.toLowerCase().includes(lowerQuery) ||
            template.description.toLowerCase().includes(lowerQuery) ||
            (template.tags && template.tags.some(tag => 
                tag.toLowerCase().includes(lowerQuery)
            ))
        );
    }

    /**
     * 按分类获取模板
     * @param {string} category - 分类名称
     * @returns {Promise<Array>} 分类下的模板列表
     */
    async getTemplatesByCategory(category) {
        const templates = await this.getAvailableTemplates();
        return templates.filter(template => 
            template.category.toLowerCase() === category.toLowerCase()
        );
    }

    /**
     * 获取所有分类
     * @returns {Promise<Array>} 分类列表
     */
    async getCategories() {
        const templates = await this.getAvailableTemplates();
        const categories = [...new Set(templates.map(t => t.category))];
        return categories.sort();
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.cache.clear();
        this.metadataCache.clear();
    }

    /**
     * 从静态文件获取Markdown内容
     * @param {string} filePath - 文件路径
     * @returns {Promise<string>} 文件内容
     */
    async fetchMarkdown(filePath) {
        try {
            // 构建正确的文件路径
            const url = filePath.startsWith('/') ? filePath : `/${filePath}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error(`获取文件失败: ${filePath}`, error);
            throw new Error(`无法加载模板文件: ${filePath}`);
        }
    }
}