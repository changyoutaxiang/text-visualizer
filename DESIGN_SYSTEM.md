# 🎨 文本视觉化工具设计系统

## 📖 概述

本文档定义了文本视觉化工具的完整设计系统，确保所有AI生成的图表具有一致的视觉语言和专业品质。通过标准化的设计规范和优化的提示词工程，我们将显著提升生成内容的质量和一致性。

## 🎯 设计目标

- **一致性**：所有图表遵循统一的视觉语言
- **专业性**：达到商业级别的设计质量
- **可读性**：确保信息传达清晰有效
- **美观性**：现代化、简洁的视觉风格
- **可访问性**：符合无障碍设计标准

---

## 🎨 视觉设计规范

### 色彩系统

#### 主色调
```css
/* 核心色彩 */
--primary-blue: #3b82f6;      /* 主蓝色 - 数据、流程 */
--success-green: #10b981;     /* 成功绿 - 正向、开始 */
--warning-yellow: #f59e0b;    /* 警告黄 - 注意、决策 */
--error-red: #ef4444;         /* 错误红 - 错误、结束 */
--special-purple: #8b5cf6;    /* 紫色系 - 特殊、子流程 */
```

#### 色彩层级
```css
/* 蓝色系渐变 */
--blue-900: #1e40af;  /* 最深 - 重要数据 */
--blue-600: #3b82f6;  /* 标准 - 常规数据 */
--blue-400: #60a5fa;  /* 中等 - 次要数据 */
--blue-200: #93c5fd;  /* 浅色 - 背景/辅助 */

/* 灰色系 */
--gray-900: #111827;  /* 主文本 */
--gray-700: #374151;  /* 副文本 */
--gray-500: #6b7280;  /* 辅助文本 */
--gray-300: #d1d5db;  /* 边框 */
--gray-100: #f3f4f6;  /* 浅背景 */
```

#### 背景色系
```css
/* 背景颜色 */
--bg-light: #ffffff;     /* 亮色主背景 */
--bg-light-alt: #f8fafc; /* 亮色次背景 */
--bg-dark: #0f172a;      /* 暗色主背景 */
--bg-dark-alt: #1e293b;  /* 暗色次背景 */
```

#### 颜色使用规则

1. **数据可视化颜色映射**：
   - 分类数据：使用主色调系列（蓝、绿、黄、红、紫）
   - 数值数据：使用单色系渐变（蓝色系）
   - 对比数据：使用互补色（蓝色 vs 橙色）

