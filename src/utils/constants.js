export const API_CONFIG = {
    OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
    DEFAULT_MODEL: 'anthropic/claude-3.5-sonnet',
    DEFAULT_FORMAT: 'svg',
    MAX_TOKENS: 4000,
    TEMPERATURE: 0.3
};

export const PREDEFINED_PROMPTS = {
    'data-analysis': {
        name: '数据分析图表',
        description: '将文本转换为数据可视化图表',
        template: '将以下文本转换为数据可视化图表，使用柱状图或饼图展示关键数据的分布和比例关系。\n\n文本内容：{text}\n\n要求：\n- 使用SVG格式\n- 配色专业协调\n- 标签清晰可读\n- 包含图例和标题\n- 响应式设计'
    },
    'network': {
        name: '网络关系图',
        description: '创建实体间关系的网络图',
        template: '分析文本中的实体关系，创建网络关系图展示各元素间的联系。\n\n文本内容：{text}\n\n要求：\n- 使用力导向图布局\n- 节点大小表示重要性\n- 连线粗细表示关系强度\n- 支持悬停交互\n- 使用D3.js或原生SVG'
    },
    'timeline': {
        name: '时间轴',
        description: '按时间顺序展示事件',
        template: '提取文本中的时间相关信息，创建水平时间轴可视化。\n\n文本内容：{text}\n\n要求：\n- 按时间顺序排列\n- 重要事件突出显示\n- 支持交互悬停\n- 清晰的日期标签\n- 响应式设计'
    },
    'wordcloud': {
        name: '词云',
        description: '基于词频的关键词可视化',
        template: '分析文本词频，生成艺术化词云展示关键词。\n\n文本内容：{text}\n\n要求：\n- 词频决定字体大小\n- 使用协调的配色方案\n- 布局美观平衡\n- 支持常见中文分词\n- 可交互悬停效果'
    },
    'flowchart': {
        name: '流程图',
        description: '将文本描述转换为流程图',
        template: '将文本描述转换为流程图或决策树。\n\n文本内容：{text}\n\n要求：\n- 逻辑清晰\n- 步骤明确\n- 使用标准流程图符号\n- 支持条件分支\n- 布局整洁'
    },
    'comparison': {
        name: '对比分析',
        description: '创建对比图表',
        template: '创建对比图表展示文本中的比较关系。\n\n文本内容：{text}\n\n要求：\n- 使用并列柱状图或雷达图\n- 突出差异和相似点\n- 清晰的标签和图例\n- 专业的配色方案\n- 响应式设计'
    },
    'hierarchy': {
        name: '层次结构',
        description: '创建树状结构图或思维导图',
        template: '将文本内容组织为层次结构图或思维导图。\n\n文本内容：{text}\n\n要求：\n- 清晰的父子关系\n- 支持折叠展开\n- 配色区分层级\n- 节点大小表示重要性\n- 交互式导航'
    },
    'geographic': {
        name: '地理信息',
        description: '地理位置可视化',
        template: '如文本包含地理信息，创建地理位置可视化。\n\n文本内容：{text}\n\n要求：\n- 使用简化地图背景\n- 位置标记准确\n- 支持缩放和详情查看\n- 交互式悬停提示\n- 数据关联显示'
    },
    'dashboard': {
        name: '进度仪表盘',
        description: '将进度信息转换为仪表盘',
        template: '将文本中的进度或状态信息转换为仪表盘。\n\n文本内容：{text}\n\n要求：\n- 使用圆形仪表盘或进度条\n- 数值显示清晰\n- 颜色编码状态\n- 实时数据展示\n- 专业的视觉效果'
    },
    'report': {
        name: '综合报告',
        description: '创建综合性可视化报告',
        template: '创建综合性可视化报告，结合多种图表类型。\n\n文本内容：{text}\n\n要求：\n- 布局专业\n- 图表协调统一\n- 包含标题、图例和结论\n- 响应式设计\n- 支持交互式元素'
    }
};

