import axios from 'axios';
import { API_CONFIG, MODEL_CONFIGS, SYSTEM_PROMPTS } from '../utils/constants.js';
import { cacheManager } from '../utils/cache.js';

export class OpenRouterAPI {
    constructor() {
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'TextVisualizer'
            },
            timeout: 30000 // 30秒超时
        });
        
        // 设置请求拦截器用于性能监控
        this.setupInterceptors();
    }

    /**
     * 设置请求拦截器
     */
    setupInterceptors() {
        // 请求拦截器 - 添加性能监控
        this.client.interceptors.request.use(
            (config) => {
                config.startTime = Date.now();
                console.log(`🚀 API请求开始: ${config.url}`);
                return config;
            },
            (error) => {
                console.error('❌ API请求配置错误:', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器 - 记录性能数据
        this.client.interceptors.response.use(
            (response) => {
                const duration = Date.now() - response.config.startTime;
                console.log(`✅ API请求完成: ${response.config.url} (${duration}ms)`);
                
                // 记录性能数据
                this.recordPerformance(response.config.url, duration, true);
                
                return response;
            },
            (error) => {
                const duration = error.config ? Date.now() - error.config.startTime : 0;
                console.error(`❌ API请求失败: ${error.config?.url} (${duration}ms)`, error.message);
                
                // 记录错误数据
                this.recordPerformance(error.config?.url, duration, false, error.message);
                
                return Promise.reject(error);
            }
        );
    }

    /**
     * 记录性能数据
     */
    recordPerformance(url, duration, success, error = null) {
        const perfData = {
            url,
            duration,
            success,
            error,
            timestamp: Date.now()
        };

        // 缓存性能数据用于分析
        const perfHistory = cacheManager.get('api_performance', 'sessionStorage') || [];
        perfHistory.push(perfData);
        
        // 只保留最近100条记录
        if (perfHistory.length > 100) {
            perfHistory.splice(0, perfHistory.length - 100);
        }
        
        cacheManager.set('api_performance', perfHistory, { 
            storage: 'sessionStorage',
            ttl: 60 * 60 * 1000 // 1小时
        });
    }

    async generateVisualization(prompt, model, format) {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error('API密钥未配置，请检查环境变量 VITE_OPENROUTER_API_KEY');
        }
        this.client.defaults.headers['Authorization'] = `Bearer ${apiKey}`;

        // 生成缓存键 - 基于prompt、model和format
        const cacheKey = this.generateCacheKey(prompt, model, format);
        
        // 尝试从缓存获取结果（仅对相同的输入缓存）
        const cachedResult = cacheManager.get(cacheKey, 'sessionStorage');
        if (cachedResult) {
            console.log('📦 使用缓存结果');
            return cachedResult;
        }

        // 获取模型特定配置
        const modelConfig = MODEL_CONFIGS[model] || {
            temperature: 0.3,
            max_tokens: 4000,
            top_p: 0.9,
            systemPromptType: 'professional'
        };

        // 获取对应的系统提示词
        const systemPrompt = SYSTEM_PROMPTS[modelConfig.systemPromptType] || SYSTEM_PROMPTS.professional;
        
        // 构建完整的系统提示词
        const fullSystemPrompt = `${systemPrompt}

请将用户提供的文本转换为${format.toUpperCase()}格式的可视化图表。确保代码完整、可运行，并严格遵循上述设计规范。`;

        const maxRetries = 3;
        const retryDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 构建请求参数，使用模型特定配置
                const requestParams = {
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: fullSystemPrompt
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: modelConfig.max_tokens,
                    temperature: modelConfig.temperature,
                    top_p: modelConfig.top_p
                };

                // 添加可选参数（如果模型支持）
                if (modelConfig.frequency_penalty !== undefined) {
                    requestParams.frequency_penalty = modelConfig.frequency_penalty;
                }
                if (modelConfig.presence_penalty !== undefined) {
                    requestParams.presence_penalty = modelConfig.presence_penalty;
                }

                const response = await this.client.post('/chat/completions', requestParams);

                const content = response.data.choices[0]?.message?.content;
                if (!content) {
                    throw new Error('API返回格式错误');
                }

                const result = this.extractCode(content, format);
                
                // 缓存成功的结果（24小时）
                cacheManager.set(cacheKey, result, {
                    storage: 'sessionStorage',
                    ttl: 24 * 60 * 60 * 1000 // 24小时
                });

                return result;
            } catch (error) {
                if (attempt === maxRetries) {
                    if (error.response?.status === 401) {
                        throw new Error('API密钥无效或已过期');
                    } else if (error.response?.status === 400) {
                        throw new Error('请求参数错误，可能是输入文本过长或格式不正确。建议缩短文本内容或尝试其他模型。');
                    } else if (error.response?.status === 429) {
                        throw new Error('API调用频率限制，请稍后再试');
                    } else if (error.code === 'ECONNABORTED' || !error.response) {
                        throw new Error('网络连接超时，请检查网络后重试');
                    } else {
                        throw new Error(`API调用失败: ${error.message}`);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            }
        }
    }

    extractCode(content, format) {
        const pattern = '```' + format + '\\s*([\\s\\S]*?)\\s*```';
        const codeRegex = new RegExp(pattern, 'i');
        const match = content.match(codeRegex);
        
        if (match) {
            return match[1].trim();
        }
        
        return content.trim();
    }

    /**
     * 生成缓存键
     */
    generateCacheKey(prompt, model, format) {
        // 使用MD5或简单hash来生成短键
        const str = `${prompt}|${model}|${format}`;
        return 'api_' + this.simpleHash(str);
    }

    /**
     * 简单hash函数
     */
    simpleHash(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        return Math.abs(hash).toString(36);
    }

    /**
     * 获取API性能统计
     */
    getPerformanceStats() {
        const perfHistory = cacheManager.get('api_performance', 'sessionStorage') || [];
        
        if (perfHistory.length === 0) {
            return {
                totalRequests: 0,
                successRate: 0,
                averageResponseTime: 0,
                errors: []
            };
        }

        const totalRequests = perfHistory.length;
        const successfulRequests = perfHistory.filter(p => p.success).length;
        const successRate = (successfulRequests / totalRequests * 100).toFixed(2);
        
        const responseTimes = perfHistory.filter(p => p.success).map(p => p.duration);
        const averageResponseTime = responseTimes.length > 0 ? 
            Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
        
        const errors = perfHistory.filter(p => !p.success).map(p => ({
            error: p.error,
            timestamp: new Date(p.timestamp).toLocaleString()
        }));

        return {
            totalRequests,
            successRate: `${successRate}%`,
            averageResponseTime: `${averageResponseTime}ms`,
            errors: errors.slice(-10) // 最近10个错误
        };
    }

    /**
     * 获取模型的优化配置信息
     * @param {string} model - 模型名称
     * @returns {object} 模型配置
     */
    getModelConfig(model) {
        const config = MODEL_CONFIGS[model];
        if (!config) {
            console.warn(`未找到模型 ${model} 的优化配置，使用默认配置`);
            return {
                temperature: 0.3,
                max_tokens: 4000,
                top_p: 0.9,
                systemPromptType: 'professional'
            };
        }
        return config;
    }

    /**
     * 获取系统提示词
     * @param {string} promptType - 提示词类型
     * @returns {string} 系统提示词
     */
    getSystemPrompt(promptType) {
        return SYSTEM_PROMPTS[promptType] || SYSTEM_PROMPTS.professional;
    }

    /**
     * 测试API连接
     * @param {string} apiKey - API密钥
     * @returns {boolean} 连接状态
     */
    async testConnection(apiKey) {
        try {
            const testClient = axios.create({
                baseURL: this.baseURL,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'TextVisualizerTest'
                }
            });

            const response = await testClient.post('/chat/completions', {
                model: 'anthropic/claude-3.5-haiku',
                messages: [
                    {
                        role: 'user',
                        content: '测试连接'
                    }
                ],
                max_tokens: 10
            });

            return response.status === 200;
        } catch (error) {
            console.error('API连接测试失败:', error);
            return false;
        }
    }
}