2. **状态颜色**：
   - 正常/成功：绿色系 (#10b981)
   - 警告/注意：黄色系 (#f59e0b)
   - 错误/危险：红色系 (#ef4444)
   - 信息/中性：蓝色系 (#3b82f6)

### 字体系统

#### 字体族
```css
/* 中文字体 */
font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;

/* 英文字体 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* 等宽字体（代码/数据） */
font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
```

#### 字体大小层级
```css
/* 标题层级 */
--text-4xl: 2.25rem;  /* 36px - 主标题 */
--text-3xl: 1.875rem; /* 30px - 副标题 */
--text-2xl: 1.5rem;   /* 24px - 节标题 */
--text-xl: 1.25rem;   /* 20px - 小标题 */

/* 正文层级 */
--text-lg: 1.125rem;  /* 18px - 大正文 */
--text-base: 1rem;    /* 16px - 标准正文 */
--text-sm: 0.875rem;  /* 14px - 小字 */
--text-xs: 0.75rem;   /* 12px - 辅助信息 */

/* 图表专用 */
--chart-title: 20px;    /* 图表标题 */
--chart-label: 14px;    /* 节点/轴标签 */
--chart-data: 16px;     /* 数据标签 */
--chart-legend: 12px;   /* 图例文字 */
```

#### 字重系统
```css
--font-light: 300;    /* 轻细 */
--font-normal: 400;   /* 常规 */
--font-medium: 500;   /* 中等 */
--font-semibold: 600; /* 半粗 */
--font-bold: 700;     /* 加粗 */
```

### 间距系统

#### 间距单位（基于8px网格）
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

#### 图表专用间距
```css
/* 节点间距 */
--node-gap-min: 32px;     /* 最小节点间距 */
--node-gap-standard: 48px; /* 标准节点间距 */
--node-gap-large: 64px;    /* 大间距 */

/* 图表边距 */
--chart-padding: 24px;     /* 图表内边距 */
--chart-margin: 32px;      /* 图表外边距 */

/* 文字间距 */
--text-spacing: 1.5;       /* 行高 */
--letter-spacing: 0.025em; /* 字母间距 */
```

### 形状和尺寸

#### 圆角系统
```css
--radius-sm: 4px;    /* 小圆角 */
--radius-md: 8px;    /* 标准圆角 */
--radius-lg: 12px;   /* 大圆角 */
--radius-xl: 16px;   /* 超大圆角 */
--radius-full: 50%;  /* 圆形 */
```

#### 节点尺寸标准
```css
/* 流程图节点 */
--node-sm: 80px × 40px;   /* 小节点 */
--node-md: 120px × 60px;  /* 标准节点 */
--node-lg: 160px × 80px;  /* 大节点 */

/* 圆形节点 */
--circle-sm: 60px;        /* 小圆 */
--circle-md: 80px;        /* 标准圆 */
--circle-lg: 120px;       /* 大圆 */

/* 线条粗细 */
--border-thin: 1px;       /* 细线 */
--border-normal: 2px;     /* 标准线 */
--border-thick: 3px;      /* 粗线 */
--border-heavy: 4px;      /* 重线 */
```

### 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
```

---

## 🚀 提示词工程指南

### 通用设计规范模块

每个提示词都应包含以下通用规范：

```markdown
**严格遵循以下设计系统：**

🎨 **色彩规范**：
- 主色调：#3b82f6（数据展示、流程节点）
- 强调色：#10b981（正向元素、成功状态）
- 警告色：#f59e0b（注意元素、决策节点）
- 错误色：#ef4444（错误状态、结束节点）
- 辅助色：#8b5cf6（特殊元素、子流程）

📝 **字体规范**：
- 字体族：'PingFang SC', 'Microsoft YaHei', sans-serif
- 图表标题：20px, font-weight: 600
- 节点标签：14px, font-weight: 500
- 数据标签：16px, font-weight: 400
- 图例文字：12px, font-weight: 400

📏 **布局规范**：
- 基础间距：16px
- 节点间距：48px
- 图表内边距：24px
- 圆角半径：8px
- 最小节点尺寸：120×60px

🎯 **交互效果**：
- 悬停效果：opacity: 0.8, transform: scale(1.05)
- 选中状态：添加2px边框，使用主色调
- 过渡动画：transition: all 0.3s ease
- 可点击元素：cursor: pointer

📐 **质量要求**：
- 所有文字必须清晰可读
- 颜色对比度符合WCAG标准
- 支持响应式缩放
- 布局保持视觉平衡
- 避免元素重叠或过于密集
```

### 模型特定优化

#### Claude 4 Sonnet 设置
```json
{
  "model": "anthropic/claude-sonnet-4",
  "temperature": 0.2,
  "max_tokens": 4000,
  "system_prompt": "你是一位专业的数据可视化设计师，拥有深厚的设计理论基础和丰富的实践经验。请严格按照提供的设计系统创建高质量、一致性强的图表。"
}
```

#### 提示词结构模板
```markdown
# [图表类型]专业提示词

## 角色定义
你是一位资深的[图表类型]设计专家，专精于数据可视化和信息设计。

## 设计任务
将以下文本转换为专业的[图表类型]：

**原始文本：**
{text}

## 设计要求

### 1. 数据分析
[具体的数据处理要求]

### 2. 视觉设计
[遵循设计系统的具体要求]

### 3. 技术实现
[SVG/HTML具体技术要求]

### 4. 质量检查
请确保输出满足以下条件：
- □ 颜色使用符合设计系统
- □ 字体大小和层级正确
- □ 间距使用标准值
- □ 对比度足够清晰
- □ 响应式设计支持
- □ 交互效果一致
- □ 整体布局平衡

## 输出格式
返回完整的、可直接渲染的SVG代码，包含：
1. 完整的SVG结构和样式
2. 所有必要的内联CSS
3. 基础交互功能
4. 响应式viewBox设置
```

---

## 📊 图表类型规范

### 数据分析图表

#### 设计原则
- **清晰性**：数据展示清晰直观
- **准确性**：视觉比例与数据比例一致
- **美观性**：配色协调，布局平衡

#### 技术规范
```svg
<!-- 柱状图模板 -->
<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style type="text/css"><![CDATA[
      .chart-title { 
        font: 600 20px 'PingFang SC', sans-serif; 
        fill: #111827; 
      }
      .axis-label { 
        font: 500 14px 'PingFang SC', sans-serif; 
        fill: #374151; 
      }
      .data-label { 
        font: 400 16px 'PingFang SC', sans-serif; 
        fill: #6b7280; 
      }
      .bar { 
        fill: #3b82f6; 
        transition: all 0.3s ease; 
      }
      .bar:hover { 
        fill: #2563eb; 
        transform: scaleY(1.05); 
      }
    ]]></style>
  </defs>
  
  <!-- 图表内容 -->
  <g class="chart-content" transform="translate(60, 40)">
    <!-- 标题 -->
    <text x="360" y="20" class="chart-title" text-anchor="middle">图表标题</text>
    
    <!-- 坐标轴 -->
    <g class="axes">
      <!-- X轴 -->
      <line x1="0" y1="480" x2="720" y2="480" stroke="#d1d5db" stroke-width="2"/>
      <!-- Y轴 -->
      <line x1="0" y1="60" x2="0" y2="480" stroke="#d1d5db" stroke-width="2"/>
    </g>
    
    <!-- 数据条 -->
    <g class="bars">
      <!-- 示例数据条 -->
      <rect class="bar" x="60" y="280" width="80" height="200"/>
    </g>
  </g>
</svg>
```

### 流程图

#### 节点类型标准
```css
/* 开始/结束节点 */
.start-end-node {
  fill: #10b981;
  stroke: #059669;
  stroke-width: 2px;
  rx: 30px;
  ry: 20px;
}

/* 处理节点 */
.process-node {
  fill: #3b82f6;
  stroke: #2563eb;
  stroke-width: 2px;
  rx: 8px;
}

/* 决策节点 */
.decision-node {
  fill: #f59e0b;
  stroke: #d97706;
  stroke-width: 2px;
}

/* 子流程节点 */
.subprocess-node {
  fill: #8b5cf6;
  stroke: #7c3aed;
  stroke-width: 2px;
  rx: 8px;
}
```

#### 连接线规范
```css
/* 流程线 */
.flow-line {
  stroke: #374151;
  stroke-width: 2px;
  fill: none;
  marker-end: url(#arrowhead);
}

/* 条件分支线 */
.condition-line {
  stroke: #f59e0b;
  stroke-width: 2px;
  stroke-dasharray: 5,5;
  fill: none;
  marker-end: url(#arrowhead);
}
```

### 网络关系图

#### 力导向布局参数
```javascript
// D3.js力导向布局推荐参数
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links).distance(80).strength(0.5))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(30));
```

#### 节点分类颜色
```css
.node-person { fill: #3b82f6; }      /* 人员 */
.node-organization { fill: #10b981; } /* 组织 */
.node-location { fill: #f59e0b; }     /* 地点 */
.node-concept { fill: #8b5cf6; }      /* 概念 */
.node-event { fill: #ef4444; }        /* 事件 */
```

---

## ✅ 质量检查清单

### 设计一致性检查
- [ ] **颜色使用**：是否严格遵循色彩系统
- [ ] **字体规范**：字体族、大小、粗细是否符合标准
- [ ] **间距系统**：是否使用标准间距值
- [ ] **圆角半径**：是否使用标准圆角值
- [ ] **阴影效果**：是否使用标准阴影样式

### 可读性检查
- [ ] **对比度**：文字与背景对比度≥4.5:1
- [ ] **字体大小**：最小字体≥12px
- [ ] **元素间距**：元素间有足够间距，无重叠
- [ ] **信息层级**：重要信息突出显示
- [ ] **颜色编码**：颜色含义一致且直观

### 技术质量检查
- [ ] **SVG结构**：代码结构清晰，使用语义化标签
- [ ] **响应式**：支持不同屏幕尺寸
- [ ] **性能**：避免过多DOM元素，优化渲染性能
- [ ] **交互性**：悬停、点击效果流畅
- [ ] **可访问性**：支持键盘导航和屏幕阅读器

### 数据准确性检查
- [ ] **数据映射**：视觉比例与数据比例一致
- [ ] **标签完整**：所有数据点都有清晰标签
- [ ] **单位统一**：数据单位标注清楚
- [ ] **图例准确**：图例与实际数据对应
- [ ] **趋势正确**：图表正确反映数据趋势

---

## 🔄 持续改进机制

### 质量监控
1. **自动化检查**：
   - 颜色使用检查脚本
   - 字体规范验证
   - 对比度自动测试

2. **用户反馈收集**：
   - 设计质量评分
   - 使用体验调研
   - 改进建议收集

3. **A/B测试**：
   - 不同提示词效果对比
   - 新旧设计方案对比
   - 模型性能对比

### 迭代优化流程
1. **问题识别** → 2. **原因分析** → 3. **方案设计** → 4. **测试验证** → 5. **全面部署**

---

## 📚 参考资源

### 设计理论
- 《设计中的设计》- 原研哉
- 《写给大家看的设计书》- Robin Williams
- 《数据可视化之美》- Julie Steele

### 技术规范
- [SVG规范](https://www.w3.org/TR/SVG2/)
- [WCAG 2.1无障碍指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design色彩系统](https://material.io/design/color/)

### 工具推荐
- [Coolors.co](https://coolors.co/) - 配色方案生成
- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - 对比度检查
- [SVGO](https://github.com/svg/svgo) - SVG优化工具

---

*本文档将持续更新，确保设计系统与最佳实践保持同步。*