export const MODELS = [
    {
        id: 'moonshotai/kimi-k2',
        name: 'Kimi K2',
        description: '月之暗面最新模型，中文优化'
    },
    {
        id: 'x-ai/grok-4',
        name: 'Grok-4',
        description: 'xAI最新模型，X平台集成'
    },
    {
        id: 'anthropic/claude-sonnet-4',
        name: 'Claude Sonnet 4',
        description: 'Anthropic最新Sonnet模型'
    },
    {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Google最新Gemini Pro模型'
    },
    {
        id: 'deepseek/deepseek-r1-0528',
        name: 'DeepSeek R1',
        description: '深度求索推理模型'
    },
    {
        id: 'deepseek/deepseek-chat-v3-0324',
        name: 'DeepSeek Chat V3',
        description: '深度求索对话模型'
    }
];

// 模型优化配置
export const MODEL_CONFIGS = {
    'anthropic/claude-sonnet-4': {
        temperature: 0.2,           // 降低随机性，提高一致性
        max_tokens: 4000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        systemPromptType: 'professional'
    },
    'google/gemini-2.5-pro': {
        temperature: 0.25,
        max_tokens: 4000,
        top_p: 0.85,
        systemPromptType: 'creative'
    },
    'x-ai/grok-4': {
        temperature: 0.3,
        max_tokens: 4000,
        top_p: 0.9,
        systemPromptType: 'balanced'
    },
    'moonshotai/kimi-k2': {
        temperature: 0.2,
        max_tokens: 4000,
        top_p: 0.9,
        systemPromptType: 'chinese'
    },
    'deepseek/deepseek-r1-0528': {
        temperature: 0.15,          // 推理模型使用更低温度
        max_tokens: 4000,
        top_p: 0.95,
        systemPromptType: 'analytical'
    },
    'deepseek/deepseek-chat-v3-0324': {
        temperature: 0.25,
        max_tokens: 4000,
        top_p: 0.9,
        systemPromptType: 'conversational'
    }
};

// 系统提示词模板
export const SYSTEM_PROMPTS = {
    professional: `你是一位资深的数据可视化设计师，拥有10年以上的商业图表设计经验。你精通数据科学和视觉设计原理，设计风格现代、专业，注重数据的准确传达和视觉美感。

严格遵循以下设计系统：
- 主色调：#3b82f6（数据展示、流程节点）
- 强调色：#10b981（正向元素）、#f59e0b（警告元素）、#ef4444（错误元素）
- 字体：'PingFang SC', 'Microsoft YaHei', sans-serif
- 标题：20px font-weight:600，标签：14px font-weight:500
- 间距：基于8px网格系统，最小间距16px

请将用户提供的文本转换为高质量的可视化图表。只返回完整的、可直接渲染的代码，不要添加解释。`,

    creative: `你是一位富有创意的视觉设计专家，擅长将数据转化为美观且富有表现力的图表。在保持专业性的同时，你善于运用创新的视觉元素来增强数据的表达效果。

请严格遵循设计规范，同时在布局和细节上展现创意，将文本内容转换为视觉冲击力强的图表。`,

    balanced: `你是一位平衡实用性和美观性的图表设计师。你的设计既注重信息的清晰传达，也关注视觉的美感和现代感。

请将文本转换为平衡实用与美观的可视化图表，确保信息传达高效且视觉效果优秀。`,

    chinese: `你是一位专业的中文数据可视化设计师，深度理解中文用户的阅读习惯和审美偏好。你擅长处理中文文本和数据，能够创建符合中文环境的优质图表。

请将中文文本转换为专业的可视化图表，特别注意中文字体显示和排版美观。`,

    analytical: `你是一位逻辑严密的数据分析师兼可视化专家。你擅长深度分析数据结构和关系，创建精确反映数据本质的图表。

请深度分析文本中的数据结构，创建逻辑清晰、信息准确的可视化图表。`,

    conversational: `你是一位善于沟通的可视化设计师，能够理解用户的真实需求，创建易于理解和交互的图表。

请将文本转换为用户友好的可视化图表，注重可读性和交互体验。`
};